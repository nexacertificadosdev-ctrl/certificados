import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';
import type { Plugin } from 'vite';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

function googleDriveDevPlugin(): Plugin {
  return {
    name: 'google-drive-dev-plugin',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (req.url === '/api/upload-drive' && req.method === 'POST') {
          try {
            let body = '';
            req.on('data', (chunk) => {
              body += chunk;
            });
            req.on('end', async () => {
              try {
                const parsed = JSON.parse(body);
                const files = fs.readdirSync(process.cwd());
                const keyFile = files.find(
                  (f) => f.startsWith('certificados-app-') && f.endsWith('.json')
                );

                if (!keyFile) {
                  res.statusCode = 500;
                  res.setHeader('Content-Type', 'application/json');
                  return res.end(
                    JSON.stringify({ error: 'No se encontró archivo de credenciales de Google Service Account' })
                  );
                }

                const creds = JSON.parse(fs.readFileSync(path.join(process.cwd(), keyFile), 'utf8'));
                const now = Math.floor(Date.now() / 1000);
                const header = Buffer.from(JSON.stringify({ alg: 'RS256', typ: 'JWT' })).toString('base64url');
                const claim = Buffer.from(
                  JSON.stringify({
                    iss: creds.client_email,
                    scope: 'https://www.googleapis.com/auth/drive',
                    aud: 'https://oauth2.googleapis.com/token',
                    exp: now + 3600,
                    iat: now,
                  })
                ).toString('base64url');

                const sign = crypto.createSign('RSA-SHA256');
                sign.update(`${header}.${claim}`);
                const signature = sign.sign(creds.private_key, 'base64url');
                const jwt = `${header}.${claim}.${signature}`;

                const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                  body: new URLSearchParams({
                    grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
                    assertion: jwt,
                  }),
                });

                const tokenData = (await tokenRes.json()) as any;
                if (!tokenData?.access_token) {
                  res.statusCode = 500;
                  res.setHeader('Content-Type', 'application/json');
                  return res.end(JSON.stringify({ error: 'Error de autenticación con Google OAuth' }));
                }

                const FOLDER_ID = '1lM9S94X9RXKMMO0f9izpBJlsMeiBmcYm';
                const boundary = '-------314159265358979323846';
                const delimiter = `\r\n--${boundary}\r\n`;
                const closeDelimiter = `\r\n--${boundary}--`;
                const metadata = { name: parsed.fileName, parents: [FOLDER_ID] };
                const multipart =
                  delimiter +
                  'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
                  JSON.stringify(metadata) +
                  delimiter +
                  `Content-Type: ${parsed.mimeType || 'application/pdf'}\r\n` +
                  'Content-Transfer-Encoding: base64\r\n\r\n' +
                  parsed.fileBase64 +
                  closeDelimiter;

                const uploadRes = await fetch(
                  'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,webViewLink',
                  {
                    method: 'POST',
                    headers: {
                      Authorization: `Bearer ${tokenData.access_token}`,
                      'Content-Type': `multipart/related; boundary=${boundary}`,
                    },
                    body: multipart,
                  }
                );

                const uploadData = (await uploadRes.json()) as any;
                res.statusCode = uploadRes.status;
                res.setHeader('Content-Type', 'application/json');
                return res.end(
                  JSON.stringify({
                    success: true,
                    fileId: uploadData.id,
                    name: uploadData.name,
                    webViewLink: uploadData.webViewLink || `https://drive.google.com/file/d/${uploadData.id}/view`,
                  })
                );
              } catch (e: any) {
                res.statusCode = 500;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ error: e.message }));
              }
            });
          } catch (e: any) {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: e.message }));
          }
        } else {
          next();
        }
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), tailwindcss(), googleDriveDevPlugin()],
});
