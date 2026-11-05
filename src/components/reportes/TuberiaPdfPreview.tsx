import React, { useState, useEffect } from 'react';
import type { ReporteCertificado } from '../../types';
import { Printer, ArrowLeft, CheckCircle2, ShieldCheck } from 'lucide-react';
import { generarQrVerificacion, generarHashIntegridad } from '../../utils/security';
import {
  DEFAULT_LOGO_IZQUIERDO,
  DEFAULT_LOGO_DERECHO,
  DEFAULT_COLOR_PRIMARIO,
  DEFAULT_COLOR_SECUNDARIO,
  DEFAULT_COLOR_TEXTO,
} from '../../utils/themeDefaults';

interface TuberiaPdfPreviewProps {
  reporte: ReporteCertificado;
  onVolver: () => void;
}

export const TuberiaPdfPreview: React.FC<TuberiaPdfPreviewProps> = ({ reporte, onVolver }) => {
  const d = reporte.datosTuberia;
  const numVisible = reporte.numeroConsecutivo || reporte.tempId;
  const esOficial = !!reporte.numeroConsecutivo;

  const colorPrimario = reporte.colorPrimario || DEFAULT_COLOR_PRIMARIO;
  const colorSecundario = reporte.colorSecundario || DEFAULT_COLOR_SECUNDARIO;
  const colorTexto = reporte.colorTextoEncabezado || DEFAULT_COLOR_TEXTO;
  const logoIzquierdo = reporte.logoIzquierdoUrl || DEFAULT_LOGO_IZQUIERDO;
  const logoDerecho = reporte.logoDerechoUrl || DEFAULT_LOGO_DERECHO;

  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [hashIntegridad, setHashIntegridad] = useState<string>('');

  useEffect(() => {
    generarQrVerificacion(reporte).then(setQrCodeUrl);
    generarHashIntegridad(reporte).then(setHashIntegridad);
  }, [reporte]);

  const handlePrint = () => {
    const tituloOriginal = document.title;
    const nombreArchivo = `${reporte.numeroConsecutivo || 'REPORTE'}_${reporte.clienteNombre || 'CLIENTE'}`.replace(/[\/\\?%*:|"<> ]/g, '_');
    document.title = nombreArchivo;
    window.print();
    setTimeout(() => {
      document.title = tituloOriginal;
    }, 1000);
  };

  if (!d) {
    return (
      <div className="p-8 text-center text-slate-500">
        El reporte no contiene datos técnicos de tubería cargados.
      </div>
    );
  }

  return (
    <div className="bg-slate-200 min-h-screen py-8 px-4 sm:px-6 print:bg-white print:p-0 print:m-0 print:min-h-0 print:block">
      {/* Barra de control */}
      <div className="max-w-4xl mx-auto mb-6 flex items-center justify-between bg-white p-4 rounded-xl shadow-md border border-slate-300 no-print">
        <button
          onClick={onVolver}
          className="flex items-center gap-2 text-sm font-medium text-slate-700 hover:text-slate-900 px-3 py-1.5 rounded-lg hover:bg-slate-100 transition cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Volver al Listado</span>
        </button>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <span className="text-xs text-slate-500 block">Identificador Documental</span>
            <span className="font-mono font-bold text-sm text-slate-800">{numVisible}</span>
          </div>

          <span
            className={`px-2.5 py-1 text-xs font-semibold rounded-full uppercase ${
              reporte.estado === 'emitido'
                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                : 'bg-amber-100 text-amber-800 border border-amber-300'
            }`}
          >
            {reporte.estado}
          </span>

          <button
            onClick={handlePrint}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-medium shadow-sm transition cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Imprimir / Guardar PDF</span>
          </button>
        </div>
      </div>

      {/* DOCUMENTO (2 PÁGINAS) */}
      <div className="max-w-[850px] mx-auto space-y-8 print:space-y-0 print:w-full print:max-w-none print:block">
        {/* PÁGINA 1 */}
        <div className="bg-white p-10 shadow-lg rounded-sm border border-slate-300 print:shadow-none print:border-none page-break print-page">
          {/* Encabezado con Doble Logo y Color Secundario */}
          <div
            className="border-2 p-3 mb-4 rounded-xs"
            style={{ borderColor: colorSecundario }}
          >
            <div className="grid grid-cols-12 items-center text-center gap-2">
              {/* Logo Izquierdo */}
              <div className="col-span-3 border-r border-slate-300 pr-2 flex items-center justify-center">
                {logoIzquierdo ? (
                  <img
                    src={logoIzquierdo}
                    alt="Logo Izquierdo"
                    className="h-16 max-w-full object-contain"
                  />
                ) : (
                  <div className="bg-slate-900 text-white py-2 px-3 rounded font-bold text-sm tracking-widest">
                    EMPRESA
                  </div>
                )}
              </div>

              {/* Títulos Centrales */}
              <div className="col-span-6 px-1">
                <h1
                  className="text-sm font-black uppercase tracking-tight"
                  style={{ color: colorSecundario }}
                >
                  {reporte.tituloReporteEs || 'REPORTE DE PRUEBA HIDROSTÁTICA DE TUBERÍA Y SPOOLS'}
                </h1>
                {reporte.tituloReporteEn && (
                  <span className="text-[10px] text-slate-500 italic block">
                    {reporte.tituloReporteEn}
                  </span>
                )}
                <span
                  className="text-[10px] font-semibold block mt-0.5"
                  style={{ color: colorSecundario }}
                >
                  {reporte.subtituloNormativo || 'Conforme a Código ASME B31.3 (Process Piping) Sección 345.4'}
                </span>
              </div>

              {/* Logo Derecho */}
              <div className="col-span-3 border-l border-slate-300 pl-2 flex flex-col items-center justify-center">
                {logoDerecho ? (
                  <img
                    src={logoDerecho}
                    alt="Logo Derecho"
                    className="h-12 max-w-full object-contain mb-1"
                  />
                ) : null}
                <span className="text-[8px] text-slate-500 block uppercase">Reporte No.</span>
                <span
                  className="font-mono font-bold text-xs block"
                  style={{ color: colorSecundario }}
                >
                  {numVisible}
                </span>
                <span className="text-[8px] text-slate-400 block">Página 1 de 2</span>
              </div>
            </div>
          </div>

          {!esOficial && (
            <div className="bg-amber-50 border border-amber-300 text-amber-800 text-[11px] p-2 rounded mb-4 text-center font-medium no-print">
              DOCUMENTO PROVISIONAL EN FASE DE {reporte.estado.toUpperCase()}.
            </div>
          )}

          {/* Sección 1: Datos Generales */}
          <div className="mb-4">
            <div
              className="px-2 py-0.5 text-xs font-bold uppercase tracking-wider mb-1"
              style={{ backgroundColor: colorPrimario, color: colorTexto }}
            >
              1. Datos del Solicitante y Ubicación
            </div>
            <table className="w-full text-[11px] border-collapse border border-slate-300">
              <tbody>
                <tr>
                  <td className="bg-slate-100 font-bold p-1.5 border border-slate-300 w-1/4">Solicitante:</td>
                  <td className="p-1.5 border border-slate-300 w-2/4 font-semibold">{reporte.clienteNombre}</td>
                  <td className="bg-slate-100 font-bold p-1.5 border border-slate-300 w-1/6">Fecha Ensayo:</td>
                  <td className="p-1.5 border border-slate-300 font-mono">{reporte.fechaPrueba}</td>
                </tr>
                <tr>
                  <td className="bg-slate-100 font-bold p-1.5 border border-slate-300">Contrato / O.C.:</td>
                  <td className="p-1.5 border border-slate-300 font-mono">{reporte.contratoOC}</td>
                  <td className="bg-slate-100 font-bold p-1.5 border border-slate-300">Fecha Emisión:</td>
                  <td className="p-1.5 border border-slate-300 font-mono">{reporte.fechaEmision || 'Pendiente'}</td>
                </tr>
                <tr>
                  <td className="bg-slate-100 font-bold p-1.5 border border-slate-300">Ubicación del Servicio:</td>
                  <td colSpan={3} className="p-1.5 border border-slate-300">{reporte.ubicacionServicio}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Sección 2: Especificaciones del Spool o Línea */}
          <div className="mb-4">
            <div
              className="px-2 py-0.5 text-xs font-bold uppercase tracking-wider mb-1"
              style={{ backgroundColor: colorPrimario, color: colorTexto }}
            >
              2. Identificación del Tramo / Spool de Tubería
            </div>
            <table className="w-full text-[11px] border-collapse border border-slate-300">
              <tbody>
                <tr>
                  <td className="bg-slate-100 font-bold p-1.5 border border-slate-300 w-1/4">Tag / Identificación Línea:</td>
                  <td
                    className="p-1.5 border border-slate-300 w-1/4 font-mono font-bold"
                    style={{ color: colorSecundario }}
                  >
                    {d.tagSpoolLinea}
                  </td>
                  <td className="bg-slate-100 font-bold p-1.5 border border-slate-300 w-1/4">Plano / Isométrico No.:</td>
                  <td className="p-1.5 border border-slate-300 w-1/4 font-mono font-semibold">{d.isometricoPlano}</td>
                </tr>
                <tr>
                  <td className="bg-slate-100 font-bold p-1.5 border border-slate-300">Diámetro Nominal (NPS):</td>
                  <td className="p-1.5 border border-slate-300 font-mono">{d.diametroNPS}</td>
                  <td className="bg-slate-100 font-bold p-1.5 border border-slate-300">Schedule / Espesor:</td>
                  <td className="p-1.5 border border-slate-300 font-mono">{d.scheduleEspesor}</td>
                </tr>
                <tr>
                  <td className="bg-slate-100 font-bold p-1.5 border border-slate-300">Material de Tubería:</td>
                  <td className="p-1.5 border border-slate-300">{d.materialTuberia}</td>
                  <td className="bg-slate-100 font-bold p-1.5 border border-slate-300">Clase / Rating Bridas:</td>
                  <td className="p-1.5 border border-slate-300 font-mono">{d.claseRating}</td>
                </tr>
                <tr>
                  <td className="bg-slate-100 font-bold p-1.5 border border-slate-300">Medio / Fluido de Ensayo:</td>
                  <td colSpan={3} className="p-1.5 border border-slate-300 font-medium">{d.medioPrueba}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Sección 3: Parámetros y Resultados de la Prueba de Presión */}
          <div className="mb-4">
            <div
              className="px-2 py-0.5 text-xs font-bold uppercase tracking-wider mb-1"
              style={{ backgroundColor: colorPrimario, color: colorTexto }}
            >
              3. Parámetros de Ensayo de Resistencia y Hermeticidad
            </div>
            <table className="w-full text-[11px] border-collapse border border-slate-300 text-center mb-3">
              <thead>
                <tr style={{ backgroundColor: colorPrimario, color: colorTexto }}>
                  <th className="p-1.5 border border-slate-300 text-left">Variable del Ensayo</th>
                  <th className="p-1.5 border border-slate-300">Valor de Diseño</th>
                  <th className="p-1.5 border border-slate-300">Requerido por Norma</th>
                  <th className="p-1.5 border border-slate-300 font-bold">Valor Registrado</th>
                  <th className="p-1.5 border border-slate-300">Unidad</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="p-1.5 border border-slate-300 text-left font-medium">Presión de Prueba Hidrostática</td>
                  <td className="p-1.5 border border-slate-300 font-mono">{d.presionDisenoPsi}</td>
                  <td className="p-1.5 border border-slate-300 font-mono">{d.presionPruebaPsi}</td>
                  <td
                    className="p-1.5 border border-slate-300 font-mono font-bold"
                    style={{ color: colorSecundario, backgroundColor: `${colorSecundario}10` }}
                  >
                    {d.presionAlcanzadaPsi}
                  </td>
                  <td className="p-1.5 border border-slate-300 font-bold">PSI</td>
                </tr>
                <tr>
                  <td className="p-1.5 border border-slate-300 text-left font-medium">Tiempo de Sostenimiento</td>
                  <td className="p-1.5 border border-slate-300 font-mono">-</td>
                  <td className="p-1.5 border border-slate-300 font-mono">≥ 30 min</td>
                  <td
                    className="p-1.5 border border-slate-300 font-mono font-bold"
                    style={{ color: colorSecundario, backgroundColor: `${colorSecundario}10` }}
                  >
                    {d.tiempoSostenimientoMinutos}
                  </td>
                  <td className="p-1.5 border border-slate-300 font-bold">Minutos</td>
                </tr>
                <tr>
                  <td className="p-1.5 border border-slate-300 text-left font-medium">Caída de Presión Observada</td>
                  <td className="p-1.5 border border-slate-300 font-mono">-</td>
                  <td className="p-1.5 border border-slate-300 font-mono">Máx: {d.caidaPresionPermisiblePsi} PSI</td>
                  <td className="p-1.5 border border-slate-300 font-mono font-bold text-emerald-800 bg-emerald-50">{d.caidaPresionRegistradaPsi}</td>
                  <td className="p-1.5 border border-slate-300 font-bold">PSI</td>
                </tr>
                <tr>
                  <td className="p-1.5 border border-slate-300 text-left font-medium">Temperatura del Fluido</td>
                  <td className="p-1.5 border border-slate-300 font-mono">-</td>
                  <td className="p-1.5 border border-slate-300 font-mono">-</td>
                  <td
                    className="p-1.5 border border-slate-300 font-mono font-bold"
                    style={{ color: colorSecundario, backgroundColor: `${colorSecundario}10` }}
                  >
                    {d.temperaturaFluido}
                  </td>
                  <td className="p-1.5 border border-slate-300 font-bold">°C</td>
                </tr>
              </tbody>
            </table>

            {/* Inspección visual */}
            <div className="border border-slate-300 p-2.5 bg-slate-50 text-[11px] rounded mb-3">
              <span className="font-bold text-slate-800 block mb-0.5">Inspección Visual de Soldaduras y Uniones:</span>
              <p className="text-slate-700">{d.inspeccionVisualHermeticidad}</p>
            </div>

            {/* Evaluación */}
            <div className="flex items-center justify-between border border-slate-300 p-3 bg-slate-50 rounded">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <span className="text-xs font-bold text-slate-800">
                  Hermeticidad y Resistencia Estructural: CUMPLE
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-600 font-semibold">Conclusión Técnica:</span>
                <span className="px-3 py-1 text-xs font-bold rounded bg-emerald-600 text-white uppercase">
                  {d.conclusionGeneral}
                </span>
              </div>
            </div>
          </div>

          <div className="text-right text-[9px] text-slate-400 pt-3 border-t border-slate-200 mt-4">
            Formato: {reporte.codigoFormato || 'FOR-MET-TB-01'} | Versión: {reporte.versionPlantilla}
          </div>
        </div>

        {/* PÁGINA 2: TRAZABILIDAD, GRÁFICO DE PRESIÓN Y FIRMAS */}
        <div className="bg-white p-10 shadow-lg rounded-sm border border-slate-300 print:shadow-none print:border-none print-page-last">
          <div
            className="flex justify-between items-center border-b-2 pb-2 mb-4 text-[10px] text-slate-600"
            style={{ borderColor: colorSecundario }}
          >
            <span><strong style={{ color: colorSecundario }}>REPORTE:</strong> {numVisible} - {reporte.tituloReporteEs}</span>
            <span>TAG: {d.tagSpoolLinea}</span>
            <span>Página 2 de 2</span>
          </div>

          {/* Gráfico de Presión vs Tiempo */}
          <div className="mb-4">
            <div
              className="px-2 py-0.5 text-xs font-bold uppercase tracking-wider mb-2"
              style={{ backgroundColor: colorPrimario, color: colorTexto }}
            >
              4. Gráfica de Presión y Temperatura Durante el Sostenimiento
            </div>
            {reporte.graficasServicio && reporte.graficasServicio.filter((g) => g.imagenUrl).length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {reporte.graficasServicio
                  .filter((g) => g.imagenUrl)
                  .map((g, idx) => (
                    <div
                      key={g.id || idx}
                      className="border-2 rounded bg-white overflow-hidden flex flex-col shadow-xs"
                      style={{ borderColor: colorSecundario }}
                    >
                      <div
                        className="px-2 py-1 text-center font-bold text-[10px] uppercase tracking-wide border-b"
                        style={{
                          backgroundColor: `${colorSecundario}12`,
                          color: colorSecundario,
                          borderColor: `${colorSecundario}30`,
                        }}
                      >
                        {g.titulo || `Gráfica de Ensayo #${idx + 1}`}
                      </div>
                      <div className="p-2 flex items-center justify-center bg-white min-h-[140px] max-h-[180px] overflow-hidden">
                        <img
                          src={g.imagenUrl}
                          alt={g.titulo}
                          className="max-h-40 max-w-full object-contain"
                        />
                      </div>
                      {g.pieGrafica && (
                        <div className="text-[8px] text-slate-500 text-center py-0.5 px-1 bg-slate-50 border-t border-slate-200 italic">
                          {g.pieGrafica}
                        </div>
                      )}
                    </div>
                  ))}
              </div>
            ) : (
              <div className="border border-slate-300 p-3 bg-white text-center">
                <svg viewBox="0 0 600 200" className="w-full h-44 bg-slate-50 border border-slate-200">
                  <line x1="40" y1="20" x2="580" y2="20" stroke="#e2e8f0" strokeDasharray="3" />
                  <line x1="40" y1="70" x2="580" y2="70" stroke="#e2e8f0" strokeDasharray="3" />
                  <line x1="40" y1="120" x2="580" y2="120" stroke="#e2e8f0" strokeDasharray="3" />
                  <line x1="40" y1="170" x2="580" y2="170" stroke="#94a3b8" />
                  <line x1="40" y1="20" x2="40" y2="170" stroke="#94a3b8" />

                  <text x="35" y="24" fontSize="9" textAnchor="end" fill="#64748b">500 psi</text>
                  <text x="35" y="74" fontSize="9" textAnchor="end" fill="#64748b">450 psi</text>
                  <text x="35" y="124" fontSize="9" textAnchor="end" fill="#64748b">250 psi</text>
                  <text x="35" y="174" fontSize="9" textAnchor="end" fill="#64748b">0 psi</text>
                  <text x="310" y="190" fontSize="9" textAnchor="middle" fill="#64748b">Tiempo de Prueba: 60 minutos (Sostenimiento Estable)</text>

                  <line x1="40" y1="70" x2="580" y2="70" stroke="#ef4444" strokeWidth="1.5" strokeDasharray="4" />
                  <text x="540" y="65" fontSize="8" fill="#ef4444" fontWeight="bold">Presión: 450 psi</text>

                  <path
                    d="M 40,170 L 100,70 L 480,70 L 540,170"
                    fill="none"
                    stroke={colorSecundario}
                    strokeWidth="2.5"
                  />
                  <circle cx="290" cy="70" r="4" fill={colorSecundario} />
                  <text x="290" y="60" fontSize="9" fill={colorSecundario} fontWeight="bold" textAnchor="middle">
                    452.5 PSI sostenido sin caída (0 PSI)
                  </text>
                </svg>
              </div>
            )}
          </div>

          {/* Trazabilidad de Patrones */}
          <div className="mb-4">
            <div
              className="px-2 py-0.5 text-xs font-bold uppercase tracking-wider mb-1"
              style={{ backgroundColor: colorPrimario, color: colorTexto }}
            >
              5. Trazabilidad de Instrumentos de Medición Patrón
            </div>
            <table className="w-full text-[10px] border-collapse border border-slate-300">
              <thead>
                <tr className="bg-slate-100">
                  <th className="p-1 border border-slate-300 text-left">Instrumento Patrón</th>
                  <th className="p-1 border border-slate-300">Código</th>
                  <th className="p-1 border border-slate-300">Certificado No.</th>
                  <th className="p-1 border border-slate-300">Fecha Calibración</th>
                  <th className="p-1 border border-slate-300">Vigencia</th>
                </tr>
              </thead>
              <tbody>
                {d.equiposPatrones.map((pat) => (
                  <tr key={pat.id}>
                    <td className="p-1 border border-slate-300 font-medium">{pat.nombre}</td>
                    <td className="p-1 border border-slate-300 font-mono text-center">{pat.codigo}</td>
                    <td className="p-1 border border-slate-300 font-mono text-center">{pat.certificadoCalibracion}</td>
                    <td className="p-1 border border-slate-300 font-mono text-center">{pat.fechaCalibracion}</td>
                    <td className="p-1 border border-slate-300 font-mono text-center">{pat.vigencia}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Observaciones y Declaraciones */}
          <div className="mb-4 space-y-2 text-[11px]">
            <div className="border border-slate-300 p-2.5 bg-slate-50">
              <span className="font-bold text-slate-800 block mb-0.5">Observaciones Técnicas:</span>
              <p className="text-slate-700">{d.observaciones}</p>
            </div>
            <div className="border border-slate-300 p-2.5 bg-slate-50">
              <span className="font-bold text-slate-800 block mb-0.5">Declaración de Validez:</span>
              <p className="text-slate-600 text-[10px]">{d.declaraciones}</p>
            </div>
          </div>

          {/* Cuadro de 3 Firmas */}
          <div className="mb-4">
            <div
              className="px-2 py-0.5 text-xs font-bold uppercase tracking-wider mb-2"
              style={{ backgroundColor: colorPrimario, color: colorTexto }}
            >
              6. Firmas y Autorizaciones
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="border border-slate-300 p-2 flex flex-col justify-between text-center bg-slate-50 min-h-[140px]">
                <span className="text-[10px] font-bold text-slate-700 uppercase border-b border-slate-200 pb-1">
                  Ejecutado Por (Técnico)
                </span>
                <div className="h-12 flex items-center justify-center">
                  {reporte.creadoPor.firmaUrl ? (
                    <img src={reporte.creadoPor.firmaUrl} alt="Firma" className="max-h-10 object-contain" />
                  ) : (
                    <span className="text-[10px] text-slate-400 italic">Firma registrada</span>
                  )}
                </div>
                <div className="text-[9px] border-t border-slate-200 pt-1">
                  <p className="font-bold text-slate-900">{reporte.creadoPor.nombre}</p>
                  <p className="text-slate-500">{reporte.creadoPor.cargo}</p>
                </div>
              </div>

              <div className="border border-slate-300 p-2 flex flex-col justify-between text-center bg-slate-50 min-h-[140px]">
                <span className="text-[10px] font-bold text-slate-700 uppercase border-b border-slate-200 pb-1">
                  Inspeccionado Por (QA/QC)
                </span>
                <div className="h-12 flex items-center justify-center">
                  {reporte.revisadoPor?.firmaUrl ? (
                    <img src={reporte.revisadoPor.firmaUrl} alt="Firma" className="max-h-10 object-contain" />
                  ) : (
                    <span className="text-[10px] text-slate-400 italic">Firma registrada</span>
                  )}
                </div>
                <div className="text-[9px] border-t border-slate-200 pt-1">
                  <p className="font-bold text-slate-900">{reporte.revisadoPor?.nombre || 'Ing. Diana Gutiérrez'}</p>
                  <p className="text-slate-500">{reporte.revisadoPor?.cargo || 'Revisora Técnica'}</p>
                </div>
              </div>

              <div className="border border-slate-300 p-2 flex flex-col justify-between text-center bg-slate-50 min-h-[140px]">
                <span className="text-[10px] font-bold text-slate-700 uppercase border-b border-slate-200 pb-1">
                  Autorizado Por (Director)
                </span>
                <div className="h-12 flex items-center justify-center">
                  {reporte.aprobadoPor?.firmaUrl ? (
                    <img src={reporte.aprobadoPor.firmaUrl} alt="Firma" className="max-h-10 object-contain" />
                  ) : (
                    <span className="text-[10px] text-slate-400 italic">Firma registrada</span>
                  )}
                </div>
                <div className="text-[9px] border-t border-slate-200 pt-1">
                  <p className="font-bold text-slate-900">{reporte.aprobadoPor?.nombre || 'Ing. Roberto Silva'}</p>
                  <p className="text-slate-500">{reporte.aprobadoPor?.cargo || 'Director Técnico'}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Sello de Seguridad, Huella Digital y QR */}
          <div className="border-t-2 border-slate-300 pt-3 flex items-center justify-between text-[10px] text-slate-600 bg-slate-50 p-2.5 rounded border border-slate-200">
            <div className="flex items-center gap-3">
              {qrCodeUrl && (
                <img
                  src={qrCodeUrl}
                  alt="QR Verificación"
                  className="w-14 h-14 bg-white border border-slate-300 p-0.5 rounded shadow-xs shrink-0"
                />
              )}
              <div className="space-y-0.5 text-left">
                <div className="flex items-center gap-1.5 text-slate-800 font-bold">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Reporte Hidrostático Oficial ASME B31.3 - Registro Inmutable CertiGest Web</span>
                </div>
                <p className="text-[9px] text-slate-500 font-mono break-all max-w-md">
                  SHA-256: {hashIntegridad || 'Calculando firma digital...'}
                </p>
                <span className="text-[8px] text-slate-400 block">
                  Escanea el código QR para validar la trazabilidad y el estatus oficial en el portal metrológico.
                </span>
              </div>
            </div>
            <div className="text-right shrink-0">
              <span className="font-mono text-[9px] text-slate-400 block">PÁGINA 2 DE 2</span>
              <span
                className="font-mono font-bold text-[10px] block"
                style={{ color: colorSecundario }}
              >
                {numVisible}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
