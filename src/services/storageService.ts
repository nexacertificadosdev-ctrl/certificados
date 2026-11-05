import type {
  Clasificacion,
  Cliente,
  CodigoClasificacion,
  EquipoInstrumento,
  EstadoReporte,
  PlantillaDocumental,
  RegistroAuditoria,
  ReporteCertificado,
  GraficaServicio,
  SerieConsecutiva,
  Usuario,
  EquipoPatron,
  RolUsuario,
  ModuloPermiso,
  MatrizPermisos,
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
  MATRIZ_PERMISOS_INICIAL,
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
  CONFIG_GLOBAL: 'cert_config_global_v1',
  AUDITORIA: 'cert_auditoria_v1',
  USUARIO_ACTUAL: 'cert_usuario_actual_v1',
  USUARIOS: 'cert_usuarios_v1',
  SESION: 'cert_sesion_activa_v1',
  MATRIZ_PERMISOS: 'cert_matriz_permisos_v1',
  GOOGLE_DRIVE: 'cert_google_drive_v1',
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

  private graficasCache: Map<string, GraficaServicio[]> = new Map();

  public getGraficasDeReporte(id: string): GraficaServicio[] | undefined {
    if (this.graficasCache.has(id)) {
      return this.graficasCache.get(id);
    }
    try {
      const raw = sessionStorage.getItem(`cert_graficas_${id}`);
      if (raw) {
        const parsed = JSON.parse(raw);
        this.graficasCache.set(id, parsed);
        return parsed;
      }
    } catch {}
    return undefined;
  }

  public setGraficasDeReporte(id: string, graficas?: GraficaServicio[]): void {
    if (!graficas || graficas.length === 0) {
      this.graficasCache.delete(id);
      try { sessionStorage.removeItem(`cert_graficas_${id}`); } catch {}
      return;
    }
    this.graficasCache.set(id, graficas);
    try {
      sessionStorage.setItem(`cert_graficas_${id}`, JSON.stringify(graficas));
    } catch (e) {
      console.warn('[storageService] No se pudo guardar en sessionStorage:', e);
    }
  }

  private set<T>(key: string, value: T): void {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.warn(`[storageService] Exceso de cuota o error al guardar '${key}':`, e);
      if (key === STORAGE_KEYS.PLANTILLAS && Array.isArray(value)) {
        try {
          // Si el array de plantillas excede la cuota de 5MB por duplicación de base64,
          // guardamos una versión optimizada donde las plantillas heredan de CONFIG_GLOBAL.
          const plantillasLigeras = (value as PlantillaDocumental[]).map((p) => ({
            ...p,
            logoIzquierdoUrl: p.logoIzquierdoUrl?.startsWith('data:') && p.logoIzquierdoUrl.length > 3000 ? '' : p.logoIzquierdoUrl,
            logoDerechoUrl: p.logoDerechoUrl?.startsWith('data:') && p.logoDerechoUrl.length > 3000 ? '' : p.logoDerechoUrl,
          }));
          localStorage.setItem(key, JSON.stringify(plantillasLigeras));
          console.info('[storageService] Plantillas guardadas en formato ligero con herencia de logos globales.');
        } catch (err2) {
          console.error('[storageService] Error persistente al guardar plantillas ligeras:', err2);
        }
      }
      if (key === STORAGE_KEYS.REPORTES && Array.isArray(value)) {
        try {
          // Si el array de reportes excede cuota por imágenes base64 de gráficas,
          // omitimos graficasServicio de localStorage (se conservan en memoria/sessionStorage)
          const reportesLigeros = (value as ReporteCertificado[]).map((r) => {
            const { graficasServicio, ...resto } = r;
            return resto;
          });
          localStorage.setItem(key, JSON.stringify(reportesLigeros));
          console.info('[storageService] Reportes guardados en localStorage sin imágenes pesadas de gráficas.');
        } catch (err3) {
          console.error('[storageService] Error persistente al guardar reportes ligeros:', err3);
        }
      }
    }
  }

  // Inicialización de datos
  public init(): void {
    if (!localStorage.getItem(STORAGE_KEYS.CONFIG_GLOBAL)) {
      this.setConfiguracionGlobal({
        logoIzquierdoUrl: DEFAULT_LOGO_IZQUIERDO,
        logoDerechoUrl: DEFAULT_LOGO_DERECHO,
        colorPrimario: DEFAULT_COLOR_PRIMARIO,
        colorSecundario: DEFAULT_COLOR_SECUNDARIO,
        colorTextoEncabezado: DEFAULT_COLOR_TEXTO,
      });
    }
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
    if (!localStorage.getItem(STORAGE_KEYS.USUARIOS)) {
      this.set(STORAGE_KEYS.USUARIOS, USUARIOS_INICIALES);
    }
    if (!localStorage.getItem(STORAGE_KEYS.MATRIZ_PERMISOS)) {
      this.set(STORAGE_KEYS.MATRIZ_PERMISOS, MATRIZ_PERMISOS_INICIAL);
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

  // ==========================================
  // GESTIÓN DE SESIÓN, USUARIOS & PERMISOS RBAC
  // ==========================================

  public getSesionUsuario(): Usuario | null {
    return this.get<Usuario | null>(STORAGE_KEYS.SESION, null);
  }

  public setSesionUsuario(usuario: Usuario | null): void {
    if (usuario) {
      this.set(STORAGE_KEYS.SESION, usuario);
      this.set(STORAGE_KEYS.USUARIO_ACTUAL, usuario);
    } else {
      localStorage.removeItem(STORAGE_KEYS.SESION);
    }
  }

  public cerrarSesion(): void {
    localStorage.removeItem(STORAGE_KEYS.SESION);
  }

  // Usuario activo en el sistema
  public getUsuarioActual(): Usuario {
    const sesion = this.getSesionUsuario();
    if (sesion) return sesion;
    return this.get<Usuario>(STORAGE_KEYS.USUARIO_ACTUAL, USUARIOS_INICIALES[0]);
  }

  public setUsuarioActual(usuario: Usuario): void {
    this.set(STORAGE_KEYS.USUARIO_ACTUAL, usuario);
    this.set(STORAGE_KEYS.SESION, usuario);
  }

  public getUsuarios(): Usuario[] {
    const lista = this.get<Usuario[]>(STORAGE_KEYS.USUARIOS, USUARIOS_INICIALES);
    return lista.length > 0 ? lista : USUARIOS_INICIALES;
  }

  public guardarUsuario(usuario: Usuario, adminOperador?: Usuario): void {
    const usuarios = this.getUsuarios();
    const index = usuarios.findIndex((u) => u.id === usuario.id);
    const esNuevo = index === -1;

    if (index >= 0) {
      usuarios[index] = { ...usuarios[index], ...usuario };
    } else {
      usuarios.push(usuario);
    }

    this.set(STORAGE_KEYS.USUARIOS, usuarios);

    // Si se actualizó el usuario con sesión activa, refrescar sesión
    const sesion = this.getSesionUsuario();
    if (sesion && sesion.id === usuario.id) {
      this.setSesionUsuario({ ...sesion, ...usuario });
    }

    if (adminOperador) {
      this.registrarAuditoria({
        usuarioId: adminOperador.id,
        usuarioNombre: adminOperador.nombre,
        rol: adminOperador.rol,
        accion: 'CONFIGURACION',
        entidad: 'usuario',
        entidadId: usuario.id,
        detalles: `${esNuevo ? 'Creación' : 'Actualización'} de usuario "${usuario.nombre}" (${usuario.email}) con rol [${usuario.rol}]`,
      });
    }
  }

  public eliminarUsuario(id: string, adminOperador?: Usuario): void {
    const usuarios = this.getUsuarios();
    const target = usuarios.find((u) => u.id === id);
    const nuevas = usuarios.filter((u) => u.id !== id);
    this.set(STORAGE_KEYS.USUARIOS, nuevas);

    if (adminOperador && target) {
      this.registrarAuditoria({
        usuarioId: adminOperador.id,
        usuarioNombre: adminOperador.nombre,
        rol: adminOperador.rol,
        accion: 'CONFIGURACION',
        entidad: 'usuario',
        entidadId: id,
        detalles: `Eliminación de usuario "${target.nombre}" (${target.email})`,
      });
    }
  }

  // Matriz de Permisos por Rol
  public getMatrizPermisos(): MatrizPermisos {
    return this.get<MatrizPermisos>(STORAGE_KEYS.MATRIZ_PERMISOS, MATRIZ_PERMISOS_INICIAL);
  }

  public guardarMatrizPermisos(matriz: MatrizPermisos, adminOperador?: Usuario): void {
    this.set(STORAGE_KEYS.MATRIZ_PERMISOS, matriz);
    if (adminOperador) {
      this.registrarAuditoria({
        usuarioId: adminOperador.id,
        usuarioNombre: adminOperador.nombre,
        rol: adminOperador.rol,
        accion: 'CONFIGURACION',
        entidad: 'permisos',
        entidadId: 'matriz_global',
        detalles: `Actualización de matriz global de permisos y roles del sistema.`,
      });
    }
  }

  public tienePermiso(rol: RolUsuario, permiso: ModuloPermiso): boolean {
    if (rol === 'administrador') return true; // El Administrador siempre tiene todos los privilegios
    const matriz = this.getMatrizPermisos();
    const permisosDelRol = matriz[rol] || [];
    return permisosDelRol.includes(permiso);
  }

  public actualizarFirmaUsuario(usuarioId: string, firmaUrl: string): void {
    const usuarios = this.getUsuarios();
    const idx = usuarios.findIndex((u) => u.id === usuarioId);
    if (idx !== -1) {
      usuarios[idx].firmaUrl = firmaUrl;
      this.set(STORAGE_KEYS.USUARIOS, usuarios);
    }

    const usuarioActual = this.getUsuarioActual();
    if (usuarioActual.id === usuarioId) {
      usuarioActual.firmaUrl = firmaUrl;
      this.setUsuarioActual(usuarioActual);
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

  // Configuración de Google Drive Institucional
  public getGoogleDriveConfig(): {
    folderUrl: string;
    folderId: string;
    conectado: boolean;
  } {
    return this.get(STORAGE_KEYS.GOOGLE_DRIVE, {
      folderUrl: 'https://drive.google.com/drive/u/0/folders/1lM9S94X9RXKMMO0f9izpBJlsMeiBmcYm',
      folderId: '1lM9S94X9RXKMMO0f9izpBJlsMeiBmcYm',
      conectado: true,
    });
  }

  public setGoogleDriveConfig(config: { folderUrl: string; folderId?: string; conectado: boolean }): void {
    const folderId = config.folderId || config.folderUrl.split('folders/')[1]?.split('?')[0] || '';
    this.set(STORAGE_KEYS.GOOGLE_DRIVE, {
      ...config,
      folderId,
    });
  }

  // Calibración de serie consecutiva desde certificados históricos
  public calibrarConsecutivoDesdeHistorico(
    clasificacionCodigo: CodigoClasificacion,
    nuevoUltimoNumero: number,
    adminOperador?: Usuario
  ): void {
    const series = this.getSeries();
    const mapaDefault: Record<string, string> = {
      VT: 'ser-1',
      TB: 'ser-2',
      PR: 'ser-3',
      TM: 'ser-4',
      EL: 'ser-5',
    };
    const idx = series.findIndex(
      (s) => s.clasificacionCodigo === clasificacionCodigo || s.id === mapaDefault[clasificacionCodigo]
    );
    if (idx !== -1) {
      const numeroAnterior = series[idx].ultimoNumero;
      series[idx].ultimoNumero = Math.max(series[idx].ultimoNumero, nuevoUltimoNumero);
      this.set(STORAGE_KEYS.SERIES, series);
      supabaseService.guardarSerieEnNube(series[idx]).catch(() => {});

      if (adminOperador) {
        this.registrarAuditoria({
          usuarioId: adminOperador.id,
          usuarioNombre: adminOperador.nombre,
          rol: adminOperador.rol,
          accion: 'CONFIGURACION',
          entidad: 'serie',
          entidadId: series[idx].id,
          detalles: `Calibración de serie [${series[idx].clasificacionCodigo}] desde certificados históricos. Consecutivo ajustado de ${numeroAnterior} a ${series[idx].ultimoNumero} (Próximo: ${series[idx].ultimoNumero + 1}).`,
        });
      }
    }
  }

  // Registro de certificado histórico digitalizado en Google Drive
  public importarCertificadoHistorico(
    datos: {
      numeroConsecutivo: string;
      clasificacionCodigo: CodigoClasificacion;
      clienteNombre?: string;
      fechaEmision?: string;
      nombreArchivo: string;
      googleDriveUrl?: string;
    },
    usuario: Usuario
  ): ReporteCertificado {
    const driveCfg = this.getGoogleDriveConfig();
    const id = `rep-hist-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
    const fecha = datos.fechaEmision || new Date().toISOString().split('T')[0];

    const nuevoReporte: ReporteCertificado = {
      id,
      tempId: datos.numeroConsecutivo,
      numeroConsecutivo: datos.numeroConsecutivo,
      clasificacionCodigo: datos.clasificacionCodigo,
      estado: 'emitido',
      versionPlantilla: 'v1.0 (Histórico)',
      clienteId: 'cli-hist',
      clienteNombre: datos.clienteNombre || 'Cliente Histórico Nexatech',
      direccionServicio: 'Archivo físico / digitalizado en Google Drive',
      contratoOC: 'Emisión Histórica',
      ubicacionServicio: 'Google Drive Nexatech',
      equipoId: 'eq-hist',
      fechaRecepcion: fecha,
      fechaPrueba: fecha,
      fechaEmision: fecha,
      creadoPor: usuario,
      aprobadoPor: usuario,
      esHistorico: true,
      nombreArchivoOriginal: datos.nombreArchivo,
      googleDriveUrl: datos.googleDriveUrl || driveCfg.folderUrl,
      transiciones: [
        {
          id: `trans-hist-${Date.now()}`,
          estadoAnterior: 'borrador',
          estadoNuevo: 'emitido',
          usuarioId: usuario.id,
          usuarioNombre: usuario.nombre,
          rolUsuario: usuario.rol,
          fecha: new Date().toISOString(),
          observaciones: `Certificado histórico digitalizado en Google Drive (${datos.nombreArchivo})`,
        },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const reportes = this.getReportes();
    reportes.unshift(nuevoReporte);
    this.set(STORAGE_KEYS.REPORTES, reportes);
    supabaseService.guardarReporteEnNube(nuevoReporte).catch(() => {});

    return nuevoReporte;
  }

  // Configuración global institucional de logos y colores
  public getConfiguracionGlobal(): {
    logoIzquierdoUrl: string;
    logoDerechoUrl: string;
    colorPrimario: string;
    colorSecundario: string;
    colorTextoEncabezado: string;
  } {
    const cfg = this.get(STORAGE_KEYS.CONFIG_GLOBAL, {
      logoIzquierdoUrl: DEFAULT_LOGO_IZQUIERDO,
      logoDerechoUrl: DEFAULT_LOGO_DERECHO,
      colorPrimario: DEFAULT_COLOR_PRIMARIO,
      colorSecundario: DEFAULT_COLOR_SECUNDARIO,
      colorTextoEncabezado: DEFAULT_COLOR_TEXTO,
    });

    // Auto-recuperación: si la configuración global conserva los logos SVG por defecto,
    // pero alguna plantilla ya fue personalizada con logotipos del usuario,
    // adoptamos automáticamente esos logos como globales institucionales.
    const esDefaultIzq = !cfg.logoIzquierdoUrl || cfg.logoIzquierdoUrl === DEFAULT_LOGO_IZQUIERDO;
    const esDefaultDer = !cfg.logoDerechoUrl || cfg.logoDerechoUrl === DEFAULT_LOGO_DERECHO;

    if (esDefaultIzq || esDefaultDer) {
      try {
        const rawPlantillas = this.get<PlantillaDocumental[]>(STORAGE_KEYS.PLANTILLAS, []);
        const plantillaConLogo = rawPlantillas.find(
          (p) =>
            (p.logoIzquierdoUrl && p.logoIzquierdoUrl !== DEFAULT_LOGO_IZQUIERDO) ||
            (p.logoDerechoUrl && p.logoDerechoUrl !== DEFAULT_LOGO_DERECHO)
        );
        if (plantillaConLogo) {
          if (esDefaultIzq && plantillaConLogo.logoIzquierdoUrl && plantillaConLogo.logoIzquierdoUrl !== DEFAULT_LOGO_IZQUIERDO) {
            cfg.logoIzquierdoUrl = plantillaConLogo.logoIzquierdoUrl;
          }
          if (esDefaultDer && plantillaConLogo.logoDerechoUrl && plantillaConLogo.logoDerechoUrl !== DEFAULT_LOGO_DERECHO) {
            cfg.logoDerechoUrl = plantillaConLogo.logoDerechoUrl;
          }
          this.set(STORAGE_KEYS.CONFIG_GLOBAL, cfg);
        }
      } catch {
        // Ignorar si hay error
      }
    }

    return cfg;
  }

  public setConfiguracionGlobal(config: Partial<{
    logoIzquierdoUrl: string;
    logoDerechoUrl: string;
    colorPrimario: string;
    colorSecundario: string;
    colorTextoEncabezado: string;
  }>): void {
    const actual = this.getConfiguracionGlobal();
    this.set(STORAGE_KEYS.CONFIG_GLOBAL, { ...actual, ...config });
  }

  // Plantillas documentales y configuración de títulos
  public getPlantillas(): PlantillaDocumental[] {
    const globalCfg = this.getConfiguracionGlobal();
    const list = this.get<PlantillaDocumental[]>(STORAGE_KEYS.PLANTILLAS, PLANTILLAS_INICIALES);

    return list.map((p) => {
      // Si la plantilla no tiene logo asignado o tiene el logo por defecto inicial,
      // hereda el logo institucional configurado globalmente.
      const usarGlobalIzq =
        !p.logoIzquierdoUrl ||
        p.logoIzquierdoUrl === DEFAULT_LOGO_IZQUIERDO;

      const usarGlobalDer =
        !p.logoDerechoUrl ||
        p.logoDerechoUrl === DEFAULT_LOGO_DERECHO;

      const usarGlobalPrimario =
        !p.colorPrimario ||
        p.colorPrimario === DEFAULT_COLOR_PRIMARIO;

      const usarGlobalSecundario =
        !p.colorSecundario ||
        p.colorSecundario === DEFAULT_COLOR_SECUNDARIO;

      return {
        ...p,
        logoIzquierdoUrl: usarGlobalIzq
          ? (globalCfg.logoIzquierdoUrl || DEFAULT_LOGO_IZQUIERDO)
          : (p.logoIzquierdoUrl || DEFAULT_LOGO_IZQUIERDO),
        logoDerechoUrl: usarGlobalDer
          ? (globalCfg.logoDerechoUrl || DEFAULT_LOGO_DERECHO)
          : (p.logoDerechoUrl || DEFAULT_LOGO_DERECHO),
        colorPrimario: usarGlobalPrimario
          ? (globalCfg.colorPrimario || DEFAULT_COLOR_PRIMARIO)
          : (p.colorPrimario || DEFAULT_COLOR_PRIMARIO),
        colorSecundario: usarGlobalSecundario
          ? (globalCfg.colorSecundario || DEFAULT_COLOR_SECUNDARIO)
          : (p.colorSecundario || DEFAULT_COLOR_SECUNDARIO),
        colorTextoEncabezado:
          p.colorTextoEncabezado || globalCfg.colorTextoEncabezado || DEFAULT_COLOR_TEXTO,
      };
    });
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

  public aplicarLogosYColoresATodasLasPlantillas(
    opciones: {
      logoIzquierdoUrl?: string;
      logoDerechoUrl?: string;
      colorPrimario?: string;
      colorSecundario?: string;
      colorTextoEncabezado?: string;
      incluirColores?: boolean;
    },
    usuario?: Usuario
  ): void {
    const globalActual = this.getConfiguracionGlobal();
    const nuevoGlobal = {
      logoIzquierdoUrl: opciones.logoIzquierdoUrl || globalActual.logoIzquierdoUrl,
      logoDerechoUrl: opciones.logoDerechoUrl || globalActual.logoDerechoUrl,
      colorPrimario:
        opciones.incluirColores && opciones.colorPrimario
          ? opciones.colorPrimario
          : globalActual.colorPrimario,
      colorSecundario:
        opciones.incluirColores && opciones.colorSecundario
          ? opciones.colorSecundario
          : globalActual.colorSecundario,
      colorTextoEncabezado:
        opciones.incluirColores && opciones.colorTextoEncabezado
          ? opciones.colorTextoEncabezado
          : globalActual.colorTextoEncabezado,
    };
    this.setConfiguracionGlobal(nuevoGlobal);

    const plantillas = this.get<PlantillaDocumental[]>(STORAGE_KEYS.PLANTILLAS, PLANTILLAS_INICIALES);
    const actualizadas = plantillas.map((p) => ({
      ...p,
      logoIzquierdoUrl: nuevoGlobal.logoIzquierdoUrl,
      logoDerechoUrl: nuevoGlobal.logoDerechoUrl,
      ...(opciones.incluirColores
        ? {
            colorPrimario: nuevoGlobal.colorPrimario,
            colorSecundario: nuevoGlobal.colorSecundario,
            colorTextoEncabezado: nuevoGlobal.colorTextoEncabezado,
          }
        : {}),
    }));

    this.set(STORAGE_KEYS.PLANTILLAS, actualizadas);
    actualizadas.forEach((p) => {
      supabaseService.guardarPlantillaEnNube(p).catch(() => {});
    });

    if (usuario) {
      this.registrarAuditoria({
        usuarioId: usuario.id,
        usuarioNombre: usuario.nombre,
        rol: usuario.rol,
        accion: 'CONFIGURACION',
        entidad: 'plantilla',
        entidadId: 'todas',
        detalles: `Replicación masiva de logotipos ${opciones.incluirColores ? 'y paleta de colores ' : ''}a todas las ${actualizadas.length} plantillas del sistema.`,
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
    const mapaDefault: Record<string, string> = {
      VT: 'ser-1',
      TB: 'ser-2',
      PR: 'ser-3',
      TM: 'ser-4',
      EL: 'ser-5',
    };
    const serieIndex = series.findIndex(
      (s) => (s.clasificacionCodigo === clasificacionCodigo || s.id === mapaDefault[clasificacionCodigo]) && s.activa
    );
    
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
      graficasServicio: r.graficasServicio || this.getGraficasDeReporte(r.id) || (r.tempId ? this.getGraficasDeReporte(r.tempId) : undefined),
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
      datosTuberia: reporteData.datosTuberia,
      datosCalibracion: reporteData.datosCalibracion,
      graficasServicio: reporteData.graficasServicio,
      fechaFormato: reporteData.fechaFormato || plantillaElegida.fechaFormato,
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

    if (reporteData.graficasServicio && reporteData.graficasServicio.length > 0) {
      this.setGraficasDeReporte(nuevoId, reporteData.graficasServicio);
      this.setGraficasDeReporte(tempId, reporteData.graficasServicio);
    }

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

    if (cambios.graficasServicio) {
      this.setGraficasDeReporte(reporteId, cambios.graficasServicio);
      if (actual.tempId) {
        this.setGraficasDeReporte(actual.tempId, cambios.graficasServicio);
      }
    }

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
