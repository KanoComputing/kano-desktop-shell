const { remote, ipcRenderer } = require('electron');

const currentWindow = remote.getCurrentWindow();
const { aboutOptions } = currentWindow;
const { versions } = process;

let clicks = 0;
let { devMode } = aboutOptions;

function updateUI() {
    const template = `
<body>
    <div class="logo" id="app-icon" style="border: ${aboutOptions.iconPath ? 'none' : '1px solid grey'}">
        <img alt="App icon" height="200" src="${aboutOptions.iconPath || ''}">
    </div>
    <h2 class="title">${remote.app.getName()} ${remote.app.getVersion()}</h2>
    <h3 class="description">${aboutOptions.description || ''}</h3>
    <div class="copyright">${aboutOptions.copyright || ''}</div>
    <div>${devMode ? 'Developer Mode enabled' : ''}</div>
    <table class="versions">
        ${['electron', 'chrome', 'node', 'v8'].map(key => `<tr><td>${key}</td><td>${versions[key]}</td></tr>`).join('')}
    </table>
    <footer class="footer">
        <div class="link bug-report-link"></div>
    </footer>
</body>
`;
    document.body.innerHTML = template;
}

function enableDevMode() {
    devMode = true;
    ipcRenderer.send('about:enable-dev-mode');
    updateUI();
}

function onIconClick() {
    clicks += 1;
    if (clicks >= 5) {
        enableDevMode();
    }
}

window.addEventListener('DOMContentLoaded', () => {
    updateUI();
    const icon = document.getElementById('app-icon');
    icon.addEventListener('click', onIconClick);
});
