/* eslint global-require: "off" */
/* eslint import/no-dynamic-require: "off" */
const { remote, webFrame } = require('electron');

const currentWindow = remote.getCurrentWindow();
const { shell } = currentWindow;

function loadPreloadScript() {
    if (!shell) {
        return;
    }

    if (shell.options.preload) {
        require(shell.options.preload);
    }
}

webFrame.registerURLSchemeAsPrivileged(shell.options.scheme);

loadPreloadScript();
