import { supabase, estaConfiguradoSupabase } from './supabaseClient';
import type {
  PlantillaDocumental,
  SerieConsecutiva,
  Cliente,
  EquipoInstrumento,
  ReporteCertificado,
  RegistroAuditoria,
  CodigoClasificacion,
} from '../types';

class SupabaseService {
  /**
   * Sincronización completa de inicio: Descarga desde Supabase a la aplicación
   */
  async sincronizarDesdeNube(): Promise<{
    plantillas?: PlantillaDocumental[];
    series?: SerieConsecutiva[];
    clientes?: Cliente[];
    equipos?: EquipoInstrumento[];
    reportes?: ReporteCertificado[];
    auditoria?: RegistroAuditoria[];
  } | null> {
    if (!estaConfiguradoSupabase()) return null;

    try {
      // 1. Descargar Plantillas
      const { data: dbPlantillas } = await supabase
        .from('plantillas_documentales')
        .select('*')
        .order('created_at', { ascending: true });

      const plantillas = dbPlantillas
        ? dbPlantillas.map((p) => ({
            id: p.id,
            clasificacionCodigo: p.clasificacion_codigo as CodigoClasificacion,
            nombreIdentificador: p.nombre_identificador,
            tipoElemento: p.tipo_elemento,
            tituloReporteEs: p.titulo_reporte_es,
            tituloReporteEn: p.titulo_reporte_en,
            subtituloNormativo: p.subtitulo_normativo,
            codigoFormato: p.codigo_formato,
            versionRevision: p.version_revision,
            declaracionTrazabilidadPorDefecto: p.declaracion_trazabilidad,
            declaracionesConformidadPorDefecto: p.declaraciones_conformidad,
            activa: p.activa,
          }))
        : undefined;

      // 2. Descargar Series Consecutivas
      const { data: dbSeries } = await supabase
        .from('series_consecutivas')
        .select('*')
        .order('clasificacion_codigo', { ascending: true });

      const series = dbSeries
        ? dbSeries.map((s) => ({
            id: s.id,
            clasificacionCodigo: s.clasificacion_codigo as CodigoClasificacion,
            nombre: s.nombre,
            prefijo: s.prefijo,
            separador: s.separador,
            longitudDigitos: s.longitud_digitos,
            incluyeAnio: s.incluye_anio,
            reinicioAnual: s.reinicio_anual,
            anioVigente: s.anio_vigente,
            ultimoNumero: s.ultimo_numero,
            activa: s.activa,
          }))
        : undefined;

      // 3. Descargar Clientes
      const { data: dbClientes } = await supabase
        .from('clientes')
        .select('*')
        .order('razon_social', { ascending: true });

      const clientes = dbClientes
        ? dbClientes.map((c) => ({
            id: c.id,
            razonSocial: c.razon_social,
            identificacion: c.identificacion,
            direccion: c.direccion,
            contacto: c.contacto || '',
            telefono: c.telefono || '',
            email: c.email || '',
          }))
        : undefined;

      // 4. Descargar Reportes y Certificados
      const { data: dbReportes } = await supabase
        .from('reportes')
        .select('*, reporte_transiciones(*)')
        .order('created_at', { ascending: false });

      const reportes: ReporteCertificado[] | undefined = dbReportes
        ? dbReportes.map((r) => {
            const dt = r.datos_tecnicos || {};
            return {
              id: r.id,
              tempId: r.temp_id,
              numeroConsecutivo: r.numero_consecutivo || undefined,
              clasificacionCodigo: r.clasificacion_codigo as CodigoClasificacion,
              estado: r.estado,
              plantillaId: r.plantilla_id || 'plan-vt-1',
              tituloReporteEs: r.titulo_reporte_es,
              tituloReporteEn: r.titulo_reporte_en || undefined,
              subtituloNormativo: r.subtitulo_normativo || undefined,
              codigoFormato: r.codigo_formato,
              versionPlantilla: r.version_plantilla,
              clienteId: r.cliente_id || '',
              clienteNombre: r.cliente_nombre,
              direccionServicio: r.direccion_servicio,
              contratoOC: r.contrato_oc,
              ubicacionServicio: r.ubicacion_servicio,
              equipoId: r.equipo_id || '',
              fechaRecepcion: r.fecha_recepcion,
              fechaPrueba: r.fecha_prueba,
              fechaEmision: r.fecha_emision || undefined,
              motivoAnulacion: r.motivo_anulacion || undefined,
              creadoPor: {
                id: r.creado_por,
                nombre: 'Operador / Técnico',
                email: '',
                cargo: 'Técnico de Ensayos',
                rol: 'tecnico',
              },
              datosValvula: r.clasificacion_codigo === 'VT' ? dt : undefined,
              datosTuberia: r.clasificacion_codigo === 'TB' ? dt : undefined,
              datosCalibracion: ['PR', 'TM', 'EL'].includes(r.clasificacion_codigo) ? dt : undefined,
              transiciones: (r.reporte_transiciones || []).map((t: any) => ({
                id: t.id,
                estadoAnterior: t.estado_anterior,
                estadoNuevo: t.estado_nuevo,
                usuarioId: t.usuario_id,
                usuarioNombre: 'Usuario Sistema',
                rolUsuario: 'tecnico' as any,
                fecha: t.created_at,
                observaciones: t.observaciones || undefined,
              })),
              createdAt: r.created_at,
              updatedAt: r.updated_at,
            };
          })
        : undefined;

      // 5. Descargar Auditoría
      const { data: dbAuditoria } = await supabase
        .from('auditoria')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      const auditoria = dbAuditoria
        ? dbAuditoria.map((a) => ({
            id: a.id,
            usuarioId: a.usuario_id || 'usr-1',
            usuarioNombre: a.usuario_nombre,
            rol: a.rol,
            accion: a.accion as any,
            entidad: a.entidad as any,
            entidadId: a.entidad_id,
            detalles: a.detalles,
            fechaHora: a.created_at,
          }))
        : undefined;

      return {
        plantillas,
        series,
        clientes,
        reportes,
        auditoria,
      };
    } catch (err) {
      console.warn('Sincronización inicial con Supabase en pausa o error:', err);
      return null;
    }
  }

