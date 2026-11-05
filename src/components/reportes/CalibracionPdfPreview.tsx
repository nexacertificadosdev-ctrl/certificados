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

interface CalibracionPdfPreviewProps {
  reporte: ReporteCertificado;
  onVolver: () => void;
}

export const CalibracionPdfPreview: React.FC<CalibracionPdfPreviewProps> = ({ reporte, onVolver }) => {
  const d = reporte.datosCalibracion;
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
        El reporte no contiene datos de calibración metrológica.
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
            <span className="text-xs text-slate-500 block">Certificado Metrológico</span>
            <span className="font-mono font-bold text-sm text-slate-800">{numVisible}</span>
          </div>

          <span
            className={`px-2.5 py-1 text-xs font-semibold rounded-full uppercase ${
              reporte.estado === 'emitido'
                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold'
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
        {/* PÁGINA 1: DATOS DEL INSTRUMENTO Y PATRONES */}
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
                  {reporte.tituloReporteEs || 'CERTIFICADO DE CALIBRACION'}
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
                  Magnitud: {d.magnitud} | {reporte.subtituloNormativo || d.normaMetodo}
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
                <span className="text-[8px] text-slate-500 block uppercase">Certificado No.</span>
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
              CERTIFICADO PROVISIONAL EN FASE DE {reporte.estado.toUpperCase()}. Consecutivo oficial asignado en la emisión.
            </div>
          )}

          {/* Sección 1: Datos del Solicitante */}
          <div className="mb-4">
            <div
              className="px-2 py-0.5 text-xs font-bold uppercase tracking-wider mb-1"
              style={{ backgroundColor: colorPrimario, color: colorTexto }}
            >
              1. Datos del Solicitante
            </div>
            <table className="w-full text-[11px] border-collapse border border-slate-300">
              <tbody>
                <tr>
                  <td className="bg-slate-100 font-bold p-1.5 border border-slate-300 w-1/4">Solicitante / Cliente:</td>
                  <td className="p-1.5 border border-slate-300 w-2/4 font-semibold">{reporte.clienteNombre}</td>
                  <td className="bg-slate-100 font-bold p-1.5 border border-slate-300 w-1/6">Fecha Calibración:</td>
                  <td className="p-1.5 border border-slate-300 font-mono">{reporte.fechaPrueba}</td>
                </tr>
                <tr>
                  <td className="bg-slate-100 font-bold p-1.5 border border-slate-300">Dirección:</td>
                  <td className="p-1.5 border border-slate-300">{reporte.direccionServicio}</td>
                  <td className="bg-slate-100 font-bold p-1.5 border border-slate-300">Fecha Emisión:</td>
                  <td className="p-1.5 border border-slate-300 font-mono">{reporte.fechaEmision || 'Pendiente'}</td>
                </tr>
                <tr>
                  <td className="bg-slate-100 font-bold p-1.5 border border-slate-300">Lugar de Calibración:</td>
                  <td colSpan={3} className="p-1.5 border border-slate-300">{reporte.ubicacionServicio}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Sección 2: Datos del Instrumento */}
          <div className="mb-4">
            <div
              className="px-2 py-0.5 text-xs font-bold uppercase tracking-wider mb-1"
              style={{ backgroundColor: colorPrimario, color: colorTexto }}
            >
              2. Identificación del Instrumento Calibrado
            </div>
            <table className="w-full text-[11px] border-collapse border border-slate-300">
              <tbody>
                <tr>
                  <td className="bg-slate-100 font-bold p-1.5 border border-slate-300 w-1/4">Instrumento:</td>
                  <td className="p-1.5 border border-slate-300 w-1/4 font-medium">{d.tipoInstrumento}</td>
                  <td className="bg-slate-100 font-bold p-1.5 border border-slate-300 w-1/4">Identificación (Tag):</td>
                  <td
                    className="p-1.5 border border-slate-300 w-1/4 font-mono font-bold"
                    style={{ color: colorSecundario }}
                  >
                    {d.tagIdentificacion}
                  </td>
                </tr>
                <tr>
                  <td className="bg-slate-100 font-bold p-1.5 border border-slate-300">Fabricante:</td>
                  <td className="p-1.5 border border-slate-300 font-semibold">{d.fabricante}</td>
                  <td className="bg-slate-100 font-bold p-1.5 border border-slate-300">Número de Serie:</td>
                  <td className="p-1.5 border border-slate-300 font-mono font-semibold">{d.numeroSerie}</td>
                </tr>
                <tr>
                  <td className="bg-slate-100 font-bold p-1.5 border border-slate-300">Modelo:</td>
                  <td className="p-1.5 border border-slate-300 font-mono">{d.modelo}</td>
                  <td className="bg-slate-100 font-bold p-1.5 border border-slate-300">Rango / Alcance:</td>
                  <td className="p-1.5 border border-slate-300 font-mono">{d.rangoMin} a {d.rangoMax} {d.unidadMedida}</td>
                </tr>
                <tr>
                  <td className="bg-slate-100 font-bold p-1.5 border border-slate-300">Resolución / División:</td>
                  <td className="p-1.5 border border-slate-300 font-mono">{d.resolucion} {d.unidadMedida}</td>
                  <td className="bg-slate-100 font-bold p-1.5 border border-slate-300">Error Máx. Permitido:</td>
                  <td className="p-1.5 border border-slate-300 font-mono font-bold">±{d.toleranciaPermitidaPct}% FS</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Sección 3: Patrones y Condiciones Ambientales */}
          <div className="mb-4">
            <div
              className="px-2 py-0.5 text-xs font-bold uppercase tracking-wider mb-1"
              style={{ backgroundColor: colorPrimario, color: colorTexto }}
            >
              3. Condiciones Ambientales y Trazabilidad Metrológica
            </div>

            <div className="grid grid-cols-2 gap-3 mb-3">
              <div className="border border-slate-300 p-2 text-[11px] bg-slate-50">
                <span className="font-bold text-slate-800 block mb-0.5">Condiciones Ambientales:</span>
                <p>Temperatura: {d.condicionesAmbientales.temperatura.promedio} °C (±1.5 °C)</p>
                <p>Humedad Relativa: {d.condicionesAmbientales.humedadRelativa.promedio} % HR (±5%)</p>
              </div>

              <div className="border border-slate-300 p-2 text-[11px] bg-slate-50">
                <span className="font-bold text-slate-800 block mb-0.5">Método y Procedimiento:</span>
                <p>{d.normaMetodo}</p>
                <p className="text-slate-500 text-[10px]">Generación: {d.medioGeneracion}</p>
              </div>
            </div>

            <table className="w-full text-[10px] border-collapse border border-slate-300">
              <thead>
                <tr className="bg-slate-100">
                  <th className="p-1 border border-slate-300 text-left">Patrón de Referencia</th>
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

          <div className="text-right text-[9px] text-slate-400 pt-3 border-t border-slate-200 mt-6">
            Formato: {reporte.codigoFormato || 'FOR-MET-PR-01'} | Versión: {reporte.versionPlantilla}
          </div>
        </div>

        {/* PÁGINA 2: RESULTADOS METROLÓGICOS, INCERTIDUMBRE Y FIRMAS */}
        <div className="bg-white p-10 shadow-lg rounded-sm border border-slate-300 print:shadow-none print:border-none print-page-last">
          <div
            className="flex justify-between items-center border-b-2 pb-2 mb-4 text-[10px] text-slate-600"
            style={{ borderColor: colorSecundario }}
          >
            <span><strong style={{ color: colorSecundario }}>CERTIFICADO:</strong> {numVisible} - {reporte.tituloReporteEs}</span>
            <span>TAG: {d.tagIdentificacion} | SERIAL: {d.numeroSerie}</span>
            <span>Página 2 de 2</span>
          </div>

          {/* Tabla de Puntos de Calibración */}
          <div className="mb-4">
            <div
              className="px-2 py-0.5 text-xs font-bold uppercase tracking-wider mb-2"
              style={{ backgroundColor: colorPrimario, color: colorTexto }}
            >
              4. Resultados de Medición y Curva de Calibración ({d.unidadMedida})
            </div>

            <table className="w-full text-[10px] border-collapse border border-slate-300 text-center mb-3">
              <thead>
                <tr style={{ backgroundColor: colorPrimario, color: colorTexto }}>
                  <th className="p-1.5 border border-slate-300">Valor Nominal</th>
                  <th className="p-1.5 border border-slate-300 font-bold">Valor Patrón</th>
                  <th className="p-1.5 border border-slate-300">Lectura Subida</th>
                  <th className="p-1.5 border border-slate-300">Lectura Bajada</th>
                  <th className="p-1.5 border border-slate-300">Error Subida</th>
                  <th className="p-1.5 border border-slate-300">Error Bajada</th>
                  <th className="p-1.5 border border-slate-300">Histéresis</th>
                  <th className="p-1.5 border border-slate-300 font-bold">Incertidumbre U(k=2)</th>
                </tr>
              </thead>
              <tbody>
                {d.puntos.map((pt) => (
                  <tr key={pt.id} className="hover:bg-slate-50">
                    <td className="p-1.5 border border-slate-300 font-mono">{pt.nominal.toFixed(1)}</td>
                    <td
                      className="p-1.5 border border-slate-300 font-mono font-bold"
                      style={{ color: colorSecundario, backgroundColor: `${colorSecundario}10` }}
                    >
                      {pt.patron.toFixed(2)}
                    </td>
                    <td className="p-1.5 border border-slate-300 font-mono">{pt.lecturaSubida.toFixed(2)}</td>
                    <td className="p-1.5 border border-slate-300 font-mono">{pt.lecturaBajada.toFixed(2)}</td>
                    <td className="p-1.5 border border-slate-300 font-mono text-rose-700 font-semibold">{pt.errorSubida > 0 ? `+${pt.errorSubida.toFixed(2)}` : pt.errorSubida.toFixed(2)}</td>
                    <td className="p-1.5 border border-slate-300 font-mono text-rose-700 font-semibold">{pt.errorBajada > 0 ? `+${pt.errorBajada.toFixed(2)}` : pt.errorBajada.toFixed(2)}</td>
                    <td className="p-1.5 border border-slate-300 font-mono">{pt.histeresis.toFixed(2)}</td>
                    <td
                      className="p-1.5 border border-slate-300 font-mono font-bold"
                      style={{ color: colorSecundario, backgroundColor: `${colorSecundario}10` }}
                    >
                      ±{pt.incertidumbreExpandida.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Resumen Metrológico */}
            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="border border-slate-300 p-2 text-center bg-slate-50 rounded">
                <span className="text-[10px] text-slate-500 block">Error Máximo Absoluto</span>
                <span className="text-xs font-mono font-bold text-slate-900">{d.errorMaximo.toFixed(2)} {d.unidadMedida}</span>
              </div>
              <div className="border border-slate-300 p-2 text-center bg-slate-50 rounded">
                <span className="text-[10px] text-slate-500 block">Incertidumbre Expandida Máx (k=2)</span>
                <span
                  className="text-xs font-mono font-bold"
                  style={{ color: colorSecundario }}
                >
                  ±{d.incertidumbreGlobal.toFixed(2)} {d.unidadMedida}
                </span>
              </div>
              <div className="border border-slate-300 p-2 text-center bg-slate-50 rounded flex flex-col justify-center">
                <span className="text-[10px] text-slate-500 block">Evaluación de Tolerancia</span>
                <span className="text-xs font-bold uppercase text-emerald-700 flex items-center justify-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {d.conclusionGeneral}
                </span>
              </div>
            </div>
          </div>

          {/* Gráfico de Desviación / Curvas de Calibración */}
          <div className="mb-4">
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
                        {g.titulo || `Gráfica Metrológica #${idx + 1}`}
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
              <div className="border border-slate-300 p-2.5 bg-white text-center">
                <span className="text-[10px] font-bold text-slate-700 block mb-1">
                  Curva de Desviación y Error de Indicación ({d.unidadMedida}) vs. Valor Nominal
                </span>
                <svg viewBox="0 0 550 140" className="w-full h-32 bg-slate-50 border border-slate-200">
                  <line x1="30" y1="20" x2="520" y2="20" stroke="#f1f5f9" />
                  <line x1="30" y1="70" x2="520" y2="70" stroke="#94a3b8" />
                  <line x1="30" y1="120" x2="520" y2="120" stroke="#f1f5f9" />
                  <line x1="30" y1="20" x2="30" y2="120" stroke="#94a3b8" />

                  <text x="25" y="24" fontSize="8" textAnchor="end" fill="#64748b">+1.5</text>
                  <text x="25" y="74" fontSize="8" textAnchor="end" fill="#64748b">0.0</text>
                  <text x="25" y="124" fontSize="8" textAnchor="end" fill="#64748b">-1.5</text>

                  {/* Banda de Tolerancia */}
                  <rect x="30" y="40" width="490" height="60" fill="#22c55e" fillOpacity="0.08" />
                  <line x1="30" y1="40" x2="520" y2="40" stroke="#ef4444" strokeWidth="1" strokeDasharray="3" />
                  <line x1="30" y1="100" x2="520" y2="100" stroke="#ef4444" strokeWidth="1" strokeDasharray="3" />
                  <text x="510" y="36" fontSize="7" fill="#ef4444" textAnchor="end">Límite Superior (+EMP)</text>
                  <text x="510" y="110" fontSize="7" fill="#ef4444" textAnchor="end">Límite Inferior (-EMP)</text>

                  {/* Curva de error de subida */}
                  <path
                    d="M 50,70 L 160,65 L 280,58 L 400,62 L 500,55"
                    fill="none"
                    stroke={colorSecundario}
                    strokeWidth="2"
                  />
                  <circle cx="50" cy="70" r="3" fill={colorSecundario} />
                  <circle cx="160" cy="65" r="3" fill={colorSecundario} />
                  <circle cx="280" cy="58" r="3" fill={colorSecundario} />
                  <circle cx="400" cy="62" r="3" fill={colorSecundario} />
                  <circle cx="500" cy="55" r="3" fill={colorSecundario} />
                </svg>
              </div>
            )}
          </div>

          {/* Declaración de Incertidumbre y Firmas */}
          <div className="mb-4 space-y-1.5 text-[10px]">
            <p className="text-slate-600 italic">
              <strong>Declaración de Incertidumbre:</strong> {d.declaraciones}
            </p>
            <p className="text-slate-600">
              <strong>Observaciones:</strong> {d.observaciones}
            </p>
          </div>

          {/* Firmas */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="border border-slate-300 p-2 text-center bg-slate-50 min-h-[120px] flex flex-col justify-between">
              <span className="text-[10px] font-bold text-slate-700 uppercase border-b border-slate-200 pb-1">
                Calibrado Por (Metrólogo)
              </span>
              <div className="h-10 flex items-center justify-center">
                {reporte.creadoPor.firmaUrl ? (
                  <img src={reporte.creadoPor.firmaUrl} alt="Firma" className="max-h-9 object-contain" />
                ) : (
                  <span className="text-[10px] text-slate-400 italic">Firma registrada</span>
                )}
              </div>
              <div className="text-[9px] border-t border-slate-200 pt-1">
                <p className="font-bold text-slate-900">{reporte.creadoPor.nombre}</p>
                <p className="text-slate-500">{reporte.creadoPor.cargo}</p>
              </div>
            </div>

            <div className="border border-slate-300 p-2 text-center bg-slate-50 min-h-[120px] flex flex-col justify-between">
              <span className="text-[10px] font-bold text-slate-700 uppercase border-b border-slate-200 pb-1">
                Autorizado Por (Signatario Técnico)
              </span>
              <div className="h-10 flex items-center justify-center">
                {reporte.aprobadoPor?.firmaUrl ? (
                  <img src={reporte.aprobadoPor.firmaUrl} alt="Firma" className="max-h-9 object-contain" />
                ) : (
                  <span className="text-[10px] text-slate-400 italic">Firma registrada</span>
                )}
              </div>
              <div className="text-[9px] border-t border-slate-200 pt-1">
                <p className="font-bold text-slate-900">{reporte.aprobadoPor?.nombre || 'Ing. Roberto Silva'}</p>
                <p className="text-slate-500">{reporte.aprobadoPor?.cargo || 'Director Técnico de Laboratorio'}</p>
              </div>
            </div>
          </div>

          {/* Sello de Seguridad, Huella Digital y QR */}
          <div className="border-t-2 border-slate-300 pt-2 flex items-center justify-between text-[10px] text-slate-600 bg-slate-50 p-2.5 rounded border border-slate-200">
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
                  <span>Certificado Metrológico Oficial - Trazabilidad SI (NTC-ISO/IEC 17025)</span>
                </div>
                <p className="text-[9px] text-slate-500 font-mono break-all max-w-md">
                  SHA-256: {hashIntegridad || 'Calculando firma digital...'}
                </p>
                <span className="text-[8px] text-slate-400 block">
                  Escanea el código QR para validar la autenticidad e incertidumbre expandida en el portal oficial.
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
