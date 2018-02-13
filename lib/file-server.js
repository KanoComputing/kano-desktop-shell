const { protocol } = require('electron');
const spaHandler = require('./spa-file-protocol-handler');

function registerProtocol(scheme, root, handler = () => {}) {
    protocol.registerFileProtocol(scheme, spaHandler(root), handler);
}

module.exports = { registerProtocol };
