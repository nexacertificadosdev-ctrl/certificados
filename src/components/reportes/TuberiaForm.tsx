import React, { useState } from 'react';
import type {
  Cliente,
  DatosTecnicosTuberia,
  EquipoInstrumento,
  ReporteCertificado,
  Usuario,
} from '../../types';
import { storageService } from '../../services/storageService';
import { Save, Send, ArrowLeft, CheckCircle2, AlertTriangle, Calculator, Activity } from 'lucide-react';
import { PatronesSelector } from './PatronesSelector';

interface TuberiaFormProps {
  reporteInicial?: ReporteCertificado;
  clientes: Cliente[];
  equipos: EquipoInstrumento[];
  usuarioActual: Usuario;
  onGuardado: (reporte: ReporteCertificado) => void;
  onCancelar: () => void;
}

export const TuberiaForm: React.FC<TuberiaFormProps> = ({
  reporteInicial,
  clientes,
  equipos,
  usuarioActual,
  onGuardado,
  onCancelar,
}) => {
  const esEdicion = !!reporteInicial;
  const soloLectura =
    esEdicion &&
    (reporteInicial.estado === 'emitido' ||
      reporteInicial.estado === 'anulado' ||
      (reporteInicial.estado === 'en_revision' && usuarioActual.rol === 'tecnico'));

  // Plantillas de Tubería
  const plantillasDisponibles = storageService
    .getPlantillas()
    .filter((p) => p.clasificacionCodigo === 'TB');

  const [plantillaId, setPlantillaId] = useState<string>(
    reporteInicial?.plantillaId || plantillasDisponibles[0]?.id || 'plan-tb-1'
  );
  const plantillaSeleccionada =
    plantillasDisponibles.find((p) => p.id === plantillaId) || plantillasDisponibles[0];

  const [tituloReporteEs, setTituloReporteEs] = useState<string>(
    reporteInicial?.tituloReporteEs ||
      plantillaSeleccionada?.tituloReporteEs ||
      'REPORTE DE PRUEBA HIDROSTÁTICA DE TUBERÍA Y SPOOLS'
  );
  const [tituloReporteEn, setTituloReporteEn] = useState<string>(
    reporteInicial?.tituloReporteEn ||
      plantillaSeleccionada?.tituloReporteEn ||
      'Hydrostatic Piping Test Report'
  );
  const [subtituloNormativo, setSubtituloNormativo] = useState<string>(
    reporteInicial?.subtituloNormativo ||
      plantillaSeleccionada?.subtituloNormativo ||
      'Conforme a Código ASME B31.3 (Process Piping) Sección 345.4'
  );
  const [codigoFormato, setCodigoFormato] = useState<string>(
    reporteInicial?.codigoFormato || plantillaSeleccionada?.codigoFormato || 'FOR-MET-TB-01'
  );

  // Cliente y Generales
  const [clienteId, setClienteId] = useState(reporteInicial?.clienteId || clientes[0]?.id || '');
  const clienteSeleccionado = clientes.find((c) => c.id === clienteId) || clientes[0];

  const [equipoId] = useState(reporteInicial?.equipoId || equipos[0]?.id || '');
  const [direccionServicio, setDireccionServicio] = useState(
    reporteInicial?.direccionServicio || clienteSeleccionado?.direccion || ''
  );
  const [contratoOC, setContratoOC] = useState(reporteInicial?.contratoOC || 'OC-TB-2026-088');
  const [ubicacionServicio, setUbicacionServicio] = useState(
    reporteInicial?.ubicacionServicio || 'Planta de Procesos - Área de Facilidades'
  );
  const [fechaRecepcion, setFechaRecepcion] = useState(
    reporteInicial?.fechaRecepcion || new Date().toISOString().split('T')[0]
  );
  const [fechaPrueba, setFechaPrueba] = useState(
    reporteInicial?.fechaPrueba || new Date().toISOString().split('T')[0]
  );

  // Datos Técnicos de Tubería
  const defaultTuberia: DatosTecnicosTuberia = reporteInicial?.datosTuberia || {
    tagSpoolLinea: 'LINE-4"-CW-0012-A1A (Spool #03)',
    isometricoPlano: 'ISO-PL-CW-4002-REV.B',
    diametroNPS: '4" NPS',
    scheduleEspesor: 'SCH 40 (6.02 mm)',
    materialTuberia: 'ASTM A106 Gr. B / Acero al Carbono',
    claseRating: '150# ANSI',
    medioPrueba: 'Agua tratada con inhibidor de corrosión',
    presionDisenoPsi: 285,
    presionPruebaPsi: 428, // 1.5 x Diseño ASME B31.3
    presionAlcanzadaPsi: 430,
    tiempoSostenimientoMinutos: 60,
    temperaturaAmbiente: 28.5,
    temperaturaFluido: 25.2,
    caidaPresionRegistradaPsi: 0.0,
    caidaPresionPermisiblePsi: 0.0,
    inspeccionVisualHermeticidad: 'Ausencia total de fugas o goteos en juntas bridadas y soldaduras a tope. Sin deformación plástica visible.',
    cumplePrueba: true,
    conclusionGeneral: 'CONFORME',
    observaciones: 'Prueba hidrostática ejecutada con presurización escalonada (30%, 60%, 100%) conforme a procedimiento interno PR-TUB-04.',
    declaraciones: 'Los resultados se refieren exclusivamente al ítem ensayado y las condiciones del momento. Documento inmutable emitido bajo trazabilidad metrológica.',
    condicionesAmbientales: {
      temperatura: { min: 26, max: 31, promedio: 28.5 },
      humedadRelativa: { min: 60, max: 75, promedio: 68 },
    },
    equiposPatrones: [
      {
        id: 'pat-1',
        nombre: 'Manómetro Patrón Digital',
        codigo: 'PAT-MPD-01',
        marca: 'Crystal Engineering',
        modelo: 'XP2i',
        serie: 'SN-784410',
        rangoMedida: '0 a 1000 psi',
        resolucion: '0.1 psi',
        incertidumbre: '± 0.05% de lectura',
        certificadoCalibracion: 'CAL-PR-2026-0014',
        fechaCalibracion: '2026-01-10',
        vigencia: '2027-01-10',
      },
      {
        id: 'pat-2',
        nombre: 'Termómetro Digital Trazable',
        codigo: 'PAT-TM-03',
        marca: 'Fluke Calibration',
        modelo: '1551A Ex',
        serie: 'SN-402911',
        rangoMedida: '-50 a 160 °C',
        resolucion: '0.01 °C',
        incertidumbre: '± 0.03 °C',
        certificadoCalibracion: 'CAL-TM-2025-0089',
        fechaCalibracion: '2025-11-20',
        vigencia: '2026-11-20',
      },
    ],
    equiposAuxiliares: [
      {
        id: 'aux-1',
        nombre: 'Bomba Hidrostática de Presurización Neumática',
        codigo: 'BOM-HID-02',
        fluidoMedio: 'Agua / Aire comprimido 100 psi',
        numeroSerie: 'BH-55201',
      },
      {
        id: 'aux-2',
        nombre: 'Registrador Gráfico de Presión y Temperatura',
        codigo: 'CHART-REC-01',
        fluidoMedio: 'Presión Hidrostática',
        numeroSerie: 'CR-88912',
      },
    ],
  };

  const [tuberia, setTuberia] = useState<DatosTecnicosTuberia>(defaultTuberia);

  // Auto cálculo de presión de prueba recomendada (1.5 x Presión de diseño)
  const calcularPresionPruebaSugerida = () => {
    const pDiseno = Number(tuberia.presionDisenoPsi) || 0;
    const sugerida = Math.round(pDiseno * 1.5);
    setTuberia((prev) => ({
      ...prev,
      presionPruebaPsi: sugerida,
      presionAlcanzadaPsi: sugerida,
    }));
  };

  // Validación de cumplimiento
  const cumplePrueba =
    Number(tuberia.presionAlcanzadaPsi) >= Number(tuberia.presionPruebaPsi) &&
    Number(tuberia.caidaPresionRegistradaPsi) <= Number(tuberia.caidaPresionPermisiblePsi);
  const conclusionAuto = cumplePrueba ? 'CONFORME' : 'NO CONFORME';

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
    const datosFinales: DatosTecnicosTuberia = {
      ...tuberia,
      cumplePrueba,
      conclusionGeneral: conclusionAuto,
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
          datosTuberia: datosFinales,
        },
        usuarioActual
      );

      if (enviarARevision && reporteInicial.estado === 'borrador') {
        reporteResult = storageService.cambiarEstadoReporte(
          reporteResult.id,
          'en_revision',
          usuarioActual,
          'Envío a revisión técnica por parte del operador'
        );
      }
    } else {
      reporteResult = storageService.crearBorrador(
        {
          clasificacionCodigo: 'TB',
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
          datosTuberia: datosFinales,
        },
        usuarioActual
      );

      if (enviarARevision) {
        reporteResult = storageService.cambiarEstadoReporte(
          reporteResult.id,
          'en_revision',
          usuarioActual,
          'Envío directo a revisión técnica tras registro inicial'
        );
      }
    }

    onGuardado(reporteResult);
  };

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
              <span className="font-mono text-xs font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
                TB - TUBERÍAS & SPOOLS
              </span>
              <h2 className="text-xl font-bold text-slate-900">
                {esEdicion
                  ? `Editar Reporte: ${reporteInicial.numeroConsecutivo || reporteInicial.tempId}`
                  : 'Nuevo Reporte de Prueba de Tubería'}
              </h2>
            </div>
            <p className="text-xs text-slate-500">
              Ensayos hidrostáticos y neumáticos según ASME B31.3 Sección 345.
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
                className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-medium shadow-sm transition cursor-pointer"
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
            Este reporte se encuentra en estado <strong>{reporteInicial?.estado}</strong> y no admite
            modificaciones con tu rol actual.
          </span>
        </div>
      )}

      <div className="space-y-6">
        {/* BLOQUE 0: Plantilla y Título Oficial */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 pb-2 border-b border-slate-100 flex items-center gap-2">
            <Activity className="w-4 h-4 text-emerald-600" />
            <span>0. Plantilla Documental y Título Oficial</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Plantilla Preconfigurada
              </label>
              <select
                disabled={soloLectura}
                value={plantillaId}
                onChange={(e) => handleCambioPlantilla(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-emerald-500"
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
                Subtítulo Normativo
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
            1. Información Administrativa & Cliente
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
              <label className="block text-xs font-medium text-slate-700 mb-1">Orden de Compra / Contrato</label>
              <input
                type="text"
                disabled={soloLectura}
                value={contratoOC}
                onChange={(e) => setContratoOC(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Lugar del Ensayo</label>
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
                <label className="block text-xs font-medium text-slate-700 mb-1">Fecha de Prueba</label>
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

        {/* BLOQUE 2: Especificaciones del Spool o Línea */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 pb-2 border-b border-slate-100">
            2. Especificaciones de la Línea / Spool
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Tag / Identificación de Línea</label>
              <input
                type="text"
                disabled={soloLectura}
                value={tuberia.tagSpoolLinea}
                onChange={(e) => setTuberia({ ...tuberia, tagSpoolLinea: e.target.value })}
                className="w-full px-3 py-2 text-xs font-semibold border border-slate-300 rounded-lg font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Isométrico / Plano No.</label>
              <input
                type="text"
                disabled={soloLectura}
                value={tuberia.isometricoPlano}
                onChange={(e) => setTuberia({ ...tuberia, isometricoPlano: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Diámetro Nominal (NPS)</label>
              <input
                type="text"
                disabled={soloLectura}
                value={tuberia.diametroNPS}
                onChange={(e) => setTuberia({ ...tuberia, diametroNPS: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                placeholder='Ej. 4" NPS'
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Schedule / Espesor</label>
              <input
                type="text"
                disabled={soloLectura}
                value={tuberia.scheduleEspesor}
                onChange={(e) => setTuberia({ ...tuberia, scheduleEspesor: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                placeholder="SCH 40 / 6.02 mm"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Material de la Tubería</label>
              <input
                type="text"
                disabled={soloLectura}
                value={tuberia.materialTuberia}
                onChange={(e) => setTuberia({ ...tuberia, materialTuberia: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Clase / Rating</label>
              <input
                type="text"
                disabled={soloLectura}
                value={tuberia.claseRating}
                onChange={(e) => setTuberia({ ...tuberia, claseRating: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                placeholder="150# ANSI"
              />
            </div>

            <div className="md:col-span-3">
              <label className="block text-xs font-medium text-slate-700 mb-1">Fluido / Medio de Prueba</label>
              <input
                type="text"
                disabled={soloLectura}
                value={tuberia.medioPrueba}
                onChange={(e) => setTuberia({ ...tuberia, medioPrueba: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                placeholder="Agua tratada con inhibidor de corrosión / Nitrógeno N2"
              />
            </div>
          </div>
        </div>

        {/* Patrones de Calibración Trazables (ISO/IEC 17025) */}
        <PatronesSelector
          patronesSeleccionados={tuberia.equiposPatrones || []}
          onChangePatrones={(nuevosPatrones) =>
            setTuberia({ ...tuberia, equiposPatrones: nuevosPatrones })
          }
          soloLectura={soloLectura}
        />

        {/* BLOQUE 3: Parámetros del Ensayo Hidrostático y Cálculos */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between pb-2 mb-4 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Calculator className="w-4 h-4 text-blue-600" />
              <span>3. Parámetros de Prueba & Hermeticidad (ASME B31.3)</span>
            </h3>
            <button
              type="button"
              onClick={calcularPresionPruebaSugerida}
              disabled={soloLectura}
              className="text-xs bg-blue-50 text-blue-700 hover:bg-blue-100 px-2.5 py-1 rounded border border-blue-200 flex items-center gap-1 cursor-pointer"
            >
              <Calculator className="w-3.5 h-3.5" />
              <span>Auto 1.5 × P. Diseño</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Presión de Diseño (psi)</label>
              <input
                type="number"
                disabled={soloLectura}
                value={tuberia.presionDisenoPsi}
                onChange={(e) => setTuberia({ ...tuberia, presionDisenoPsi: Number(e.target.value) })}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg font-mono font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Presión de Prueba Requerida (psi)</label>
              <input
                type="number"
                disabled={soloLectura}
                value={tuberia.presionPruebaPsi}
                onChange={(e) => setTuberia({ ...tuberia, presionPruebaPsi: Number(e.target.value) })}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg font-mono font-bold text-blue-700"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Presión Alcanzada / Sostenida (psi)</label>
              <input
                type="number"
                disabled={soloLectura}
                value={tuberia.presionAlcanzadaPsi}
                onChange={(e) => setTuberia({ ...tuberia, presionAlcanzadaPsi: Number(e.target.value) })}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg font-mono font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Tiempo de Sostenimiento (min)</label>
              <input
                type="number"
                disabled={soloLectura}
                value={tuberia.tiempoSostenimientoMinutos}
                onChange={(e) => setTuberia({ ...tuberia, tiempoSostenimientoMinutos: Number(e.target.value) })}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Caída de Presión Registrada (psi)</label>
              <input
                type="number"
                step="0.1"
                disabled={soloLectura}
                value={tuberia.caidaPresionRegistradaPsi}
                onChange={(e) => setTuberia({ ...tuberia, caidaPresionRegistradaPsi: Number(e.target.value) })}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Caída Máxima Permisible (psi)</label>
              <input
                type="number"
                step="0.1"
                disabled={soloLectura}
                value={tuberia.caidaPresionPermisiblePsi}
                onChange={(e) => setTuberia({ ...tuberia, caidaPresionPermisiblePsi: Number(e.target.value) })}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Temp. Ambiente (°C)</label>
              <input
                type="number"
                step="0.1"
                disabled={soloLectura}
                value={tuberia.temperaturaAmbiente}
                onChange={(e) => setTuberia({ ...tuberia, temperaturaAmbiente: Number(e.target.value) })}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Temp. Fluido Ensayado (°C)</label>
              <input
                type="number"
                step="0.1"
                disabled={soloLectura}
                value={tuberia.temperaturaFluido}
                onChange={(e) => setTuberia({ ...tuberia, temperaturaFluido: Number(e.target.value) })}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
              />
            </div>

            <div className="md:col-span-4">
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Inspección Visual de Hermeticidad (Juntas Bridadas y Soldaduras)
              </label>
              <input
                type="text"
                disabled={soloLectura}
                value={tuberia.inspeccionVisualHermeticidad}
                onChange={(e) => setTuberia({ ...tuberia, inspeccionVisualHermeticidad: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
              />
            </div>
          </div>

          {/* Panel de Evaluación Automática */}
          <div
            className={`mt-6 p-4 rounded-xl border flex items-center justify-between ${
              cumplePrueba ? 'bg-emerald-50 border-emerald-200' : 'bg-rose-50 border-rose-200'
            }`}
          >
            <div className="flex items-center gap-3">
              {cumplePrueba ? (
                <CheckCircle2 className="w-6 h-6 text-emerald-600" />
              ) : (
                <AlertTriangle className="w-6 h-6 text-rose-600" />
              )}
              <div>
                <span className="text-xs font-bold uppercase tracking-wider block text-slate-700">
                  Dictamen Automatizado de Conformidad
                </span>
                <span className="text-xs text-slate-600">
                  {cumplePrueba
                    ? `Presión sostenida (${tuberia.presionAlcanzadaPsi} psi >= ${tuberia.presionPruebaPsi} psi) sin caída de presión no permitida.`
                    : 'La presión alcanzada es inferior a la requerida o la caída de presión excede la tolerancia permisible.'}
                </span>
              </div>
            </div>

            <span
              className={`px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-wider ${
                cumplePrueba ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'
              }`}
            >
              {conclusionAuto}
            </span>
          </div>
        </div>

        {/* BLOQUE 4: Observaciones & Declaraciones */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 pb-2 border-b border-slate-100">
            4. Observaciones Técnicas & Declaración de Conformidad
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Observaciones y Notas del Ensayo
              </label>
              <textarea
                disabled={soloLectura}
                rows={3}
                value={tuberia.observaciones}
                onChange={(e) => setTuberia({ ...tuberia, observaciones: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Declaración Metrológica & Trazabilidad
              </label>
              <textarea
                disabled={soloLectura}
                rows={2}
                value={tuberia.declaraciones}
                onChange={(e) => setTuberia({ ...tuberia, declaraciones: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg text-slate-600"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