  /**
   * Generación atómica de consecutivo en Supabase usando la función SQL
   */
  async asignarConsecutivoEnNube(clasificacion: CodigoClasificacion): Promise<string | null> {
    if (!estaConfiguradoSupabase()) return null;

    try {
      const { data, error } = await supabase.rpc('asignar_siguiente_consecutivo', {
        p_clasificacion_codigo: clasificacion,
      });

      if (error) {
        console.error('Error invocando RPC asignar_siguiente_consecutivo en Supabase:', error);
        return null;
      }

      return data as string;
    } catch (err) {
      console.error('Excepción llamando a función atómica de Supabase:', err);
      return null;
    }
  }

  /**
   * Guarda o actualiza un reporte en Supabase
   */
  async guardarReporteEnNube(reporte: ReporteCertificado): Promise<void> {
    if (!estaConfiguradoSupabase()) return;

    try {
      const datosTecnicos =
        reporte.datosValvula || reporte.datosTuberia || reporte.datosCalibracion || {};

      const payload = {
        id: reporte.id,
        temp_id: reporte.tempId,
        numero_consecutivo: reporte.numeroConsecutivo || null,
        clasificacion_codigo: reporte.clasificacionCodigo,
        estado: reporte.estado,
        plantilla_id: reporte.plantillaId,
        titulo_reporte_es: reporte.tituloReporteEs,
        titulo_reporte_en: reporte.tituloReporteEn || null,
        subtitulo_normativo: reporte.subtituloNormativo || null,
        codigo_formato: reporte.codigoFormato,
        version_plantilla: reporte.versionPlantilla,
        cliente_id: reporte.clienteId || null,
        cliente_nombre: reporte.clienteNombre,
        direccion_servicio: reporte.direccionServicio,
        contrato_oc: reporte.contratoOC,
        ubicacion_servicio: reporte.ubicacionServicio,
        equipo_id: reporte.equipoId || null,
        fecha_recepcion: reporte.fechaRecepcion,
        fecha_prueba: reporte.fechaPrueba,
        fecha_emision: reporte.fechaEmision || null,
        creado_por: reporte.creadoPor?.id || 'usr-1',
        revisado_por: reporte.revisadoPor?.id || null,
        aprobado_por: reporte.aprobadoPor?.id || null,
        datos_tecnicos: datosTecnicos,
        motivo_anulacion: reporte.motivoAnulacion || null,
        updated_at: new Date().toISOString(),
      };

      await supabase.from('reportes').upsert(payload);

      // Guardar transiciones
      if (reporte.transiciones && reporte.transiciones.length > 0) {
        const transRows = reporte.transiciones.map((t) => ({
          id: t.id,
          reporte_id: reporte.id,
          estado_anterior: t.estadoAnterior,
          estado_nuevo: t.estadoNuevo,
          usuario_id: t.usuarioId,
          observaciones: t.observaciones || null,
        }));
        await supabase.from('reporte_transiciones').upsert(transRows);
      }
    } catch (err) {
      console.error('Error guardando reporte en Supabase:', err);
    }
  }

  /**
   * Sincroniza una plantilla documental en Supabase
   */
  async guardarPlantillaEnNube(plantilla: PlantillaDocumental): Promise<void> {
    if (!estaConfiguradoSupabase()) return;

    try {
      await supabase.from('plantillas_documentales').upsert({
        id: plantilla.id,
        clasificacion_codigo: plantilla.clasificacionCodigo,
        nombre_identificador: plantilla.nombreIdentificador,
        tipo_elemento: plantilla.tipoElemento,
        titulo_reporte_es: plantilla.tituloReporteEs,
        titulo_reporte_en: plantilla.tituloReporteEn || null,
        subtitulo_normativo: plantilla.subtituloNormativo || null,
        codigo_formato: plantilla.codigoFormato,
        version_revision: plantilla.versionRevision,
        declaracion_trazabilidad: plantilla.declaracionTrazabilidadPorDefecto || null,
        declaraciones_conformidad: plantilla.declaracionesConformidadPorDefecto || null,
        activa: plantilla.activa,
        updated_at: new Date().toISOString(),
      });
    } catch (err) {
      console.error('Error guardando plantilla en Supabase:', err);
    }
  }

