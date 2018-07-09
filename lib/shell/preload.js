/* eslint global-require: "off" */
/* eslint import/no-dynamic-require: "off" */
const { remote, webFrame } = require('electron');

const currentWindow = remote.getCurrentWindow();
const { shell } = currentWindow;

function setupTitlebar() {
    // Dynamically require this one on windows
    const Titlebar = require('../titlebar/preload');
    const titlebar = new Titlebar();

    titlebar.element.style.background = '#C9C3C2';
    titlebar.element.setAttribute('draggable', '');

    window.addEventListener('DOMContentLoaded', () => {
        titlebar.setup();
    });
    if (!shell.window.isMenuBarVisible()) {
        titlebar.noMenu = true;
    }
}

function loadPreloadScript() {
    if (!shell) {
        return;
    }

    if (shell.options.preload) {
        require(shell.options.preload);
    }
}

if (shell.constructor.isWin() && shell.options.uwpTitlebar && shell.options.titlebar) {
    setupTitlebar();
}

webFrame.registerURLSchemeAsPrivileged(shell.options.scheme);

loadPreloadScript();
