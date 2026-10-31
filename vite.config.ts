import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';
import { handleApiRequest } from './src/services/apiRouter.ts';

export default defineConfig({
  plugins: [
    tailwindcss(),
    {
      name: 'learnova-api-server',
      configureServer(server) {
        server.middlewares.use(async (req, res, next) => {
          if (req.url && req.url.startsWith('/api/')) {
            const method = req.method || 'GET';
            let body: any = null;

            if (method === 'POST' || method === 'PUT' || method === 'PATCH') {
              const buffers: any[] = [];
              let totalLength = 0;
              const MAX_BODY_SIZE = 5 * 1024 * 1024; // 5MB limit

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

            const [pathname] = req.url.split('?');
            const timestamp = new Date().toISOString();
            console.log(`[${timestamp}] [API] ${method} ${pathname}`);

            try {
              const result = await handleApiRequest(method, pathname, body);
              res.statusCode = result.status;
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
          next();
        });
      },
    },
  ],
  server: {
    host: '0.0.0.0',
    port: 3000,
  },
});
