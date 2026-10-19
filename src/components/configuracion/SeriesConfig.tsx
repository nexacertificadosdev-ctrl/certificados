import React, { useState } from 'react';
import type { SerieConsecutiva, Usuario } from '../../types';
import { storageService } from '../../services/storageService';
import { Settings, ShieldCheck, AlertCircle, Save, Check } from 'lucide-react';

interface SeriesConfigProps {
  usuarioActual: Usuario;
}

export const SeriesConfig: React.FC<SeriesConfigProps> = ({ usuarioActual }) => {
  const [series, setSeries] = useState<SerieConsecutiva[]>(storageService.getSeries());
  const [guardadoMsg, setGuardadoMsg] = useState<string | null>(null);

  const esAdmin = usuarioActual.rol === 'administrador';

  const handleUpdate = (id: string, campo: keyof SerieConsecutiva, valor: any) => {
    if (!esAdmin) return;
    const nuevas = series.map((s) => (s.id === id ? { ...s, [campo]: valor } : s));
    setSeries(nuevas);
  };

  const handleGuardarTodo = () => {
    if (!esAdmin) return;
    series.forEach((s) => storageService.guardarSerie(s));
    storageService.registrarAuditoria({
      usuarioId: usuarioActual.id,
      usuarioNombre: usuarioActual.nombre,
      rol: usuarioActual.rol,
      accion: 'CONFIGURACION',
      entidad: 'serie',
      entidadId: 'todas',
      detalles: 'Actualización administrativa de parámetros de series y reglas de numeración.',
    });
    setGuardadoMsg('Parámetros de series actualizados exitosamente en la base de datos.');
    setTimeout(() => setGuardadoMsg(null), 3500);
  };

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Settings className="w-7 h-7 text-blue-600" />
            Configuración de Series y Consecutivos
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Reglas de numeración atómica aprobadas: formato <code>[PREFIJO]-[CODIGO]-[AÑO]-[NUMERO]</code> con reinicio anual automático.
          </p>
        </div>

        {esAdmin && (
          <button
            onClick={handleGuardarTodo}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition shadow-xs"
          >
            <Save className="w-4 h-4" />
            <span>Guardar Configuración</span>
          </button>
        )}
      </div>

      {guardadoMsg && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs px-4 py-3 rounded-lg flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-600" />
          <span>{guardadoMsg}</span>
        </div>
      )}

      {!esAdmin && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 text-xs px-4 py-3 rounded-lg flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
          <span>
            Estás visualizando la configuración en modo lectura. Solo el rol <strong>Administrador</strong> tiene permisos para modificar prefijos, dígitos o reiniciar contadores.
          </span>
        </div>
      )}

      {/* Tarjetas de Series Documentales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {series.map((serie) => {
          const proximo = serie.ultimoNumero + 1;
          const proximoStr = String(proximo).padStart(serie.longitudDigitos, '0');
          const ejemploGenerado = `${serie.prefijo}${serie.separador}${serie.clasificacionCodigo}${
            serie.incluyeAnio ? `${serie.separador}${serie.anioVigente}` : ''
          }${serie.separador}${proximoStr}`;

          return (
            <div
              key={serie.id}
              className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 space-y-4 hover:border-slate-300 transition"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <div>
                  <span className="font-mono text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                    {serie.clasificacionCodigo}
                  </span>
                  <h3 className="font-bold text-slate-900 text-sm mt-1">{serie.nombre}</h3>
                </div>
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
              </div>

              {/* Ejemplo en vivo */}
              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-center">
                <span className="text-[10px] text-slate-500 uppercase font-semibold block mb-0.5">
                  Próximo Consecutivo Oficial:
                </span>
                <span className="font-mono font-bold text-blue-900 text-sm">{ejemploGenerado}</span>
              </div>

              {/* Parámetros configurables */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block text-[11px] font-medium text-slate-600 mb-0.5">Prefijo</label>
                  <input
                    type="text"
                    disabled={!esAdmin}
                    value={serie.prefijo}
                    onChange={(e) => handleUpdate(serie.id, 'prefijo', e.target.value)}
                    className="w-full border border-slate-300 rounded p-1.5 font-mono text-xs uppercase"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-600 mb-0.5">Separador</label>
                  <input
                    type="text"
                    disabled={!esAdmin}
                    value={serie.separador}
                    onChange={(e) => handleUpdate(serie.id, 'separador', e.target.value)}
                    className="w-full border border-slate-300 rounded p-1.5 font-mono text-xs text-center"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-600 mb-0.5">Dígitos</label>
                  <input
                    type="number"
                    min={3}
                    max={8}
                    disabled={!esAdmin}
                    value={serie.longitudDigitos}
                    onChange={(e) => handleUpdate(serie.id, 'longitudDigitos', Number(e.target.value))}
                    className="w-full border border-slate-300 rounded p-1.5 font-mono text-xs text-center"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-600 mb-0.5">Año Vigente</label>
                  <input
                    type="number"
                    disabled={!esAdmin}
                    value={serie.anioVigente}
                    onChange={(e) => handleUpdate(serie.id, 'anioVigente', Number(e.target.value))}
                    className="w-full border border-slate-300 rounded p-1.5 font-mono text-xs text-center font-bold"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-[11px] font-medium text-slate-600 mb-0.5">
                    Último Número Asignado (Contador)
                  </label>
                  <input
                    type="number"
                    disabled={!esAdmin}
                    value={serie.ultimoNumero}
                    onChange={(e) => handleUpdate(serie.id, 'ultimoNumero', Number(e.target.value))}
                    className="w-full border border-slate-300 rounded p-1.5 font-mono text-xs font-bold text-slate-800"
                  />
                </div>
              </div>

              <div className="border-t border-slate-100 pt-2 space-y-1 text-[11px] text-slate-600">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    disabled={!esAdmin}
                    checked={serie.incluyeAnio}
                    onChange={(e) => handleUpdate(serie.id, 'incluyeAnio', e.target.checked)}
                    className="rounded text-blue-600"
                  />
                  <span>Incluir año en el código</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    disabled={!esAdmin}
                    checked={serie.reinicioAnual}
                    onChange={(e) => handleUpdate(serie.id, 'reinicioAnual', e.target.checked)}
                    className="rounded text-blue-600"
                  />
                  <span>Reinicio a 0001 al inicio de año</span>
                </label>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
