import React, { useState } from 'react';
import type { EstadoReporte, ReporteCertificado, Usuario } from '../../types';
import {
  Search,
  Plus,
  Eye,
  Edit,
  CheckSquare,
  Copy,
  Download,
  FileCheck2,
  ExternalLink,
} from 'lucide-react';


interface ReportesListProps {
  reportes: ReporteCertificado[];
  usuarioActual: Usuario;
  onVerPdf: (reporte: ReporteCertificado) => void;
  onEditar: (reporte: ReporteCertificado) => void;
  onNuevoReporte: () => void;
  onGestionarEstado: (reporte: ReporteCertificado) => void;
  onCopiarComoBase: (reporte: ReporteCertificado) => void;
}

export const ReportesList: React.FC<ReportesListProps> = ({
  reportes,
  usuarioActual,
  onVerPdf,
  onEditar,
  onNuevoReporte,
  onGestionarEstado,
  onCopiarComoBase,
}) => {
  const [busqueda, setBusqueda] = useState('');
  const [filtroClasificacion, setFiltroClasificacion] = useState<string>('TODAS');
  const [filtroEstado, setFiltroEstado] = useState<string>('TODOS');

  // Filtrado reactivo
  const reportesFiltrados = reportes.filter((r) => {
    const termino = busqueda.toLowerCase().trim();
    const coincideTexto =
      !termino ||
      (r.numeroConsecutivo && r.numeroConsecutivo.toLowerCase().includes(termino)) ||
      r.tempId.toLowerCase().includes(termino) ||
      r.clienteNombre.toLowerCase().includes(termino) ||
      (r.datosValvula?.identificacionTag &&
        r.datosValvula.identificacionTag.toLowerCase().includes(termino)) ||
      (r.datosValvula?.numeroSerie &&
        r.datosValvula.numeroSerie.toLowerCase().includes(termino)) ||
      (r.datosTuberia?.tagSpoolLinea &&
        r.datosTuberia.tagSpoolLinea.toLowerCase().includes(termino)) ||
      (r.datosTuberia?.isometricoPlano &&
        r.datosTuberia.isometricoPlano.toLowerCase().includes(termino)) ||
      (r.datosCalibracion?.tagIdentificacion &&
        r.datosCalibracion.tagIdentificacion.toLowerCase().includes(termino)) ||
      (r.datosCalibracion?.numeroSerie &&
        r.datosCalibracion.numeroSerie.toLowerCase().includes(termino)) ||
      r.contratoOC.toLowerCase().includes(termino);

    const coincideClasificacion =
      filtroClasificacion === 'TODAS' || r.clasificacionCodigo === filtroClasificacion;

    const coincideEstado = filtroEstado === 'TODOS' || r.estado === filtroEstado;

    return coincideTexto && coincideClasificacion && coincideEstado;
  });

  const exportarCSV = () => {
    const cabeceras = [
      'Consecutivo / ID',
      'Clasificación',
      'Título Documental',
      'Cliente / Solicitante',
      'Contrato / OC',
      'Tag / Spool',
      'Serial / Plano',
      'Estado Ciclo',
      'Fecha Ensayo',
      'Fecha Emisión',
      'Dictamen de Calidad',
      'Norma de Referencia',
      'Técnico Operador',
      'Revisor Técnico',
      'Aprobador Técnico',
      'Hash SHA-256',
    ];

    const filas = reportesFiltrados.map((r) => {
      const tag =
        r.datosValvula?.identificacionTag ||
        r.datosTuberia?.tagSpoolLinea ||
        r.datosCalibracion?.tagIdentificacion ||
        'N/A';
      const serial =
        r.datosValvula?.numeroSerie ||
        r.datosTuberia?.isometricoPlano ||
        r.datosCalibracion?.numeroSerie ||
        'N/A';
      const dictamen =
        r.datosValvula?.conclusionGeneral ||
        r.datosTuberia?.conclusionGeneral ||
        r.datosCalibracion?.conclusionGeneral ||
        'N/A';
      const norma =
        r.subtituloNormativo ||
        r.datosValvula?.normaReferencia ||
        r.datosCalibracion?.normaMetodo ||
        'ASME B31.3';

      return [
        `"${r.numeroConsecutivo || r.tempId}"`,
        `"${r.clasificacionCodigo}"`,
        `"${(r.tituloReporteEs || '').replace(/"/g, '""')}"`,
        `"${(r.clienteNombre || '').replace(/"/g, '""')}"`,
        `"${(r.contratoOC || '').replace(/"/g, '""')}"`,
        `"${tag.replace(/"/g, '""')}"`,
        `"${serial.replace(/"/g, '""')}"`,
        `"${r.estado.toUpperCase()}"`,
        `"${r.fechaPrueba}"`,
        `"${r.fechaEmision || 'Pendiente'}"`,
        `"${dictamen}"`,
        `"${norma.replace(/"/g, '""')}"`,
        `"${(r.creadoPor?.nombre || '').replace(/"/g, '""')}"`,
        `"${(r.revisadoPor?.nombre || 'N/A').replace(/"/g, '""')}"`,
        `"${(r.aprobadoPor?.nombre || 'N/A').replace(/"/g, '""')}"`,
        `"${r.hashSha256 || 'Sin emitir'}"`,
      ];
    });

    // UTF-8 BOM (\uFEFF) para visualización nativa en Excel sin errores de tildes ni símbolos
    const csvContent =
      '\uFEFF' + [cabeceras.join(';'), ...filas.map((e) => e.join(';'))].join('\r\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Dossier_Calidad_Certificados_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const getBadgeEstado = (estado: EstadoReporte) => {
    switch (estado) {
      case 'emitido':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case 'aprobado':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'en_revision':
        return 'bg-amber-100 text-amber-800 border-amber-300';
      case 'devuelto':
        return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'anulado':
        return 'bg-rose-100 text-rose-800 border-rose-300';
      case 'borrador':
      default:
        return 'bg-slate-100 text-slate-700 border-slate-300';
    }
  };

  const puedeCrear = ['tecnico', 'administrador'].includes(usuarioActual.rol);

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-6">
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <FileCheck2 className="w-7 h-7 text-[#00875a]" />
            Certificados y Reportes Técnicos
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Repositorio centralizado con control de estados, trazabilidad y consecutivos oficiales.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={exportarCSV}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 transition shadow-xs cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Exportar CSV</span>
          </button>

          {puedeCrear && (
            <button
              onClick={onNuevoReporte}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-[#00875a] hover:bg-[#047857] rounded-xl transition shadow-xs cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Nuevo Reporte</span>
            </button>
          )}
        </div>
      </div>

      {/* Barra de Filtros y Búsqueda */}
      <div className="bg-white p-4 rounded-xl shadow-xs border border-slate-200 grid grid-cols-1 md:grid-cols-12 gap-3">
        <div className="md:col-span-6 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar por consecutivo, cliente, serial, tag, contrato..."
            className="w-full text-xs pl-9 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
        </div>

        <div className="md:col-span-3">
          <select
            value={filtroClasificacion}
            onChange={(e) => setFiltroClasificacion(e.target.value)}
            className="w-full text-xs py-2 px-3 border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
          >
            <option value="TODAS">Todas las Clasificaciones</option>
            <option value="VT">VT - Válvulas de Seguridad</option>
            <option value="TB">TB - Tuberías</option>
            <option value="PR">PR - Magnitud Presión</option>
            <option value="TM">TM - Magnitud Temperatura</option>
            <option value="EL">EL - Magnitudes Eléctricas</option>
          </select>
        </div>

        <div className="md:col-span-3">
          <select
            value={filtroEstado}
            onChange={(e) => setFiltroEstado(e.target.value)}
            className="w-full text-xs py-2 px-3 border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
          >
            <option value="TODOS">Todos los Estados</option>
            <option value="borrador">Borrador</option>
            <option value="en_revision">En Revisión</option>
            <option value="devuelto">Devuelto para Corrección</option>
            <option value="aprobado">Aprobado</option>
            <option value="emitido">Emitido (Oficial)</option>
            <option value="anulado">Anulado</option>
          </select>
        </div>
      </div>

      {/* Tabla de Resultados */}
      <div className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-4">Identificador</th>
                <th className="py-3 px-3">Clasificación</th>
                <th className="py-3 px-4">Cliente / Contrato</th>
                <th className="py-3 px-3">Tag / Serial</th>
                <th className="py-3 px-3">Estado</th>
                <th className="py-3 px-3">Fecha Prueba</th>
                <th className="py-3 px-3">Resultado</th>
                <th className="py-3 px-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {reportesFiltrados.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    No se encontraron reportes con los criterios de búsqueda aplicados.
                  </td>
                </tr>
              ) : (
                reportesFiltrados.map((rep) => {
                  const tieneOficial = !!rep.numeroConsecutivo;
                  const tag = rep.datosValvula?.identificacionTag || 'N/A';
                  const serial = rep.datosValvula?.numeroSerie || 'N/A';
                  const conclusion = rep.datosValvula?.conclusionGeneral;

                  return (
                    <tr key={rep.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3 px-4">
                        <div className="font-mono font-bold text-slate-900 text-xs flex items-center gap-1.5">
                          {rep.numeroConsecutivo || (
                            <span className="text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                              {rep.tempId}
                            </span>
                          )}
                          {rep.esHistorico && (
                            <span className="bg-emerald-100 text-emerald-800 text-[9px] font-semibold px-1.5 py-0.2 rounded border border-emerald-200">
                              Drive
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-slate-400 font-sans block truncate max-w-[180px]">
                          {rep.esHistorico
                            ? (rep.nombreArchivoOriginal || 'Histórico Drive')
                            : tieneOficial
                            ? 'Consecutivo Oficial'
                            : 'Provisional (Borrador)'}
                        </span>
                      </td>

                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 font-bold text-[10px] rounded bg-slate-100 text-slate-700 border border-slate-200">
                          {rep.clasificacionCodigo}
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-800 truncate max-w-[200px]">
                          {rep.clienteNombre}
                        </div>
                        <span className="text-[10px] text-slate-500 font-mono block">
                          {rep.contratoOC}
                        </span>
                      </td>

                      <td className="py-3 px-3">
                        <div className="font-mono text-slate-800 font-medium">{tag}</div>
                        <span className="text-[10px] text-slate-400 font-mono block">{serial}</span>
                      </td>

                      <td className="py-3 px-3">
                        <span
                          className={`inline-block px-2 py-0.5 text-[10px] font-bold rounded-full border uppercase tracking-wider ${getBadgeEstado(
                            rep.estado
                          )}`}
                        >
                          {rep.estado}
                        </span>
                      </td>

                      <td className="py-3 px-3 font-mono text-slate-600">{rep.fechaPrueba}</td>

                      <td className="py-3 px-3">
                        {conclusion ? (
                          <span
                            className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase ${
                              conclusion === 'CONFORME'
                                ? 'bg-emerald-50 text-emerald-700'
                                : 'bg-rose-50 text-rose-700'
                            }`}
                          >
                            {conclusion}
                          </span>
                        ) : (
                          <span className="text-slate-400 text-[10px]">-</span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => onVerPdf(rep)}
                            title="Ver Documento / Imprimir PDF"
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-md transition"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {rep.googleDriveUrl && (
                            <a
                              href={rep.googleDriveUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              title="Ver en Google Drive"
                              className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-md transition"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </a>
                          )}

                          {rep.estado !== 'emitido' && rep.estado !== 'anulado' && (
                            <button
                              onClick={() => onEditar(rep)}
                              title="Editar Datos Técnicos"
                              className="p-1.5 text-slate-600 hover:bg-slate-100 rounded-md transition"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                          )}

                          <button
                            onClick={() => onGestionarEstado(rep)}
                            title="Revisar / Cambiar Estado"
                            className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-md transition"
                          >
                            <CheckSquare className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => onCopiarComoBase(rep)}
                            title="Copiar como Base para Nuevo Borrador"
                            className="p-1.5 text-purple-600 hover:bg-purple-50 rounded-md transition"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
