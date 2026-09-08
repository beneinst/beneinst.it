(() => {
    'use strict';

    const getResponsiveScale = (dataScale, width) => {
        if (!dataScale || typeof dataScale !== 'object') {
            return 1;
        }

        let scale_xl = dataScale?.xl;
        let scale_lg = dataScale?.lg ? dataScale.lg : scale_xl;
        let scale_md = dataScale?.md ? dataScale.md : scale_lg;
        let scale_sm = dataScale?.sm ? dataScale.sm : scale_md;
        let scale_xs = dataScale?.xs ? dataScale.xs : scale_sm;

        let scale = scale_xl;

        if (width <= 1199.98) {
            scale = scale_lg;
        }

        if (width <= 991.98) {
            scale = scale_md;
        }

        if (width <= 767.98) {
            scale = scale_sm;
        }

        if (width <= 575.98) {
            scale = scale_xs;
        }

        scale = Number(scale);

        return Number.isFinite(scale) ? scale : 1;
    };

    const getResponsiveWidth = (
        currentDocument,
    ) => {
        const currentWindow =
            currentDocument?.defaultView || window;

        const pageBuilderContainer =
            currentDocument?.getElementById(
                'sp-pagebuilder-container'
            );

        if (pageBuilderContainer) {
            const rect =
                pageBuilderContainer.getBoundingClientRect();

            if (rect.width > 0) {
                return rect.width;
            }
        }

        return currentWindow.innerWidth;
    };

    const createUpdateSVGStyle = (
        currentDocument,
        path,
        image
    ) => {
        return () => {
            if (!image || !path) {
                return;
            }

            let dataScale;

            try {
                dataScale = JSON.parse(
                    image.getAttribute('data-scale') || '{}'
                );
            } catch (error) {
                console.error(
                    'Invalid data-scale:',
                    image.getAttribute('data-scale'),
                    error
                );

                return;
            }

            const width = getResponsiveWidth(
                currentDocument
            );

            const scale = getResponsiveScale(
                dataScale,
                width
            );

            if (!Number.isFinite(scale)) {
                return;
            }

            const bbox = path.getBBox();

            const centerX =
                bbox.x + bbox.width / 2;

            const centerY =
                bbox.y + bbox.height / 2;

            const translateX =
                image.getBoundingClientRect().width / 2;

            const translateY =
                image.getBoundingClientRect().height / 2;

            path.setAttribute(
                'transform',
                `translate(${translateX},${translateY}) ` +
                `scale(${scale}) ` +
                `translate(${-centerX},${-centerY})`
            );

            image.style.visibility = null;
        };
    };

    const processImageShapes = (
        currentDocument = document
    ) => {
        const wrapperElements =
            currentDocument?.querySelectorAll(
                '.sppb-addon-image-shape'
            );

        if (!wrapperElements) {
            return;
        }

        wrapperElements.forEach((wrapperElement) => {
            const path =
                wrapperElement.querySelector('svg path');

            const image =
                wrapperElement.querySelector('img');

            if (!image || !path) {
                return;
            }

            const updateSVGStyle =
                createUpdateSVGStyle(
                    currentDocument,
                    path,
                    image
                );

            image._updateSVGStyle = updateSVGStyle;

            if (image.complete) {
                updateSVGStyle();
            } else {
                image.addEventListener(
                    'load',
                    updateSVGStyle,
                    { once: true }
                );
            }
        });
    };

    const updateAllImageShapes = (
        currentDocument = document
    ) => {
        const images =
            currentDocument.querySelectorAll(
                '.sppb-addon-image-shape img'
            );

        images.forEach((image) => {
            if (
                typeof image._updateSVGStyle ===
                'function'
            ) {
                image._updateSVGStyle();
            }
        });
    };

    const observeContainerResize = (
        container,
        callback
    ) => {
        if (
            !container ||
            typeof ResizeObserver === 'undefined'
        ) {
            return null;
        }

        const resizeObserver =
            new ResizeObserver(() => {
                callback();
            });

        resizeObserver.observe(container);

        return resizeObserver;
    };

    document.addEventListener(
        'DOMContentLoaded',
        function () {
            processImageShapes(document);

            let resizeTimer;

            window.addEventListener(
                'resize',
                () => {
                    clearTimeout(resizeTimer);

                    resizeTimer = setTimeout(() => {
                        processImageShapes(document);
                        updateAllImageShapes(document);
                    }, 50);
                }
            );

            const editorIframe =
                document.getElementById(
                    'sp-pagebuilder-view'
                );

            if (!editorIframe) {
                return;
            }

            editorIframe.addEventListener(
                'load',
                () => {
                    const pageBuilderIframe =
                        window.frames[
                            'sp-pagebuilder-view'
                        ];

                    if (!pageBuilderIframe) {
                        return;
                    }

                    const editorDocument =
                        pageBuilderIframe.document;

                    const container =
                        editorDocument.getElementById(
                            'sp-pagebuilder-container'
                        );

                    if (!container) {
                        return;
                    }

                    processImageShapes(editorDocument);

                    observeContainerResize(
                        container,
                        () => {
                            processImageShapes(
                                editorDocument
                            );

                            updateAllImageShapes(
                                editorDocument
                            );
                        }
                    );

                    if (editorDocument.body) {
                        observeContainerResize(
                            editorDocument.body,
                            () => {
                                processImageShapes(
                                    editorDocument
                                );

                                updateAllImageShapes(
                                    editorDocument
                                );
                            }
                        );
                    }

                    const config = {
                        childList: true,
                        subtree: true
                    };

                    let mutationTimer;

                    const observer =
                        new MutationObserver(
                            (mutations) => {
                                let shouldUpdate = false;

                                mutations.forEach(
                                    (mutation) => {
                                        if (
                                            mutation.type ===
                                                'childList' ||
                                            mutation.type ===
                                                'attributes'
                                        ) {
                                            shouldUpdate = true;
                                        }
                                    }
                                );

                                if (!shouldUpdate) {
                                    return;
                                }

                                clearTimeout(
                                    mutationTimer
                                );

                                mutationTimer =
                                    setTimeout(() => {
                                        processImageShapes(
                                            editorDocument
                                        );

                                        updateAllImageShapes(
                                            editorDocument
                                        );
                                    }, 20);
                            }
                        );

                    observer.observe(
                        container,
                        config
                    );
                }
            );
        }
    );
})();
