const url = require('url');
const path = require('path');
const fs = require('fs');
const mime = require('mime-types');

function getExtension(p) {
    const parts = p.split('/');
    const lastPart = parts[parts.length - 1];
    const dotLocation = lastPart.indexOf('.');
    if (dotLocation === -1) {
        return null;
    }
    return lastPart.slice(dotLocation + 1);
}

function getResponse(req, filePath) {
    const fileStat = fs.statSync(filePath);
    const headers = {};
    // Handle video/audio streaming (or seeking)
    if (req.headers.Range) {
        const range = req.headers.Range;
        const parts = range.replace(/bytes=/, '').split('-');
        const start = parseInt(parts[0], 10);
        const end = parts[1] ? parseInt(parts[1], 10) : fileStat.size - 1;
        const chunkSize = (end - start) + 1;

        headers['Content-Range'] = `bytes ${start}-${end}/${fileStat.size}`;
        headers['Accept-Ranges'] = 'bytes';
        headers['Content-Length'] = chunkSize;
        return { status: 206, headers, stream: fs.createReadStream(filePath, { start, end }) };
    }
    headers['Content-Length'] = fileStat.size;
    return { status: 200, headers, stream: fs.createReadStream(filePath) };
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
        const isFile = extension !== null;
        // Replace the path with the fallback file if the request is not for a file
        const filename = isFile ? u.pathname : fallback;
        // Re-read extension is falling back to default file
        if (!isFile) {
            extension = getExtension(filename);
        }
        const file = path.normalize(`${authorityRoot}/${filename}`);
        const mimeType = mime.lookup(extension);
        const resData = getResponse(req, file);
        const { stream, status, headers } = resData;
        const finalStream = postProcess(stream, mimeType, u);
        headers['Content-Type'] = mimeType;
        headers['Access-Control-Allow-Origin'] = '*';
        callback({ statusCode: status, headers, data: finalStream });
    };
};
