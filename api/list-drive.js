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
      scope: 'https://www.googleapis.com/auth/drive.readonly https://www.googleapis.com/auth/drive',
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
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const creds = getServiceAccount();
    const token = await getAccessToken(creds);

    const q = encodeURIComponent(`'${FOLDER_ID}' in parents and trashed = false`);
    const filesRes = await fetch(
      `https://www.googleapis.com/drive/v3/files?q=${q}&fields=files(id,name,mimeType,size,webViewLink,createdTime,modifiedTime)&orderBy=modifiedTime desc`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    const filesData = await filesRes.json();
    if (!filesRes.ok) {
      return res.status(filesRes.status).json({ error: filesData });
    }

    return res.status(200).json({
      success: true,
      files: filesData.files || [],
    });
  } catch (error) {
    console.error('Error en api/list-drive:', error);
    return res.status(500).json({ error: error.message || 'Error interno al consultar Google Drive' });
  }
}
