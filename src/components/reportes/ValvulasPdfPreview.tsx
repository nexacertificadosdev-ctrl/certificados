import React, { useState, useEffect } from 'react';
import type { ReporteCertificado } from '../../types';
import { Printer, ArrowLeft, CheckCircle2, XCircle, ShieldCheck } from 'lucide-react';
import { generarQrVerificacion, generarHashIntegridad } from '../../utils/security';
import {
  DEFAULT_LOGO_IZQUIERDO,
  DEFAULT_LOGO_DERECHO,
  DEFAULT_COLOR_PRIMARIO,
  DEFAULT_COLOR_SECUNDARIO,
  DEFAULT_COLOR_TEXTO,
} from '../../utils/themeDefaults';

interface ValvulasPdfPreviewProps {
  reporte: ReporteCertificado;
  onVolver: () => void;
}

export const ValvulasPdfPreview: React.FC<ValvulasPdfPreviewProps> = ({ reporte, onVolver }) => {
  const d = reporte.datosValvula;
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
        El reporte no contiene datos técnicos de válvulas cargados.
      </div>
    );
  }

  // Cálculos de variación
  const setPoint = d.setPointPsi || 175;
  const toleranciaPsi = (setPoint * (d.criterioAceptacionPorcentaje || 3)) / 100;
  const rangoMin = (setPoint - toleranciaPsi).toFixed(2);
  const rangoMax = (setPoint + toleranciaPsi).toFixed(2);
  const desviacionPsi = (d.disparoAjustadoPsi - setPoint).toFixed(2);
  const desviacionPct = (((d.disparoAjustadoPsi - setPoint) / setPoint) * 100).toFixed(2);

  return (
    <div className="bg-slate-200 min-h-screen py-8 px-4 sm:px-6 print:bg-white print:p-0 print:m-0 print:min-h-0 print:block">
      {/* Barra de control flotante no imprimible */}
      <div className="max-w-4xl mx-auto mb-6 flex items-center justify-between bg-white p-4 rounded-xl shadow-md border border-slate-300 no-print">
        <button
          onClick={onVolver}
          className="flex items-center gap-2 text-sm font-medium text-slate-700 hover:text-slate-900 px-3 py-1.5 rounded-lg hover:bg-slate-100 transition cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Volver al Listado</span>
        </button>

        <div className="flex items-center gap-4">
          <div className="text-right">
            <span className="text-xs text-slate-500 block">Consecutivo Técnico</span>
            <span className="font-mono font-bold text-sm text-slate-900">{numVisible}</span>
          </div>

          <span
            className={`px-2.5 py-1 text-xs font-semibold rounded-full uppercase ${
              reporte.estado === 'emitido'
                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                : reporte.estado === 'aprobado'
                ? 'bg-blue-100 text-blue-800 border border-blue-300'
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

      {/* CONTENEDOR DOCUMENTO (3 PÁGINAS CARTA) */}
      <div className="max-w-[850px] mx-auto space-y-8 print:space-y-0 print:w-full print:max-w-none print:block">
        {/* ========================================================= */}
        {/* PÁGINA 1: DATOS GENERALES, AMBIENTALES Y TRAZABILIDAD */}
        {/* ========================================================= */}
        <div className="bg-white p-10 shadow-lg rounded-sm border border-slate-300 print:shadow-none print:border-none page-break print-page">
          {/* Encabezado Institucional con Doble Logo y Colores */}
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
                    alt="Logo Corporativo Izquierdo"
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
                  {reporte.tituloReporteEs || 'REPORTE DE PRUEBA DE VÁLVULAS DE SEGURIDAD Y/O ALIVIO'}
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
                  {reporte.subtituloNormativo || d.normaReferencia || 'Conforme a Código ASME Sec. VIII Div. 1 & Norma API 527'}
                </span>
              </div>

              {/* Logo Derecho */}
              <div className="col-span-3 border-l border-slate-300 pl-2 flex flex-col items-center justify-center">
                {logoDerecho ? (
                  <img
                    src={logoDerecho}
                    alt="Logo Laboratorio Derecho"
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
                <span className="text-[8px] text-slate-400 block">Página 1 de 3</span>
              </div>
            </div>
          </div>

          {!esOficial && (
            <div className="bg-amber-50 border border-amber-300 text-amber-800 text-[11px] p-2 rounded mb-4 text-center font-medium no-print">
              DOCUMENTO PROVISIONAL EN FASE DE {reporte.estado.toUpperCase()}. El consecutivo oficial definitivo se asigna en la emisión.
            </div>
          )}

          {/* Sección 1: Datos del Solicitante */}
          <div className="mb-4">
            <div
              className="px-2 py-0.5 text-xs font-bold uppercase tracking-wider mb-1"
              style={{ backgroundColor: colorPrimario, color: colorTexto }}
            >
              1. Datos del Solicitante y Servicio
            </div>
            <table className="w-full text-[11px] border-collapse border border-slate-300">
              <tbody>
                <tr>
                  <td className="bg-slate-100 font-bold p-1.5 border border-slate-300 w-1/4">Solicitante:</td>
                  <td className="p-1.5 border border-slate-300 w-2/4 font-semibold">{reporte.clienteNombre}</td>
                  <td className="bg-slate-100 font-bold p-1.5 border border-slate-300 w-1/6">Fecha Recepción:</td>
                  <td className="p-1.5 border border-slate-300 font-mono">{reporte.fechaRecepcion}</td>
                </tr>
                <tr>
                  <td className="bg-slate-100 font-bold p-1.5 border border-slate-300">Dirección:</td>
                  <td className="p-1.5 border border-slate-300">{reporte.direccionServicio}</td>
                  <td className="bg-slate-100 font-bold p-1.5 border border-slate-300">Fecha Ensayo:</td>
                  <td className="p-1.5 border border-slate-300 font-mono">{reporte.fechaPrueba}</td>
                </tr>
                <tr>
                  <td className="bg-slate-100 font-bold p-1.5 border border-slate-300">Contrato / O.C.:</td>
                  <td className="p-1.5 border border-slate-300 font-mono">{reporte.contratoOC}</td>
                  <td className="bg-slate-100 font-bold p-1.5 border border-slate-300">Fecha Emisión:</td>
                  <td className="p-1.5 border border-slate-300 font-mono">{reporte.fechaEmision || 'Pendiente'}</td>
                </tr>
                <tr>
                  <td className="bg-slate-100 font-bold p-1.5 border border-slate-300">Lugar de Ejecución:</td>
                  <td colSpan={3} className="p-1.5 border border-slate-300">{d.lugarPrueba || reporte.ubicacionServicio}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Sección 2: Identificación de la Válvula */}
          <div className="mb-4">
            <div
              className="px-2 py-0.5 text-xs font-bold uppercase tracking-wider mb-1"
              style={{ backgroundColor: colorPrimario, color: colorTexto }}
            >
              2. Identificación y Especificaciones del Elemento
            </div>
            <table className="w-full text-[11px] border-collapse border border-slate-300">
              <tbody>
                <tr>
                  <td className="bg-slate-100 font-bold p-1.5 border border-slate-300 w-1/4">Tipo de Válvula:</td>
                  <td className="p-1.5 border border-slate-300 w-1/4">{d.tipoValvula}</td>
                  <td className="bg-slate-100 font-bold p-1.5 border border-slate-300 w-1/4">Identificación (Tag):</td>
                  <td
                    className="p-1.5 border border-slate-300 w-1/4 font-mono font-bold"
                    style={{ color: colorSecundario }}
                  >
                    {d.identificacionTag}
                  </td>
                </tr>
                <tr>
                  <td className="bg-slate-100 font-bold p-1.5 border border-slate-300">Fabricante:</td>
                  <td className="p-1.5 border border-slate-300 font-semibold">{d.fabricante}</td>
                  <td className="bg-slate-100 font-bold p-1.5 border border-slate-300">No. de Serie:</td>
                  <td className="p-1.5 border border-slate-300 font-mono font-semibold">{d.numeroSerie}</td>
                </tr>
                <tr>
                  <td className="bg-slate-100 font-bold p-1.5 border border-slate-300">Modelo / Referencia:</td>
                  <td className="p-1.5 border border-slate-300 font-mono">{d.modeloReferencia}</td>
                  <td className="bg-slate-100 font-bold p-1.5 border border-slate-300">Tamaño (Entrada x Salida):</td>
                  <td className="p-1.5 border border-slate-300 font-mono">{d.tamanio}</td>
                </tr>
                <tr>
                  <td className="bg-slate-100 font-bold p-1.5 border border-slate-300">Clase de Presión:</td>
                  <td className="p-1.5 border border-slate-300 font-mono">{d.clasificacionPresion}</td>
                  <td className="bg-slate-100 font-bold p-1.5 border border-slate-300">Norma Aplicable:</td>
                  <td className="p-1.5 border border-slate-300">{d.normaReferencia}</td>
                </tr>
                <tr>
                  <td className="bg-slate-100 font-bold p-1.5 border border-slate-300">Material Cuerpo:</td>
                  <td className="p-1.5 border border-slate-300">{d.materialCuerpo}</td>
                  <td className="bg-slate-100 font-bold p-1.5 border border-slate-300">Material Disco:</td>
                  <td className="p-1.5 border border-slate-300">{d.materialDisco}</td>
                </tr>
                <tr>
                  <td className="bg-slate-100 font-bold p-1.5 border border-slate-300">Material Asiento:</td>
                  <td className="p-1.5 border border-slate-300">{d.materialAsiento}</td>
                  <td className="bg-slate-100 font-bold p-1.5 border border-slate-300">Material Vástago:</td>
                  <td className="p-1.5 border border-slate-300">{d.materialVastago}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Sección 3: Condiciones Ambientales */}
          <div className="mb-4">
            <div
              className="px-2 py-0.5 text-xs font-bold uppercase tracking-wider mb-1"
              style={{ backgroundColor: colorPrimario, color: colorTexto }}
            >
              3. Condiciones Ambientales Durante la Prueba
            </div>
            <table className="w-full text-[11px] border-collapse border border-slate-300 text-center">
              <thead>
                <tr style={{ backgroundColor: colorPrimario, color: colorTexto }}>
                  <th className="p-1.5 border border-slate-300 text-left">Magnitud Medida</th>
                  <th className="p-1.5 border border-slate-300">Valor Mínimo</th>
                  <th className="p-1.5 border border-slate-300">Valor Máximo</th>
                  <th className="p-1.5 border border-slate-300">Valor Promedio</th>
                  <th className="p-1.5 border border-slate-300">Unidad</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="p-1.5 border border-slate-300 text-left font-medium">Temperatura Ambiental</td>
                  <td className="p-1.5 border border-slate-300 font-mono">{d.condicionesAmbientales.temperatura.min.toFixed(1)}</td>
                  <td className="p-1.5 border border-slate-300 font-mono">{d.condicionesAmbientales.temperatura.max.toFixed(1)}</td>
                  <td className="p-1.5 border border-slate-300 font-mono font-semibold">{d.condicionesAmbientales.temperatura.promedio.toFixed(1)}</td>
                  <td className="p-1.5 border border-slate-300">°C</td>
                </tr>
                <tr>
                  <td className="p-1.5 border border-slate-300 text-left font-medium">Humedad Relativa</td>
                  <td className="p-1.5 border border-slate-300 font-mono">{d.condicionesAmbientales.humedadRelativa.min.toFixed(1)}</td>
                  <td className="p-1.5 border border-slate-300 font-mono">{d.condicionesAmbientales.humedadRelativa.max.toFixed(1)}</td>
                  <td className="p-1.5 border border-slate-300 font-mono font-semibold">{d.condicionesAmbientales.humedadRelativa.promedio.toFixed(1)}</td>
                  <td className="p-1.5 border border-slate-300">% HR</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Sección 4: Equipos Auxiliares y Patrones con Trazabilidad */}
          <div className="mb-2">
            <div
              className="px-2 py-0.5 text-xs font-bold uppercase tracking-wider mb-1"
              style={{ backgroundColor: colorPrimario, color: colorTexto }}
            >
              4. Trazabilidad Metrológica y Equipos de Referencia
            </div>
            
            <p className="text-[10px] font-bold text-slate-700 mb-1">Equipos Patrones Utilizados:</p>
            <table className="w-full text-[10px] border-collapse border border-slate-300 mb-3">
              <thead>
                <tr className="bg-slate-100">
                  <th className="p-1 border border-slate-300 text-left">Patrón de Referencia</th>
                  <th className="p-1 border border-slate-300">Código Interno</th>
                  <th className="p-1 border border-slate-300">No. Certificado</th>
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

            <p className="text-[10px] font-bold text-slate-700 mb-1">Equipos Auxiliares:</p>
            <table className="w-full text-[10px] border-collapse border border-slate-300 mb-2">
              <thead>
                <tr className="bg-slate-100">
                  <th className="p-1 border border-slate-300 text-left">Equipo Auxiliar</th>
                  <th className="p-1 border border-slate-300">Código</th>
                  <th className="p-1 border border-slate-300">Fluido / Medio</th>
                  <th className="p-1 border border-slate-300">Número de Serie</th>
                </tr>
              </thead>
              <tbody>
                {d.equiposAuxiliares.map((aux) => (
                  <tr key={aux.id}>
                    <td className="p-1 border border-slate-300">{aux.nombre}</td>
                    <td className="p-1 border border-slate-300 font-mono text-center">{aux.codigo}</td>
                    <td className="p-1 border border-slate-300 text-center">{aux.fluidoMedio}</td>
                    <td className="p-1 border border-slate-300 font-mono text-center">{aux.numeroSerie}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <p className="text-[9px] text-slate-600 italic leading-tight border-l-2 pl-2 mt-2" style={{ borderColor: colorSecundario }}>
              <strong>Declaración de Trazabilidad:</strong> {d.declaracionTrazabilidad}
            </p>
          </div>

          <div className="text-right text-[9px] text-slate-400 pt-3 border-t border-slate-200 mt-4">
            Formato: {reporte.codigoFormato || 'FOR-MET-VT-01'} | Versión: {reporte.versionPlantilla}
          </div>
        </div>

        {/* ========================================================= */}
        {/* PÁGINA 2: RESULTADOS TÉCNICOS, CRITERIOS Y GRÁFICAS */}
        {/* ========================================================= */}
        <div className="bg-white p-10 shadow-lg rounded-sm border border-slate-300 print:shadow-none print:border-none page-break print-page">
          {/* Subencabezado Página 2 */}
          <div
            className="flex justify-between items-center border-b-2 pb-2 mb-4 text-[10px] text-slate-600"
            style={{ borderColor: colorSecundario }}
          >
            <span><strong style={{ color: colorSecundario }}>{reporte.tituloReporteEs || 'REPORTE'}:</strong> {numVisible} - {d.tipoValvula}</span>
            <span>TAG: {d.identificacionTag} | SERIAL: {d.numeroSerie}</span>
            <span>Página 2 de 3</span>
          </div>

          <div className="mb-4">
            <div
              className="px-2 py-0.5 text-xs font-bold uppercase tracking-wider mb-2"
              style={{ backgroundColor: colorPrimario, color: colorTexto }}
            >
              5. Resultados de Ensayo de Presión de Ajuste (Set Point) y Sello
            </div>

            <table className="w-full text-[11px] border-collapse border border-slate-300 text-center mb-4">
              <thead>
                <tr style={{ backgroundColor: colorPrimario, color: colorTexto }}>
                  <th className="p-2 border border-slate-300 text-left">Parámetro Metrológico</th>
                  <th className="p-2 border border-slate-300">Valor Nominal / Requerido</th>
                  <th className="p-2 border border-slate-300">Valor Encontrado</th>
                  <th className="p-2 border border-slate-300 font-bold">Valor Dejado / Ajustado</th>
                  <th className="p-2 border border-slate-300">Unidad</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="p-2 border border-slate-300 text-left font-medium">Presión de Disparo (Set Point)</td>
                  <td className="p-2 border border-slate-300 font-mono font-bold">{setPoint.toFixed(1)}</td>
                  <td className="p-2 border border-slate-300 font-mono">{d.disparoEncontradoPsi.toFixed(1)}</td>
                  <td
                    className="p-2 border border-slate-300 font-mono font-bold"
                    style={{ color: colorSecundario, backgroundColor: `${colorSecundario}10` }}
                  >
                    {d.disparoAjustadoPsi.toFixed(1)}
                  </td>
                  <td className="p-2 border border-slate-300 font-bold">PSI</td>
                </tr>
                <tr>
                  <td className="p-2 border border-slate-300 text-left font-medium">Presión de Prueba de Sello (Hermeticidad)</td>
                  <td className="p-2 border border-slate-300 font-mono font-medium">{(setPoint * 0.9).toFixed(1)} (90%)</td>
                  <td className="p-2 border border-slate-300 font-mono">-</td>
                  <td
                    className="p-2 border border-slate-300 font-mono font-bold"
                    style={{ color: colorSecundario, backgroundColor: `${colorSecundario}10` }}
                  >
                    {d.puntoSelloPsi.toFixed(1)}
                  </td>
                  <td className="p-2 border border-slate-300 font-bold">PSI</td>
                </tr>
                <tr>
                  <td className="p-2 border border-slate-300 text-left font-medium">Presión de Reasiento (Blowdown)</td>
                  <td className="p-2 border border-slate-300 font-mono">-</td>
                  <td className="p-2 border border-slate-300 font-mono">-</td>
                  <td
                    className="p-2 border border-slate-300 font-mono font-bold"
                    style={{ color: colorSecundario, backgroundColor: `${colorSecundario}10` }}
                  >
                    {d.blowdownPsi.toFixed(1)}
                  </td>
                  <td className="p-2 border border-slate-300 font-bold">PSI</td>
                </tr>
              </tbody>
            </table>

            {/* Verificación Matemática y Criterios */}
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="border border-slate-300 p-3 bg-slate-50 rounded">
                <span className="text-[10px] font-bold text-slate-700 uppercase block mb-1">
                  Cálculo de Desviación y Tolerancia
                </span>
                <div className="text-[11px] space-y-1">
                  <p><strong>Criterio de Aceptación:</strong> ±{d.criterioAceptacionPorcentaje}% del Set Point</p>
                  <p><strong>Rango Permitido:</strong> [{rangoMin} - {rangoMax}] PSI</p>
                  <p><strong>Desviación Absoluta:</strong> {desviacionPsi} PSI</p>
                  <p><strong>Error Relativo:</strong> {desviacionPct}%</p>
                </div>
              </div>

              <div className="border border-slate-300 p-3 bg-slate-50 rounded flex flex-col justify-center">
                <span className="text-[10px] font-bold text-slate-700 uppercase block mb-2">
                  Evaluación de Conformidad
                </span>
                <div className="flex items-center gap-4 text-xs font-semibold">
                  <div className="flex items-center gap-1.5">
                    {d.cumpleDisparo ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <XCircle className="w-4 h-4 text-rose-600" />}
                    <span>Disparo: {d.cumpleDisparo ? 'CUMPLE' : 'NO CUMPLE'}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {d.cumpleSello ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <XCircle className="w-4 h-4 text-rose-600" />}
                    <span>Hermeticidad: {d.cumpleSello ? 'CUMPLE' : 'NO CUMPLE'}</span>
                  </div>
                </div>

                <div className="mt-3 pt-2 border-t border-slate-200 flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800">Conclusión Técnica:</span>
                  <span
                    className={`font-mono font-bold text-xs px-2 py-0.5 rounded ${
                      d.conclusionGeneral === 'CONFORME'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}
                  >
                    {d.conclusionGeneral}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Sección 6: Curvas y Gráficas de Presión */}
          <div>
            <div
              className="px-2 py-0.5 text-xs font-bold uppercase tracking-wider mb-2"
              style={{ backgroundColor: colorPrimario, color: colorTexto }}
            >
              6. Gráficas Registradas de Presión vs. Tiempo
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              {/* Gráfica 1: Entrada / Disparo */}
              <div className="border border-slate-300 p-2 text-center bg-white">
                <span className="text-[10px] font-bold text-slate-700 block mb-1">
                  Curva de Disparo (Pop Test) - Ciclo Encontrado y Ajustado
                </span>
                <svg viewBox="0 0 320 160" className="w-full h-36 border border-slate-200 bg-slate-50">
                  <line x1="30" y1="20" x2="310" y2="20" stroke="#e2e8f0" strokeDasharray="3" />
                  <line x1="30" y1="50" x2="310" y2="50" stroke="#e2e8f0" strokeDasharray="3" />
                  <line x1="30" y1="80" x2="310" y2="80" stroke="#e2e8f0" strokeDasharray="3" />
                  <line x1="30" y1="110" x2="310" y2="110" stroke="#e2e8f0" strokeDasharray="3" />
                  <line x1="30" y1="140" x2="310" y2="140" stroke="#94a3b8" />
                  <line x1="30" y1="20" x2="30" y2="140" stroke="#94a3b8" />

                  <text x="26" y="24" fontSize="8" textAnchor="end" fill="#64748b">200</text>
                  <text x="26" y="54" fontSize="8" textAnchor="end" fill="#64748b">175</text>
                  <text x="26" y="84" fontSize="8" textAnchor="end" fill="#64748b">150</text>
                  <text x="26" y="114" fontSize="8" textAnchor="end" fill="#64748b">100</text>
                  <text x="26" y="144" fontSize="8" textAnchor="end" fill="#64748b">0</text>
                  <text x="170" y="155" fontSize="8" textAnchor="middle" fill="#64748b">Tiempo (seg)</text>

                  <line x1="30" y1="50" x2="310" y2="50" stroke="#ef4444" strokeWidth="1.5" strokeDasharray="4" />
                  <text x="290" y="46" fontSize="7" fill="#ef4444" fontWeight="bold">Set: 175 psi</text>

                  <path
                    d="M 30,140 Q 90,135 120,90 T 170,48 L 180,68 Q 210,50 240,49 L 260,70 L 300,138"
                    fill="none"
                    stroke={colorSecundario}
                    strokeWidth="2"
                  />
                  <circle cx="170" cy="48" r="3" fill={colorSecundario} />
                  <text x="170" y="40" fontSize="7" fill={colorSecundario} fontWeight="bold" textAnchor="middle">175.4 psi</text>
                </svg>
                <span className="text-[9px] text-slate-500 italic block mt-1">Medio: Nitrógeno | Sensor: PAT-PR-04</span>
              </div>

              {/* Gráfica 2: Sello / Fuga */}
              <div className="border border-slate-300 p-2 text-center bg-white">
                <span className="text-[10px] font-bold text-slate-700 block mb-1">
                  Estabilidad de Sello (Hermeticidad a 90% Set Point)
                </span>
                <svg viewBox="0 0 320 160" className="w-full h-36 border border-slate-200 bg-slate-50">
                  <line x1="30" y1="20" x2="310" y2="20" stroke="#e2e8f0" strokeDasharray="3" />
                  <line x1="30" y1="50" x2="310" y2="50" stroke="#e2e8f0" strokeDasharray="3" />
                  <line x1="30" y1="80" x2="310" y2="80" stroke="#e2e8f0" strokeDasharray="3" />
                  <line x1="30" y1="140" x2="310" y2="140" stroke="#94a3b8" />
                  <line x1="30" y1="20" x2="30" y2="140" stroke="#94a3b8" />

                  <text x="26" y="54" fontSize="8" textAnchor="end" fill="#64748b">165</text>
                  <text x="26" y="84" fontSize="8" textAnchor="end" fill="#64748b">150</text>
                  <text x="26" y="144" fontSize="8" textAnchor="end" fill="#64748b">0</text>
                  <text x="170" y="155" fontSize="8" textAnchor="middle" fill="#64748b">Tiempo de sostenimiento: 120s</text>

                  <path
                    d="M 30,140 L 70,55 L 280,55 L 305,140"
                    fill="none"
                    stroke="#059669"
                    strokeWidth="2"
                  />
                  <text x="175" y="47" fontSize="8" fill="#065f46" fontWeight="bold" textAnchor="middle">
                    165 psi sostenido sin fuga (0 bpm)
                  </text>
                </svg>
                <span className="text-[9px] text-slate-500 italic block mt-1">Criterio API 527: 0 burbujas por minuto</span>
              </div>
            </div>
          </div>

          <div className="text-right text-[9px] text-slate-400 pt-3 border-t border-slate-200 mt-6">
            Formato: {reporte.codigoFormato || 'FOR-MET-VT-01'} | Versión: {reporte.versionPlantilla}
          </div>
        </div>

        {/* ========================================================= */}
        {/* PÁGINA 3: OBSERVACIONES, DECLARACIONES Y FIRMAS */}
        {/* ========================================================= */}
        <div className="bg-white p-10 shadow-lg rounded-sm border border-slate-300 print:shadow-none print:border-none print-page-last">
          {/* Subencabezado Página 3 */}
          <div
            className="flex justify-between items-center border-b-2 pb-2 mb-4 text-[10px] text-slate-600"
            style={{ borderColor: colorSecundario }}
          >
            <span><strong style={{ color: colorSecundario }}>{reporte.tituloReporteEs || 'REPORTE'}:</strong> {numVisible} - {d.tipoValvula}</span>
            <span>TAG: {d.identificacionTag}</span>
            <span>Página 3 de 3</span>
          </div>

          {/* Sección 7: Observaciones Técnicas */}
          <div className="mb-4">
            <div
              className="px-2 py-0.5 text-xs font-bold uppercase tracking-wider mb-1"
              style={{ backgroundColor: colorPrimario, color: colorTexto }}
            >
              7. Observaciones Técnicas
            </div>
            <div className="border border-slate-300 p-3 text-xs text-slate-800 bg-slate-50 min-h-[90px] leading-relaxed">
              {d.observaciones || 'Sin observaciones adicionales registradas.'}
            </div>
          </div>

          {/* Sección 8: Declaraciones de Conformidad */}
          <div className="mb-6">
            <div
              className="px-2 py-0.5 text-xs font-bold uppercase tracking-wider mb-1"
              style={{ backgroundColor: colorPrimario, color: colorTexto }}
            >
              8. Declaraciones de Conformidad y Validez Metrológica
            </div>
            <div className="border border-slate-300 p-3 text-[11px] text-slate-700 bg-slate-50 leading-relaxed space-y-2">
              <p>
                {d.declaraciones ||
                  'Los resultados expresados en el presente informe se refieren exclusivamente al ítem inspeccionado y en las condiciones indicadas en la fecha del ensayo.'}
              </p>
              <p className="text-[10px] text-slate-500">
                • Este documento no debe ser reproducido total o parcialmente sin la aprobación escrita del laboratorio emisor.<br />
                • Los sellos de seguridad instalados garantizan que el elemento no ha sido manipulado con posterioridad a la prueba. La rotura del precinto anula la validez del reporte.<br />
                • El presente reporte conserva validez técnica e integridad documental respaldada por registro inmutable en base de datos.
              </p>
            </div>
          </div>

          {/* Sección 9: Firmas y Autorizaciones */}
          <div className="mb-6">
            <div
              className="px-2 py-0.5 text-xs font-bold uppercase tracking-wider mb-2"
              style={{ backgroundColor: colorPrimario, color: colorTexto }}
            >
              9. Autorizaciones y Firmas Responsables
            </div>

            <div className="grid grid-cols-3 gap-3">
              {/* 1. Realizado por */}
              <div className="border border-slate-300 p-2.5 flex flex-col justify-between text-center bg-slate-50 min-h-[170px]">
                <div>
                  <span className="text-[10px] font-bold text-slate-700 uppercase block border-b border-slate-200 pb-1 mb-2">
                    Realizado Por (Técnico)
                  </span>
                  <div className="h-16 flex items-center justify-center">
                    {reporte.creadoPor.firmaUrl ? (
                      <img
                        src={reporte.creadoPor.firmaUrl}
                        alt="Firma Técnico"
                        className="max-h-14 max-w-full object-contain"
                      />
                    ) : (
                      <span className="text-[10px] text-slate-400 italic">Firma registrada</span>
                    )}
                  </div>
                </div>
                <div className="border-t border-slate-300 pt-1 text-[10px]">
                  <p className="font-bold text-slate-900 leading-tight">{reporte.creadoPor.nombre}</p>
                  <p className="text-slate-500 text-[9px] leading-tight">{reporte.creadoPor.cargo}</p>
                  <p className="font-mono text-slate-400 text-[8px] mt-0.5">{reporte.fechaPrueba}</p>
                </div>
              </div>

              {/* 2. Revisado por */}
              <div className="border border-slate-300 p-2.5 flex flex-col justify-between text-center bg-slate-50 min-h-[170px]">
                <div>
                  <span className="text-[10px] font-bold text-slate-700 uppercase block border-b border-slate-200 pb-1 mb-2">
                    Revisado Por (Aseguramiento)
                  </span>
                  <div className="h-16 flex items-center justify-center">
                    {reporte.revisadoPor?.firmaUrl ? (
                      <img
                        src={reporte.revisadoPor.firmaUrl}
                        alt="Firma Revisor"
                        className="max-h-14 max-w-full object-contain"
                      />
                    ) : (
                      <span className="text-[10px] text-slate-400 italic">
                        {reporte.revisadoPor ? 'Firma registrada' : 'Pendiente de revisión'}
                      </span>
                    )}
                  </div>
                </div>
                <div className="border-t border-slate-300 pt-1 text-[10px]">
                  <p className="font-bold text-slate-900 leading-tight">
                    {reporte.revisadoPor?.nombre || 'Ing. Diana Gutiérrez'}
                  </p>
                  <p className="text-slate-500 text-[9px] leading-tight">
                    {reporte.revisadoPor?.cargo || 'Revisora de Aseguramiento Técnico'}
                  </p>
                  <p className="font-mono text-slate-400 text-[8px] mt-0.5">
                    {reporte.fechaEmision || reporte.fechaPrueba}
                  </p>
                </div>
              </div>

              {/* 3. Aprobado / Emitido por */}
              <div className="border border-slate-300 p-2.5 flex flex-col justify-between text-center bg-slate-50 min-h-[170px]">
                <div>
                  <span className="text-[10px] font-bold text-slate-700 uppercase block border-b border-slate-200 pb-1 mb-2">
                    Aprobado / Emitido Por (Director)
                  </span>
                  <div className="h-16 flex items-center justify-center">
                    {reporte.aprobadoPor?.firmaUrl ? (
                      <img
                        src={reporte.aprobadoPor.firmaUrl}
                        alt="Firma Director Técnico"
                        className="max-h-14 max-w-full object-contain"
                      />
                    ) : (
                      <span className="text-[10px] text-slate-400 italic">
                        {reporte.aprobadoPor ? 'Firma registrada' : 'Pendiente de aprobación'}
                      </span>
                    )}
                  </div>
                </div>
                <div className="border-t border-slate-300 pt-1 text-[10px]">
                  <p className="font-bold text-slate-900 leading-tight">
                    {reporte.aprobadoPor?.nombre || 'Ing. Roberto Silva'}
                  </p>
                  <p className="text-slate-500 text-[9px] leading-tight">
                    {reporte.aprobadoPor?.cargo || 'Director Técnico de Laboratorio'}
                  </p>
                  <p className="font-mono text-slate-400 text-[8px] mt-0.5">
                    {reporte.fechaEmision || 'Pendiente'}
                  </p>
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
                  <span>Certificado Controlado e Inmutable - Trazabilidad NTC-ISO/IEC 17025</span>
                </div>
                <p className="text-[9px] text-slate-500 font-mono break-all max-w-md">
                  SHA-256: {hashIntegridad || 'Calculando firma digital...'}
                </p>
                <span className="text-[8px] text-slate-400 block">
                  Escanea el código QR para validar la autenticidad y el historial de emisión en la base de datos oficial.
                </span>
              </div>
            </div>
            <div className="text-right shrink-0">
              <span className="font-mono text-[9px] text-slate-400 block">PÁGINA 3 DE 3</span>
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
