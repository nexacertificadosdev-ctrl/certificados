import React, { useState } from 'react';
import type {
  Cliente,
  CodigoClasificacion,
  DatosTecnicosCalibracion,
  EquipoInstrumento,
  PuntoCalibracion,
  ReporteCertificado,
  Usuario,
  GraficaServicio,
} from '../../types';
import { storageService } from '../../services/storageService';
import { Save, Send, ArrowLeft, CheckCircle2, AlertTriangle, Plus, Trash2, Gauge, Calculator } from 'lucide-react';
import { PatronesSelector } from './PatronesSelector';
import { GraficasServicioUploader } from '../common/GraficasServicioUploader';

interface CalibracionFormProps {
  reporteInicial?: ReporteCertificado;
  clasificacionDefault?: CodigoClasificacion;
  clientes: Cliente[];
  equipos: EquipoInstrumento[];
  usuarioActual: Usuario;
  onGuardado: (reporte: ReporteCertificado) => void;
  onCancelar: () => void;
}

export const CalibracionForm: React.FC<CalibracionFormProps> = ({
  reporteInicial,
  clasificacionDefault = 'PR',
  clientes,
  equipos,
  usuarioActual,
  onGuardado,
  onCancelar,
}) => {
  const esEdicion = !!reporteInicial;
  const codigoClasificacion: CodigoClasificacion =
    reporteInicial?.clasificacionCodigo || clasificacionDefault;

  const soloLectura =
    esEdicion &&
    (reporteInicial.estado === 'emitido' ||
      reporteInicial.estado === 'anulado' ||
      (reporteInicial.estado === 'en_revision' && usuarioActual.rol === 'tecnico'));

  // Plantillas de Calibración para la clasificación activa
  const plantillasDisponibles = storageService
    .getPlantillas()
    .filter((p) => p.clasificacionCodigo === codigoClasificacion);

  const [plantillaId, setPlantillaId] = useState<string>(
    reporteInicial?.plantillaId || plantillasDisponibles[0]?.id || 'plan-pr-1'
  );
  const plantillaSeleccionada =
    plantillasDisponibles.find((p) => p.id === plantillaId) || plantillasDisponibles[0];

  const [tituloReporteEs, setTituloReporteEs] = useState<string>(
    reporteInicial?.tituloReporteEs ||
      plantillaSeleccionada?.tituloReporteEs ||
      'CERTIFICADO DE CALIBRACION'
  );
  const [tituloReporteEn, setTituloReporteEn] = useState<string>(
    reporteInicial?.tituloReporteEn ||
      plantillaSeleccionada?.tituloReporteEn ||
      'Calibration Certificate'
  );
  const [subtituloNormativo, setSubtituloNormativo] = useState<string>(
    reporteInicial?.subtituloNormativo ||
      plantillaSeleccionada?.subtituloNormativo ||
      'Guía Técnica DKD-R 6-1 / NTC-ISO/IEC 17025'
  );
  const [codigoFormato, setCodigoFormato] = useState<string>(
    reporteInicial?.codigoFormato || plantillaSeleccionada?.codigoFormato || 'FOR-MET-PR-01'
  );

  // Cliente y Generales
  const [clienteId, setClienteId] = useState(reporteInicial?.clienteId || clientes[0]?.id || '');
  const clienteSeleccionado = clientes.find((c) => c.id === clienteId) || clientes[0];

  const [equipoId] = useState(reporteInicial?.equipoId || equipos[0]?.id || '');
  const [direccionServicio, setDireccionServicio] = useState(
    reporteInicial?.direccionServicio || clienteSeleccionado?.direccion || ''
  );
  const [contratoOC, setContratoOC] = useState(reporteInicial?.contratoOC || 'OC-CAL-2026-112');
  const [ubicacionServicio, setUbicacionServicio] = useState(
    reporteInicial?.ubicacionServicio || 'Laboratorio Central de Metrología (Sala Climatizada)'
  );
  const [fechaRecepcion, setFechaRecepcion] = useState(
    reporteInicial?.fechaRecepcion || new Date().toISOString().split('T')[0]
  );
  const [fechaPrueba, setFechaPrueba] = useState(
    reporteInicial?.fechaPrueba || new Date().toISOString().split('T')[0]
  );
  const [graficasServicio, setGraficasServicio] = useState<GraficaServicio[]>(
    reporteInicial?.graficasServicio || []
  );

  // Magnitud según clasificación
  const getMagnitudPorCodigo = (
    cod: CodigoClasificacion
  ): 'Presión' | 'Temperatura' | 'Magnitudes Eléctricas' => {
    if (cod === 'TM') return 'Temperatura';
    if (cod === 'EL') return 'Magnitudes Eléctricas';
    return 'Presión';
  };

  // Puntos iniciales por defecto según magnitud
  const getPuntosIniciales = (cod: CodigoClasificacion): PuntoCalibracion[] => {
    if (cod === 'PR') {
      return [
        { id: '1', nominal: 0, patron: 0.0, lecturaSubida: 0.0, lecturaBajada: 0.1, errorSubida: 0.0, errorBajada: 0.1, histeresis: 0.1, incertidumbreExpandida: 0.08 },
        { id: '2', nominal: 25, patron: 75.0, lecturaSubida: 75.2, lecturaBajada: 75.3, errorSubida: 0.2, errorBajada: 0.3, histeresis: 0.1, incertidumbreExpandida: 0.09 },
        { id: '3', nominal: 50, patron: 150.0, lecturaSubida: 150.4, lecturaBajada: 150.5, errorSubida: 0.4, errorBajada: 0.5, histeresis: 0.1, incertidumbreExpandida: 0.10 },
        { id: '4', nominal: 75, patron: 225.0, lecturaSubida: 225.3, lecturaBajada: 225.5, errorSubida: 0.3, errorBajada: 0.5, histeresis: 0.2, incertidumbreExpandida: 0.11 },
        { id: '5', nominal: 100, patron: 300.0, lecturaSubida: 300.5, lecturaBajada: 300.5, errorSubida: 0.5, errorBajada: 0.5, histeresis: 0.0, incertidumbreExpandida: 0.12 },
      ];
    } else if (cod === 'TM') {
      return [
        { id: '1', nominal: 0, patron: 0.0, lecturaSubida: 0.05, lecturaBajada: 0.06, errorSubida: 0.05, errorBajada: 0.06, histeresis: 0.01, incertidumbreExpandida: 0.05 },
        { id: '2', nominal: 50, patron: 50.0, lecturaSubida: 50.12, lecturaBajada: 50.15, errorSubida: 0.12, errorBajada: 0.15, histeresis: 0.03, incertidumbreExpandida: 0.06 },
        { id: '3', nominal: 100, patron: 100.0, lecturaSubida: 100.18, lecturaBajada: 100.20, errorSubida: 0.18, errorBajada: 0.20, histeresis: 0.02, incertidumbreExpandida: 0.07 },
      ];
    }
    return [
      { id: '1', nominal: 4, patron: 4.0, lecturaSubida: 4.002, lecturaBajada: 4.003, errorSubida: 0.002, errorBajada: 0.003, histeresis: 0.001, incertidumbreExpandida: 0.005 },
      { id: '2', nominal: 12, patron: 12.0, lecturaSubida: 12.008, lecturaBajada: 12.009, errorSubida: 0.008, errorBajada: 0.009, histeresis: 0.001, incertidumbreExpandida: 0.006 },
      { id: '3', nominal: 20, patron: 20.0, lecturaSubida: 20.014, lecturaBajada: 20.015, errorSubida: 0.014, errorBajada: 0.015, histeresis: 0.001, incertidumbreExpandida: 0.008 },
    ];
  };

  const defaultCalibracion: DatosTecnicosCalibracion = reporteInicial?.datosCalibracion || {
    magnitud: getMagnitudPorCodigo(codigoClasificacion),
    tipoInstrumento: codigoClasificacion === 'PR' ? 'Manómetro Bourdon' : codigoClasificacion === 'TM' ? 'Termómetro Digital RTD' : 'Multímetro / Calibrador de Proceso',
    fabricante: 'Ashcroft / Wika',
    modelo: '1009 Duralife',
    numeroSerie: 'SN-MAN-2026-891',
    tagIdentificacion: 'PI-201-B',
    rangoMin: 0,
    rangoMax: codigoClasificacion === 'PR' ? 300 : codigoClasificacion === 'TM' ? 100 : 20,
    unidadMedida: codigoClasificacion === 'PR' ? 'psi' : codigoClasificacion === 'TM' ? '°C' : 'mA',
    resolucion: codigoClasificacion === 'PR' ? 0.5 : 0.01,
    toleranciaPermitidaPct: 1.0, // ± 1.0% de Span
    normaMetodo: codigoClasificacion === 'PR' ? 'DKD-R 6-1:2014 Sec. B' : 'EURAMET cg-11 v2.0',
    medioGeneracion: codigoClasificacion === 'PR' ? 'Balanza de Pesos Muertos / Comparador Hidráulico' : 'Pozo Seco de Temperatura',
    puntos: getPuntosIniciales(codigoClasificacion),
    errorMaximo: 0.5,
    incertidumbreGlobal: 0.12,
    cumpleTolerancia: true,
    conclusionGeneral: 'CONFORME',
    observaciones: 'El instrumento ensayado se encuentra dentro de la clase de exactitud declarada por el fabricante.',
    declaraciones: 'La incertidumbre reportada corresponde a la incertidumbre expandida U con un factor de cobertura k=2 (nivel de confianza ~95%). Trazabilidad referida a patrones nacionales INM / NIST.',
    condicionesAmbientales: {
      temperatura: { min: 20.0, max: 21.5, promedio: 20.8 },
      humedadRelativa: { min: 45, max: 55, promedio: 50 },
    },
    equiposPatrones: [
      {
        id: 'pat-1',
        nombre: 'Balanza de Pesos Muertos / Calibrador Primario',
        codigo: 'PAT-BPM-01',
        marca: 'Fluke Calibration / Ruska',
        modelo: '2400 Series',
        serie: 'SN-RUS-901',
        rangoMedida: '0 a 1000 psi',
        resolucion: '0.001 psi',
        incertidumbre: '± 0.008% de lectura',
        certificadoCalibracion: 'INM-MET-PR-2025-44',
        fechaCalibracion: '2025-09-15',
        vigencia: '2027-09-15',
      },
    ],
  };

  const [calibracion, setCalibracion] = useState<DatosTecnicosCalibracion>(defaultCalibracion);

  // Recálculo dinámico de puntos
  const actualizarPunto = (index: number, campo: keyof PuntoCalibracion, valor: number) => {
    const nuevosPuntos = [...calibracion.puntos];
    const p = { ...nuevosPuntos[index], [campo]: valor };

    // Auto-cálculo de errores e histéresis
    const errorSub = Number((p.lecturaSubida - p.patron).toFixed(3));
    const errorBaj = Number((p.lecturaBajada - p.patron).toFixed(3));
    const hist = Number(Math.abs(p.lecturaSubida - p.lecturaBajada).toFixed(3));

    p.errorSubida = errorSub;
    p.errorBajada = errorBaj;
    p.histeresis = hist;

    nuevosPuntos[index] = p;

    // Calcular error máximo global
    let maxErr = 0;
    let maxU = 0;
    nuevosPuntos.forEach((item) => {
      const eMaxPunto = Math.max(Math.abs(item.errorSubida), Math.abs(item.errorBajada));
      if (eMaxPunto > maxErr) maxErr = eMaxPunto;
      if (item.incertidumbreExpandida > maxU) maxU = item.incertidumbreExpandida;
    });

    const span = Math.abs(calibracion.rangoMax - calibracion.rangoMin);
    const empValor = (span * calibracion.toleranciaPermitidaPct) / 100;
    const cumple = maxErr <= empValor;

    setCalibracion({
      ...calibracion,
      puntos: nuevosPuntos,
      errorMaximo: Number(maxErr.toFixed(3)),
      incertidumbreGlobal: Number(maxU.toFixed(3)),
      cumpleTolerancia: cumple,
      conclusionGeneral: cumple ? 'CONFORME' : 'NO CONFORME',
    });
  };

  const agregarPunto = () => {
    const nuevoId = String(calibracion.puntos.length + 1);
    const nuevoPunto: PuntoCalibracion = {
      id: nuevoId,
      nominal: 0,
      patron: 0,
      lecturaSubida: 0,
      lecturaBajada: 0,
      errorSubida: 0,
      errorBajada: 0,
      histeresis: 0,
      incertidumbreExpandida: 0.1,
    };
    setCalibracion({
      ...calibracion,
      puntos: [...calibracion.puntos, nuevoPunto],
    });
  };

  const eliminarPunto = (index: number) => {
    if (calibracion.puntos.length <= 1) return;
    const filtrados = calibracion.puntos.filter((_, i) => i !== index);
    setCalibracion({
      ...calibracion,
      puntos: filtrados,
    });
  };

  const handleCambioPlantilla = (id: string) => {
    setPlantillaId(id);
    const p = plantillasDisponibles.find((item) => item.id === id);
    if (p) {
      setTituloReporteEs(p.tituloReporteEs);
      setTituloReporteEn(p.tituloReporteEn || '');
      setSubtituloNormativo(p.subtituloNormativo || '');
      setCodigoFormato(p.codigoFormato);
    }
  };

  const handleSubmit = (enviarARevision: boolean = false) => {
    const span = Math.abs(calibracion.rangoMax - calibracion.rangoMin);
    const empValor = (span * calibracion.toleranciaPermitidaPct) / 100;
    const cumple = calibracion.errorMaximo <= empValor;
    const conclusion = cumple ? 'CONFORME' : 'NO CONFORME';

    const datosFinales: DatosTecnicosCalibracion = {
      ...calibracion,
      cumpleTolerancia: cumple,
      conclusionGeneral: conclusion,
    };

    let reporteResult: ReporteCertificado;

    if (esEdicion && reporteInicial) {
      reporteResult = storageService.actualizarReporte(
        reporteInicial.id,
        {
          plantillaId,
          tituloReporteEs,
          tituloReporteEn,
          subtituloNormativo,
          codigoFormato,
          versionPlantilla: plantillaSeleccionada?.versionRevision || reporteInicial.versionPlantilla,
          logoIzquierdoUrl: plantillaSeleccionada?.logoIzquierdoUrl || reporteInicial?.logoIzquierdoUrl,
          logoDerechoUrl: plantillaSeleccionada?.logoDerechoUrl || reporteInicial?.logoDerechoUrl,
          colorPrimario: plantillaSeleccionada?.colorPrimario || reporteInicial?.colorPrimario,
          colorSecundario: plantillaSeleccionada?.colorSecundario || reporteInicial?.colorSecundario,
          colorTextoEncabezado: plantillaSeleccionada?.colorTextoEncabezado || reporteInicial?.colorTextoEncabezado,
          clienteId,
          clienteNombre: clienteSeleccionado?.razonSocial || '',
          direccionServicio,
          contratoOC,
          ubicacionServicio,
          equipoId,
          fechaRecepcion,
          fechaPrueba,
          datosCalibracion: datosFinales,
          graficasServicio,
        },
        usuarioActual
      );

      if (enviarARevision && reporteInicial.estado === 'borrador') {
        reporteResult = storageService.cambiarEstadoReporte(
          reporteResult.id,
          'en_revision',
          usuarioActual,
          'Envío a revisión técnica por parte del metrólogo'
        );
      }
    } else {
      reporteResult = storageService.crearBorrador(
        {
          clasificacionCodigo: codigoClasificacion,
          plantillaId,
          tituloReporteEs,
          tituloReporteEn,
          subtituloNormativo,
          codigoFormato,
          versionPlantilla: plantillaSeleccionada?.versionRevision || 'v1.0 (Rev 01)',
          logoIzquierdoUrl: plantillaSeleccionada?.logoIzquierdoUrl,
          logoDerechoUrl: plantillaSeleccionada?.logoDerechoUrl,
          colorPrimario: plantillaSeleccionada?.colorPrimario,
          colorSecundario: plantillaSeleccionada?.colorSecundario,
          colorTextoEncabezado: plantillaSeleccionada?.colorTextoEncabezado,
          clienteId,
          clienteNombre: clienteSeleccionado?.razonSocial || '',
          direccionServicio,
          contratoOC,
          ubicacionServicio,
          equipoId,
          fechaRecepcion,
          fechaPrueba,
          datosCalibracion: datosFinales,
          graficasServicio,
        },
        usuarioActual
      );

      if (enviarARevision) {
        reporteResult = storageService.cambiarEstadoReporte(
          reporteResult.id,
          'en_revision',
          usuarioActual,
          'Envío directo a revisión metrológica tras calibración'
        );
      }
    }

    onGuardado(reporteResult);
  };

  const spanInstrumento = Math.abs(calibracion.rangoMax - calibracion.rangoMin);
  const empCalculado = (spanInstrumento * calibracion.toleranciaPermitidaPct) / 100;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Barra Superior */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between pb-6 mb-6 border-b border-slate-200 gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={onCancelar}
            className="p-2 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 transition cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold text-purple-800 bg-purple-100 px-2 py-0.5 rounded">
                {codigoClasificacion} - CALIBRACIÓN METROLÓGICA ({calibracion.magnitud})
              </span>
              <h2 className="text-xl font-bold text-slate-900">
                {esEdicion
                  ? `Editar Certificado: ${reporteInicial.numeroConsecutivo || reporteInicial.tempId}`
                  : `Nuevo Certificado de Calibración (${calibracion.magnitud})`}
              </h2>
            </div>
            <p className="text-xs text-slate-500">
              Cálculo de errores, histéresis e incertidumbre expandida k=2 bajo ISO/IEC 17025.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto justify-end">
          <button
            onClick={onCancelar}
            className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-50 transition cursor-pointer"
          >
            Cancelar
          </button>

          {!soloLectura && (
            <>
              <button
                onClick={() => handleSubmit(false)}
                className="flex items-center gap-1.5 px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-medium shadow-sm transition cursor-pointer"
              >
                <Save className="w-4 h-4 text-slate-300" />
                <span>Guardar Borrador</span>
              </button>

              <button
                onClick={() => handleSubmit(true)}
                className="flex items-center gap-1.5 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-medium shadow-sm transition cursor-pointer"
              >
                <Send className="w-4 h-4" />
                <span>Guardar y Enviar a Revisión</span>
              </button>
            </>
          )}
        </div>
      </div>

      {soloLectura && (
        <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-3 text-amber-800 text-xs">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
          <span>
            Este certificado se encuentra en estado <strong>{reporteInicial?.estado}</strong> y no admite
            ediciones con el rol actual.
          </span>
        </div>
      )}

      <div className="space-y-6">
        {/* BLOQUE 0: Plantilla y Título Oficial */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 pb-2 border-b border-slate-100 flex items-center gap-2">
            <Gauge className="w-4 h-4 text-purple-600" />
            <span>0. Plantilla Documental y Título Oficial</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Plantilla Metrológica
              </label>
              <select
                disabled={soloLectura}
                value={plantillaId}
                onChange={(e) => handleCambioPlantilla(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-purple-500"
              >
                {plantillasDisponibles.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nombreIdentificador} ({p.codigoFormato})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Código de Formato & Versión
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  disabled={soloLectura}
                  value={codigoFormato}
                  onChange={(e) => setCodigoFormato(e.target.value)}
                  className="w-1/2 px-3 py-2 text-xs border border-slate-300 rounded-lg"
                />
                <input
                  type="text"
                  disabled
                  value={plantillaSeleccionada?.versionRevision || 'v1.0 (Rev 01)'}
                  className="w-1/2 px-3 py-2 text-xs border border-slate-200 bg-slate-50 text-slate-500 rounded-lg"
                />
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Título del Certificado (Español)
              </label>
              <input
                type="text"
                disabled={soloLectura}
                value={tituloReporteEs}
                onChange={(e) => setTituloReporteEs(e.target.value)}
                className="w-full px-3 py-2 text-xs font-semibold border border-slate-300 rounded-lg uppercase"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Título Secundario (Inglés)
              </label>
              <input
                type="text"
                disabled={soloLectura}
                value={tituloReporteEn}
                onChange={(e) => setTituloReporteEn(e.target.value)}
                className="w-full px-3 py-2 text-xs italic border border-slate-300 rounded-lg"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Guía Técnica / Norma Aplicada
              </label>
              <input
                type="text"
                disabled={soloLectura}
                value={subtituloNormativo}
                onChange={(e) => setSubtituloNormativo(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
              />
            </div>
          </div>
        </div>

        {/* BLOQUE 1: Datos Administrativos y Cliente */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 pb-2 border-b border-slate-100">
            1. Información Administrativa & Solicitante
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Cliente / Solicitante</label>
              <select
                disabled={soloLectura}
                value={clienteId}
                onChange={(e) => {
                  setClienteId(e.target.value);
                  const cl = clientes.find((c) => c.id === e.target.value);
                  if (cl) setDireccionServicio(cl.direccion);
                }}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white"
              >
                {clientes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.razonSocial} ({c.identificacion})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Orden de Compra / Solicitud</label>
              <input
                type="text"
                disabled={soloLectura}
                value={contratoOC}
                onChange={(e) => setContratoOC(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Lugar de la Calibración</label>
              <input
                type="text"
                disabled={soloLectura}
                value={ubicacionServicio}
                onChange={(e) => setUbicacionServicio(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-slate-700 mb-1">Dirección del Cliente</label>
              <input
                type="text"
                disabled={soloLectura}
                value={direccionServicio}
                onChange={(e) => setDireccionServicio(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Fecha Recepción</label>
                <input
                  type="date"
                  disabled={soloLectura}
                  value={fechaRecepcion}
                  onChange={(e) => setFechaRecepcion(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Fecha Calibración</label>
                <input
                  type="date"
                  disabled={soloLectura}
                  value={fechaPrueba}
                  onChange={(e) => setFechaPrueba(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                />
              </div>
            </div>
          </div>
        </div>

        {/* BLOQUE 2: Instrumento Bajo Calibración */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 pb-2 border-b border-slate-100">
            2. Instrumento Bajo Calibración (Ítem de Ensayo)
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Tipo de Instrumento</label>
              <input
                type="text"
                disabled={soloLectura}
                value={calibracion.tipoInstrumento}
                onChange={(e) => setCalibracion({ ...calibracion, tipoInstrumento: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg font-semibold"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Fabricante / Marca</label>
              <input
                type="text"
                disabled={soloLectura}
                value={calibracion.fabricante}
                onChange={(e) => setCalibracion({ ...calibracion, fabricante: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Modelo / Referencia</label>
              <input
                type="text"
                disabled={soloLectura}
                value={calibracion.modelo}
                onChange={(e) => setCalibracion({ ...calibracion, modelo: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Número de Serie</label>
              <input
                type="text"
                disabled={soloLectura}
                value={calibracion.numeroSerie}
                onChange={(e) => setCalibracion({ ...calibracion, numeroSerie: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg font-mono font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Tag / Identificación</label>
              <input
                type="text"
                disabled={soloLectura}
                value={calibracion.tagIdentificacion}
                onChange={(e) => setCalibracion({ ...calibracion, tagIdentificacion: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg font-mono font-bold text-blue-700"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Unidad de Medida</label>
              <input
                type="text"
                disabled={soloLectura}
                value={calibracion.unidadMedida}
                onChange={(e) => setCalibracion({ ...calibracion, unidadMedida: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg font-mono"
                placeholder="psi, bar, °C, mA"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Rango Mínimo</label>
              <input
                type="number"
                disabled={soloLectura}
                value={calibracion.rangoMin}
                onChange={(e) => setCalibracion({ ...calibracion, rangoMin: Number(e.target.value) })}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Rango Máximo</label>
              <input
                type="number"
                disabled={soloLectura}
                value={calibracion.rangoMax}
                onChange={(e) => setCalibracion({ ...calibracion, rangoMax: Number(e.target.value) })}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Resolución</label>
              <input
                type="number"
                step="0.001"
                disabled={soloLectura}
                value={calibracion.resolucion}
                onChange={(e) => setCalibracion({ ...calibracion, resolucion: Number(e.target.value) })}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg font-mono"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Tolerancia de Clase / Error Máximo Permitido EMP (% del Span)
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  step="0.1"
                  disabled={soloLectura}
                  value={calibracion.toleranciaPermitidaPct}
                  onChange={(e) =>
                    setCalibracion({ ...calibracion, toleranciaPermitidaPct: Number(e.target.value) })
                  }
                  className="w-32 px-3 py-2 text-xs border border-slate-300 rounded-lg font-mono font-bold"
                />
                <span className="text-xs text-slate-500 font-mono">
                  = ± {empCalculado.toFixed(3)} {calibracion.unidadMedida}
                </span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Medio de Generación</label>
              <input
                type="text"
                disabled={soloLectura}
                value={calibracion.medioGeneracion}
                onChange={(e) => setCalibracion({ ...calibracion, medioGeneracion: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
              />
            </div>
          </div>
        </div>

        {/* Patrones de Calibración Trazables (ISO/IEC 17025) */}
        <PatronesSelector
          patronesSeleccionados={calibracion.equiposPatrones || []}
          onChangePatrones={(nuevosPatrones) =>
            setCalibracion({ ...calibracion, equiposPatrones: nuevosPatrones })
          }
          soloLectura={soloLectura}
        />

        {/* BLOQUE 3: Tabla Multi-Puntos de Calibración con Cálculos en Vivo */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between pb-2 mb-4 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <Calculator className="w-4 h-4 text-purple-600" />
                <span>3. Puntos de Calibración, Errores e Incertidumbre U(k=2)</span>
              </h3>
              <p className="text-xs text-slate-500">
                Ciclo de subida y bajada. El error y la histéresis se calculan automáticamente.
              </p>
            </div>

            {!soloLectura && (
              <button
                type="button"
                onClick={agregarPunto}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200 rounded-lg text-xs font-semibold cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Agregar Punto</span>
              </button>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-700 font-bold border border-slate-300">
                  <th className="p-2 text-center border-r border-slate-200 w-12">Pto.</th>
                  <th className="p-2 border-r border-slate-200">Nominal (%)</th>
                  <th className="p-2 border-r border-slate-200">Patrón ({calibracion.unidadMedida})</th>
                  <th className="p-2 border-r border-slate-200">Subida ({calibracion.unidadMedida})</th>
                  <th className="p-2 border-r border-slate-200">Bajada ({calibracion.unidadMedida})</th>
                  <th className="p-2 border-r border-slate-200 bg-slate-200/50">Error Subida</th>
                  <th className="p-2 border-r border-slate-200 bg-slate-200/50">Error Bajada</th>
                  <th className="p-2 border-r border-slate-200 bg-slate-200/50">Histéresis</th>
                  <th className="p-2 border-r border-slate-200">Incertidumbre U</th>
                  {!soloLectura && <th className="p-2 text-center w-10">Acción</th>}
                </tr>
              </thead>
              <tbody>
                {calibracion.puntos.map((p, idx) => (
                  <tr key={p.id} className="border-b border-slate-200 hover:bg-slate-50">
                    <td className="p-2 text-center font-bold text-slate-500 border-r border-slate-200">
                      #{idx + 1}
                    </td>
                    <td className="p-1.5 border-r border-slate-200">
                      <input
                        type="number"
                        disabled={soloLectura}
                        value={p.nominal}
                        onChange={(e) => actualizarPunto(idx, 'nominal', Number(e.target.value))}
                        className="w-16 px-1.5 py-1 text-xs border border-slate-300 rounded font-mono"
                      />
                    </td>
                    <td className="p-1.5 border-r border-slate-200">
                      <input
                        type="number"
                        step="0.01"
                        disabled={soloLectura}
                        value={p.patron}
                        onChange={(e) => actualizarPunto(idx, 'patron', Number(e.target.value))}
                        className="w-20 px-1.5 py-1 text-xs border border-slate-300 rounded font-mono font-bold"
                      />
                    </td>
                    <td className="p-1.5 border-r border-slate-200">
                      <input
                        type="number"
                        step="0.01"
                        disabled={soloLectura}
                        value={p.lecturaSubida}
                        onChange={(e) => actualizarPunto(idx, 'lecturaSubida', Number(e.target.value))}
                        className="w-20 px-1.5 py-1 text-xs border border-slate-300 rounded font-mono"
                      />
                    </td>
                    <td className="p-1.5 border-r border-slate-200">
                      <input
                        type="number"
                        step="0.01"
                        disabled={soloLectura}
                        value={p.lecturaBajada}
                        onChange={(e) => actualizarPunto(idx, 'lecturaBajada', Number(e.target.value))}
                        className="w-20 px-1.5 py-1 text-xs border border-slate-300 rounded font-mono"
                      />
                    </td>
                    <td className="p-2 border-r border-slate-200 font-mono font-bold text-slate-700 bg-slate-50">
                      {p.errorSubida > 0 ? `+${p.errorSubida}` : p.errorSubida}
                    </td>
                    <td className="p-2 border-r border-slate-200 font-mono font-bold text-slate-700 bg-slate-50">
                      {p.errorBajada > 0 ? `+${p.errorBajada}` : p.errorBajada}
                    </td>
                    <td className="p-2 border-r border-slate-200 font-mono text-slate-700 bg-slate-50">
                      {p.histeresis}
                    </td>
                    <td className="p-1.5 border-r border-slate-200">
                      <input
                        type="number"
                        step="0.001"
                        disabled={soloLectura}
                        value={p.incertidumbreExpandida}
                        onChange={(e) =>
                          actualizarPunto(idx, 'incertidumbreExpandida', Number(e.target.value))
                        }
                        className="w-18 px-1.5 py-1 text-xs border border-slate-300 rounded font-mono"
                      />
                    </td>
                    {!soloLectura && (
                      <td className="p-2 text-center">
                        <button
                          type="button"
                          onClick={() => eliminarPunto(idx)}
                          disabled={calibracion.puntos.length <= 1}
                          className="text-slate-400 hover:text-rose-600 disabled:opacity-30 cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Dictamen Metrológico Resumen */}
          <div
            className={`mt-6 p-4 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
              calibracion.cumpleTolerancia
                ? 'bg-emerald-50 border-emerald-200'
                : 'bg-rose-50 border-rose-200'
            }`}
          >
            <div className="flex items-center gap-3">
              {calibracion.cumpleTolerancia ? (
                <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
              ) : (
                <AlertTriangle className="w-6 h-6 text-rose-600 shrink-0" />
              )}
              <div>
                <span className="text-xs font-bold uppercase tracking-wider block text-slate-700">
                  Dictamen Metrológico de Conformidad
                </span>
                <span className="text-xs text-slate-600">
                  Error Máximo: <strong>{calibracion.errorMaximo} {calibracion.unidadMedida}</strong> | EMP Permisible: <strong>± {empCalculado.toFixed(3)} {calibracion.unidadMedida}</strong> | Incertidumbre Máx: <strong>± {calibracion.incertidumbreGlobal}</strong>
                </span>
              </div>
            </div>

            <span
              className={`px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-wider ${
                calibracion.cumpleTolerancia ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'
              }`}
            >
              {calibracion.conclusionGeneral}
            </span>
          </div>
        </div>

        {/* BLOQUE: Representación Gráfica del Ensayo / Calibración */}
        <GraficasServicioUploader
          graficas={graficasServicio}
          onChange={setGraficasServicio}
          titulosSugeridos={[
            'Curva de Error Instrumental vs Rango de Medición',
            'Banda de Incertidumbre Expandida (k=2)',
          ]}
          maxGraficas={4}
        />

        {/* BLOQUE 4: Observaciones & Declaraciones */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 pb-2 border-b border-slate-100">
            4. Observaciones Técnicas & Declaración de Incertidumbre
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Observaciones y Notas del Metrólogo
              </label>
              <textarea
                disabled={soloLectura}
                rows={3}
                value={calibracion.observaciones}
                onChange={(e) => setCalibracion({ ...calibracion, observaciones: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Declaración Metrológica & Trazabilidad (ISO/IEC 17025)
              </label>
              <textarea
                disabled={soloLectura}
                rows={2}
                value={calibracion.declaraciones}
                onChange={(e) => setCalibracion({ ...calibracion, declaraciones: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg text-slate-600"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
