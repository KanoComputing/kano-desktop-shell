const { app, shell, Menu } = require('electron');

const ITEMS = {
    about: {
        label: 'About',
    },
    undo: {
        label: 'Undo',
        accelerator: 'CmdOrCtrl+Z',
        selector: 'undo:',
    },
    redo: {
        label: 'Redo',
        accelerator: 'Shift+CmdOrCtrl+Z',
        selector: 'redo:',
    },
    selectAll: {
        label: 'Select All',
        accelerator: 'CmdOrCtrl+A',
        selector: 'selectAll:',
    },
    copy: {
        label: 'Copy',
        accelerator: 'CmdOrCtrl+C',
        selector: 'copy:',
    },
    cut: {
        label: 'Cut',
        accelerator: 'CmdOrCtrl+X',
        selector: 'cut:',
    },
    paste: {
        label: 'Paste',
        accelerator: 'CmdOrCtrl+V',
        selector: 'paste:',
    },
    separator: {
        type: 'separator',
    },
    reload: { role: 'reload' },
    forcereload: { role: 'forcereload' },
    toggledevtools: { role: 'toggledevtools' },
};

const defaultOptions = {
    transform(menu) {
        return menu;
    },
};

class ShellMenu {
    constructor(window, about, options) {
        this.options = Object.assign({}, defaultOptions, options);
        this.window = window;

        /* Menus for context menus */

        this.selectionMenuTemplate = [
            ShellMenu.createMenuItem('copy'),
            ShellMenu.createMenuItem('selectAll'),
        ];

        this.editMenuTemplate = [
            ShellMenu.createMenuItem('undo'),
            ShellMenu.createMenuItem('redo'),
            ShellMenu.createMenuItem('separator'),
            ShellMenu.createMenuItem('cut'),
            ShellMenu.createMenuItem('copy'),
            ShellMenu.createMenuItem('paste'),
            ShellMenu.createMenuItem('selectAll'),
        ];

        this.aboutItem = ShellMenu.createMenuItem('about');

        this.aboutItem.click = () => {
            about.openWindow();
        };

        this.window.webContents.on('context-menu', (e, props) => {
            const { selectionText, isEditable } = props;
            if (isEditable) {
                this.inputMenu.popup(this.window);
            } else if (selectionText && selectionText.trim() !== '') {
                this.selectionMenu.popup(this.window);
            }
        });
    }

    static createMenuItem(name) {
        return Object.assign({}, ITEMS[name]);
    }

    static addItem(id, item) {
        ITEMS[id] = item;
    }

    build(debug) {
        const menuTemplate = [];
        this.selectionMenu = Menu.buildFromTemplate(this.selectionMenuTemplate);
        this.inputMenu = Menu.buildFromTemplate(this.editMenuTemplate);

        const edit = {
            label: 'Edit',
            submenu: this.editMenuTemplate,
        };

        menuTemplate.push(edit);

        const view = {
            label: 'View',
            submenu: [],
        };

        if (debug) {
            if (view.submenu.length > 0) {
                view.submenu.push(ShellMenu.createMenuItem('separator'));
            }
            view.submenu = view.submenu.concat([
                ShellMenu.createMenuItem('reload'),
                ShellMenu.createMenuItem('forcereload'),
                ShellMenu.createMenuItem('toggledevtools'),
            ]);
        }

        if (view.submenu.length > 0) {
            menuTemplate.push(view);
        }

        const help = {
            label: 'Help',
            submenu: [],
        };

        if (debug) {
            help.submenu.push({
                label: 'Open logs directory',
                click: () => {
                    let stream;
                    for (let i = 0; i < this.window.shell.log.streams.length; i += 1) {
                        stream = this.window.shell.log.streams[i];
                        if (stream.name === 'file') {
                            shell.showItemInFolder(stream.path);
                            break;
                        }
                    }
                },
            });
        }
        if (process.platform !== 'darwin') {
            if (help.submenu.length) {
                help.submenu.push(ShellMenu.createMenuItem('separator'));
            }
            help.submenu.push(this.aboutItem);
        }

        if (help.submenu.length > 0) {
            menuTemplate.push(help);
        }
        // The `app name` menu is specific to MacOS windowing system paradigm
        if (process.platform === 'darwin') {
            const appName = {
                label: app.getName(),
                submenu: [
                    this.aboutItem,
                    ShellMenu.createMenuItem('reload'),
                    { role: 'services', submenu: [] },
                    ShellMenu.createMenuItem('reload'),
                    { role: 'hide' },
                    { role: 'hideothers' },
                    { role: 'unhide' },
                    ShellMenu.createMenuItem('reload'),
                    { role: 'quit' },
                ],
            };
            menuTemplate.unshift(appName);
        }
        const { transform } = this.options;
        this.menu = Menu.buildFromTemplate(transform(menuTemplate));
    }
}

module.exports = ShellMenu;
