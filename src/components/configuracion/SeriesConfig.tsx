import React, { useState } from 'react';
import type { SerieConsecutiva, Usuario, CodigoClasificacion } from '../../types';
import { storageService } from '../../services/storageService';
import { 
  Settings, 
  ShieldCheck, 
  Save, 
  Check, 
  UploadCloud, 
  FileText, 
  ExternalLink, 
  FolderSync, 
  ArrowRight,
  Sparkles,
  CheckCircle2
} from 'lucide-react';

interface SeriesConfigProps {
  usuarioActual: Usuario;
}

interface CertificadoDetectado {
  archivo: File;
  nombre: string;
  consecutivoDetectado: number | null;
  codigoClasificacion: CodigoClasificacion;
}

export const SeriesConfig: React.FC<SeriesConfigProps> = ({ usuarioActual }) => {
  const [series, setSeries] = useState<SerieConsecutiva[]>(storageService.getSeries());
  const [guardadoMsg, setGuardadoMsg] = useState<string | null>(null);
  
  // Google Drive config
  const driveConfig = storageService.getGoogleDriveConfig();
  const [clasificacionSeleccionada, setClasificacionSeleccionada] = useState<CodigoClasificacion>('VT');
  
  // Importador histórico
  const [archivosAnalizados, setArchivosAnalizados] = useState<CertificadoDetectado[]>([]);
  const [calibracionExito, setCalibracionExito] = useState<string | null>(null);
  const [registrarEnLista, setRegistrarEnLista] = useState(true);

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

  // Analizador inteligente de nombres de archivos PDF
  const extraerConsecutivoDeNombre = (nombreArchivo: string): number | null => {
    const nombreLimpio = nombreArchivo.replace(/\.pdf$/i, '');
    
    // Intento 1: Formato estándar [PREFIJO]-[CODIGO]-[AÑO]-[NUMERO] -> toma el último bloque numérico
    const partes = nombreLimpio.split(/[-_/\s]+/);
    for (let i = partes.length - 1; i >= 0; i--) {
      const parte = partes[i];
      if (/^\d+$/.test(parte)) {
        const num = parseInt(parte, 10);
        // Descartar si parece un año reciente (2020 a 2030) a menos que sea el único
        if (num >= 2020 && num <= 2030 && partes.length > 1) {
          continue;
        }
        return num;
      }
    }

    // Intento 2: Buscar secuencias de dígitos al final de la cadena
    const matchFinal = nombreLimpio.match(/(\d+)$/);
    if (matchFinal) {
      return parseInt(matchFinal[1], 10);
    }

    // Intento 3: Cualquier número en el nombre
    const matchCualquiera = nombreLimpio.match(/\d+/g);
    if (matchCualquiera && matchCualquiera.length > 0) {
      const posibles = matchCualquiera
        .map((n) => parseInt(n, 10))
        .filter((n) => !(n >= 2020 && n <= 2030));
      if (posibles.length > 0) {
        return Math.max(...posibles);
      }
      return parseInt(matchCualquiera[matchCualquiera.length - 1], 10);
    }

    return null;
  };

  const handleFilesSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const files = Array.from(e.target.files);

    const resultados: CertificadoDetectado[] = files.map((file) => {
      const consecutivo = extraerConsecutivoDeNombre(file.name);
      return {
        archivo: file,
        nombre: file.name,
        consecutivoDetectado: consecutivo,
        codigoClasificacion: clasificacionSeleccionada,
      };
    });

    setArchivosAnalizados(resultados);
  };

  const maxConsecutivoDetectado = archivosAnalizados.reduce((max, item) => {
    if (item.consecutivoDetectado !== null && item.consecutivoDetectado > max) {
      return item.consecutivoDetectado;
    }
    return max;
  }, 0);

  const handleAplicarCalibracion = () => {
    if (maxConsecutivoDetectado <= 0) return;

    // 1. Calibrar serie
    storageService.calibrarConsecutivoDesdeHistorico(
      clasificacionSeleccionada,
      maxConsecutivoDetectado,
      usuarioActual
    );

    // 2. Si se eligió registrar en la lista de reportes para consulta
    if (registrarEnLista) {
      archivosAnalizados.forEach((item) => {
        const serieActual = series.find((s) => s.clasificacionCodigo === clasificacionSeleccionada);
        const prefijo = serieActual?.prefijo || 'TEST';
        const numStr = item.consecutivoDetectado
          ? String(item.consecutivoDetectado).padStart(serieActual?.longitudDigitos || 4, '0')
          : '0001';
        const consecutivoFinal = `${prefijo}-${clasificacionSeleccionada}-${new Date().getFullYear()}-${numStr}`;

        storageService.importarCertificadoHistorico(
          {
            numeroConsecutivo: consecutivoFinal,
            clasificacionCodigo: clasificacionSeleccionada,
            nombreArchivo: item.nombre,
            googleDriveUrl: driveConfig.folderUrl,
          },
          usuarioActual
        );
      });
    }

    // Refrescar series en estado
    setSeries(storageService.getSeries());
    setCalibracionExito(
      `¡Serie [${clasificacionSeleccionada}] calibrada con éxito! Último número ajustado a ${maxConsecutivoDetectado}. El próximo certificado generado será el #${maxConsecutivoDetectado + 1}.`
    );
    setArchivosAnalizados([]);
    setTimeout(() => setCalibracionExito(null), 6000);
  };

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
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg shadow-sm text-sm transition-all"
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

          <a
            href={driveConfig.folderUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 bg-white hover:bg-emerald-50 text-emerald-700 font-medium rounded-lg border border-emerald-300 shadow-xs text-xs transition-colors self-stretch sm:self-auto justify-center"
          >
            <span>Abrir Carpeta en Google Drive</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      {/* SECCION 1: SUBIDA Y DETECCION DE HISTORICOS PARA CALIBRAR CONSECUTIVOS */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-600" />
              Calibración Automática de Consecutivos desde Certificados Anteriores (PDF)
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Selecciona la clasificación técnica y arrastra tus PDFs anteriores (subidos a tu Google Drive). El sistema analiza los nombres de archivo, detecta el último número consecutivo emitido y ajusta la serie automáticamente para que la plataforma continúe la secuencia correcta.
            </p>
          </div>
        </div>

        {calibracionExito && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-3 text-emerald-800 text-sm">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            <span className="font-medium">{calibracionExito}</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
              1. Clasificación Técnica
            </label>
            <select
              value={clasificacionSeleccionada}
              onChange={(e) => setClasificacionSeleccionada(e.target.value as CodigoClasificacion)}
              className="w-full text-sm border-slate-300 rounded-lg shadow-sm focus:border-indigo-500 focus:ring-indigo-500 bg-slate-50 p-2.5 font-medium"
            >
              {series.map((s) => (
                <option key={s.id} value={s.clasificacionCodigo}>
                  [{s.clasificacionCodigo}] {s.nombre} (Último actual: #{s.ultimoNumero})
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
              2. Subir o Arrastrar Certificados Anteriores (Archivos .PDF)
            </label>
            <label className="flex flex-col items-center justify-center border-2 border-dashed border-indigo-200 hover:border-indigo-400 bg-indigo-50/40 hover:bg-indigo-50/70 rounded-xl p-4 cursor-pointer transition-all">
              <UploadCloud className="w-8 h-8 text-indigo-500 mb-1" />
              <span className="text-xs font-medium text-indigo-900">
                Haz clic para seleccionar o arrastra tus archivos PDF aquí
              </span>
              <span className="text-[11px] text-slate-500 mt-0.5">
                (Formatos soportados: TEST-VT-2026-0035.pdf, VT-0042.pdf, Certificado_50.pdf, etc.)
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
        </div>

        {/* Listado de archivos analizados */}
        {archivosAnalizados.length > 0 && (
          <div className="space-y-4 pt-2">
            <div className="flex items-center justify-between bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
                  Archivos Analizados: {archivosAnalizados.length}
                </span>
                <p className="text-sm font-semibold text-slate-900 mt-0.5">
                  Último número consecutivo detectado:{' '}
                  <span className="text-indigo-600 text-lg font-bold font-mono">
                    #{maxConsecutivoDetectado > 0 ? maxConsecutivoDetectado : 'No detectado'}
                  </span>
                </p>
              </div>

              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={registrarEnLista}
                    onChange={(e) => setRegistrarEnLista(e.target.checked)}
                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>Registrar en historial con enlace a Drive</span>
                </label>

                <button
                  onClick={handleAplicarCalibracion}
                  disabled={maxConsecutivoDetectado <= 0}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-medium rounded-lg text-sm shadow-sm transition-all"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Calibrar Serie a #{maxConsecutivoDetectado}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="max-h-60 overflow-y-auto border border-slate-200 rounded-xl divide-y divide-slate-100">
              {archivosAnalizados.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 text-xs hover:bg-slate-50">
                  <div className="flex items-center gap-2.5 truncate">
                    <FileText className="w-4 h-4 text-rose-500 flex-shrink-0" />
                    <span className="font-mono text-slate-800 truncate">{item.nombre}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-slate-400">{(item.archivo.size / 1024).toFixed(1)} KB</span>
                    {item.consecutivoDetectado !== null ? (
                      <span className="px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-800 font-mono font-bold">
                        Consecutivo: #{item.consecutivoDetectado}
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 font-medium">
                        Sin número evidente
                      </span>
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
            Visualiza y edita los prefijos, año fiscal activo, longitud de relleno de ceros y último consecutivo generado.
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
                      <span className="font-mono bg-blue-50 text-blue-700 px-2 py-0.5 rounded border border-blue-200 font-bold">
                        {s.clasificacionCodigo}
                      </span>
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
