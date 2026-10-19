import type {
  Clasificacion,
  Cliente,
  CodigoClasificacion,
  EquipoInstrumento,
  EstadoReporte,
  PlantillaDocumental,
  RegistroAuditoria,
  ReporteCertificado,
  SerieConsecutiva,
  Usuario,
  EquipoPatron,
} from '../types';
import {
  CLASIFICACIONES_INICIALES,
  CLIENTES_INICIALES,
  EQUIPOS_INICIALES,
  PATRONES_INICIALES,
  PLANTILLAS_INICIALES,
  REPORTES_INICIALES,
  SERIES_INICIALES,
  USUARIOS_INICIALES,
} from './mockData';
import {
  DEFAULT_LOGO_IZQUIERDO,
  DEFAULT_LOGO_DERECHO,
  DEFAULT_COLOR_PRIMARIO,
  DEFAULT_COLOR_SECUNDARIO,
  DEFAULT_COLOR_TEXTO,
} from '../utils/themeDefaults';
import { supabaseService } from './supabaseService';

const STORAGE_KEYS = {
  REPORTES: 'cert_reportes_v1',
  SERIES: 'cert_series_v1',
  CLIENTES: 'cert_clientes_v1',
  EQUIPOS: 'cert_equipos_v1',
  PATRONES: 'cert_patrones_v1',
  PLANTILLAS: 'cert_plantillas_v1',
  AUDITORIA: 'cert_auditoria_v1',
  USUARIO_ACTUAL: 'cert_usuario_actual_v1',
};

class StorageService {
  private get<T>(key: string, defaultValue: T): T {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch {
      return defaultValue;
    }
  }

