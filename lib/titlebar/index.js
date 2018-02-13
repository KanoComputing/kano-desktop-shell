const EVENTS = require('./events');
const { ipcMain } = require('electron');

const actions = {
    close(window) {
        window.close();
    },
    maximize(window) {
        window.maximize();
    },
    minimize(window) {
        window.minimize();
    },
    'un-maximize': (window) => {
        window.unmaximize();
    },
    menu(window) {
        if (window.shell) {
            window.shell.menu.popup(window);
        }
    },
};

const Titlebar = {
    setup(window) {
        EVENTS.forEach((eventName) => {
            ipcMain.on(eventName, (event) => {
                if (event.sender === window.webContents) {
                    actions[eventName](window);
                }
            });
        });
        window.on('maximize', () => window.webContents.send('maximize'));
        window.on('unmaximize', () => window.webContents.send('unmaximize'));
    },
};

module.exports = Titlebar;
