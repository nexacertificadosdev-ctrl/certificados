import React, { useState, useEffect } from 'react';
import type { ReporteCertificado } from '../../types';
import { storageService } from '../../services/storageService';
import { generarHashIntegridad } from '../../utils/security';
import {
  ShieldCheck,
  Search,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Calendar,
  Building2,
  Hash,
  Eye,
  ArrowRight,
} from 'lucide-react';

interface VerificadorPublicoProps {
  onVerReporteDetalle?: (reporte: ReporteCertificado) => void;
  codigoInicial?: string;
}

export const VerificadorPublico: React.FC<VerificadorPublicoProps> = ({
  onVerReporteDetalle,
  codigoInicial = '',
}) => {
  const [codigoBusqueda, setCodigoBusqueda] = useState(codigoInicial);
  const [reporteEncontrado, setReporteEncontrado] = useState<ReporteCertificado | null>(null);
  const [hashCalculado, setHashCalculado] = useState<string>('');
  const [buscado, setBuscado] = useState(false);
  const [cargando, setCargando] = useState(false);

  // Comprobar si hay parámetro en URL
  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.hash) {
      const match = window.location.hash.match(/cert=([^&]+)/);
      if (match && match[1]) {
        const codigo = decodeURIComponent(match[1]);
        setCodigoBusqueda(codigo);
        ejecutarVerificacion(codigo);
      }
    } else if (codigoInicial) {
      ejecutarVerificacion(codigoInicial);
    }
  }, [codigoInicial]);

  const ejecutarVerificacion = async (termino: string) => {
    const t = termino.trim().toUpperCase();
    if (!t) return;

    setCargando(true);
    setBuscado(true);

    const reportes = storageService.getReportes();
    const encontrado = reportes.find(
      (r) =>
        (r.numeroConsecutivo && r.numeroConsecutivo.toUpperCase() === t) ||
        r.tempId.toUpperCase() === t ||
        r.id.toUpperCase() === t
    );

    if (encontrado) {
      setReporteEncontrado(encontrado);
      const hash = await generarHashIntegridad(encontrado);
      setHashCalculado(hash);
    } else {
      setReporteEncontrado(null);
      setHashCalculado('');
    }

    setCargando(false);
  };

  const handleBuscar = (e: React.FormEvent) => {
    e.preventDefault();
    ejecutarVerificacion(codigoBusqueda);
  };

  const certificadosEjemplo = [
    'TEST-VT-2026-0032',
    'TEST-VT-2026-0033',
    'TEST-TB-2026-0001',
    'CAL-PR-2026-0001',
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
      {/* Banner Superior */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center p-3 bg-blue-100 text-blue-700 rounded-2xl mb-3 shadow-inner">
          <ShieldCheck className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-black text-slate-900 tracking-tight">
          Portal Público de Verificación Metrológica
        </h2>
        <p className="text-xs text-slate-500 max-w-lg mx-auto mt-1">
          Comprueba en tiempo real la autenticidad, trazabilidad metrológica y validez oficial de cualquier
          certificado o reporte emitido por el laboratorio.
        </p>
      </div>

      {/* Buscador */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-md mb-8">
        <form onSubmit={handleBuscar} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-5 h-5 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Ingresa el número de certificado (ej. TEST-VT-2026-0032)..."
              value={codigoBusqueda}
              onChange={(e) => setCodigoBusqueda(e.target.value)}
              className="w-full pl-11 pr-4 py-2.5 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 font-mono uppercase"
            />
          </div>
          <button
            type="submit"
            disabled={cargando || !codigoBusqueda.trim()}
            className="flex items-center justify-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-sm font-semibold shadow-xs transition cursor-pointer shrink-0"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>{cargando ? 'Consultando...' : 'Verificar Certificado'}</span>
          </button>
        </form>

        <div className="flex flex-wrap items-center gap-2 mt-4 pt-3 border-t border-slate-100 text-xs text-slate-500">
          <span>Ejemplos rápidos:</span>
          {certificadosEjemplo.map((ej) => (
            <button
              key={ej}
              type="button"
              onClick={() => {
                setCodigoBusqueda(ej);
                ejecutarVerificacion(ej);
              }}
              className="font-mono text-[11px] bg-slate-100 hover:bg-blue-50 hover:text-blue-700 px-2.5 py-1 rounded-md text-slate-700 border border-slate-200 transition cursor-pointer"
            >
              {ej}
            </button>
          ))}
        </div>
      </div>

      {/* RESULTADO DE LA VERIFICACIÓN */}
      {buscado && reporteEncontrado && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden animate-fadeIn">
          {/* Header de Estado */}
          <div
            className={`p-6 border-b flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
              reporteEncontrado.estado === 'emitido'
                ? 'bg-emerald-500/10 border-emerald-200'
                : reporteEncontrado.estado === 'anulado'
                ? 'bg-rose-500/10 border-rose-200'
                : 'bg-amber-500/10 border-amber-200'
            }`}
          >
            <div className="flex items-center gap-3">
              {reporteEncontrado.estado === 'emitido' ? (
                <div className="p-2.5 bg-emerald-600 text-white rounded-xl shadow-xs">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
              ) : reporteEncontrado.estado === 'anulado' ? (
                <div className="p-2.5 bg-rose-600 text-white rounded-xl shadow-xs">
                  <XCircle className="w-6 h-6" />
                </div>
              ) : (
                <div className="p-2.5 bg-amber-500 text-white rounded-xl shadow-xs">
                  <AlertTriangle className="w-6 h-6" />
                </div>
              )}
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider block text-slate-600">
                  Estado Registrado en la Base de Datos
                </span>
                <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                  <span>
                    {reporteEncontrado.estado === 'emitido'
                      ? 'CERTIFICADO AUTÉNTICO & EMITIDO OFICIALMENTE'
                      : reporteEncontrado.estado === 'anulado'
                      ? 'DOCUMENTO ANULADO FORMALMENTE'
                      : 'DOCUMENTO EN TRÁMITE / NO OFICIAL'}
                  </span>
                </h3>
              </div>
            </div>

            <span
              className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${
                reporteEncontrado.estado === 'emitido'
                  ? 'bg-emerald-600 text-white'
                  : reporteEncontrado.estado === 'anulado'
                  ? 'bg-rose-600 text-white'
                  : 'bg-amber-500 text-white'
              }`}
            >
              {reporteEncontrado.estado}
            </span>
          </div>

          {/* Datos del Certificado */}
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                  Identificador Oficial
                </span>
                <span className="font-mono text-base font-black text-blue-900 block">
                  {reporteEncontrado.numeroConsecutivo || reporteEncontrado.tempId}
                </span>
                <span className="text-xs text-slate-600 block mt-1">
                  {reporteEncontrado.tituloReporteEs}
                </span>
                {reporteEncontrado.subtituloNormativo && (
                  <span className="text-[11px] text-slate-500 italic block mt-0.5">
                    {reporteEncontrado.subtituloNormativo}
                  </span>
                )}
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                  Cliente & Solicitante
                </span>
                <span className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                  <Building2 className="w-4 h-4 text-slate-400" />
                  <span>{reporteEncontrado.clienteNombre}</span>
                </span>
                <span className="text-xs text-slate-500 block mt-1">
                  Ubicación: {reporteEncontrado.ubicacionServicio}
                </span>
                <span className="text-xs text-slate-500 block">
                  Contrato / OC: {reporteEncontrado.contratoOC}
                </span>
              </div>
            </div>

            {/* Fechas & Dictamen */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-3 bg-white rounded-xl border border-slate-200">
                <span className="text-slate-400 block mb-1 font-medium">Fecha de Ensayo</span>
                <span className="font-bold text-slate-800 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-blue-500" />
                  <span>{reporteEncontrado.fechaPrueba}</span>
                </span>
              </div>

              <div className="p-3 bg-white rounded-xl border border-slate-200">
                <span className="text-slate-400 block mb-1 font-medium">Fecha de Emisión</span>
                <span className="font-bold text-slate-800 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-emerald-500" />
                  <span>{reporteEncontrado.fechaEmision || 'Pendiente'}</span>
                </span>
              </div>

              <div className="p-3 bg-white rounded-xl border border-slate-200">
                <span className="text-slate-400 block mb-1 font-medium">Dictamen Metrológico</span>
                <span className="font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded inline-block">
                  {reporteEncontrado.datosValvula?.conclusionGeneral ||
                    reporteEncontrado.datosTuberia?.conclusionGeneral ||
                    reporteEncontrado.datosCalibracion?.conclusionGeneral ||
                    'CONFORME'}
                </span>
              </div>

              <div className="p-3 bg-white rounded-xl border border-slate-200">
                <span className="text-slate-400 block mb-1 font-medium">Autorizado Por</span>
                <span className="font-bold text-slate-800 truncate block">
                  {reporteEncontrado.aprobadoPor?.nombre || 'Director Técnico'}
                </span>
              </div>
            </div>

            {/* Ítem Ensayo */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs">
              <span className="font-bold text-slate-800 block mb-2">Especificaciones del Ítem de Ensayo:</span>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                <div>
                  <span className="text-slate-500">Tag / Identificación:</span>
                  <span className="font-mono font-bold text-slate-900 block">
                    {reporteEncontrado.datosValvula?.identificacionTag ||
                      reporteEncontrado.datosTuberia?.tagSpoolLinea ||
                      reporteEncontrado.datosCalibracion?.tagIdentificacion ||
                      'TAG-N/A'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500">Número de Serie:</span>
                  <span className="font-mono text-slate-900 block">
                    {reporteEncontrado.datosValvula?.numeroSerie ||
                      reporteEncontrado.datosCalibracion?.numeroSerie ||
                      reporteEncontrado.datosTuberia?.isometricoPlano ||
                      'SN-N/A'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500">Parámetro Principal:</span>
                  <span className="font-bold text-blue-700 block">
                    {reporteEncontrado.datosValvula
                      ? `Set Point: ${reporteEncontrado.datosValvula.setPointPsi} psi`
                      : reporteEncontrado.datosTuberia
                      ? `P. Prueba: ${reporteEncontrado.datosTuberia.presionPruebaPsi} psi`
                      : reporteEncontrado.datosCalibracion
                      ? `Span: ${reporteEncontrado.datosCalibracion.rangoMax} ${reporteEncontrado.datosCalibracion.unidadMedida}`
                      : 'N/A'}
                  </span>
                </div>
              </div>
            </div>

            {/* Huella Criptográfica SHA-256 */}
            <div className="p-4 bg-slate-900 text-slate-300 rounded-xl font-mono text-xs">
              <div className="flex items-center gap-1.5 text-blue-400 font-bold mb-1">
                <Hash className="w-4 h-4" />
                <span>Huella Digital Criptográfica (SHA-256 Inmutable):</span>
              </div>
              <p className="break-all text-[11px] text-slate-400 selection:bg-blue-600">
                {hashCalculado}
              </p>
              <span className="text-[10px] text-slate-500 block mt-1">
                Esta huella valida matemáticamente que el contenido del certificado no ha sufrido alteraciones.
              </span>
            </div>

            {/* Botón Ver PDF */}
            {onVerReporteDetalle && (
              <div className="flex justify-end pt-2">
                <button
                  onClick={() => onVerReporteDetalle(reporteEncontrado)}
                  className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-sm transition cursor-pointer"
                >
                  <Eye className="w-4 h-4" />
                  <span>Ver Previsualización Completa del Certificado</span>
                  <ArrowRight className="w-3.5 h-3.5 ml-1" />
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* No encontrado */}
      {buscado && !reporteEncontrado && !cargando && (
        <div className="bg-white rounded-2xl border border-rose-200 p-8 text-center shadow-md animate-fadeIn">
          <div className="p-3 bg-rose-50 text-rose-600 rounded-2xl inline-block mb-3">
            <XCircle className="w-8 h-8" />
          </div>
          <h3 className="font-bold text-slate-900 text-base">Certificado no encontrado</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
            No se encontró ningún registro con el identificador{' '}
            <strong className="font-mono text-slate-800 font-bold">"{codigoBusqueda}"</strong> en la
            base de datos oficial. Verifica los caracteres e intenta nuevamente.
          </p>
        </div>
      )}
    </div>
  );
};
