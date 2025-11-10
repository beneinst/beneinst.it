(() => {
    'use strict';

    document.addEventListener('DOMContentLoaded', function () {
        const elements = document.querySelectorAll(".sppb-addon-text-block");
        elements.forEach(element => {
            const fullText = element.querySelector(".sppb-addon-content-full-text");
            const showMoreButtonElement = element.querySelector(".sppb-btn-show-more");
            const addonContentElement = element.querySelector(".sppb-addon-content");

            const handleClick = () => {
                addonContentElement.innerHTML = fullText.innerHTML;
            };
            showMoreButtonElement?.addEventListener('click', handleClick);
        });
    })
})();