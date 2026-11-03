import React, { useState, useEffect } from 'react';
import type { SerieConsecutiva, Usuario, CodigoClasificacion } from '../../types';
import { storageService } from '../../services/storageService';
import { driveService } from '../../services/driveService';
import type { ArchivoDriveItem } from '../../services/driveService';
import { 
  Settings, 
  ShieldCheck, 
  Save, 
  Check, 
  UploadCloud, 
  FileText, 
  ExternalLink, 
  FolderSync, 
  Sparkles,
  CheckCircle2,
  Loader2,
  RefreshCw,
  Zap
} from 'lucide-react';

interface SeriesConfigProps {
  usuarioActual: Usuario;
}

interface CertificadoDetectado {
  idTemp: string;
  archivo?: File;
  nombre: string;
  consecutivoDetectado: number | null;
  codigoClasificacion: CodigoClasificacion;
  driveUrl?: string;
  driveId?: string;
  origen: 'local' | 'drive';
}

export const SeriesConfig: React.FC<SeriesConfigProps> = ({ usuarioActual }) => {
  const [series, setSeries] = useState<SerieConsecutiva[]>(storageService.getSeries());
  const [guardadoMsg, setGuardadoMsg] = useState<string | null>(null);
  
  // Google Drive config
  const driveConfig = storageService.getGoogleDriveConfig();
  
  // Importador histórico y sincronización
  const [archivosAnalizados, setArchivosAnalizados] = useState<CertificadoDetectado[]>([]);
  const [filtroVisual, setFiltroVisual] = useState<string>('TODAS');
  const [calibracionExito, setCalibracionExito] = useState<string | null>(null);
  const [registrarEnLista, setRegistrarEnLista] = useState(true);
  const [subiendoADrive, setSubiendoADrive] = useState(false);
  const [cargandoDrive, setCargandoDrive] = useState(false);
  const [progresoSubida, setProgresoSubida] = useState<string | null>(null);
  const [notificacionDrive, setNotificacionDrive] = useState<string | null>(null);

  const esAdmin = usuarioActual.rol === 'administrador';

  const handleUpdate = (id: string, campo: keyof SerieConsecutiva, valor: any) => {
    if (!esAdmin) return;
    const nuevas = series.map((s) => (s.id === id ? { ...s, [campo]: valor } : s));
    setSeries(nuevas);
  };

  const handleGuardarTodo = () => {
    if (!esAdmin) return;
    series.forEach((s) => storageService.guardarSerie(s));
    storageService.registrarAuditoria({
      usuarioId: usuarioActual.id,
      usuarioNombre: usuarioActual.nombre,
      rol: usuarioActual.rol,
      accion: 'CONFIGURACION',
      entidad: 'serie',
      entidadId: 'todas',
      detalles: 'Actualización administrativa de parámetros de series y reglas de numeración.',
    });
    setGuardadoMsg('Parámetros de series actualizados exitosamente en la base de datos.');
    setTimeout(() => setGuardadoMsg(null), 3500);
  };

  // Detector inteligente de clasificación técnica según el nombre del archivo
  const detectarClasificacionDeNombre = (nombreArchivo: string): CodigoClasificacion => {
    const norm = nombreArchivo.toUpperCase();
    if (norm.includes('TUBERIA') || norm.includes('SPOOL') || norm.includes('-TB-') || norm.includes('-SP-') || norm.includes('TB')) return 'TB';
    if (norm.includes('VALVULA') || norm.includes('PSV') || norm.includes('-VT-') || norm.includes('VT')) return 'VT';
    if (norm.includes('PRESION') || norm.includes('MANOMETRO') || norm.includes('-PR-') || norm.includes('PR')) return 'PR';
    if (norm.includes('TEMPERATURA') || norm.includes('TERMOMETRO') || norm.includes('-TM-') || norm.includes('TM')) return 'TM';
    if (norm.includes('ELECTRICA') || norm.includes('VOLTAJE') || norm.includes('-EL-') || norm.includes('-E-') || norm.includes('EL')) return 'EL';
    return 'VT';
  };

  // Extractor inteligente del número consecutivo del certificado
  const extraerConsecutivoDeNombre = (nombreArchivo: string): number | null => {
    const nombreLimpio = nombreArchivo.replace(/\.pdf$/i, '');
    
    // Intento 1: Patrón completo [PREFIJO]-[CODIGO]-[NUMERO] ej. TEST-VT-78, TEST-SP-1, TEST-E-0001
    const mPrefijo = nombreLimpio.match(/(?:TEST|CAL|CERT)[-_ ]*(?:VT|TB|SP|PR|TM|EL|E)[-_ ]*(\d+)/i);
    if (mPrefijo) {
      return parseInt(mPrefijo[1], 10);
    }

    // Intento 2: Patrón [CODIGO]-[NUMERO] ej. VT-78, SP-1, E-0001
    const mCodigo = nombreLimpio.match(/(?:VT|TB|SP|PR|TM|EL|E)[-_ ]*(\d+)/i);
    if (mCodigo) {
      return parseInt(mCodigo[1], 10);
    }

    // Intento 3: Eliminar contenido entre paréntesis que suele ser orden o serial secundario ej (28960394) o (FV-1834B)
    const sinParentesis = nombreLimpio.replace(/\([^)]*\)/g, ' ');
    const mDigits = sinParentesis.match(/\b\d+\b/g);
    if (mDigits) {
      const nums = mDigits.map((n) => parseInt(n, 10)).filter((n) => !(n >= 2020 && n <= 2030));
      if (nums.length > 0) return nums[0];
    }

    // Intento 4: Secuencia de dígitos al final
    const matchFinal = nombreLimpio.match(/(\d+)(?:\D*)$/);
    if (matchFinal) {
      const num = parseInt(matchFinal[1], 10);
      if (!(num >= 2020 && num <= 2030)) return num;
    }

    return null;
  };

  // Sincronización directa desde Google Drive (lee todos los archivos que ya están en la carpeta)
  const handleSincronizarDriveDirecto = async () => {
    setCargandoDrive(true);
    setNotificacionDrive(null);
    try {
      const res = await driveService.listarArchivosDrive();
      if (!res.success || !res.files) {
        setNotificacionDrive(`No se pudieron listar los archivos de Google Drive: ${res.error || 'Error de conexión'}`);
        setCargandoDrive(false);
        return;
      }

      if (res.files.length === 0) {
        setNotificacionDrive('La carpeta de Google Drive está vacía o no tiene archivos PDF aún.');
        setCargandoDrive(false);
        return;
      }

      const detectados: CertificadoDetectado[] = res.files.map((f: ArchivoDriveItem, index: number) => {
        const clasif = detectarClasificacionDeNombre(f.name);
        const consecutivo = extraerConsecutivoDeNombre(f.name);
        return {
          idTemp: `drive-${f.id || index}-${Date.now()}`,
          nombre: f.name,
          consecutivoDetectado: consecutivo,
          codigoClasificacion: clasif,
          driveUrl: f.webViewLink,
          driveId: f.id,
          origen: 'drive',
        };
      });

      setArchivosAnalizados(detectados);
      setNotificacionDrive(`¡Sincronización exitosa! Se detectaron ${detectados.length} archivos en tu Google Drive.`);
      setTimeout(() => setNotificacionDrive(null), 5000);
    } catch (err: any) {
      setNotificacionDrive(`Error al consultar Google Drive: ${err.message}`);
    } finally {
      setCargandoDrive(false);
    }
  };

  // Cargar automáticamente archivos de Google Drive al montar
  useEffect(() => {
    handleSincronizarDriveDirecto();
  }, []);

  const handleFilesSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const files = Array.from(e.target.files);

    const nuevos: CertificadoDetectado[] = files.map((file, idx) => {
      const clasif = detectarClasificacionDeNombre(file.name);
      const consecutivo = extraerConsecutivoDeNombre(file.name);
      return {
        idTemp: `local-${idx}-${Date.now()}`,
        archivo: file,
        nombre: file.name,
        consecutivoDetectado: consecutivo,
        codigoClasificacion: clasif,
        origen: 'local',
      };
    });

    setArchivosAnalizados((prev) => [...prev, ...nuevos]);
  };

  const handleCambiarClasificacionArchivo = (idTemp: string, nuevoCodigo: CodigoClasificacion) => {
    setArchivosAnalizados((prev) =>
      prev.map((item) => (item.idTemp === idTemp ? { ...item, codigoClasificacion: nuevoCodigo } : item))
    );
  };

  const handleCambiarConsecutivoArchivo = (idTemp: string, nuevoNum: number) => {
    setArchivosAnalizados((prev) =>
      prev.map((item) => (item.idTemp === idTemp ? { ...item, consecutivoDetectado: nuevoNum } : item))
    );
  };

  // Cálculo de resumen agrupado por clasificación
  const resumenPorClasificacion: Record<string, { count: number; maxNumero: number; items: CertificadoDetectado[] }> = {};
  series.forEach((s) => {
    resumenPorClasificacion[s.clasificacionCodigo] = { count: 0, maxNumero: 0, items: [] };
  });

  archivosAnalizados.forEach((item) => {
    if (!resumenPorClasificacion[item.codigoClasificacion]) {
      resumenPorClasificacion[item.codigoClasificacion] = { count: 0, maxNumero: 0, items: [] };
    }
    resumenPorClasificacion[item.codigoClasificacion].count += 1;
    resumenPorClasificacion[item.codigoClasificacion].items.push(item);
    if (
      item.consecutivoDetectado !== null &&
      item.consecutivoDetectado > resumenPorClasificacion[item.codigoClasificacion].maxNumero
    ) {
      resumenPorClasificacion[item.codigoClasificacion].maxNumero = item.consecutivoDetectado;
    }
  });

  // Calibrar una clasificación individual
  const calibrarClasificacion = async (codigoClasif: CodigoClasificacion, maxNum: number, items: CertificadoDetectado[]) => {
    if (maxNum <= 0) return;

    // 1. Calibrar serie en el servicio
    storageService.calibrarConsecutivoDesdeHistorico(codigoClasif, maxNum, usuarioActual);

    // 2. Registrar en historial si está marcado
    if (registrarEnLista) {
      setSubiendoADrive(true);
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        let driveUrl = item.driveUrl || driveConfig.folderUrl;

        if (item.origen === 'local' && item.archivo) {
          setProgresoSubida(`Subiendo a Google Drive (${i + 1}/${items.length}): ${item.nombre}`);
          try {
            const res = await driveService.subirArchivo(item.archivo, item.nombre);
            if (res.success && res.webViewLink) {
              driveUrl = res.webViewLink;
            }
          } catch (e) {
            console.warn('Subida no completada, usando URL de carpeta', e);
          }
        }

        const serieActual = series.find(
          (s) => s.clasificacionCodigo === codigoClasif || s.id === `ser-${codigoClasif.toLowerCase()}`
        );
        const prefijo = serieActual?.prefijo || 'TEST';
        const numStr = item.consecutivoDetectado
          ? String(item.consecutivoDetectado).padStart(serieActual?.longitudDigitos || 4, '0')
          : '0001';
        const consecutivoFinal = `${prefijo}-${codigoClasif}-${new Date().getFullYear()}-${numStr}`;

        storageService.importarCertificadoHistorico(
          {
            numeroConsecutivo: consecutivoFinal,
            clasificacionCodigo: codigoClasif,
            nombreArchivo: item.nombre,
            googleDriveUrl: driveUrl,
          },
          usuarioActual
        );
      }
      setSubiendoADrive(false);
      setProgresoSubida(null);
    }

    setSeries(storageService.getSeries());
    setCalibracionExito(
      `¡Serie [${codigoClasif}] calibrada con éxito! Último número ajustado a ${maxNum}. El próximo certificado nuevo será el #${maxNum + 1}.`
    );
    setTimeout(() => setCalibracionExito(null), 6000);
  };

  // Calibrar todas las clasificaciones detectadas en 1 clic
  const handleCalibrarTodasLasSeries = async () => {
    const clasificacionesConArchivos = Object.entries(resumenPorClasificacion).filter(
      ([_, data]) => data.count > 0 && data.maxNumero > 0
    );

    if (clasificacionesConArchivos.length === 0) return;

    for (const [cod, data] of clasificacionesConArchivos) {
      await calibrarClasificacion(cod as CodigoClasificacion, data.maxNumero, data.items);
    }

    setCalibracionExito(
      `¡Todas las series detectadas (${clasificacionesConArchivos.length}) han sido calibradas con éxito! Las próximas emisiones continuarán en la secuencia correcta.`
    );
    setTimeout(() => setCalibracionExito(null), 7000);
  };

  // Filtrado de la lista según la pestaña seleccionada
  const archivosMostrados = archivosAnalizados.filter((item) => {
    if (filtroVisual === 'TODAS') return true;
    return item.codigoClasificacion === filtroVisual;
  });

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-8">
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Settings className="w-7 h-7 text-blue-600" />
            Configuración de Series y Consecutivos
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Reglas de numeración atómica aprobadas: formato <code>[PREFIJO]-[CODIGO]-[AÑO]-[NUMERO]</code> con reinicio anual automático y enlace a almacenamiento en Google Drive.
          </p>
        </div>

        {esAdmin && (
          <button
            onClick={handleGuardarTodo}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg shadow-sm text-sm transition-all cursor-pointer"
          >
            <Save className="w-4 h-4" />
            Guardar Parámetros de Series
          </button>
        )}
      </div>

      {guardadoMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center gap-3 text-emerald-800 text-sm animate-fade-in">
          <Check className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          <span>{guardadoMsg}</span>
        </div>
      )}

      {/* BANNER GOOGLE DRIVE VINCULADO */}
      <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-blue-50 border border-emerald-200 rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 rounded-xl bg-white shadow-sm border border-emerald-100 flex items-center justify-center flex-shrink-0">
              <FolderSync className="w-6 h-6 text-emerald-600" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-semibold text-slate-900">Almacenamiento Conectado: Google Drive Nexatech</h3>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                  <CheckCircle2 className="w-3 h-3 mr-1" />
                  Sincronizado
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-1">
                Carpeta vinculada: <span className="font-mono font-medium text-slate-800">Certificados-app</span> (ID: <code className="text-emerald-700 bg-white/70 px-1 py-0.5 rounded border border-emerald-200">{driveConfig.folderId}</code>). Los PDFs anteriores y los nuevos respaldos se conservan aquí sin consumir la cuota de la base de datos.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 self-stretch sm:self-auto">
            <button
              onClick={handleSincronizarDriveDirecto}
              disabled={cargandoDrive}
              className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-70 text-white font-medium rounded-lg shadow-sm text-xs transition-colors cursor-pointer"
            >
              {cargandoDrive ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <RefreshCw className="w-3.5 h-3.5" />
              )}
              <span>Sincronizar Archivos de Google Drive</span>
            </button>

            <a
              href={driveConfig.folderUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 bg-white hover:bg-emerald-50 text-emerald-700 font-medium rounded-lg border border-emerald-300 shadow-xs text-xs transition-colors justify-center"
            >
              <span>Abrir Carpeta en Google Drive</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

        {notificacionDrive && (
          <div className="mt-4 p-3 bg-white/80 border border-emerald-300 rounded-xl text-xs text-emerald-900 font-medium flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{notificacionDrive}</span>
          </div>
        )}
      </div>

      {/* SECCION 1: PANEL DE CALIBRACIÓN MULTI-DISCIPLINA */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-600" />
              Panel de Calibración de Series desde Certificados Anteriores
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              El sistema lee todos los PDFs de tu Google Drive, clasifica automáticamente cada certificado (Válvulas, Tuberías, Eléctrica, etc.) y calcula el último número consecutivo emitido.
            </p>
          </div>

          {archivosAnalizados.length > 0 && (
            <button
              onClick={handleCalibrarTodasLasSeries}
              disabled={subiendoADrive}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold rounded-xl text-xs shadow-md transition cursor-pointer self-start sm:self-auto"
            >
              {subiendoADrive ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>{progresoSubida || 'Calibrando y sincronizando...'}</span>
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4 text-amber-300" />
                  <span>Calibrar Todas las Series Detectadas</span>
                </>
              )}
            </button>
          )}
        </div>

        {calibracionExito && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-3 text-emerald-800 text-sm">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span className="font-medium">{calibracionExito}</span>
          </div>
        )}

        {/* TARJETAS RESUMEN POR CADA CLASIFICACIÓN DETECTADA */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {series.map((s) => {
            const data = resumenPorClasificacion[s.clasificacionCodigo] || { count: 0, maxNumero: 0, items: [] };
            const tieneArchivos = data.count > 0;

            return (
              <div
                key={s.id}
                className={`p-4 rounded-xl border transition-all ${
                  tieneArchivos
                    ? 'bg-gradient-to-br from-slate-50 to-indigo-50/30 border-indigo-200 shadow-xs'
                    : 'bg-slate-50/50 border-slate-200 opacity-70'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono bg-indigo-100 text-indigo-800 text-xs px-2 py-0.5 rounded font-bold">
                    [{s.clasificacionCodigo}] {s.nombre}
                  </span>
                  <span className="text-[11px] text-slate-500 font-medium">
                    {data.count} archivo(s)
                  </span>
                </div>

                <div className="mt-3 flex items-baseline justify-between">
                  <div>
                    <span className="text-[10px] text-slate-500 block uppercase font-medium">Último detectado</span>
                    <span className="text-xl font-mono font-bold text-slate-900">
                      {data.maxNumero > 0 ? `#${data.maxNumero}` : 'Sin archivos'}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-500 block uppercase font-medium">Serie actual</span>
                    <span className="text-sm font-mono text-slate-600">
                      #{s.ultimoNumero}
                    </span>
                  </div>
                </div>

                {tieneArchivos && (
                  <button
                    onClick={() => calibrarClasificacion(s.clasificacionCodigo, data.maxNumero, data.items)}
                    disabled={subiendoADrive || data.maxNumero <= 0}
                    className="mt-3 w-full inline-flex items-center justify-center gap-1.5 py-1.5 px-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg text-xs font-semibold shadow-xs transition cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Calibrar serie a #{data.maxNumero}</span>
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {/* ZONA DE ARRASTRE PARA ARCHIVOS LOCALES ADICIONALES */}
        <div>
          <label className="flex flex-col items-center justify-center border-2 border-dashed border-indigo-200 hover:border-indigo-400 bg-indigo-50/30 hover:bg-indigo-50/60 rounded-xl p-4 cursor-pointer transition-all">
            <UploadCloud className="w-7 h-7 text-indigo-500 mb-1" />
            <span className="text-xs font-medium text-indigo-900">
              ¿Tienes más certificados en tu computador? Haz clic aquí o arrástralos para analizarlos también
            </span>
            <input
              type="file"
              multiple
              accept=".pdf"
              className="hidden"
              onChange={handleFilesSelected}
            />
          </label>
        </div>

        {/* LISTADO DE TODOS LOS ARCHIVOS ANALIZADOS CON PESTAÑAS DE FILTRO */}
        {archivosAnalizados.length > 0 && (
          <div className="space-y-4 pt-2">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
              {/* Pestañas de filtro rápido */}
              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setFiltroVisual('TODAS')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                    filtroVisual === 'TODAS'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  Todos ({archivosAnalizados.length})
                </button>

                {series.map((s) => {
                  const count = resumenPorClasificacion[s.clasificacionCodigo]?.count || 0;
                  if (count === 0) return null;
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setFiltroVisual(s.clasificacionCodigo)}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                        filtroVisual === s.clasificacionCodigo
                          ? 'bg-indigo-600 text-white'
                          : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      [{s.clasificacionCodigo}] ({count})
                    </button>
                  );
                })}
              </div>

              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={registrarEnLista}
                    onChange={(e) => setRegistrarEnLista(e.target.checked)}
                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>Registrar en historial con enlace a Drive</span>
                </label>
              </div>
            </div>

            {/* Lista detallada de archivos */}
            <div className="max-h-72 overflow-y-auto border border-slate-200 rounded-xl divide-y divide-slate-100">
              {archivosMostrados.map((item) => (
                <div key={item.idTemp} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 text-xs hover:bg-slate-50 gap-2">
                  <div className="flex items-center gap-2.5 truncate">
                    <FileText className="w-4 h-4 text-rose-500 shrink-0" />
                    <span className="font-mono text-slate-800 truncate max-w-sm sm:max-w-md" title={item.nombre}>
                      {item.nombre}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] bg-slate-100 text-slate-600 border border-slate-200 uppercase font-semibold shrink-0">
                      {item.origen === 'drive' ? 'Google Drive' : 'Local'}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    {/* Selector de Clasificación editable por archivo si se desea corregir */}
                    <div className="flex items-center gap-1">
                      <span className="text-[10px] text-slate-400 font-semibold">Tipo:</span>
                      <select
                        value={item.codigoClasificacion}
                        onChange={(e) => handleCambiarClasificacionArchivo(item.idTemp, e.target.value as CodigoClasificacion)}
                        className="text-[11px] font-bold bg-white border border-slate-300 rounded px-1.5 py-0.5 text-indigo-700"
                      >
                        {series.map((s) => (
                          <option key={s.id} value={s.clasificacionCodigo}>
                            [{s.clasificacionCodigo}] {s.nombre}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Consecutivo detectado editable */}
                    <div className="flex items-center gap-1 font-mono">
                      <span className="text-[10px] text-slate-400 font-semibold">Num:</span>
                      <input
                        type="number"
                        value={item.consecutivoDetectado ?? ''}
                        onChange={(e) => handleCambiarConsecutivoArchivo(item.idTemp, parseInt(e.target.value, 10) || 0)}
                        className="w-16 px-1.5 py-0.5 border border-indigo-200 bg-indigo-50/50 rounded text-center font-bold text-indigo-800 text-xs"
                      />
                    </div>

                    {item.driveUrl && (
                      <a
                        href={item.driveUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-emerald-600 hover:underline flex items-center gap-1 text-[11px] font-medium"
                      >
                        <span>Ver en Drive</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* SECCION 2: TABLA DE PARÁMETROS ATÓMICOS */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100">
          <h2 className="text-lg font-bold text-slate-900">Parámetros Operativos de Numeración por Serie</h2>
          <p className="text-xs text-slate-500 mt-1">
            Visualiza y edita los prefijos, códigos técnicos, año fiscal activo, longitud de relleno de ceros y último consecutivo generado.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-700">
            <thead className="bg-slate-50 text-slate-600 font-semibold text-xs border-b border-slate-200 uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Clasificación</th>
                <th className="py-3 px-4">Código</th>
                <th className="py-3 px-4">Prefijo Empresa</th>
                <th className="py-3 px-4">Año Activo</th>
                <th className="py-3 px-4">Relleno Ceros</th>
                <th className="py-3 px-4">Último Número</th>
                <th className="py-3 px-4">Próximo a Generar</th>
                <th className="py-3 px-4">Reinicio Anual</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-xs">
              {series.map((s) => {
                const proximoNumero = String(s.ultimoNumero + 1).padStart(s.longitudDigitos, '0');
                const ejemploProximo = `${s.prefijo}-${s.clasificacionCodigo}-${s.anioVigente}-${proximoNumero}`;

                return (
                  <tr key={s.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 font-semibold text-slate-900">{s.nombre}</td>
                    <td className="py-3 px-4">
                      {esAdmin ? (
                        <input
                          type="text"
                          value={s.clasificacionCodigo}
                          onChange={(e) =>
                            handleUpdate(s.id, 'clasificacionCodigo', e.target.value.toUpperCase())
                          }
                          maxLength={8}
                          className="w-16 px-2 py-1 border border-blue-300 bg-blue-50/60 focus:bg-white rounded font-mono font-bold text-blue-700 text-xs text-center focus:ring-2 focus:ring-blue-400 outline-none uppercase"
                          title="Código de clasificación técnica (editable por el Administrador)"
                        />
                      ) : (
                        <span className="font-mono bg-blue-50 text-blue-700 px-2 py-0.5 rounded border border-blue-200 font-bold">
                          {s.clasificacionCodigo}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <input
                        type="text"
                        disabled={!esAdmin}
                        value={s.prefijo}
                        onChange={(e) => handleUpdate(s.id, 'prefijo', e.target.value.toUpperCase())}
                        className="w-20 px-2 py-1 border border-slate-300 rounded font-mono font-medium text-slate-800 disabled:bg-slate-100"
                      />
                    </td>
                    <td className="py-3 px-4">
                      <input
                        type="number"
                        disabled={!esAdmin}
                        value={s.anioVigente}
                        onChange={(e) => handleUpdate(s.id, 'anioVigente', parseInt(e.target.value, 10))}
                        className="w-20 px-2 py-1 border border-slate-300 rounded font-mono font-medium text-slate-800 disabled:bg-slate-100"
                      />
                    </td>
                    <td className="py-3 px-4">
                      <input
                        type="number"
                        min="3"
                        max="8"
                        disabled={!esAdmin}
                        value={s.longitudDigitos}
                        onChange={(e) => handleUpdate(s.id, 'longitudDigitos', parseInt(e.target.value, 10))}
                        className="w-16 px-2 py-1 border border-slate-300 rounded font-mono font-medium text-slate-800 disabled:bg-slate-100"
                      />
                    </td>
                    <td className="py-3 px-4">
                      <input
                        type="number"
                        min="0"
                        disabled={!esAdmin}
                        value={s.ultimoNumero}
                        onChange={(e) => handleUpdate(s.id, 'ultimoNumero', parseInt(e.target.value, 10))}
                        className="w-24 px-2 py-1 border border-indigo-300 bg-indigo-50/50 rounded font-mono font-bold text-indigo-700 disabled:bg-slate-100"
                      />
                    </td>
                    <td className="py-3 px-4 font-mono font-semibold text-emerald-700 bg-emerald-50/40 rounded px-2">
                      {ejemploProximo}
                    </td>
                    <td className="py-3 px-4">
                      <label className="inline-flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="checkbox"
                          disabled={!esAdmin}
                          checked={s.reinicioAnual}
                          onChange={(e) => handleUpdate(s.id, 'reinicioAnual', e.target.checked)}
                          className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 disabled:opacity-50"
                        />
                        <span className="text-slate-600">Activo</span>
                      </label>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Control de concurrencia e inmutabilidad garantizados por transacciones atómicas de base de datos.</span>
          </div>
          {!esAdmin && (
            <span className="text-amber-600 font-medium">Modo solo lectura (se requieren permisos de Administrador).</span>
          )}
        </div>
      </div>
    </div>
  );
};
