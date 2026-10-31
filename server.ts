import 'dotenv/config';
import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { handleApiRequest } from './src/services/apiRouter.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 5000;
const HOST = '0.0.0.0';

const server = http.createServer(async (req, res) => {
  const url = req.url || '/';

  // Security & CORS headers
 res.setHeader('Access-Control-Allow-Origin', 'https://sparkling-bombolone-d39b27.netlify.app');
res.setHeader('Access-Control-Allow-Credentials', 'true');
res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    res.end();
    return;
  }

  // API routing
  if (url.startsWith('/api/')) {
    const method = req.method || 'GET';
    let body: any = null;

    if (method === 'POST' || method === 'PUT' || method === 'PATCH') {
      const buffers: any[] = [];
      let totalLength = 0;
      const MAX_BODY_SIZE = 5 * 1024 * 1024; // 5MB payload limit

      for await (const chunk of req) {
        totalLength += chunk.length;
        if (totalLength > MAX_BODY_SIZE) {
          res.statusCode = 413;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: 'Payload Too Large: maximum allowed upload is 5MB.' }));
          return;
        }
        buffers.push(chunk);
      }
      const data = Buffer.concat(buffers).toString();
      try {
        body = data ? JSON.parse(data) : {};
      } catch (e) {
        body = {};
      }
    }

    try {
      const [pathname] = url.split('?');
      const result = await handleApiRequest(method, pathname, body, { cookie: req.headers.cookie });
      res.statusCode = result.status;
      for (const [header, value] of Object.entries(result.headers || {})) {
        res.setHeader(header, value);
      }
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify(result.data));
      return;
    } catch (err: any) {
      res.statusCode = 500;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: err.message || 'Internal Server Error' }));
      return;
    }
  }

  // Serve static files from dist or root
  let filePath = path.join(__dirname, 'dist', url === '/' ? 'index.html' : url);
  if (!fs.existsSync(filePath)) {
    filePath = path.join(__dirname, 'dist', 'index.html');
  }

  if (fs.existsSync(filePath)) {
    const ext = path.extname(filePath);
    const mimeTypes: Record<string, string> = {
      '.html': 'text/html',
      '.js': 'application/javascript',
      '.css': 'text/css',
      '.svg': 'image/svg+xml',
      '.json': 'application/json',
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
    };
    res.statusCode = 200;
    res.setHeader('Content-Type', mimeTypes[ext] || 'application/octet-stream');
    fs.createReadStream(filePath).pipe(res);
  } else {
    res.statusCode = 200;
    res.setHeader('Content-Type', 'text/html');
    res.end('<!DOCTYPE html><html><body><h1>Learnova Tutor</h1><p>Build required: npm run build</p></body></html>');
  }
});

server.listen(Number(PORT), HOST, () => {
  console.log(`Learnova Tutor server running at http://${HOST}:${PORT}`);
});
