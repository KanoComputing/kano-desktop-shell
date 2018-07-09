const { EventEmitter } = require('events');
const path = require('path');
const {
    BrowserWindow,
    remote,
    shell,
    ipcMain,
} = require('electron');

class About extends EventEmitter {
    constructor(opts = {}) {
        super();
        this.window = null;

        this.indexPage = `file://${path.join(__dirname, 'about.html')}`;

        this.winOptions = Object.assign(
            {
                width: 400,
                height: 400,
                useContentSize: true,
                titleBarStyle: 'hidden-inset',
                show: false,
                icon: opts.iconPath,
            },
            opts.winOptions || {},
        );

        this.winOptions.webPreferences = Object.assign({}, this.winOptions.webPreferences || {}, {
            nodeIntegration: false,
            preload: path.join(__dirname, 'preload.js'),
        });

        this.options = opts;
    }
    openWindow() {
        if (this.window !== null) {
            this.window.focus();
            return this.window;
        }

        ipcMain.on('about:enable-dev-mode', (event) => {
            if (event.sender === this.window.webContents) {
                this.emit('enable-dev-mode');
            }
        });

        this.window = new (BrowserWindow || remote.BrowserWindow)(this.winOptions);

        this.window.once('ready-to-show', () => {
            this.window.show();
        });

        this.window.aboutOptions = this.options;

        this.window.once('closed', () => {
            this.window = null;
        });
        this.window.loadURL(this.indexPage);

        this.window.webContents.on('will-navigate', (e, url) => {
            e.preventDefault();
            shell.openExternal(url);
        });
        this.window.webContents.on('new-window', (e, url) => {
            e.preventDefault();
            shell.openExternal(url);
        });

        this.window.webContents.once('dom-ready', () => {
            if (this.options.openDevtools) {
                if (process.versions.electron >= '1.4') {
                    this.window.webContents.openDevTools({ mode: 'detach' });
                } else {
                    this.window.webContents.openDevTools();
                }
            }
        });

        this.window.once('ready-to-show', () => {
            this.window.show();
        });

        this.window.setMenu(null);

        return this.window;
    }
    close() {
        if (!this.window) {
            return;
        }
        this.window.close();
    }
}

module.exports = About;
