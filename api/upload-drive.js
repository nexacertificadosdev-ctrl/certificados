import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

const FOLDER_ID = '1lM9S94X9RXKMMO0f9izpBJlsMeiBmcYm';

function getServiceAccount() {
  if (process.env.GOOGLE_SERVICE_ACCOUNT_KEY) {
    try {
      return JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY);
    } catch (e) {
      console.error('Error parseando GOOGLE_SERVICE_ACCOUNT_KEY:', e);
    }
  }

  try {
    const files = fs.readdirSync(process.cwd());
    const keyFile = files.find((f) => f.startsWith('certificados-app-') && f.endsWith('.json'));
    if (keyFile) {
      return JSON.parse(fs.readFileSync(path.join(process.cwd(), keyFile), 'utf8'));
    }
  } catch (e) {
    console.error('Error buscando archivo local de credenciales:', e);
  }

  throw new Error('No se encontraron credenciales de Google Service Account');
}

async function getAccessToken(creds) {
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

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    }),
  });

  const data = await res.json();
  if (!data.access_token) {
    throw new Error(`Google token error: ${JSON.stringify(data)}`);
  }
  return data.access_token;
}

export default async function handler(req, res) {
  // Configurar CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido. Use POST.' });
  }

  try {
    const { fileName, fileBase64, mimeType = 'application/pdf' } = req.body || {};
    if (!fileName || !fileBase64) {
      return res.status(400).json({ error: 'Faltan parámetros: fileName o fileBase64' });
    }

    const creds = getServiceAccount();
    const token = await getAccessToken(creds);

    const boundary = '-------314159265358979323846';
    const delimiter = `\r\n--${boundary}\r\n`;
    const closeDelimiter = `\r\n--${boundary}--`;

    const metadata = {
      name: fileName,
      parents: [FOLDER_ID],
    };

    const multipartRequestBody =
      delimiter +
      'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
      JSON.stringify(metadata) +
      delimiter +
      `Content-Type: ${mimeType}\r\n` +
      'Content-Transfer-Encoding: base64\r\n\r\n' +
      fileBase64 +
      closeDelimiter;

    const uploadRes = await fetch(
      'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,webViewLink,webContentLink',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': `multipart/related; boundary=${boundary}`,
        },
        body: multipartRequestBody,
      }
    );

    const uploadData = await uploadRes.json();
    if (!uploadRes.ok) {
      return res.status(uploadRes.status).json({ error: uploadData });
    }

    return res.status(200).json({
      success: true,
      fileId: uploadData.id,
      name: uploadData.name,
      webViewLink: uploadData.webViewLink || `https://drive.google.com/file/d/${uploadData.id}/view`,
    });
  } catch (error) {
    console.error('Error en api/upload-drive:', error);
    return res.status(500).json({ error: error.message || 'Error interno del servidor' });
  }
}
