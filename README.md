# Kano Desktop Shell

Abstraction layer on top of electron to provide common features in a shell ready to use.

## Features

 - Static SPA content delivery (Through registered custom protocol)
 - Window state managment (electron-window-state)
 - UWP style titlebar for windows with dropdown menu
 - Default menu items (clipboard, selection, help)
 - About page (Help/About or AppName/About on macOS)
 - Developer mode option (5 clicks on icon in the about page)

### Future Features

 - Update checking and menu options

## Style

### Windows

UWP style Titlebar

![Classic](res/uwp.png?raw=true)
![Classic](res/uwp-menu.png?raw=true)

Classic style titlebar (Windows 10)

![Classic](res/classic.png?raw=true)
![Classic](res/classic-menu.png?raw=true)

## API

`Shell`: Use this class to create a new app with a browser window serving content from a local directory

options: 
 - `root`, (required) Root of the local directory you want to serve in the browser window.
 - `scheme`, Scheme that will be used in the server protocol (Default: `shell`)
 - `width`, Width of the main window (Default: `800`).
 - `height`, Height of the main window (Default: `600`).
 - `preload`, path to a preload script (Default: none).
 - `titlebar`, Enables the titlebar (Default: `true`).
 - `uwpTitlebar`, Enables the UWP style titlebar for windows (Default: `true`).
 - `devMode`, Enables developer mode (DevTool options) (Default: `false`).
 - `menuTransform`, Function that will receive the shell menu and should return a modified version of it to add custom menu and menu items.
 - `windowOptions`, Any option that will be passed down to electron's `BrowserWindow` constructor.

Methods:

 - `updateMenu()`: Triggers an update of the menu bar.
 - `isDevMode()`: Return a boolean. `true` if in developer mode `false` if not.

## Example

```js
const { app } = require('electron');
const { Shell, Shellmenu } = require('kano-desktop-shell');
const path = require('path');

const CONTENT_SCHEME = 'my-custom-app';
// Location of the static content to serve. This will be served through a custom protocol
const CONTENT_ROOT = path.join(__dirname, './src');

// Custom menu Item added
ShellItem.addItem('my-item', { label: 'My Menu Item', click() { console.log('My Menu Item') } });

// Create new Shell with custom options
// Includes automatic window state managment and UWP style titlebar for windows
// Custom preload as module supported
const shell = new Shell({
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
    menuTransform(menu) {
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
    // Set custom window options through this object
    windowOptions: {
        icon: path.join(__dirname, 'res/icon_180.png'),
    },
});

app.on('ready', () => {
    shell.createWindow();
    // The main window is accessible through properties
    console.log(shell.window);
});
```