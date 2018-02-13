const url = require('url');
const path = require('path');

module.exports = function getHandler(root, fallback = 'index.html') {
    return (req, callback) => {
        // Parse the url to extract the pathname
        const u = url.parse(req.url);
        const parts = u.pathname.split('/');
        // If the path contains an extension, it is a request for a file
        const isFile = parts[parts.length - 1].indexOf('.') !== -1;
        // Replace the path with the fallback file if the request is not for a file
        const filename = isFile ? u.pathname : fallback;
        const file = path.normalize(`${root}/${filename}`);
        callback({ path: file });
    };
};
