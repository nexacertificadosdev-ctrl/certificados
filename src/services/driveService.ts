export interface UploadDriveResult {
  success: boolean;
  fileId?: string;
  name?: string;
  webViewLink?: string;
  error?: string;
}

export const driveService = {
  /**
   * Sube un archivo PDF a la carpeta de Google Drive configurada
   */
  async subirArchivo(archivo: File | Blob, nombreArchivo: string): Promise<UploadDriveResult> {
    try {
      const buffer = await archivo.arrayBuffer();
      const base64 = btoa(
        new Uint8Array(buffer).reduce((data, byte) => data + String.fromCharCode(byte), '')
      );

      const response = await fetch('/api/upload-drive', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fileName: nombreArchivo,
          fileBase64: base64,
          mimeType: 'application/pdf',
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return {
          success: false,
          error: errorData.error || `HTTP ${response.status}`,
        };
      }

      const data = await response.json();
      return {
        success: true,
        fileId: data.fileId,
        name: data.name,
        webViewLink: data.webViewLink,
      };
    } catch (err: any) {
      console.warn('[driveService] Error subiendo a Drive:', err);
      return {
        success: false,
        error: err.message || 'Error de red al conectar con Google Drive',
      };
    }
  },
};
