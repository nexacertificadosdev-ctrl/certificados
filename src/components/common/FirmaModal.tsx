import React, { useState } from 'react';
import type { Usuario } from '../../types';
import { storageService } from '../../services/storageService';
import { Upload, X, Check, PenTool } from 'lucide-react';

interface FirmaModalProps {
  usuario: Usuario;
  onClose: () => void;
  onFirmaActualizada: (firmaUrl: string) => void;
}

export const FirmaModal: React.FC<FirmaModalProps> = ({ usuario, onClose, onFirmaActualizada }) => {
  const [previewUrl, setPreviewUrl] = useState<string>(usuario.firmaUrl || '');
  const [guardando, setGuardando] = useState(false);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGenerarFirmaEjemplo = () => {
    // Generar imagen SVG en base64 simulando firma manuscrita para agilizar pruebas
    const canvas = document.createElement('canvas');
    canvas.width = 300;
    canvas.height = 120;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.clearRect(0, 0, 300, 120);
      ctx.font = 'italic 26px "Brush Script MT", "Segoe Script", cursive';
      ctx.fillStyle = '#0f172a';
      ctx.fillText(usuario.nombre, 25, 65);
      ctx.strokeStyle = '#2563eb';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(20, 75);
      ctx.bezierCurveTo(90, 85, 180, 60, 270, 80);
      ctx.stroke();
      setPreviewUrl(canvas.toDataURL());
    }
  };

  const handleGuardar = () => {
    if (!previewUrl) return;
    setGuardando(true);
    storageService.actualizarFirmaUsuario(usuario.id, previewUrl);
    onFirmaActualizada(previewUrl);
    setGuardando(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
          <div className="flex items-center gap-2">
            <PenTool className="w-5 h-5 text-blue-600" />
            <h3 className="font-semibold text-slate-800">Firma Digitalizada del Usuario</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="text-sm text-slate-600">
            <p><strong>Usuario:</strong> {usuario.nombre}</p>
            <p><strong>Cargo:</strong> {usuario.cargo}</p>
            <p className="text-xs text-slate-500 mt-1">
              Esta firma se estampará en los certificados emitidos conforme a tu rol técnico o directivo.
            </p>
          </div>

          <div className="border-2 border-dashed border-slate-300 rounded-lg p-4 text-center bg-slate-50 flex flex-col items-center justify-center min-h-[140px]">
            {previewUrl ? (
              <div className="relative group">
                <img src={previewUrl} alt="Firma vista previa" className="max-h-24 max-w-full object-contain mx-auto" />
                <span className="text-[11px] text-emerald-600 font-medium block mt-2">✓ Firma cargada correctamente</span>
              </div>
            ) : (
              <div className="text-slate-400">
                <Upload className="w-8 h-8 mx-auto mb-1 stroke-1" />
                <span className="text-xs">No hay firma cargada</span>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2">
            <label className="flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg border border-slate-300 hover:bg-slate-50 text-slate-700 cursor-pointer transition">
              <Upload className="w-3.5 h-3.5" />
              <span>Subir Archivo (PNG/JPG)</span>
              <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
            </label>

            <button
              type="button"
              onClick={handleGenerarFirmaEjemplo}
              className="flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg border border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-700 transition"
            >
              <PenTool className="w-3.5 h-3.5" />
              <span>Generar Demo</span>
            </button>
          </div>
        </div>

        <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-200 rounded-lg transition"
          >
            Cancelar
          </button>
          <button
            onClick={handleGuardar}
            disabled={!previewUrl || guardando}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition disabled:opacity-50"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Guardar Firma</span>
          </button>
        </div>
      </div>
    </div>
  );
};
