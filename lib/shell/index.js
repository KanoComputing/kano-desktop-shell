const {
    BrowserWindow,
    protocol,
    app,
} = require('electron');
const appServer = require('../file-server');
const Titlebar = require('../titlebar');
const About = require('../about');
const MenuGenerator = require('../menu');
const path = require('path');
const windowStateKeeper = require('electron-window-state');
const Logger = require('../logger');

const defaultOptions = {
    scheme: 'shell',
    titlebar: true,
    uwpTitlebar: true,
    width: 800,
    height: 600,
    devMode: false,
    windowOptions: {
        show: false,
        autoHideMenuBar: true,
    },
    name: 'Kano Desktop Shell',
};

const INTERNAL_SCHEME = 'k-desktop-shell';

class Shell {
    constructor(opts) {
        this.options = Object.assign({}, defaultOptions, opts);
        if (!this.options.root) {
            throw new Error('Missing root option');
        }
        const customTitlebar = !(this.options.titlebar && (!this.options.uwpTitlebar || !Shell.isWin()));
        this.options.server = this.options.server || {};
        app.setName(this.options.name);
        this.log = Logger.getLogger(this.options.log || {});
        protocol.registerStandardSchemes([this.options.scheme], { secure: true });
        if (customTitlebar) {
            protocol.registerStandardSchemes([INTERNAL_SCHEME], { secure: true });
        }
        app.on('ready', () => {
            appServer.registerProtocol(this.options.scheme, this.options.root, this.options.server);
            if (customTitlebar) {
                const preloadPath = path.join(__dirname, 'webview-preload.js');
                protocol.registerStringProtocol(INTERNAL_SCHEME, (req, cb) => {
                    cb({
                        statusCode: 200,
                        mimeType: 'text/html',
                        charset: 'utf-8',
                        data: `<html>
                            <head>
                                <style>
                                    html, body {
                                        padding: 0;
                                        margin: 0;
                                        width: 100%;
                                        height: 100%;
                                        display: flex;
                                        flex-direction: column;
                                    }
                                    webview {
                                        flex: 1;
                                    }
                                </style>
                            </head>
                            <body>
                                <webview src="${this.options.scheme}://index" preload="file://${preloadPath}"></webview>
                            </body>
                        </html>`,
                    });
                }, () => {});
            }
        });
        this.about = new About({
            iconPath: this.options.windowOptions.icon,
            openDevtools: this.options.devMode,
        });
        this.about.on('enable-dev-mode', () => {
            this.options.devMode = true;
            this.updateMenu();
            Logger.enableDevMode(this.options.log || {});
            this.log.debug('Developer mode enabled');
        });
        this.log.level(this.options.logLevel);
        if (this.options.devMode) {
            Logger.enableDevMode(this.options.log || {});
            this.log.debug('Developer mode enabled');
        }
    }
    createWindow() {
        this.log.debug('Creating new window');
        this.windowState = windowStateKeeper({
            defaultWidth: this.options.width,
            defaultHeight: this.options.height,
        });
        const customTitlebar = !(this.options.titlebar && (!this.options.uwpTitlebar || !Shell.isWin()));
        const indexUrl = `${customTitlebar ? INTERNAL_SCHEME : this.options.scheme}://index`;
        this.windowOptions = Object.assign({}, {
            x: this.windowState.x,
            y: this.windowState.y,
            width: this.windowState.width,
            height: this.windowState.height,
            frame: !customTitlebar,
            webPreferences: {
                nodeIntegration: customTitlebar,
                preload: path.join(__dirname, 'preload.js'),
            },
        }, this.options.windowOptions);
        this.window = new BrowserWindow(this.windowOptions);

        this.menuGenerator = new MenuGenerator(
            this.window,
            this.about,
            this.options.menu || {},
        );

        this.updateMenu();

        this.window.shell = this;

        this.window.on('closed', () => {
            this.about.close();
            this.window = null;
        });

        this.window.once('ready-to-show', () => {
            this.window.show();
        });

        // Quit when all windows are closed.
        app.on('window-all-closed', () => {
            // On OS X it is common for applications and their menu bar
            // to stay active until the user quits explicitly with Cmd + Q
            if (process.platform !== 'darwin') {
                app.quit();
            }
        });

        app.on('activate', () => {
            // On OS X it's common to re-create a window in the app when the
            // dock icon is clicked and there are no other windows open.
            if (this.window === null) {
                this.createWindow();
            }
        });

        if (Shell.isWin() && this.options.titlebar && this.options.uwpTitlebar) {
            Titlebar.setup(this.window);
        }

        this.window.loadURL(indexUrl);

        this.windowState.manage(this.window);
    }

    updateMenu() {
        this.menuGenerator.build(this.options.devMode);

        this.menu = this.menuGenerator.menu;

        this.window.setMenu(this.menu);
    }

    static isWin() {
        return process.platform !== 'darwin';
    }

    isDevMode() {
        return this.options.devMode;
    }
}

module.exports = Shell;
