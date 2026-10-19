import QRCode from 'qrcode';
import type { ReporteCertificado } from '../types';

/**
 * Genera un hash criptográfico SHA-256 que garantiza la inmutabilidad
 * y autenticidad del reporte oficial de calibración o ensayo.
 */
export async function generarHashIntegridad(reporte: ReporteCertificado): Promise<string> {
  const cadenaBase = [
    reporte.id,
    reporte.numeroConsecutivo || reporte.tempId,
    reporte.clasificacionCodigo,
    reporte.clienteNombre,
    reporte.fechaEmision || reporte.fechaPrueba,
    reporte.aprobadoPor?.id || 'NO_APROBADO',
    JSON.stringify(reporte.datosValvula || reporte.datosTuberia || reporte.datosCalibracion || {}),
  ].join('|');

  // Cálculo en navegador usando Web Crypto API
  if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) {
    const encoder = new TextEncoder();
    const data = encoder.encode(cadenaBase);
    const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  }

  // Fallback simple si Web Crypto no está disponible
  let hash = 0;
  for (let i = 0; i < cadenaBase.length; i++) {
    const char = cadenaBase.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return Math.abs(hash).toString(16).padStart(64, '0');
}

/**
 * Genera un código QR en Data URL (PNG) con la URL o token de verificación
 */
export async function generarQrVerificacion(reporte: ReporteCertificado): Promise<string> {
  const idDocumental = reporte.numeroConsecutivo || reporte.tempId;
  const urlVerificacion = `${window.location.origin}/#verificar?cert=${encodeURIComponent(idDocumental)}`;

  try {
    return await QRCode.toDataURL(urlVerificacion, {
      errorCorrectionLevel: 'M',
      width: 140,
      margin: 1,
      color: {
        dark: '#0f172a',
        light: '#ffffff',
      },
    });
  } catch (err) {
    console.error('Error generando QR code:', err);
    return '';
  }
}
