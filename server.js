const http = require('http');
const fs = require('fs');
const path = require('path');

const port = 3000;
const MIME = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

http.createServer((req, res) => {
  let filePath = req.url === '/' ? '/index.html' : req.url;
  
  // Remove query string
  filePath = filePath.split('?')[0];
  
  // Add .html extension if no extension present
  if (!path.extname(filePath)) {
    filePath += '.html';
  }
  
  const fullPath = path.join(__dirname, filePath);
  const ext = path.extname(fullPath).toLowerCase();
  
  fs.readFile(fullPath, (err, data) => {
    if (err) {
      // Try serving 404.html
      fs.readFile(path.join(__dirname, '404.html'), (e404, d404) => {
        if (e404) {
          res.writeHead(404, { 'Content-Type': 'text/html' });
          res.end('<h1>404 - Page Not Found</h1>');
        } else {
          res.writeHead(404, { 'Content-Type': 'text/html' });
          res.end(d404);
        }
      });
      return;
    }
    
    res.writeHead(200, { 'Content-Type': MIME[ext] || 'text/html' });
    res.end(data);
  });
}).listen(port, () => {
  console.log('🛒 Fahd Shop running on http://localhost:' + port);
});
