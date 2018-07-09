const { app } = require('electron');
const { Shell, ShellMenu } = require('../lib');
const path = require('path');

const CONTENT_SCHEME = 'kano-shell';
const CONTENT_ROOT = path.join(__dirname, './src');

// Custom menu Item added
ShellMenu.addItem('my-item', { label: 'My Menu Item', click() { console.log('My Menu Item'); } });

// Create new Shell with custom options
// Includes automatic window state managment and UWP style titlebar for windows
// Custom preload as module supported
const shell = new Shell({
    name: 'My App',
    root: CONTENT_ROOT,
    scheme: CONTENT_SCHEME,
    // Can provide custom width and height
    width: 1440,
    height: 900,
    // Supports preload script
    preload: path.join(__dirname, 'preload.js'),
    titlebar: true,
    // Enable UWP style titlebar
    uwpTitlebar: true,
    devMode: false,
    menu: {
        transform(menu) {
            const submenu = [ShellMenu.createMenuItem('my-item')];
            // Can update when dev mode changes
            if (shell.isDevMode()) {
                submenu.push(ShellMenu.createMenuItem('separator'));
                // Can add custom runtime generated menu items
                submenu.push({ label: 'Dev option' });
            }
            // Inject in list of menus
            menu.splice(1, 0, {
                label: 'Custom Menu',
                submenu,
            });
            return menu;
        },
    },
    windowOptions: {
        icon: path.join(__dirname, 'res/icon_180.png'),
    },
    log: {
        level: 'info',
        file: {
            period: '1d',
            count: 7,
        },
    },
});

app.on('ready', () => {
    shell.createWindow();
    // Can access logger through the shell object
    const { log } = shell;
    log.info('My app has started');
    // The main window is accessible through properties
    // console.log(shell.window);
});
