import React, { useState } from 'react';
import type { EquipoPatron } from '../../types';
import { storageService } from '../../services/storageService';
import {
  Scale,
  Plus,
  Trash2,
  ShieldAlert,
  Info,
} from 'lucide-react';

interface PatronesSelectorProps {
  patronesSeleccionados: EquipoPatron[];
  onChangePatrones: (patrones: EquipoPatron[]) => void;
  soloLectura?: boolean;
}

export const PatronesSelector: React.FC<PatronesSelectorProps> = ({
  patronesSeleccionados = [],
  onChangePatrones,
  soloLectura = false,
}) => {
  const [catalogoPatrones] = useState<EquipoPatron[]>(storageService.getPatrones());
  const [patronSeleccionadoId, setPatronSeleccionadoId] = useState<string>('');

  const getDiasVigencia = (vigencia: string) => {
    if (!vigencia) return 0;
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const v = new Date(vigencia);
    v.setHours(0, 0, 0, 0);
    return Math.ceil((v.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));
  };

  const getEstadoBadge = (vigencia: string) => {
    const diff = getDiasVigencia(vigencia);
    if (diff < 0) {
      return {
        label: `Vencido hace ${Math.abs(diff)}d`,
        color: 'bg-rose-50 text-rose-700 border-rose-200',
        esVencido: true,
      };
    }
    if (diff <= 30) {
      return {
        label: `Por vencer (${diff}d)`,
        color: 'bg-amber-50 text-amber-700 border-amber-200',
        esVencido: false,
      };
    }
    return {
      label: `Vigente (${diff}d)`,
      color: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      esVencido: false,
    };
  };

  const handleAgregarPatron = () => {
    if (!patronSeleccionadoId) return;
    const p = catalogoPatrones.find((item) => item.id === patronSeleccionadoId);
    if (!p) return;

    if (patronesSeleccionados.some((item) => item.id === p.id || item.codigo === p.codigo)) {
      alert('Este patrón de calibración ya está asignado al reporte.');
      return;
    }

    onChangePatrones([...patronesSeleccionados, p]);
    setPatronSeleccionadoId('');
  };

  const handleEliminarPatron = (index: number) => {
    const nuevaLista = patronesSeleccionados.filter((_, i) => i !== index);
    onChangePatrones(nuevaLista);
  };

  const tienePatronesVencidos = patronesSeleccionados.some(
    (p) => getDiasVigencia(p.vigencia) < 0
  );

  return (
    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div>
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <Scale className="w-4 h-4 text-blue-600" />
            <span>Patrones de Referencia Metrológica Trazables</span>
            <span className="text-[10px] font-mono bg-blue-50 text-blue-800 border border-blue-200 px-2 py-0.5 rounded-full font-bold">
              ISO/IEC 17025:2017 §6.4 - §6.5
            </span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Instrumentos y patrones patrón utilizados para la comparación metrológica con trazabilidad al INM / ONAC.
          </p>
        </div>

        {/* Dropdown de asignación rápida */}
        {!soloLectura && (
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <select
              value={patronSeleccionadoId}
              onChange={(e) => setPatronSeleccionadoId(e.target.value)}
              className="px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white font-medium text-slate-800 max-w-xs truncate"
            >
              <option value="">-- Seleccionar patrón del catálogo --</option>
              {catalogoPatrones
                .filter((p) => p.activo !== false)
                .map((p) => {
                  const estado = getEstadoBadge(p.vigencia);
                  return (
                    <option key={p.id} value={p.id}>
                      [{p.codigo}] {p.nombre} ({estado.label})
                    </option>
                  );
                })}
            </select>

            <button
              type="button"
              onClick={handleAgregarPatron}
              disabled={!patronSeleccionadoId}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg text-xs font-medium transition cursor-pointer shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Vincular</span>
            </button>
          </div>
        )}
      </div>

      {/* Alerta de Auditoría si algún patrón asignado está vencido */}
      {tienePatronesVencidos && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-start gap-2.5">
          <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div>
            <strong className="block font-bold">
              Advertencia de Validez Metrológica (ISO/IEC 17025 §6.4.7)
            </strong>
            Uno o más de los patrones asignados presenta una fecha de calibración vencida. No se debe emitir ni aprobar certificados oficiales con patrones fuera del intervalo de calibración vigente.
          </div>
        </div>
      )}

      {/* Lista de Patrones Asignados */}
      {patronesSeleccionados.length === 0 ? (
        <div className="p-6 text-center border-2 border-dashed border-slate-200 rounded-xl">
          <Info className="w-6 h-6 text-slate-400 mx-auto mb-1" />
          <p className="text-xs text-slate-500 font-medium">
            No se han asignado patrones de calibración a este reporte.
          </p>
          {!soloLectura && (
            <p className="text-[11px] text-slate-400 mt-0.5">
              Selecciona un patrón del catálogo superior para incorporarlo con su número de certificado e incertidumbre.
            </p>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {patronesSeleccionados.map((p, idx) => {
            const badge = getEstadoBadge(p.vigencia);
            return (
              <div
                key={p.id || idx}
                className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 relative group hover:border-slate-300 transition"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold bg-blue-100 text-blue-900 px-2 py-0.5 rounded">
                      {p.codigo}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${badge.color}`}
                    >
                      {badge.label}
                    </span>
                  </div>

                  {!soloLectura && (
                    <button
                      type="button"
                      onClick={() => handleEliminarPatron(idx)}
                      className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition cursor-pointer"
                      title="Desvincular patrón"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <div className="mt-2">
                  <h4 className="text-xs font-bold text-slate-900">{p.nombre}</h4>
                  <p className="text-[11px] text-slate-500">
                    {p.marca || 'N/A'} {p.modelo ? `• Mod. ${p.modelo}` : ''} {p.serie ? `• S/N: ${p.serie}` : ''}
                  </p>
                </div>

                <div className="mt-2.5 pt-2.5 border-t border-slate-200/60 grid grid-cols-2 gap-2 text-[11px]">
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Certificado</span>
                    <span className="font-mono font-bold text-slate-800">
                      {p.certificadoCalibracion || 'S/N'}
                    </span>
                    <span className="block text-[10px] text-slate-500 truncate">
                      {p.laboratorioCalibrador || 'Laboratorio Acreditado'}
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Metrología</span>
                    <span className="font-mono text-slate-700 block truncate">
                      Rango: {p.rangoMedida || 'N/A'}
                    </span>
                    <span className="text-[10px] text-slate-600 block">
                      U = {p.incertidumbre || 'N/A'}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
