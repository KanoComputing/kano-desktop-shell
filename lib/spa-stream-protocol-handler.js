const url = require('url');
const path = require('path');
const fs = require('fs');
const mime = require('mime-types');

function getExtension(p) {
    const parts = p.split('/');
    const lastPart = parts[parts.length - 1];
    return lastPart.split('.').pop();
}

module.exports = function getHandler(root, fallback = 'index.html') {
    return (req, callback) => {
        // Parse the url to extract the pathname
        const u = url.parse(req.url);
        let extension = getExtension(u.pathname);
        // If the path contains an extension, it is a request for a file
        const isFile = extension !== '';
        // Replace the path with the fallback file if the request is not for a file
        const filename = isFile ? u.pathname : fallback;
        extension = getExtension(filename);
        const file = path.normalize(`${root}/${filename}`);
        const mimeType = mime.lookup(extension);
        const stream = fs.createReadStream(file);
        callback({ statusCode: 200, headers: { 'content-type': mimeType }, data: stream });
    };
};