  private set<T>(key: string, value: T): void {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.error('Error guardando en localStorage:', e);
    }
  }

  // Inicialización de datos
  public init(): void {
    if (!localStorage.getItem(STORAGE_KEYS.SERIES)) {
      this.set(STORAGE_KEYS.SERIES, SERIES_INICIALES);
    }
    if (!localStorage.getItem(STORAGE_KEYS.CLIENTES)) {
      this.set(STORAGE_KEYS.CLIENTES, CLIENTES_INICIALES);
    }
    if (!localStorage.getItem(STORAGE_KEYS.EQUIPOS)) {
      this.set(STORAGE_KEYS.EQUIPOS, EQUIPOS_INICIALES);
    }
    if (!localStorage.getItem(STORAGE_KEYS.PATRONES)) {
      this.set(STORAGE_KEYS.PATRONES, PATRONES_INICIALES);
    }
    if (!localStorage.getItem(STORAGE_KEYS.PLANTILLAS)) {
      this.set(STORAGE_KEYS.PLANTILLAS, PLANTILLAS_INICIALES);
    }
    if (!localStorage.getItem(STORAGE_KEYS.REPORTES)) {
      this.set(STORAGE_KEYS.REPORTES, REPORTES_INICIALES);
    }
    if (!localStorage.getItem(STORAGE_KEYS.AUDITORIA)) {
      const auditInicial: RegistroAuditoria[] = [
        {
          id: 'aud-0',
          usuarioId: 'usr-4',
          usuarioNombre: 'Administrador General',
          rol: 'administrador',
          accion: 'CONFIGURACION',
          entidad: 'serie',
          entidadId: 'ser-1',
          detalles: 'Inicialización de series documentales y clasificaciones para el año 2026.',
          fechaHora: new Date().toISOString(),
        },
      ];
      this.set(STORAGE_KEYS.AUDITORIA, auditInicial);
    }
    if (!localStorage.getItem(STORAGE_KEYS.USUARIO_ACTUAL)) {
      this.set(STORAGE_KEYS.USUARIO_ACTUAL, USUARIOS_INICIALES[0]); // Por defecto Técnico
    }

    // Sincronización asíncrona con Supabase en segundo plano si está configurado
    this.sincronizarConNube().catch(() => {});
  }

  public async sincronizarConNube(): Promise<boolean> {
    try {
      const nube = await supabaseService.sincronizarDesdeNube();
      if (!nube) return false;

      if (nube.plantillas && nube.plantillas.length > 0) {
        this.set(STORAGE_KEYS.PLANTILLAS, nube.plantillas);
      }
      if (nube.series && nube.series.length > 0) {
        this.set(STORAGE_KEYS.SERIES, nube.series);
      }
      if (nube.clientes && nube.clientes.length > 0) {
        this.set(STORAGE_KEYS.CLIENTES, nube.clientes);
      }
      if (nube.reportes && nube.reportes.length > 0) {
        this.set(STORAGE_KEYS.REPORTES, nube.reportes);
      }
      if (nube.auditoria && nube.auditoria.length > 0) {
        this.set(STORAGE_KEYS.AUDITORIA, nube.auditoria);
      }
      return true;
    } catch {
      return false;
    }
  }

  // Usuario actual
  public getUsuarioActual(): Usuario {
    return this.get<Usuario>(STORAGE_KEYS.USUARIO_ACTUAL, USUARIOS_INICIALES[0]);
  }

  public setUsuarioActual(usuario: Usuario): void {
    this.set(STORAGE_KEYS.USUARIO_ACTUAL, usuario);
  }

  public getUsuarios(): Usuario[] {
    return USUARIOS_INICIALES;
  }

  public actualizarFirmaUsuario(usuarioId: string, firmaUrl: string): void {
    const usuarioActual = this.getUsuarioActual();
    if (usuarioActual.id === usuarioId) {
      usuarioActual.firmaUrl = firmaUrl;
      this.setUsuarioActual(usuarioActual);
    }
    const idx = USUARIOS_INICIALES.findIndex(u => u.id === usuarioId);
    if (idx !== -1) {
      USUARIOS_INICIALES[idx].firmaUrl = firmaUrl;
    }
    supabaseService.actualizarFirmaEnNube(usuarioId, firmaUrl).catch(() => {});
  }

  // Clasificaciones
  public getClasificaciones(): Clasificacion[] {
    return CLASIFICACIONES_INICIALES;
  }

  // Clientes
  public getClientes(): Cliente[] {
    return this.get<Cliente[]>(STORAGE_KEYS.CLIENTES, CLIENTES_INICIALES);
  }

  public guardarCliente(cliente: Cliente): void {
    const clientes = this.getClientes();
    const index = clientes.findIndex(c => c.id === cliente.id);
    if (index >= 0) {
      clientes[index] = cliente;
    } else {
      clientes.push(cliente);
    }
    this.set(STORAGE_KEYS.CLIENTES, clientes);
    supabaseService.guardarClienteEnNube(cliente).catch(() => {});
  }

  public eliminarCliente(clienteId: string): void {
    const clientes = this.getClientes().filter(c => c.id !== clienteId);
    this.set(STORAGE_KEYS.CLIENTES, clientes);
    supabaseService.eliminarClienteEnNube(clienteId).catch(() => {});
  }

  // Equipos
  public getEquipos(): EquipoInstrumento[] {
    return this.get<EquipoInstrumento[]>(STORAGE_KEYS.EQUIPOS, EQUIPOS_INICIALES);
  }

  public getEquiposPorCliente(clienteId: string): EquipoInstrumento[] {
    return this.getEquipos().filter(e => e.clienteId === clienteId);
  }

  public guardarEquipo(equipo: EquipoInstrumento): void {
    const equipos = this.getEquipos();
    const index = equipos.findIndex(e => e.id === equipo.id);
    if (index >= 0) {
      equipos[index] = equipo;
    } else {
      equipos.push(equipo);
    }
    this.set(STORAGE_KEYS.EQUIPOS, equipos);
    supabaseService.guardarEquipoEnNube(equipo).catch(() => {});
  }

  public eliminarEquipo(equipoId: string): void {
    const equipos = this.getEquipos().filter(e => e.id !== equipoId);
    this.set(STORAGE_KEYS.EQUIPOS, equipos);
    supabaseService.eliminarEquipoEnNube(equipoId).catch(() => {});
  }

  // Patrones Metrológicos Trazables (ISO 17025)
  public getPatrones(): EquipoPatron[] {
    return this.get<EquipoPatron[]>(STORAGE_KEYS.PATRONES, PATRONES_INICIALES);
  }

  public guardarPatron(patron: EquipoPatron): void {
    const patrones = this.getPatrones();
    const index = patrones.findIndex(p => p.id === patron.id);
    if (index >= 0) {
      patrones[index] = patron;
    } else {
      patrones.push(patron);
    }
    this.set(STORAGE_KEYS.PATRONES, patrones);
  }

  public eliminarPatron(patronId: string): void {
    const patrones = this.getPatrones().filter(p => p.id !== patronId);
    this.set(STORAGE_KEYS.PATRONES, patrones);
  }

  // Series y asignación de consecutivos (Atómica y con reinicio anual)
  public getSeries(): SerieConsecutiva[] {
    return this.get<SerieConsecutiva[]>(STORAGE_KEYS.SERIES, SERIES_INICIALES);
  }

  public guardarSerie(serie: SerieConsecutiva): void {
    const series = this.getSeries();
    const index = series.findIndex(s => s.id === serie.id);
    if (index >= 0) {
      series[index] = serie;
    } else {
      series.push(serie);
    }
    this.set(STORAGE_KEYS.SERIES, series);
    supabaseService.guardarSerieEnNube(serie).catch(() => {});
  }

  // Plantillas documentales y configuración de títulos
  public getPlantillas(): PlantillaDocumental[] {
    const list = this.get<PlantillaDocumental[]>(STORAGE_KEYS.PLANTILLAS, PLANTILLAS_INICIALES);
    return list.map((p) => ({
      ...p,
      logoIzquierdoUrl: p.logoIzquierdoUrl || DEFAULT_LOGO_IZQUIERDO,
      logoDerechoUrl: p.logoDerechoUrl || DEFAULT_LOGO_DERECHO,
      colorPrimario: p.colorPrimario || DEFAULT_COLOR_PRIMARIO,
      colorSecundario: p.colorSecundario || DEFAULT_COLOR_SECUNDARIO,
      colorTextoEncabezado: p.colorTextoEncabezado || DEFAULT_COLOR_TEXTO,
    }));
  }

  public getPlantillasPorClasificacion(codigo: CodigoClasificacion): PlantillaDocumental[] {
    return this.getPlantillas().filter(p => p.clasificacionCodigo === codigo && p.activa);
  }

  public guardarPlantilla(plantilla: PlantillaDocumental, usuario?: Usuario): void {
    const plantillas = this.getPlantillas();
    const index = plantillas.findIndex(p => p.id === plantilla.id);
    const esNueva = index === -1;
    if (index >= 0) {
      plantillas[index] = plantilla;
    } else {
      plantillas.push(plantilla);
    }
    this.set(STORAGE_KEYS.PLANTILLAS, plantillas);
    supabaseService.guardarPlantillaEnNube(plantilla).catch(() => {});

    if (usuario) {
      this.registrarAuditoria({
        usuarioId: usuario.id,
        usuarioNombre: usuario.nombre,
        rol: usuario.rol,
        accion: 'CONFIGURACION',
        entidad: 'plantilla',
        entidadId: plantilla.id,
        detalles: `${esNueva ? 'Creación' : 'Actualización'} de plantilla "${plantilla.nombreIdentificador}" - Título: ${plantilla.tituloReporteEs}`,
      });
    }
  }

  public eliminarPlantilla(id: string, usuario?: Usuario): void {
    const plantillas = this.getPlantillas();
    const target = plantillas.find(p => p.id === id);
    const nuevas = plantillas.filter(p => p.id !== id);
    this.set(STORAGE_KEYS.PLANTILLAS, nuevas);

    if (usuario && target) {
      this.registrarAuditoria({
        usuarioId: usuario.id,
        usuarioNombre: usuario.nombre,
        rol: usuario.rol,
        accion: 'CONFIGURACION',
        entidad: 'plantilla',
        entidadId: id,
        detalles: `Eliminación de plantilla "${target.nombreIdentificador}"`,
      });
    }
  }


  /**
   * Genera el siguiente consecutivo oficial de forma controlada y única.
   * Regla: [PREFIJO]-[CODIGO]-[AÑO]-[NUMERO_FORMATEADO]
   * Aplica reinicio a 1 si ha cambiado de año calendario y tiene reinicioAnual = true.
   */
  public asignarSiguienteConsecutivo(clasificacionCodigo: CodigoClasificacion): string {
    const series = this.getSeries();
    const serieIndex = series.findIndex(s => s.clasificacionCodigo === clasificacionCodigo && s.activa);
    
    if (serieIndex === -1) {
      throw new Error(`No existe una serie consecutiva activa para la clasificación ${clasificacionCodigo}`);
    }

    const serie = series[serieIndex];
    const anioActual = new Date().getFullYear();

    // Verificación de reinicio anual
    if (serie.reinicioAnual && serie.anioVigente !== anioActual) {
      serie.anioVigente = anioActual;
      serie.ultimoNumero = 0; // Reinicia a 0 para que el próximo sea 1
    }

    // Incrementar de forma atómica
    const proximoNumero = serie.ultimoNumero + 1;
    serie.ultimoNumero = proximoNumero;
    series[serieIndex] = serie;
    this.set(STORAGE_KEYS.SERIES, series);

    // Formatear con ceros a la izquierda
    const numeroStr = String(proximoNumero).padStart(serie.longitudDigitos, '0');
    
    let consecutivoFinal = `${serie.prefijo}${serie.separador}${serie.clasificacionCodigo}`;
    if (serie.incluyeAnio) {
      consecutivoFinal += `${serie.separador}${serie.anioVigente}`;
    }
    consecutivoFinal += `${serie.separador}${numeroStr}`;

    return consecutivoFinal;
  }

  // Reportes
  public getReportes(): ReporteCertificado[] {
    const list = this.get<ReporteCertificado[]>(STORAGE_KEYS.REPORTES, REPORTES_INICIALES);
    return list.map((r) => ({
      ...r,
      logoIzquierdoUrl: r.logoIzquierdoUrl || DEFAULT_LOGO_IZQUIERDO,
      logoDerechoUrl: r.logoDerechoUrl || DEFAULT_LOGO_DERECHO,
      colorPrimario: r.colorPrimario || DEFAULT_COLOR_PRIMARIO,
      colorSecundario: r.colorSecundario || DEFAULT_COLOR_SECUNDARIO,
      colorTextoEncabezado: r.colorTextoEncabezado || DEFAULT_COLOR_TEXTO,
    }));
  }

  public getReporteById(id: string): ReporteCertificado | undefined {
    return this.getReportes().find(r => r.id === id);
  }

  public crearBorrador(
    reporteData: Partial<ReporteCertificado>,
    usuario: Usuario
  ): ReporteCertificado {
    const reportes = this.getReportes();
    const nuevoId = `rep-${Date.now()}`;
    const tempCount = reportes.filter(r => r.tempId.startsWith('BORR-')).length + 1;
    const tempId = `BORR-${String(tempCount).padStart(3, '0')}`;

    const clasificacion = reporteData.clasificacionCodigo || 'VT';
    const plantillasDisponibles = this.getPlantillasPorClasificacion(clasificacion);
    const plantillaElegida =
      plantillasDisponibles.find((p) => p.id === reporteData.plantillaId) ||
      plantillasDisponibles[0] ||
      PLANTILLAS_INICIALES[0];

    const nuevoReporte: ReporteCertificado = {
      id: nuevoId,
      tempId,
      clasificacionCodigo: clasificacion,
      estado: 'borrador',
      plantillaId: reporteData.plantillaId || plantillaElegida.id,
      tituloReporteEs: reporteData.tituloReporteEs || plantillaElegida.tituloReporteEs,
      tituloReporteEn: reporteData.tituloReporteEn || plantillaElegida.tituloReporteEn,
      subtituloNormativo: reporteData.subtituloNormativo || plantillaElegida.subtituloNormativo,
      codigoFormato: reporteData.codigoFormato || plantillaElegida.codigoFormato,
      versionPlantilla: reporteData.versionPlantilla || plantillaElegida.versionRevision,
      logoIzquierdoUrl: reporteData.logoIzquierdoUrl || plantillaElegida.logoIzquierdoUrl || DEFAULT_LOGO_IZQUIERDO,
      logoDerechoUrl: reporteData.logoDerechoUrl || plantillaElegida.logoDerechoUrl || DEFAULT_LOGO_DERECHO,
      colorPrimario: reporteData.colorPrimario || plantillaElegida.colorPrimario || DEFAULT_COLOR_PRIMARIO,
      colorSecundario: reporteData.colorSecundario || plantillaElegida.colorSecundario || DEFAULT_COLOR_SECUNDARIO,
      colorTextoEncabezado: reporteData.colorTextoEncabezado || plantillaElegida.colorTextoEncabezado || DEFAULT_COLOR_TEXTO,
      clienteId: reporteData.clienteId || '',
      clienteNombre: reporteData.clienteNombre || '',
      direccionServicio: reporteData.direccionServicio || '',
      contratoOC: reporteData.contratoOC || '',
      ubicacionServicio: reporteData.ubicacionServicio || '',
      equipoId: reporteData.equipoId || '',
      fechaRecepcion: reporteData.fechaRecepcion || new Date().toISOString().split('T')[0],
      fechaPrueba: reporteData.fechaPrueba || new Date().toISOString().split('T')[0],
      creadoPor: usuario,
      datosValvula: reporteData.datosValvula,
      transiciones: [
        {
          id: `tr-${Date.now()}`,
          estadoAnterior: null,
          estadoNuevo: 'borrador',
          usuarioId: usuario.id,
          usuarioNombre: usuario.nombre,
          rolUsuario: usuario.rol,
          fecha: new Date().toLocaleString(),
          observaciones: 'Creación de borrador de reporte.',
        },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    reportes.unshift(nuevoReporte);
    this.set(STORAGE_KEYS.REPORTES, reportes);
    supabaseService.guardarReporteEnNube(nuevoReporte).catch(() => {});

    this.registrarAuditoria({
      usuarioId: usuario.id,
      usuarioNombre: usuario.nombre,
      rol: usuario.rol,
      accion: 'CREAR',
      entidad: 'reporte',
      entidadId: nuevoReporte.id,
      detalles: `Creación de borrador técnico temporal ${tempId}.`,
    });

    return nuevoReporte;
  }

  public actualizarReporte(
    reporteId: string,
    cambios: Partial<ReporteCertificado>,
    usuario: Usuario
  ): ReporteCertificado {
    const reportes = this.getReportes();
    const index = reportes.findIndex(r => r.id === reporteId);
    if (index === -1) throw new Error('Reporte no encontrado');

    const actual = reportes[index];
    if (actual.estado === 'emitido' || actual.estado === 'anulado') {
      throw new Error('No se pueden modificar reportes en estado emitido o anulado.');
    }

    const reporteActualizado: ReporteCertificado = {
      ...actual,
      ...cambios,
      updatedAt: new Date().toISOString(),
    };

    reportes[index] = reporteActualizado;
    this.set(STORAGE_KEYS.REPORTES, reportes);
    supabaseService.guardarReporteEnNube(reporteActualizado).catch(() => {});

    this.registrarAuditoria({
      usuarioId: usuario.id,
      usuarioNombre: usuario.nombre,
      rol: usuario.rol,
      accion: 'MODIFICAR',
      entidad: 'reporte',
      entidadId: reporteId,
      detalles: `Actualización de datos del reporte ${actual.numeroConsecutivo || actual.tempId}.`,
    });

    return reporteActualizado;
  }

  /**
   * Transición de estados con reglas de negocio estrictas
   */
  public cambiarEstadoReporte(
    reporteId: string,
    nuevoEstado: EstadoReporte,
    usuario: Usuario,
    observaciones?: string
  ): ReporteCertificado {
    const reportes = this.getReportes();
    const index = reportes.findIndex(r => r.id === reporteId);
    if (index === -1) throw new Error('Reporte no encontrado');

    const reporte = reportes[index];
    const estadoAnterior = reporte.estado;

    // Validaciones de transición según roles
    if (nuevoEstado === 'en_revision' && !['borrador', 'devuelto'].includes(estadoAnterior)) {
      throw new Error('Solo se puede enviar a revisión desde borrador o devuelto.');
    }

    if (nuevoEstado === 'devuelto') {
      if (!observaciones || observaciones.trim().length === 0) {
        throw new Error('Es obligatorio registrar los motivos u observaciones para devolver el reporte.');
      }
      if (!['revisor_tecnico', 'director_tecnico', 'administrador'].includes(usuario.rol)) {
        throw new Error('No tienes permisos para devolver reportes.');
      }
    }

    if (nuevoEstado === 'aprobado') {
      if (!['revisor_tecnico', 'director_tecnico', 'administrador'].includes(usuario.rol)) {
        throw new Error('Solo un revisor o director técnico puede aprobar el reporte.');
      }
      reporte.revisadoPor = usuario;
    }

    if (nuevoEstado === 'emitido') {
      if (!['director_tecnico', 'administrador'].includes(usuario.rol)) {
        throw new Error('Solo el Director Técnico o Administrador puede emitir oficialmente el documento.');
      }
      
      // Asignación atómica del consecutivo oficial
      if (!reporte.numeroConsecutivo) {
        reporte.numeroConsecutivo = this.asignarSiguienteConsecutivo(reporte.clasificacionCodigo);
      }
      reporte.fechaEmision = new Date().toISOString().split('T')[0];
      reporte.aprobadoPor = usuario;
    }

    if (nuevoEstado === 'anulado') {
      if (!observaciones || observaciones.trim().length === 0) {
        throw new Error('Se requiere un motivo formal para anular un reporte.');
      }
      if (!['director_tecnico', 'administrador'].includes(usuario.rol)) {
        throw new Error('Solo el Director Técnico o Administrador puede anular reportes.');
      }
      reporte.motivoAnulacion = observaciones;
    }

    // Registrar transición
    reporte.estado = nuevoEstado;
    reporte.updatedAt = new Date().toISOString();
    reporte.transiciones.push({
      id: `tr-${Date.now()}`,
      estadoAnterior,
      estadoNuevo: nuevoEstado,
      usuarioId: usuario.id,
      usuarioNombre: usuario.nombre,
      rolUsuario: usuario.rol,
      fecha: new Date().toLocaleString(),
      observaciones,
    });

    reportes[index] = reporte;
    this.set(STORAGE_KEYS.REPORTES, reportes);
    supabaseService.guardarReporteEnNube(reporte).catch(() => {});

    // Auditoría
    let accionAuditoria: RegistroAuditoria['accion'] = 'MODIFICAR';
    if (nuevoEstado === 'en_revision') accionAuditoria = 'ENVIAR_REVISION';
    else if (nuevoEstado === 'devuelto') accionAuditoria = 'DEVOLVER';
    else if (nuevoEstado === 'aprobado') accionAuditoria = 'APROBAR';
    else if (nuevoEstado === 'emitido') accionAuditoria = 'EMITIR';
    else if (nuevoEstado === 'anulado') accionAuditoria = 'ANULAR';

    this.registrarAuditoria({
      usuarioId: usuario.id,
      usuarioNombre: usuario.nombre,
      rol: usuario.rol,
      accion: accionAuditoria,
      entidad: 'reporte',
      entidadId: reporte.id,
      detalles: `Cambio de estado de ${estadoAnterior} a ${nuevoEstado}. ${observaciones ? `Motivo: ${observaciones}` : ''}`,
    });

    return reporte;
  }

  // Auditoría
  public getAuditoria(): RegistroAuditoria[] {
    return this.get<RegistroAuditoria[]>(STORAGE_KEYS.AUDITORIA, []);
  }

  public registrarAuditoria(registro: Omit<RegistroAuditoria, 'id' | 'fechaHora'>): void {
    const auditorias = this.getAuditoria();
    const nuevoRegistro: RegistroAuditoria = {
      id: `aud-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      ...registro,
      fechaHora: new Date().toISOString(),
    };
    auditorias.unshift(nuevoRegistro);
    this.set(STORAGE_KEYS.AUDITORIA, auditorias);
    supabaseService.registrarAuditoriaEnNube(nuevoRegistro).catch(() => {});
  }
}

export const storageService = new StorageService();
