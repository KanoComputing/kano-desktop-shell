const fs = require('fs');
const path = require('path');
const { ipcRenderer } = require('electron');

const EVENTS = require('./events');

const TEMPLATE_STRING = fs.readFileSync(path.join(__dirname, 'titlebar.html'), 'utf-8');

const MAXIMIZED_ATTRIBUTE = 'maximized';
const MENU_ATTRIBUTE = 'no-menu';

class WindowsTitlebar extends HTMLElement {
    constructor() {
        super();
        this.root = this.attachShadow({ mode: 'open' });
        this.root.innerHTML = TEMPLATE_STRING;

        this.minimizeButton = this.root.querySelector('.titlebar-minimize');
        this.resizeButton = this.root.querySelector('.titlebar-resize');
        this.closeButton = this.root.querySelector('.titlebar-close');
        this.titleContainer = this.root.querySelector('.titlebar-title');
        this.menu = this.root.querySelector('.titlebar-menu');

        this.updateMenuIcon();

        this.addListeners();
    }

    addListeners() {
        this.addEventListener('dblclick', event => this.onDoubleclick(event));
        this.minimizeButton.addEventListener('click', event => this.clickMinimize(event));
        this.resizeButton.addEventListener('click', event => this.clickResize(event));
        this.closeButton.addEventListener('click', event => this.clickClose(event));
        this.menu.addEventListener('click', event => this.clickMenu(event));

        ipcRenderer.on('maximize', e => this.onMaximized(e));
        ipcRenderer.on('unmaximize', e => this.onUnMaximized(e));
    }

    updateMenuIcon() {
        if (this.noMenu) {
            this.menu.setAttribute('hidden', '');
        } else {
            this.menu.removeAttribute('hidden');
        }
    }

    setup() {
        this.titleElement = document.querySelector('title');

        if (!this.titleElement) {
            return;
        }

        this.mutationObserver = new MutationObserver(() => {
            this.updateTitle();
        }).observe(
            this.titleElement,
            { subtree: true, characterData: true },
        );
        this.updateTitle();
    }

    updateTitle() {
        if (!this.titleElement) {
            return;
        }
        const title = this.titleElement.textContent;
        this.titleContainer.textContent = title;
    }

    onMaximized() {
        this.classList.add('fullscreen');
    }

    onUnMaximized() {
        this.classList.remove('fullscreen');
    }

    clickMenu() {
        this.dispatchEvent(new CustomEvent('menu'));
    }

    clickClose() {
        this.dispatchEvent(new CustomEvent('close'));
    }

    clickMinimize() {
        this.dispatchEvent(new CustomEvent('minimize'));
    }

    clickResize() {
        if (this.maximized) {
            this.dispatchEvent(new CustomEvent('un-maximize'));
        } else {
            this.dispatchEvent(new CustomEvent('maximize'));
        }

        this.maximized = !this.maximized;
    }

    onDoubleclick(event) {
        if (!(this.minimizeButton.contains(event.target)
            || this.resizeButton.contains(event.target)
            || this.closeButton.contains(event.target))) {
            this.clickResize(event);
        }
    }

    get maximized() {
        return this.hasAttribute(MAXIMIZED_ATTRIBUTE);
    }

    set maximized(value) {
        if (!value) {
            this.removeAttribute(MAXIMIZED_ATTRIBUTE);
        } else {
            this.setAttribute(MAXIMIZED_ATTRIBUTE, '');
        }
    }

    get noMenu() {
        return this.hasAttribute(MENU_ATTRIBUTE);
    }

    set noMenu(value) {
        if (!value) {
            this.removeAttribute(MENU_ATTRIBUTE);
        } else {
            this.setAttribute(MENU_ATTRIBUTE, '');
        }
        this.updateMenuIcon();
    }
}

customElements.define('windows-titlebar', WindowsTitlebar);

class Titlebar {
    constructor() {
        this.element = document.createElement('windows-titlebar');
    }
    setup(container = document.body) {
        EVENTS.forEach(eventName => (
            this.element.addEventListener(eventName, () => ipcRenderer.send(eventName))
        ));
        container.prepend(this.element);
        this.element.setup();
    }
}

module.exports = Titlebar;
