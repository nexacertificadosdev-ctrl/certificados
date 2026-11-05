// Tipos principales del sistema de gestión de certificados y reportes técnicos

export type RolUsuario = 
  | 'administrador'
  | 'tecnico'
  | 'revisor_tecnico'
  | 'director_tecnico'
  | 'auditor';

export interface Usuario {
  id: string;
  nombre: string;
  email: string;
  cargo: string;
  rol: RolUsuario;
  firmaUrl?: string; // Imagen de la firma subida
  activo?: boolean;
  password?: string; // Credencial hash o contraseña inicial de acceso
}

export type ModuloPermiso = 
  | 'reportes_crear'
  | 'reportes_revisar'
  | 'reportes_aprobar_emitir'
  | 'reportes_anular'
  | 'series_gestionar'
  | 'plantillas_gestionar'
  | 'clientes_gestionar'
  | 'patrones_gestionar'
  | 'auditoria_ver'
  | 'usuarios_gestionar';

export interface PermisoDefinicion {
  id: ModuloPermiso;
  nombre: string;
  descripcion: string;
  categoria: 'Operación & Ensayos' | 'Gestión de Calidad' | 'Configuración Maestra' | 'Seguridad & Auditoría';
}

export type MatrizPermisos = Record<RolUsuario, ModuloPermiso[]>;

export type CodigoClasificacion = 'VT' | 'TB' | 'PR' | 'TM' | 'EL' | (string & {});

export interface Clasificacion {
  id: string;
  codigo: CodigoClasificacion;
  nombre: string;
  descripcion: string;
  activa: boolean;
}

export interface SerieConsecutiva {
  id: string;
  clasificacionCodigo: CodigoClasificacion;
  nombre: string;
  prefijo: string; // ej. "TEST" o "CAL"
  separador: string; // ej. "-"
  longitudDigitos: number; // ej. 4 para 0001
  incluyeAnio: boolean; // true
  reinicioAnual: boolean; // true
  anioVigente: number; // ej. 2026
  ultimoNumero: number; // ej. 32
  activa: boolean;
}

export type EstadoReporte = 
  | 'borrador'
  | 'en_revision'
  | 'devuelto'
  | 'aprobado'
  | 'emitido'
  | 'anulado';

export interface Cliente {
  id: string;
  razonSocial: string;
  identificacion: string;
  direccion: string;
  contacto: string;
  telefono: string;
  email: string;
}

export interface EquipoInstrumento {
  id: string;
  clasificacionCodigo: CodigoClasificacion;
  tipo: string; // Válvula de seguridad, Manómetro, etc.
  fabricante: string;
  modelo: string;
  numeroSerie: string;
  tagIdentificacion: string;
  rangoPresion?: string;
  tamanio?: string;
  clasePresion?: string;
  clienteId: string;
}

export interface EquipoPatron {
  id: string;
  nombre: string;
  codigo: string;
  certificadoCalibracion: string;
  fechaCalibracion: string;
  vigencia: string;
  laboratorioCalibrador?: string;
  marca?: string;
  modelo?: string;
  serie?: string;
  rangoMedida?: string;
  resolucion?: string;
  incertidumbre?: string;
  activo?: boolean;
}

export interface EquipoAuxiliar {
  id: string;
  nombre: string;
  codigo: string;
  fluidoMedio: string;
  numeroSerie: string;
}

export interface CondicionesAmbientales {
  temperatura: {
    min: number;
    max: number;
    promedio: number;
  };
  humedadRelativa: {
    min: number;
    max: number;
    promedio: number;
  };
}

export interface DatosTecnicosValvula {
  tipoValvula: string;
  fabricante: string;
  modeloReferencia: string;
  numeroSerie: string;
  identificacionTag: string;
  clasificacionPresion: string;
  tamanio: string;
  materialCuerpo: string;
  materialDisco: string;
  materialAsiento: string;
  materialVastago: string;
  lugarPrueba: string;
  normaReferencia: string;
  
