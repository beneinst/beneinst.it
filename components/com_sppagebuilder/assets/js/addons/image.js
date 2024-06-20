(() => {
    'use strict';

    const processImageShapes = (currentDocument = document, isProcessOnLoad = false) => {
        const wrapperElements = currentDocument?.querySelectorAll('.sppb-addon-image-shape');
        
        wrapperElements.forEach((wrapperElement) => {
            const path = wrapperElement.querySelector('svg path');
            const image = wrapperElement.querySelector('img');
            
            if (!image || !path) {
                return;
            }

            const updateSVGStyle = (image) => {
                const dataScale = image.getAttribute('data-scale') || 1;
                const translateX = image.width / 2;
                const translateY = image.height / 2;
                path.setAttribute('transform', 'translate(' + translateX + ',' + translateY + ') scale(' + dataScale + ')');
                image.style.visibility = null;
            }
            
            if (isProcessOnLoad) {
                image.onload = () => {
                    updateSVGStyle(image);
                }

                return;
            }
            
            updateSVGStyle(image);
        })
    }

    document.addEventListener('DOMContentLoaded', function () {
        processImageShapes(document, false);
        
        document.getElementById('sp-pagebuilder-view')?.addEventListener('load', () => {
            const pageBuilderIframe = window.frames['sp-pagebuilder-view'];

            if (!pageBuilderIframe) {
                return;
            }

            const container = pageBuilderIframe?.window.document.getElementById('sp-pagebuilder-container');
            if (container) {
                processImageShapes(container, true);

                const config = { attributes: true, childList: true, subtree: true };
                const observer = new MutationObserver(function (mutations) {
                    mutations.forEach(function (mutation) {                            
                        if (mutation.type === 'childList' || mutation.type === 'subtree') {
                            if (mutation.target === container || container.contains(mutation.target)) {
                                processImageShapes(container, true);
                            }
                        }
                    });
                });

                observer.observe(container, config);
            }
        })
    });
})();