import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import crypto from 'node:crypto';

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [
      react(),
      tailwindcss(),
      {
        name: 'local-api-cloudinary-sign',
        configureServer(server) {
          server.middlewares.use('/api/cloudinary-sign', (req, res) => {
            res.setHeader('Content-Type', 'application/json');
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
            res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

            if (req.method === 'OPTIONS') {
              res.statusCode = 200;
              res.end();
              return;
            }

            if (req.method !== 'POST') {
              res.statusCode = 405;
              res.end(JSON.stringify({ error: 'Method Not Allowed' }));
              return;
            }

            const cloudName = env.CLOUDINARY_CLOUD_NAME || process.env.CLOUDINARY_CLOUD_NAME;
            const apiKey = env.CLOUDINARY_API_KEY || process.env.CLOUDINARY_API_KEY;
            const apiSecret = env.CLOUDINARY_API_SECRET || process.env.CLOUDINARY_API_SECRET;

            if (!cloudName || !apiKey || !apiSecret) {
              res.statusCode = 500;
              res.end(
                JSON.stringify({
                  error: 'Cloudinary credentials missing in .env for local serverless emulation.',
                })
              );
              return;
            }

            const timestamp = Math.round(new Date().getTime() / 1000);
            const folder = 'webryza/weddings';
            const stringToSign = `folder=${folder}&timestamp=${timestamp}${apiSecret}`;
            const signature = crypto.createHash('sha1').update(stringToSign).digest('hex');

            res.statusCode = 200;
            res.end(
              JSON.stringify({
                success: true,
                signature,
                timestamp,
                apiKey,
                cloudName,
                folder,
              })
            );
          });
        },
      },
    ],
    server: {
      port: 3000,
      open: true,
    },
    build: {
      chunkSizeWarningLimit: 1000,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules/firebase')) {
              return 'firebase';
            }
            if (id.includes('node_modules/react') || id.includes('node_modules/react-dom')) {
              return 'vendor';
            }
          },
        },
      },
    },
  };
});