  condicionesAmbientales: CondicionesAmbientales;
  equiposAuxiliares: EquipoAuxiliar[];
  equiposPatrones: EquipoPatron[];
  declaracionTrazabilidad: string;

  // Resultados técnicos
  setPointPsi: number;
  criterioAceptacionPorcentaje: number; // Ej. +- 3%
  disparoEncontradoPsi: number;
  disparoAjustadoPsi: number;
  puntoSelloPsi: number;
  blowdownPsi: number;
  
  cumpleDisparo: boolean;
  cumpleSello: boolean;
  conclusionGeneral: 'CONFORME' | 'NO CONFORME';

  observaciones: string;
  declaraciones: string;
}

export interface PuntoCalibracion {
  id: string;
  nominal: number;
  patron: number;
  lecturaSubida: number;
  lecturaBajada: number;
  errorSubida: number;
  errorBajada: number;
  histeresis: number;
  incertidumbreExpandida: number; // k=2
}

export interface DatosTecnicosTuberia {
  tagSpoolLinea: string;
  isometricoPlano: string;
  diametroNPS: string;
  scheduleEspesor: string;
  materialTuberia: string;
  claseRating: string;
  medioPrueba: string; // ej. "Agua tratada (Hidrostática)" o "Nitrógeno N2"
  presionDisenoPsi: number;
  presionPruebaPsi: number;
  presionAlcanzadaPsi: number;
  tiempoSostenimientoMinutos: number;
  temperaturaAmbiente: number;
  temperaturaFluido: number;
  caidaPresionRegistradaPsi: number;
  caidaPresionPermisiblePsi: number;
  inspeccionVisualHermeticidad: string;
  cumplePrueba: boolean;
  conclusionGeneral: 'CONFORME' | 'NO CONFORME';
  observaciones: string;
  declaraciones: string;
  condicionesAmbientales: CondicionesAmbientales;
  equiposPatrones: EquipoPatron[];
  equiposAuxiliares: EquipoAuxiliar[];
}

export interface DatosTecnicosCalibracion {
  magnitud: 'Presión' | 'Temperatura' | 'Magnitudes Eléctricas';
  tipoInstrumento: string;
  fabricante: string;
  modelo: string;
  numeroSerie: string;
  tagIdentificacion: string;
  rangoMin: number;
  rangoMax: number;
  unidadMedida: string;
  resolucion: number;
  toleranciaPermitidaPct: number; // Error Máximo Permitido (EMP) en %
  normaMetodo: string;
  medioGeneracion: string;
  condicionesAmbientales: CondicionesAmbientales;
  equiposPatrones: EquipoPatron[];
  puntos: PuntoCalibracion[];
  errorMaximo: number;
  incertidumbreGlobal: number;
  cumpleTolerancia: boolean;
  conclusionGeneral: 'CONFORME' | 'NO CONFORME';
  observaciones: string;
  declaraciones: string;
}


export interface HistorialTransicion {
  id: string;
  estadoAnterior: EstadoReporte | null;
  estadoNuevo: EstadoReporte;
  usuarioId: string;
  usuarioNombre: string;
  rolUsuario: RolUsuario;
  fecha: string;
  observaciones?: string;
}

export interface GraficaServicio {
  id: string;
  titulo: string; // ej. "Prueba de Sello / Disparo - Entrada"
  imagenUrl: string; // Data URL en memoria para el PDF o URL remota
  subtitulo?: string; // ej. "Curva Presión (psi) vs Tiempo (seg)"
  pieGrafica?: string;
  anchoPorcentaje?: number;
}

export interface SeccionesVisiblesPlantilla {
  datosSolicitante?: boolean;
  datosEquipo?: boolean;
  condicionesAmbientales?: boolean;
  equiposAuxiliares?: boolean;
  documentoNormativo?: boolean;
  trazabilidadMetrologica?: boolean;
  resultadosPrueba?: boolean;
  graficasServicio?: boolean;
  observaciones?: boolean;
  firmas?: boolean;
}