  /**
   * Sincroniza una serie consecutiva en Supabase
   */
  async guardarSerieEnNube(serie: SerieConsecutiva): Promise<void> {
    if (!estaConfiguradoSupabase()) return;

    try {
      await supabase.from('series_consecutivas').upsert({
        id: serie.id,
        clasificacion_codigo: serie.clasificacionCodigo,
        nombre: serie.nombre,
        prefijo: serie.prefijo,
        separador: serie.separador,
        longitud_digitos: serie.longitudDigitos,
        incluye_anio: serie.incluyeAnio,
        reinicio_anual: serie.reinicioAnual,
        anio_vigente: serie.anioVigente,
        ultimo_numero: serie.ultimoNumero,
        activa: serie.activa,
        updated_at: new Date().toISOString(),
      });
    } catch (err) {
      console.error('Error guardando serie en Supabase:', err);
    }
  }

  /**
   * Registra evento en la tabla inmutable de auditoría en Supabase
   */
  async registrarAuditoriaEnNube(auditoria: RegistroAuditoria): Promise<void> {
    if (!estaConfiguradoSupabase()) return;

    try {
      await supabase.from('auditoria').insert({
        id: auditoria.id,
        usuario_id: auditoria.usuarioId,
        usuario_nombre: auditoria.usuarioNombre,
        rol: auditoria.rol,
        accion: auditoria.accion,
        entidad: auditoria.entidad,
        entidad_id: auditoria.entidadId,
        detalles: auditoria.detalles,
      });
    } catch (err) {
      console.error('Error registrando auditoría en Supabase:', err);
    }
  }

  /**
   * Guarda o actualiza un cliente en Supabase
   */
  async guardarClienteEnNube(cliente: Cliente): Promise<void> {
    if (!estaConfiguradoSupabase()) return;

    try {
      await supabase.from('clientes').upsert({
        id: cliente.id,
        razon_social: cliente.razonSocial,
        identificacion: cliente.identificacion,
        direccion: cliente.direccion,
        contacto: cliente.contacto,
        telefono: cliente.telefono,
        email: cliente.email,
        updated_at: new Date().toISOString(),
      });
    } catch (err) {
      console.error('Error guardando cliente en Supabase:', err);
    }
  }

  /**
   * Elimina un cliente en Supabase
   */
  async eliminarClienteEnNube(clienteId: string): Promise<void> {
    if (!estaConfiguradoSupabase()) return;

    try {
      await supabase.from('clientes').delete().eq('id', clienteId);
    } catch (err) {
      console.error('Error eliminando cliente en Supabase:', err);
    }
  }

  /**
   * Guarda o actualiza un equipo/instrumento en Supabase
   */
  async guardarEquipoEnNube(equipo: EquipoInstrumento): Promise<void> {
    if (!estaConfiguradoSupabase()) return;

    try {
      await supabase.from('equipos').upsert({
        id: equipo.id,
        cliente_id: equipo.clienteId,
        clasificacion_codigo: 'VT',
        tipo: equipo.tipo,
        fabricante: equipo.fabricante,
        modelo: equipo.modelo,
        numero_serie: equipo.numeroSerie,
        tag_identificacion: equipo.tagIdentificacion,
        rango_alcance: equipo.rangoPresion || null,
        tamanio: equipo.tamanio || null,
        clase_presion: equipo.clasePresion || null,
        updated_at: new Date().toISOString(),
      });
    } catch (err) {
      console.error('Error guardando equipo en Supabase:', err);
    }
  }

  /**
   * Elimina un equipo en Supabase
   */
  async eliminarEquipoEnNube(equipoId: string): Promise<void> {
    if (!estaConfiguradoSupabase()) return;

    try {
      await supabase.from('equipos').delete().eq('id', equipoId);
    } catch (err) {
      console.error('Error eliminando equipo en Supabase:', err);
    }
  }

  /**
   * Actualiza la firma de un usuario en Supabase
   */
  async actualizarFirmaEnNube(usuarioId: string, firmaUrl: string): Promise<void> {
    if (!estaConfiguradoSupabase()) return;

    try {
      await supabase
        .from('usuarios_perfiles')
        .update({ firma_url: firmaUrl, updated_at: new Date().toISOString() })
        .eq('id', usuarioId);
    } catch (err) {
      console.error('Error actualizando firma en Supabase:', err);
    }
  }
}

export const supabaseService = new SupabaseService();
