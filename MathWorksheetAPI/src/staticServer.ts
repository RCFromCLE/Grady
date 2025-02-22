import * as http from 'http';
import * as fs from 'fs';
import * as path from 'path';

const server = http.createServer((req, res) => {
    // Add CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Handle OPTIONS request for CORS
    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }

    // Serve index.html for root path
    const filePath = req.url === '/' ? 
        path.join(process.cwd(), 'public', 'index.html') :
        path.join(process.cwd(), 'public', req.url || '');

    const contentType = {
        '.html': 'text/html',
        '.css': 'text/css',
        '.js': 'text/javascript',
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
        '.gif': 'image/gif'
    }[path.extname(filePath)] || 'text/plain';

    fs.readFile(filePath, (error, content) => {
        if (error) {
            if (error.code === 'ENOENT') {
                console.error(`File not found: ${filePath}`);
                res.writeHead(404);
                res.end('File not found');
            } else {
                console.error(`Server error: ${error.code}`);
                res.writeHead(500);
                res.end('Internal server error');
            }
        } else {
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(content);
        }
    });
});

const PORT = 3000;
server.listen(PORT, () => {
    console.log(`Static server running at http://localhost:${PORT}`);
    console.log(`Serving files from: ${path.join(process.cwd(), 'public')}`);
});