export interface TextosSeccionesPlantilla {
  tituloSolicitante?: string;
  tituloEquipo?: string;
  tituloCondiciones?: string;
  tituloAuxiliares?: string;
  tituloNormativo?: string;
  contenidoNormativo?: string;
  tituloTrazabilidad?: string;
  contenidoTrazabilidad?: string;
  tituloResultados?: string;
  tituloGraficas?: string;
  titulosGraficasPorDefecto?: string[];
  tituloObservaciones?: string;
  contenidoObservaciones?: string;
  tituloAutorizacion?: string;
  cargoAutorizador?: string;
  textoFinReporte?: string;
}

export interface PlantillaDocumental {
  id: string;
  clasificacionCodigo: CodigoClasificacion;
  nombreIdentificador: string;
  tipoElemento: string; // ej. "Válvulas de Seguridad y/o Alivio", "Válvulas On/Off", "Válvulas de Control", etc.
  tituloReporteEs: string; // ej. "REPORTE DE PRUEBA DE VALVULAS DE CONTROL"
  tituloReporteEn: string; // ej. "Control Valve Test Report"
  subtituloNormativo: string; // ej. "Conforme a Norma ANSI/FCI 70-2 / IEC 60534-4"
  codigoFormato: string; // ej. "FOR-PCC-274" o "FOR-MET-VT-01"
  versionRevision: string; // ej. "Vr: 01" o "v1.0 (Rev 03)"
  fechaFormato?: string; // ej. "24/03/2026"
  declaracionTrazabilidadPorDefecto?: string;
  declaracionesConformidadPorDefecto?: string;
  logoIzquierdoUrl?: string;
  logoDerechoUrl?: string;
  colorPrimario?: string;
  colorSecundario?: string;
  colorTextoEncabezado?: string;
  activa: boolean;
  seccionesVisibles?: SeccionesVisiblesPlantilla;
  textosSecciones?: TextosSeccionesPlantilla;
}

export interface ReporteCertificado {
  id: string;
  tempId: string; // ej. BORR-001
  numeroConsecutivo?: string; // ej. TEST-VT-2026-0001 (asignado al aprobar/emitir)
  clasificacionCodigo: CodigoClasificacion;
  estado: EstadoReporte;
  plantillaId?: string;
  tituloReporteEs?: string;
  tituloReporteEn?: string;
  subtituloNormativo?: string;
  codigoFormato?: string;
  versionPlantilla: string;
  logoIzquierdoUrl?: string;
  logoDerechoUrl?: string;
  colorPrimario?: string;
  colorSecundario?: string;
  colorTextoEncabezado?: string;
  
  clienteId: string;
  clienteNombre: string;
  direccionServicio: string;
  contratoOC: string;

  ubicacionServicio: string;

  equipoId: string;
  
  fechaRecepcion: string;
  fechaPrueba: string;
  fechaEmision?: string;
  
  creadoPor: Usuario;
  revisadoPor?: Usuario;
  aprobadoPor?: Usuario;
  
  datosValvula?: DatosTecnicosValvula;
  datosTuberia?: DatosTecnicosTuberia;
  datosCalibracion?: DatosTecnicosCalibracion;
  
  graficasServicio?: GraficaServicio[];
  fechaFormato?: string;
  
  transiciones: HistorialTransicion[];
  pdfGeneradoUrl?: string;
  googleDriveUrl?: string;
  esHistorico?: boolean;
  nombreArchivoOriginal?: string;
  hashSha256?: string;
  motivoAnulacion?: string;
  createdAt: string;
  updatedAt: string;
}

export interface RegistroAuditoria {
  id: string;
  usuarioId: string;
  usuarioNombre: string;
  rol: RolUsuario;
  accion: 'CREAR' | 'MODIFICAR' | 'ENVIAR_REVISION' | 'DEVOLVER' | 'APROBAR' | 'EMITIR' | 'ANULAR' | 'CONFIGURACION';
  entidad: 'reporte' | 'serie' | 'cliente' | 'equipo' | 'plantilla' | 'usuario' | 'permisos';
  entidadId: string;
  detalles: string;
  valoresPrevios?: any;
  valoresNuevos?: any;
  fechaHora: string;
}
