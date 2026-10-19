import React, { useState } from 'react';
import type { RegistroAuditoria } from '../../types';
import { storageService } from '../../services/storageService';
import { ShieldCheck, Search } from 'lucide-react';

export const AuditoriaView: React.FC = () => {
  const [auditorias] = useState<RegistroAuditoria[]>(storageService.getAuditoria());
  const [busqueda, setBusqueda] = useState('');
  const [filtroAccion, setFiltroAccion] = useState('TODAS');

  const filtrados = auditorias.filter((a) => {
    const coincideTexto =
      !busqueda ||
      a.usuarioNombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      a.detalles.toLowerCase().includes(busqueda.toLowerCase()) ||
      a.entidadId.toLowerCase().includes(busqueda.toLowerCase());

    const coincideAccion = filtroAccion === 'TODAS' || a.accion === filtroAccion;

    return coincideTexto && coincideAccion;
  });

  const getBadgeAccion = (accion: RegistroAuditoria['accion']) => {
    switch (accion) {
      case 'CREAR':
        return 'bg-blue-100 text-blue-800';
      case 'MODIFICAR':
        return 'bg-slate-100 text-slate-800';
      case 'APROBAR':
        return 'bg-emerald-100 text-emerald-800';
      case 'EMITIR':
        return 'bg-purple-100 text-purple-800 font-bold';
      case 'DEVOLVER':
        return 'bg-amber-100 text-amber-800';
      case 'ANULAR':
        return 'bg-rose-100 text-rose-800 font-bold';
      case 'CONFIGURACION':
        return 'bg-indigo-100 text-indigo-800';
      default:
        return 'bg-slate-100 text-slate-700';
    }
  };

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <ShieldCheck className="w-7 h-7 text-blue-600" />
          Pista de Auditoría & Trazabilidad Inmutable
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Registro inalterable de creación, cambios de estado, emisión de consecutivos oficiales y modificaciones de configuración.
        </p>
      </div>

      {/* Filtros */}
      <div className="bg-white p-4 rounded-xl shadow-xs border border-slate-200 grid grid-cols-1 md:grid-cols-12 gap-3">
        <div className="md:col-span-8 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar por usuario, acción o detalles de auditoría..."
            className="w-full text-xs pl-9 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
        </div>

        <div className="md:col-span-4">
          <select
            value={filtroAccion}
            onChange={(e) => setFiltroAccion(e.target.value)}
            className="w-full text-xs py-2 px-3 border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
          >
            <option value="TODAS">Todas las Acciones</option>
            <option value="CREAR">CREAR</option>
            <option value="MODIFICAR">MODIFICAR</option>
            <option value="ENVIAR_REVISION">ENVIAR A REVISIÓN</option>
            <option value="DEVOLVER">DEVOLVER</option>
            <option value="APROBAR">APROBAR</option>
            <option value="EMITIR">EMITIR (OFICIAL)</option>
            <option value="ANULAR">ANULAR</option>
            <option value="CONFIGURACION">CONFIGURACIÓN</option>
          </select>
        </div>
      </div>

      {/* Tabla de Auditoría */}
      <div className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-4">Fecha y Hora</th>
                <th className="py-3 px-4">Usuario Responsable</th>
                <th className="py-3 px-3">Rol</th>
                <th className="py-3 px-3">Acción</th>
                <th className="py-3 px-3">Entidad</th>
                <th className="py-3 px-4">Detalles del Evento</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtrados.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    No se encontraron eventos de auditoría registrados.
                  </td>
                </tr>
              ) : (
                filtrados.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3 px-4 font-mono text-slate-600 whitespace-nowrap">
                      {new Date(log.fechaHora).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-900">{log.usuarioNombre}</td>
                    <td className="py-3 px-3">
                      <span className="font-mono text-[10px] text-slate-600 uppercase">
                        {log.rol}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`inline-block px-2 py-0.5 text-[10px] font-bold rounded-full ${getBadgeAccion(
                          log.accion
                        )}`}
                      >
                        {log.accion}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-mono text-slate-700 uppercase text-[10px]">
                      {log.entidad}
                    </td>
                    <td className="py-3 px-4 text-slate-700 max-w-md">{log.detalles}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
