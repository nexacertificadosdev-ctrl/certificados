import React, { useState } from 'react';
import type {
  Cliente,
  DatosTecnicosValvula,
  EquipoInstrumento,
  ReporteCertificado,
  Usuario,
  GraficaServicio,
} from '../../types';
import { storageService } from '../../services/storageService';
import { Save, Send, ArrowLeft, AlertCircle, CheckCircle, Calculator } from 'lucide-react';
import { PatronesSelector } from './PatronesSelector';
import { GraficasServicioUploader } from '../common/GraficasServicioUploader';

interface ValvulasFormProps {
  reporteInicial?: ReporteCertificado;
  clientes: Cliente[];
  equipos: EquipoInstrumento[];
  usuarioActual: Usuario;
  onGuardado: (reporte: ReporteCertificado) => void;
  onCancelar: () => void;
}

export const ValvulasForm: React.FC<ValvulasFormProps> = ({
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

  // Gestión de Plantilla y Título del Certificado
  const plantillasDisponibles = storageService.getPlantillas();
  const [plantillaId, setPlantillaId] = useState<string>(
    reporteInicial?.plantillaId || 'plan-vt-1'
  );
  const plantillaSeleccionada =
    plantillasDisponibles.find((p) => p.id === plantillaId) || plantillasDisponibles[0];

  const [tituloReporteEs, setTituloReporteEs] = useState<string>(
    reporteInicial?.tituloReporteEs || plantillaSeleccionada?.tituloReporteEs || 'REPORTE DE PRUEBA DE VALVULAS DE SEGURIDAD Y/O ALIVIO'
  );
  const [tituloReporteEn, setTituloReporteEn] = useState<string>(
    reporteInicial?.tituloReporteEn || plantillaSeleccionada?.tituloReporteEn || 'Safety and/or Relief Valve Test Report'
  );
  const [subtituloNormativo, setSubtituloNormativo] = useState<string>(
    reporteInicial?.subtituloNormativo || plantillaSeleccionada?.subtituloNormativo || 'Conforme a Código ASME Sec. VIII Div. 1 & Norma API 527'
  );
  const [codigoFormato, setCodigoFormato] = useState<string>(
    reporteInicial?.codigoFormato || plantillaSeleccionada?.codigoFormato || 'FOR-MET-VT-01'
  );

  // Estado general
  const [clienteId, setClienteId] = useState(reporteInicial?.clienteId || clientes[0]?.id || '');
  const clienteSeleccionado = clientes.find((c) => c.id === clienteId) || clientes[0];

  const [equipoId, setEquipoId] = useState(reporteInicial?.equipoId || equipos[0]?.id || '');
  const equipoSeleccionado = equipos.find((e) => e.id === equipoId) || equipos[0];

  const [direccionServicio, setDireccionServicio] = useState(
    reporteInicial?.direccionServicio || clienteSeleccionado?.direccion || ''
  );
  const [contratoOC, setContratoOC] = useState(reporteInicial?.contratoOC || 'OC-2026-');
  const [ubicacionServicio, setUbicacionServicio] = useState(
    reporteInicial?.ubicacionServicio || 'Taller de Válvulas y Metrología'
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

  // Datos específicos de válvula
  const defaultValvula: DatosTecnicosValvula = reporteInicial?.datosValvula || {
    tipoValvula: equipoSeleccionado?.tipo || 'Válvula de Seguridad y/o Alivio (PSV)',
    fabricante: equipoSeleccionado?.fabricante || 'TECVAL',
    modeloReferencia: equipoSeleccionado?.modelo || 'SAI-M',
    numeroSerie: equipoSeleccionado?.numeroSerie || 'SN-',
    identificacionTag: equipoSeleccionado?.tagIdentificacion || 'PSV-',
    clasificacionPresion: equipoSeleccionado?.clasePresion || '150# ANSI',
    tamanio: equipoSeleccionado?.tamanio || '1 1/2" x 2"',
    materialCuerpo: 'Acero al Carbono A216 WCB',
    materialDisco: 'Acero Inoxidable 316',
    materialAsiento: 'Inconel 625',
    materialVastago: 'Acero Inoxidable 410',
    lugarPrueba: 'Banco de pruebas estático No. 2',
    normaReferencia: 'API 527 / ASME Sec. VIII Div. 1',
    condicionesAmbientales: {
      temperatura: { min: 24.0, max: 26.5, promedio: 25.2 },
      humedadRelativa: { min: 58.0, max: 62.0, promedio: 60.0 },
    },
    equiposAuxiliares: [
      {
        id: 'aux-1',
        nombre: 'Banco de pruebas neumático',
        codigo: 'BP-02',
        fluidoMedio: 'Nitrógeno seco (N2)',
        numeroSerie: 'BPN-5541',
      },
    ],
    equiposPatrones: [
      {
        id: 'pat-1',
        nombre: 'Manómetro Patrón Digital',
        codigo: 'PAT-PR-04',
        certificadoCalibracion: 'CERT-MET-2026-1104',
        fechaCalibracion: '2026-03-12',
        vigencia: '2027-03-12',
      },
      {
        id: 'pat-2',
        nombre: 'Termohigrómetro Digital',
        codigo: 'PAT-TH-02',
        certificadoCalibracion: 'CERT-MET-2026-0899',
        fechaCalibracion: '2026-05-20',
        vigencia: '2027-05-20',
      },
    ],
    declaracionTrazabilidad:
      'Los resultados contenidos en este reporte cuentan con trazabilidad metrológica hacia patrones nacionales e internacionales del Sistema Internacional de Unidades (SI).',
    setPointPsi: 175.0,
    criterioAceptacionPorcentaje: 3.0,
    disparoEncontradoPsi: 177.2,
    disparoAjustadoPsi: 175.0,
    puntoSelloPsi: 160.0,
    blowdownPsi: 155.0,
    cumpleDisparo: true,
    cumpleSello: true,
    conclusionGeneral: 'CONFORME',
    observaciones:
      'Válvula desarmada, inspeccionada y lapeada antes del ensayo de presión final. Se instaló precinto de seguridad numerado.',
    declaraciones:
      'La válvula ensayada cumple con los criterios de hermeticidad y presión de ajuste estipulados por el fabricante y las especificaciones del cliente conforme a norma API 527.',
  };

  const [valvula, setValvula] = useState<DatosTecnicosValvula>(defaultValvula);

  // Cálculos automáticos de metrología
  const setPoint = Number(valvula.setPointPsi) || 175;
  const criterioPct = Number(valvula.criterioAceptacionPorcentaje) || 3;
  const toleranciaPsi = (setPoint * criterioPct) / 100;
  const limiteInferior = setPoint - toleranciaPsi;
  const limiteSuperior = setPoint + toleranciaPsi;

  const disparoAjustado = Number(valvula.disparoAjustadoPsi) || setPoint;
  const cumpleDisparo = disparoAjustado >= limiteInferior && disparoAjustado <= limiteSuperior;
  const cumpleSello = Number(valvula.puntoSelloPsi) >= setPoint * 0.9;
  const conclusionAuto: 'CONFORME' | 'NO CONFORME' = cumpleDisparo && cumpleSello ? 'CONFORME' : 'NO CONFORME';

  const handleClienteChange = (cId: string) => {
    setClienteId(cId);
    const cli = clientes.find((c) => c.id === cId);
    if (cli) {
      setDireccionServicio(cli.direccion);
    }
  };

  const handleEquipoChange = (eId: string) => {
    setEquipoId(eId);
    const eq = equipos.find((e) => e.id === eId);
    if (eq) {
      setValvula((prev) => ({
        ...prev,
        tipoValvula: eq.tipo || prev.tipoValvula,
        fabricante: eq.fabricante || prev.fabricante,
        modeloReferencia: eq.modelo || prev.modeloReferencia,
        numeroSerie: eq.numeroSerie || prev.numeroSerie,
        identificacionTag: eq.tagIdentificacion || prev.identificacionTag,
        tamanio: eq.tamanio || prev.tamanio,
        clasificacionPresion: eq.clasePresion || prev.clasificacionPresion,
      }));
    }
  };

  const handlePlantillaChange = (id: string) => {
    setPlantillaId(id);
    const p = plantillasDisponibles.find((plan) => plan.id === id);
    if (p) {
      setTituloReporteEs(p.tituloReporteEs);
      setTituloReporteEn(p.tituloReporteEn);
      setSubtituloNormativo(p.subtituloNormativo);
      setCodigoFormato(p.codigoFormato);
      setValvula((prev) => ({
        ...prev,
        tipoValvula: p.tipoElemento || prev.tipoValvula,
        normaReferencia: p.subtituloNormativo || prev.normaReferencia,
        declaracionTrazabilidad: p.declaracionTrazabilidadPorDefecto || prev.declaracionTrazabilidad,
        declaraciones: p.declaracionesConformidadPorDefecto || prev.declaraciones,
      }));
    }
  };

  const handleGuardar = (enviarARevision = false) => {
    const datosFinales: DatosTecnicosValvula = {
      ...valvula,
      cumpleDisparo,
      cumpleSello,
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
          datosValvula: datosFinales,
          graficasServicio,
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
          clasificacionCodigo: 'VT',
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
          datosValvula: datosFinales,
          graficasServicio,
        },
        usuarioActual
      );

      if (enviarARevision) {
        reporteResult = storageService.cambiarEstadoReporte(
          reporteResult.id,
          'en_revision',
          usuarioActual,
          'Envío inmediato a revisión'
        );
      }
    }

    onGuardado(reporteResult);
  };

  return (
    <div className="max-w-5xl mx-auto py-6 px-4">
      {/* Barra superior de acciones */}
      <div className="flex items-center justify-between mb-6 bg-white p-4 rounded-xl shadow-xs border border-slate-200">
        <div className="flex items-center gap-3">
          <button
            onClick={onCancelar}
            className="text-slate-500 hover:text-slate-800 p-1.5 rounded-lg hover:bg-slate-100 transition"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              {esEdicion
                ? `Editar Reporte (${reporteInicial.numeroConsecutivo || reporteInicial.tempId})`
                : 'Nuevo Borrador: Prueba de Válvulas de Seguridad y/o Alivio'}
            </h2>
            <p className="text-xs text-slate-500">
              Formulario técnico conforme a plantilla oficial TEST-VT (3 páginas)
            </p>
          </div>
        </div>

        {!soloLectura && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleGuardar(false)}
              className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 transition"
            >
              <Save className="w-4 h-4" />
              <span>Guardar Borrador</span>
            </button>
            <button
              onClick={() => handleGuardar(true)}
              className="flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition shadow-xs"
            >
              <Send className="w-4 h-4" />
              <span>Enviar a Revisión</span>
            </button>
          </div>
        )}
      </div>

      {soloLectura && (
        <div className="mb-4 bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded-lg text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
          <span>
            Este reporte se encuentra en estado <strong>{reporteInicial?.estado.toUpperCase()}</strong>. Los campos técnicos se encuentran bloqueados para edición.
          </span>
        </div>
      )}

      {/* Formulario Modular */}
      <div className="space-y-6">
        {/* BLOQUE 0: PLANTILLA Y TÍTULO DEL CERTIFICADO */}
        <div className="bg-gradient-to-r from-blue-50/70 via-indigo-50/40 to-slate-50 p-6 rounded-xl shadow-xs border border-blue-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-blue-200/60 pb-3 mb-4 gap-2">
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-blue-950 flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span>
                Plantilla & Título Oficial del Certificado
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Selecciona la plantilla preconfigurada según el tipo de válvula o servicio metrológico. Puedes ajustar el título específico para este reporte.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-blue-900">Plantilla Base:</span>
              <select
                disabled={soloLectura}
                value={plantillaId}
                onChange={(e) => handlePlantillaChange(e.target.value)}
                className="text-xs border border-blue-300 rounded-lg px-2.5 py-1.5 bg-white font-medium text-blue-950 focus:ring-2 focus:ring-blue-500"
              >
                {plantillasDisponibles.map((p) => (
                  <option key={p.id} value={p.id}>
                    [{p.clasificacionCodigo}] {p.nombreIdentificador}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Título del Reporte en Español (Se estampa en el encabezado)
              </label>
              <input
                type="text"
                disabled={soloLectura}
                value={tituloReporteEs}
                onChange={(e) => setTituloReporteEs(e.target.value.toUpperCase())}
                className="w-full text-xs font-bold uppercase rounded-lg border border-slate-300 p-2 text-blue-950 bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Título Equivalente en Inglés
              </label>
              <input
                type="text"
                disabled={soloLectura}
                value={tituloReporteEn}
                onChange={(e) => setTituloReporteEn(e.target.value)}
                className="w-full text-xs italic rounded-lg border border-slate-300 p-2 text-slate-700 bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Subtítulo Normativo / Método por Defecto
              </label>
              <input
                type="text"
                disabled={soloLectura}
                value={subtituloNormativo}
                onChange={(e) => setSubtituloNormativo(e.target.value)}
                className="w-full text-xs rounded-lg border border-slate-300 p-2 text-slate-800 bg-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Código de Formato
                </label>
                <input
                  type="text"
                  disabled={soloLectura}
                  value={codigoFormato}
                  onChange={(e) => setCodigoFormato(e.target.value)}
                  className="w-full text-xs font-mono uppercase rounded-lg border border-slate-300 p-2 bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Versión Plantilla
                </label>
                <input
                  type="text"
                  disabled={soloLectura}
                  value={plantillaSeleccionada?.versionRevision || 'v1.0 (Rev 01)'}
                  readOnly
                  className="w-full text-xs font-mono rounded-lg border border-slate-200 p-2 bg-slate-100 text-slate-600"
                />
              </div>
            </div>
          </div>
        </div>

        {/* BLOQUE 1: DATOS DEL SERVICIO Y CLIENTE */}
        <div className="bg-white p-6 rounded-xl shadow-xs border border-slate-200">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800 border-b border-slate-100 pb-2 mb-4 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-blue-600"></span>
            1. Datos del Solicitante y Orden de Servicio
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Cliente / Solicitante</label>
              <select
                disabled={soloLectura}
                value={clienteId}
                onChange={(e) => handleClienteChange(e.target.value)}
                className="w-full text-xs rounded-lg border border-slate-300 p-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                {clientes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.razonSocial} ({c.identificacion})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Contrato / Orden de Compra</label>
              <input
                type="text"
                disabled={soloLectura}
                value={contratoOC}
                onChange={(e) => setContratoOC(e.target.value)}
                className="w-full text-xs rounded-lg border border-slate-300 p-2 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Ubicación del Servicio</label>
              <input
                type="text"
                disabled={soloLectura}
                value={ubicacionServicio}
                onChange={(e) => setUbicacionServicio(e.target.value)}
                className="w-full text-xs rounded-lg border border-slate-300 p-2"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Dirección del Solicitante</label>
              <input
                type="text"
                disabled={soloLectura}
                value={direccionServicio}
                onChange={(e) => setDireccionServicio(e.target.value)}
                className="w-full text-xs rounded-lg border border-slate-300 p-2"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Fecha de Recepción</label>
              <input
                type="date"
                disabled={soloLectura}
                value={fechaRecepcion}
                onChange={(e) => setFechaRecepcion(e.target.value)}
                className="w-full text-xs rounded-lg border border-slate-300 p-2 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Fecha de Ensayo</label>
              <input
                type="date"
                disabled={soloLectura}
                value={fechaPrueba}
                onChange={(e) => setFechaPrueba(e.target.value)}
                className="w-full text-xs rounded-lg border border-slate-300 p-2 font-mono"
              />
            </div>
          </div>
        </div>

        {/* BLOQUE 2: ESPECIFICACIONES DE LA VÁLVULA */}
        <div className="bg-white p-6 rounded-xl shadow-xs border border-slate-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-2 mb-4 gap-2">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-600"></span>
              2. Identificación y Materiales de la Válvula
            </h3>
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-slate-500">Cargar de Catálogo:</span>
              <select
                disabled={soloLectura}
                value={equipoId}
                onChange={(e) => handleEquipoChange(e.target.value)}
                className="text-xs border border-slate-300 rounded px-2 py-1 bg-slate-50 font-medium"
              >
                {equipos.map((eq) => (
                  <option key={eq.id} value={eq.id}>
                    {eq.tagIdentificacion} ({eq.fabricante} {eq.modelo} - {eq.numeroSerie})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Identificación (Tag)</label>
              <input
                type="text"
                disabled={soloLectura}
                value={valvula.identificacionTag}
                onChange={(e) => setValvula({ ...valvula, identificacionTag: e.target.value })}
                className="w-full text-xs rounded-lg border border-slate-300 p-2 font-mono font-bold text-blue-900"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Número de Serie</label>
              <input
                type="text"
                disabled={soloLectura}
                value={valvula.numeroSerie}
                onChange={(e) => setValvula({ ...valvula, numeroSerie: e.target.value })}
                className="w-full text-xs rounded-lg border border-slate-300 p-2 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Fabricante</label>
              <input
                type="text"
                disabled={soloLectura}
                value={valvula.fabricante}
                onChange={(e) => setValvula({ ...valvula, fabricante: e.target.value })}
                className="w-full text-xs rounded-lg border border-slate-300 p-2"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Modelo / Referencia</label>
              <input
                type="text"
                disabled={soloLectura}
                value={valvula.modeloReferencia}
                onChange={(e) => setValvula({ ...valvula, modeloReferencia: e.target.value })}
                className="w-full text-xs rounded-lg border border-slate-300 p-2"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Tamaño (Entrada x Salida)</label>
              <input
                type="text"
                disabled={soloLectura}
                value={valvula.tamanio}
                onChange={(e) => setValvula({ ...valvula, tamanio: e.target.value })}
                className="w-full text-xs rounded-lg border border-slate-300 p-2"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Clase de Presión</label>
              <input
                type="text"
                disabled={soloLectura}
                value={valvula.clasificacionPresion}
                onChange={(e) => setValvula({ ...valvula, clasificacionPresion: e.target.value })}
                className="w-full text-xs rounded-lg border border-slate-300 p-2"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Material Cuerpo</label>
              <input
                type="text"
                disabled={soloLectura}
                value={valvula.materialCuerpo}
                onChange={(e) => setValvula({ ...valvula, materialCuerpo: e.target.value })}
                className="w-full text-xs rounded-lg border border-slate-300 p-2"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Material Asiento / Tobera</label>
              <input
                type="text"
                disabled={soloLectura}
                value={valvula.materialAsiento}
                onChange={(e) => setValvula({ ...valvula, materialAsiento: e.target.value })}
                className="w-full text-xs rounded-lg border border-slate-300 p-2"
              />
            </div>
          </div>
        </div>

        {/* BLOQUE 3: CONDICIONES AMBIENTALES */}
        <div className="bg-white p-6 rounded-xl shadow-xs border border-slate-200">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800 border-b border-slate-100 pb-2 mb-4 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-blue-600"></span>
            3. Condiciones Ambientales de la Prueba
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="border border-slate-200 p-3 rounded-lg">
              <span className="text-xs font-bold text-slate-700 block mb-2">Temperatura (°C)</span>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-[10px] text-slate-500">Mín</label>
                  <input
                    type="number"
                    step="0.1"
                    disabled={soloLectura}
                    value={valvula.condicionesAmbientales.temperatura.min}
                    onChange={(e) =>
                      setValvula({
                        ...valvula,
                        condicionesAmbientales: {
                          ...valvula.condicionesAmbientales,
                          temperatura: {
                            ...valvula.condicionesAmbientales.temperatura,
                            min: Number(e.target.value),
                          },
                        },
                      })
                    }
                    className="w-full text-xs border border-slate-300 p-1.5 rounded font-mono"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-500">Máx</label>
                  <input
                    type="number"
                    step="0.1"
                    disabled={soloLectura}
                    value={valvula.condicionesAmbientales.temperatura.max}
                    onChange={(e) =>
                      setValvula({
                        ...valvula,
                        condicionesAmbientales: {
                          ...valvula.condicionesAmbientales,
                          temperatura: {
                            ...valvula.condicionesAmbientales.temperatura,
                            max: Number(e.target.value),
                          },
                        },
                      })
                    }
                    className="w-full text-xs border border-slate-300 p-1.5 rounded font-mono"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-500">Promedio</label>
                  <input
                    type="number"
                    step="0.1"
                    disabled={soloLectura}
                    value={valvula.condicionesAmbientales.temperatura.promedio}
                    onChange={(e) =>
                      setValvula({
                        ...valvula,
                        condicionesAmbientales: {
                          ...valvula.condicionesAmbientales,
                          temperatura: {
                            ...valvula.condicionesAmbientales.temperatura,
                            promedio: Number(e.target.value),
                          },
                        },
                      })
                    }
                    className="w-full text-xs border border-slate-300 p-1.5 rounded font-mono font-bold"
                  />
                </div>
              </div>
            </div>

            <div className="border border-slate-200 p-3 rounded-lg">
              <span className="text-xs font-bold text-slate-700 block mb-2">Humedad Relativa (% HR)</span>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-[10px] text-slate-500">Mín</label>
                  <input
                    type="number"
                    step="0.1"
                    disabled={soloLectura}
                    value={valvula.condicionesAmbientales.humedadRelativa.min}
                    onChange={(e) =>
                      setValvula({
                        ...valvula,
                        condicionesAmbientales: {
                          ...valvula.condicionesAmbientales,
                          humedadRelativa: {
                            ...valvula.condicionesAmbientales.humedadRelativa,
                            min: Number(e.target.value),
                          },
                        },
                      })
                    }
                    className="w-full text-xs border border-slate-300 p-1.5 rounded font-mono"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-500">Máx</label>
                  <input
                    type="number"
                    step="0.1"
                    disabled={soloLectura}
                    value={valvula.condicionesAmbientales.humedadRelativa.max}
                    onChange={(e) =>
                      setValvula({
                        ...valvula,
                        condicionesAmbientales: {
                          ...valvula.condicionesAmbientales,
                          humedadRelativa: {
                            ...valvula.condicionesAmbientales.humedadRelativa,
                            max: Number(e.target.value),
                          },
                        },
                      })
                    }
                    className="w-full text-xs border border-slate-300 p-1.5 rounded font-mono"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-500">Promedio</label>
                  <input
                    type="number"
                    step="0.1"
                    disabled={soloLectura}
                    value={valvula.condicionesAmbientales.humedadRelativa.promedio}
                    onChange={(e) =>
                      setValvula({
                        ...valvula,
                        condicionesAmbientales: {
                          ...valvula.condicionesAmbientales,
                          humedadRelativa: {
                            ...valvula.condicionesAmbientales.humedadRelativa,
                            promedio: Number(e.target.value),
                          },
                        },
                      })
                    }
                    className="w-full text-xs border border-slate-300 p-1.5 rounded font-mono font-bold"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Patrones de Calibración Trazables (ISO/IEC 17025) */}
        <PatronesSelector
          patronesSeleccionados={valvula.equiposPatrones || []}
          onChangePatrones={(nuevosPatrones) =>
            setValvula({ ...valvula, equiposPatrones: nuevosPatrones })
          }
          soloLectura={soloLectura}
        />

        {/* BLOQUE 4: RESULTADOS TÉCNICOS Y MOTOR DE CÁLCULO */}
        <div className="bg-white p-6 rounded-xl shadow-xs border border-slate-200">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-600"></span>
              4. Resultados Técnicos y Criterios de Aceptación
            </h3>
            <span className="flex items-center gap-1 text-[11px] bg-blue-50 text-blue-700 px-2 py-0.5 rounded font-medium">
              <Calculator className="w-3.5 h-3.5" />
              Cálculo Verificado en Vivo
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Set Point Nominal (PSI)</label>
              <input
                type="number"
                step="0.1"
                disabled={soloLectura}
                value={valvula.setPointPsi}
                onChange={(e) => setValvula({ ...valvula, setPointPsi: Number(e.target.value) })}
                className="w-full text-xs rounded-lg border border-slate-300 p-2 font-mono font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Criterio Tolerancia (± %)</label>
              <input
                type="number"
                step="0.1"
                disabled={soloLectura}
                value={valvula.criterioAceptacionPorcentaje}
                onChange={(e) =>
                  setValvula({ ...valvula, criterioAceptacionPorcentaje: Number(e.target.value) })
                }
                className="w-full text-xs rounded-lg border border-slate-300 p-2 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Disparo Encontrado (PSI)</label>
              <input
                type="number"
                step="0.1"
                disabled={soloLectura}
                value={valvula.disparoEncontradoPsi}
                onChange={(e) =>
                  setValvula({ ...valvula, disparoEncontradoPsi: Number(e.target.value) })
                }
                className="w-full text-xs rounded-lg border border-slate-300 p-2 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Disparo Ajustado Final (PSI)</label>
              <input
                type="number"
                step="0.1"
                disabled={soloLectura}
                value={valvula.disparoAjustadoPsi}
                onChange={(e) =>
                  setValvula({ ...valvula, disparoAjustadoPsi: Number(e.target.value) })
                }
                className="w-full text-xs rounded-lg border-2 border-blue-500 p-2 font-mono font-bold text-blue-900 bg-blue-50/30"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Presión de Sello (PSI)</label>
              <input
                type="number"
                step="0.1"
                disabled={soloLectura}
                value={valvula.puntoSelloPsi}
                onChange={(e) => setValvula({ ...valvula, puntoSelloPsi: Number(e.target.value) })}
                className="w-full text-xs rounded-lg border border-slate-300 p-2 font-mono"
              />
              <span className="text-[10px] text-slate-500">Mínimo sugerido (90%): {(setPoint * 0.9).toFixed(1)} PSI</span>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Presión Reasiento / Blowdown (PSI)</label>
              <input
                type="number"
                step="0.1"
                disabled={soloLectura}
                value={valvula.blowdownPsi}
                onChange={(e) => setValvula({ ...valvula, blowdownPsi: Number(e.target.value) })}
                className="w-full text-xs rounded-lg border border-slate-300 p-2 font-mono"
              />
            </div>
          </div>

          {/* Panel de Validación de Criterios */}
          <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <span className="text-[11px] text-slate-500 block">Rango Aceptable de Disparo</span>
              <span className="text-xs font-mono font-bold text-slate-800">
                [{limiteInferior.toFixed(2)} - {limiteSuperior.toFixed(2)}] PSI
              </span>
            </div>

            <div>
              <span className="text-[11px] text-slate-500 block">Desviación del Disparo Ajustado</span>
              <span className="text-xs font-mono font-bold text-slate-800">
                {(disparoAjustado - setPoint).toFixed(2)} PSI (
                {(((disparoAjustado - setPoint) / setPoint) * 100).toFixed(2)}%)
              </span>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <span className="text-[11px] text-slate-500 block">Conclusión Técnica</span>
                <span
                  className={`text-xs font-bold uppercase px-2 py-0.5 rounded ${
                    conclusionAuto === 'CONFORME'
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-rose-100 text-rose-800'
                  }`}
                >
                  {conclusionAuto}
                </span>
              </div>
              {conclusionAuto === 'CONFORME' ? (
                <CheckCircle className="w-6 h-6 text-emerald-600" />
              ) : (
                <AlertCircle className="w-6 h-6 text-rose-600" />
              )}
            </div>
          </div>
        </div>

        {/* BLOQUE: REPRESENTACIÓN GRÁFICA DEL SERVICIO */}
        <GraficasServicioUploader
          graficas={graficasServicio}
          onChange={setGraficasServicio}
          titulosSugeridos={
            plantillaSeleccionada?.textosSecciones?.titulosGraficasPorDefecto || [
              'Prueba de Sello / Disparo - Entrada',
              'Prueba de Sello / Disparo - Salida',
            ]
          }
          maxGraficas={4}
        />

        {/* BLOQUE 5: OBSERVACIONES Y DECLARACIONES */}
        <div className="bg-white p-6 rounded-xl shadow-xs border border-slate-200">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800 border-b border-slate-100 pb-2 mb-4 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-blue-600"></span>
            5. Observaciones Técnicas y Declaraciones de Conformidad
          </h3>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Observaciones Técnicas</label>
              <textarea
                rows={3}
                disabled={soloLectura}
                value={valvula.observaciones}
                onChange={(e) => setValvula({ ...valvula, observaciones: e.target.value })}
                className="w-full text-xs rounded-lg border border-slate-300 p-2"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Declaraciones de Validez</label>
              <textarea
                rows={2}
                disabled={soloLectura}
                value={valvula.declaraciones}
                onChange={(e) => setValvula({ ...valvula, declaraciones: e.target.value })}
                className="w-full text-xs rounded-lg border border-slate-300 p-2"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
