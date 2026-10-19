import React, { useState } from 'react';
import type { EstadoReporte, ReporteCertificado, Usuario } from '../../types';
import { storageService } from '../../services/storageService';
import {
  CheckCircle,
  XCircle,
  AlertTriangle,
  FileCheck,
  Send,
  X,
  History,
  ShieldAlert,
} from 'lucide-react';

interface RevisionModalProps {
  reporte: ReporteCertificado;
  usuarioActual: Usuario;
  onClose: () => void;
  onActualizado: (reporte: ReporteCertificado) => void;
}

export const RevisionModal: React.FC<RevisionModalProps> = ({
  reporte,
  usuarioActual,
  onClose,
  onActualizado,
}) => {
  const [observaciones, setObservaciones] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [procesando, setProcesando] = useState(false);

  const numVisible = reporte.numeroConsecutivo || reporte.tempId;

  const handleTransicion = (nuevoEstado: EstadoReporte) => {
    setError(null);
    if ((nuevoEstado === 'devuelto' || nuevoEstado === 'anulado') && !observaciones.trim()) {
      setError('Es obligatorio ingresar las observaciones o motivo para esta acción.');
      return;
    }

    try {
      setProcesando(true);
      const repActualizado = storageService.cambiarEstadoReporte(
        reporte.id,
        nuevoEstado,
        usuarioActual,
        observaciones
      );
      onActualizado(repActualizado);
      onClose();
    } catch (e: any) {
      setError(e.message || 'Error al cambiar el estado del reporte.');
    } finally {
      setProcesando(false);
    }
  };

  // Permisos según rol
  const puedeDevolver =
    reporte.estado === 'en_revision' &&
    ['revisor_tecnico', 'director_tecnico', 'administrador'].includes(usuarioActual.rol);

  const puedeAprobar =
    reporte.estado === 'en_revision' &&
    ['revisor_tecnico', 'director_tecnico', 'administrador'].includes(usuarioActual.rol);

  const puedeEmitir =
    ['aprobado', 'en_revision'].includes(reporte.estado) &&
    ['director_tecnico', 'administrador'].includes(usuarioActual.rol);

  const puedeAnular =
    reporte.estado !== 'anulado' &&
    ['director_tecnico', 'administrador'].includes(usuarioActual.rol);

  const puedeEnviarRevision =
    ['borrador', 'devuelto'].includes(reporte.estado) &&
    ['tecnico', 'administrador'].includes(usuarioActual.rol);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full overflow-hidden border border-slate-200">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Control de Estados y Aprobaciones
            </span>
            <h3 className="font-bold text-slate-800 text-base">
              Reporte: {numVisible}
            </h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-lg flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          {/* Estado actual */}
          <div className="flex items-center justify-between bg-slate-50 p-3 rounded-lg border border-slate-200">
            <div>
              <span className="text-[11px] text-slate-500 block">Estado Actual</span>
              <span className="font-bold text-xs uppercase text-slate-900">{reporte.estado}</span>
            </div>
            <div>
              <span className="text-[11px] text-slate-500 block">Tu Rol Activo</span>
              <span className="font-semibold text-xs text-blue-700 uppercase">{usuarioActual.rol}</span>
            </div>
          </div>

          {/* Historial de transiciones */}
          <div>
            <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5 mb-2">
              <History className="w-4 h-4 text-slate-500" />
              Trazabilidad de Revisiones Previas
            </span>
            <div className="space-y-2 border border-slate-200 rounded-lg p-3 bg-slate-50 text-xs max-h-40 overflow-y-auto">
              {reporte.transiciones.map((tr) => (
                <div key={tr.id} className="border-b border-slate-200 pb-2 last:border-b-0 last:pb-0">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-semibold text-slate-800">
                      {tr.usuarioNombre} ({tr.rolUsuario})
                    </span>
                    <span className="text-slate-400 font-mono text-[10px]">{tr.fecha}</span>
                  </div>
                  <div className="text-slate-600 mt-0.5">
                    Transición a <strong className="uppercase">{tr.estadoNuevo}</strong>
                    {tr.observaciones && <p className="italic text-slate-500 mt-0.5">"{tr.observaciones}"</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Campo de observaciones / motivo */}
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Observaciones Técnicas o Motivo de Transición
            </label>
            <textarea
              rows={3}
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
              placeholder="Escribe comentarios para el técnico, motivo de devolución, aprobación o anulación..."
              className="w-full text-xs rounded-lg border border-slate-300 p-2.5 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          {/* Botones de acción según permisos */}
          <div className="pt-2 border-t border-slate-100 space-y-2">
            <span className="text-xs font-bold text-slate-700 block">Acciones Disponibles para tu Rol:</span>

            <div className="flex flex-wrap gap-2">
              {puedeEnviarRevision && (
                <button
                  disabled={procesando}
                  onClick={() => handleTransicion('en_revision')}
                  className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Enviar a Revisión</span>
                </button>
              )}

              {puedeDevolver && (
                <button
                  disabled={procesando}
                  onClick={() => handleTransicion('devuelto')}
                  className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-amber-600 hover:bg-amber-700 text-white transition"
                >
                  <XCircle className="w-3.5 h-3.5" />
                  <span>Devolver para Corrección</span>
                </button>
              )}

              {puedeAprobar && (
                <button
                  disabled={procesando}
                  onClick={() => handleTransicion('aprobado')}
                  className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition"
                >
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span>Aprobar Revisión Técnica</span>
                </button>
              )}

              {puedeEmitir && (
                <button
                  disabled={procesando}
                  onClick={() => handleTransicion('emitido')}
                  className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-lg bg-blue-900 hover:bg-blue-950 text-white shadow-xs transition"
                >
                  <FileCheck className="w-3.5 h-3.5 text-blue-300" />
                  <span>Emitir Oficialmente & Asignar Consecutivo</span>
                </button>
              )}

              {puedeAnular && (
                <button
                  disabled={procesando}
                  onClick={() => handleTransicion('anulado')}
                  className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-rose-700 hover:bg-rose-800 text-white transition ml-auto"
                >
                  <ShieldAlert className="w-3.5 h-3.5" />
                  <span>Anular Reporte</span>
                </button>
              )}
            </div>

            {!puedeEnviarRevision && !puedeDevolver && !puedeAprobar && !puedeEmitir && !puedeAnular && (
              <p className="text-xs text-slate-500 italic">
                Tu rol actual ({usuarioActual.rol}) no tiene transiciones permitidas para el estado "{reporte.estado}". Cambia de rol en la barra superior si deseas simular otra etapa.
              </p>
            )}
          </div>
        </div>

        <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-200 rounded-lg transition"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
