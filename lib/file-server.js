const { protocol } = require('electron');
const spaHandler = require('./spa-stream-protocol-handler');

function registerProtocol(scheme, root, handler = () => {}) {
    protocol.registerStreamProtocol(scheme, spaHandler(root), handler);
}

module.exports = { registerProtocol };
