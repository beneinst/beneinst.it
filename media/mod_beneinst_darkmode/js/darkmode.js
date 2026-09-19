/* Beneinst Dark Mode 1.1.6 | GPL-2.0-or-later */
(() => {
    'use strict';
    function boot() {
        if (window.BeneinstDarkMode) {
            if (window.BeneinstDarkMode.refresh) window.BeneinstDarkMode.refresh();
            return;
        }
        const control = document.querySelector('[data-bdm-control]');
        if (!control) return;
        const key = 'beneinst.theme.v1';
        const root = document.documentElement;
        const media = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : { matches: false };
        let options = {};
        try { options = JSON.parse(control.getAttribute('data-bdm-config') || '{}') || {}; } catch (_) {}
        const valid = value => ['light', 'dark', 'auto'].includes(value);
        const initial = valid(options.initial) ? options.initial : 'light';
        let mode = initial;
        try {
            const stored = localStorage.getItem(key);
            if (valid(stored)) mode = stored;
        } catch (_) { /* Blocked storage must not prevent startup. */ }
        if (options.colors && typeof options.colors === 'object') {
            ['background', 'surface', 'foreground', 'link', 'alphabet'].forEach(name => {
                if (/^#[0-9a-f]{6}$/i.test(options.colors[name] || '')) root.style.setProperty('--bdm-' + name, options.colors[name]);
            });
        }
        if (Number.isFinite(options.bottom)) root.style.setProperty('--bdm-bottom', Math.max(0, Math.min(500, options.bottom)) + 'px');
        function render() {
            const dark = mode === 'dark' || (mode === 'auto' && media.matches);
            root.classList.toggle('bdm-dark', dark);
            root.dataset.bdmMode = mode;
            document.querySelectorAll('[data-bdm-toggle]').forEach(button => {
                button.setAttribute('aria-pressed', String(dark));
                button.disabled = false;
            });
            document.querySelectorAll('[data-bdm-auto]').forEach(button => {
                button.setAttribute('aria-pressed', String(mode === 'auto'));
                button.disabled = false;
            });
            document.querySelectorAll('[data-bdm-control]').forEach(element => { element.hidden = false; });
        }
        function setMode(value) {
            if (!valid(value)) return;
            mode = value;
            try { localStorage.setItem(key, mode); } catch (_) {}
            render();
        }
        window.BeneinstDarkMode = Object.freeze({ setMode, refresh: render });
        render();
        document.addEventListener('click', event => {
            if (!(event.target instanceof Element)) return;
            if (event.target.closest('[data-bdm-toggle]')) setMode(root.classList.contains('bdm-dark') ? 'light' : 'dark');
            else if (event.target.closest('[data-bdm-auto]')) setMode('auto');
        });
        const onSystemChange = () => { if (mode === 'auto') render(); };
        if (media.addEventListener) media.addEventListener('change', onSystemChange);
        else if (media.addListener) media.addListener(onSystemChange);
        window.addEventListener('storage', event => {
            if (event.key !== key && event.key !== null) return;
            mode = valid(event.newValue) ? event.newValue : initial;
            render();
        });
    }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
    else boot();
})();
