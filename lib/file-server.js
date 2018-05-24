const { protocol } = require('electron');
const spaHandler = require('./spa-stream-protocol-handler');

function registerProtocol(scheme, root, opts = {}) {
    const handler = opts.handler || (() => {});
    protocol.registerStreamProtocol(scheme, spaHandler(root, opts), handler);
}

module.exports = { registerProtocol };
