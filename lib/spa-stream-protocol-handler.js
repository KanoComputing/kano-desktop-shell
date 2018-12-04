const url = require('url');
const path = require('path');
const fs = require('fs');
const mime = require('mime-types');

function getExtension(p) {
    const parts = p.split('/');
    const lastPart = parts[parts.length - 1];
    return lastPart.split('.').pop();
}

module.exports = function getHandler(root, opts = {}) {
    const fallback = opts.fallback || 'index.html';
    const postProcess = opts.postProcess || (s => s);
    const authorities = opts.authorities || {};
    return (req, callback) => {
        // Parse the url to extract the pathname
        const u = url.parse(req.url);
        // Authority called host in URLs
        const { host } = u;
        // Use the root defined in the authorities routing or default ot the default root
        const authorityRoot = authorities[host] || root;
        let extension = getExtension(u.pathname);
        // If the path contains an extension, it is a request for a file
        const isFile = extension !== '';
        // Replace the path with the fallback file if the request is not for a file
        const filename = isFile ? u.pathname : fallback;
        extension = getExtension(filename);
        const file = path.normalize(`${authorityRoot}/${filename}`);
        const mimeType = mime.lookup(extension);
        const stream = fs.createReadStream(file);
        const finalStream = postProcess(stream, mimeType, u);
        callback({ statusCode: 200, headers: { 'content-type': mimeType, 'Access-Control-Allow-Origin': '*' }, data: finalStream });
    };
};
