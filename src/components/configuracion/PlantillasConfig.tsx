import React, { useState } from 'react';
import type { PlantillaDocumental, CodigoClasificacion, Usuario } from '../../types';
import { storageService } from '../../services/storageService';
import {
  DEFAULT_LOGO_IZQUIERDO,
  DEFAULT_LOGO_DERECHO,
  DEFAULT_COLOR_PRIMARIO,
  DEFAULT_COLOR_SECUNDARIO,
  DEFAULT_COLOR_TEXTO,
  PALETAS_PREDEFINIDAS,
} from '../../utils/themeDefaults';
import { optimizarImagenParaLogo } from '../../utils/imageOptimizer';
import {
  FileText,
  Plus,
  Edit,
  Copy,
  Trash2,
  Check,
  AlertCircle,
  Eye,
  X,
  Languages,
  Upload,
  Image as ImageIcon,
  Palette,
  RotateCcw,
  Layers,
  RefreshCw,
} from 'lucide-react';

interface PlantillasConfigProps {
  usuarioActual: Usuario;
}

export const PlantillasConfig: React.FC<PlantillasConfigProps> = ({ usuarioActual }) => {
  const [plantillas, setPlantillas] = useState<PlantillaDocumental[]>(storageService.getPlantillas());
  const [filtroClasificacion, setFiltroClasificacion] = useState<string>('TODAS');
  const [modalAbierto, setModalAbierto] = useState<boolean>(false);
  const [plantillaEnEdicion, setPlantillaEnEdicion] = useState<PlantillaDocumental | null>(null);
  const [mensajeExito, setMensajeExito] = useState<string | null>(null);
  const [previewPlantilla, setPreviewPlantilla] = useState<PlantillaDocumental | null>(null);
  const [replicarLogosATodas, setReplicarLogosATodas] = useState<boolean>(true);
  const [replicarColoresATodas, setReplicarColoresATodas] = useState<boolean>(true);

  const puedeEditar = ['administrador', 'director_tecnico'].includes(usuarioActual.rol);

  const plantillasFiltradas = plantillas.filter((p) => {
    if (filtroClasificacion === 'TODAS') return true;
    return p.clasificacionCodigo === filtroClasificacion;
  });

  const recargar = () => {
    setPlantillas([...storageService.getPlantillas()]);
  };

  const handleNueva = () => {
    setPlantillaEnEdicion({
      id: `plan-${Date.now()}`,
      clasificacionCodigo: 'VT',
      nombreIdentificador: '',
      tipoElemento: 'Válvulas',
      tituloReporteEs: 'REPORTE DE PRUEBA DE VALVULAS',
      tituloReporteEn: 'Valve Test Report',
      subtituloNormativo: 'Conforme a Procedimiento Técnico Interno',
      codigoFormato: 'FOR-MET-VT-01',
      versionRevision: 'v1.0 (Rev 01)',
      logoIzquierdoUrl: DEFAULT_LOGO_IZQUIERDO,
      logoDerechoUrl: DEFAULT_LOGO_DERECHO,
      colorPrimario: DEFAULT_COLOR_PRIMARIO,
      colorSecundario: DEFAULT_COLOR_SECUNDARIO,
      colorTextoEncabezado: DEFAULT_COLOR_TEXTO,
      declaracionTrazabilidadPorDefecto:
        'Los resultados contenidos en este reporte cuentan con trazabilidad metrológica hacia patrones nacionales e internacionales del Sistema Internacional de Unidades (SI).',
      declaracionesConformidadPorDefecto:
        'Los resultados expresados se refieren exclusivamente al ítem inspeccionado y en las condiciones indicadas.',
      activa: true,
    });
    setModalAbierto(true);
  };

  const handleEditar = (p: PlantillaDocumental) => {
    const globalCfg = storageService.getConfiguracionGlobal();
    setPlantillaEnEdicion({
      ...p,
      logoIzquierdoUrl: p.logoIzquierdoUrl || globalCfg.logoIzquierdoUrl || DEFAULT_LOGO_IZQUIERDO,
      logoDerechoUrl: p.logoDerechoUrl || globalCfg.logoDerechoUrl || DEFAULT_LOGO_DERECHO,
      colorPrimario: p.colorPrimario || globalCfg.colorPrimario || DEFAULT_COLOR_PRIMARIO,
      colorSecundario: p.colorSecundario || globalCfg.colorSecundario || DEFAULT_COLOR_SECUNDARIO,
      colorTextoEncabezado: p.colorTextoEncabezado || globalCfg.colorTextoEncabezado || DEFAULT_COLOR_TEXTO,
    });
    setModalAbierto(true);
  };

  const handleDuplicar = (p: PlantillaDocumental) => {
    const clon: PlantillaDocumental = {
      ...p,
      id: `plan-${Date.now()}`,
      nombreIdentificador: `${p.nombreIdentificador} (Copia)`,
      codigoFormato: `${p.codigoFormato}-C`,
    };
    storageService.guardarPlantilla(clon, usuarioActual);
    recargar();
    setMensajeExito(`Plantilla "${clon.nombreIdentificador}" creada como duplicado.`);
    setTimeout(() => setMensajeExito(null), 3000);
  };

  const handleEliminar = (id: string, nombre: string) => {
    if (confirm(`¿Estás seguro de eliminar la plantilla "${nombre}"?`)) {
      storageService.eliminarPlantilla(id, usuarioActual);
      recargar();
      setMensajeExito(`Plantilla "${nombre}" eliminada correctamente.`);
      setTimeout(() => setMensajeExito(null), 3000);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>, lado: 'izquierdo' | 'derecho') => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert('La imagen no debe superar los 5MB.');
      return;
    }

    try {
      const optimizedBase64 = await optimizarImagenParaLogo(file, 400);
      if (plantillaEnEdicion) {
        setPlantillaEnEdicion({
          ...plantillaEnEdicion,
          [lado === 'izquierdo' ? 'logoIzquierdoUrl' : 'logoDerechoUrl']: optimizedBase64,
        });
      }
    } catch (err) {
      console.error('Error optimizando imagen de logo:', err);
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64 = event.target?.result as string;
        if (plantillaEnEdicion) {
          setPlantillaEnEdicion({
            ...plantillaEnEdicion,
            [lado === 'izquierdo' ? 'logoIzquierdoUrl' : 'logoDerechoUrl']: base64,
          });
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCopiarLogosATodasAhora = () => {
    if (!plantillaEnEdicion) return;

    storageService.aplicarLogosYColoresATodasLasPlantillas(
      {
        logoIzquierdoUrl: plantillaEnEdicion.logoIzquierdoUrl,
        logoDerechoUrl: plantillaEnEdicion.logoDerechoUrl,
        colorPrimario: plantillaEnEdicion.colorPrimario,
        colorSecundario: plantillaEnEdicion.colorSecundario,
        colorTextoEncabezado: plantillaEnEdicion.colorTextoEncabezado,
        incluirColores: replicarColoresATodas,
      },
      usuarioActual
    );
    recargar();
    setMensajeExito(
      `¡Logotipos ${replicarColoresATodas ? 'y colores ' : ''}copiados inmediatamente a todas las ${plantillas.length} plantillas del sistema (Válvulas, Tubería, Presión, Temperatura, Eléctricas)!`
    );
    setTimeout(() => setMensajeExito(null), 4000);
  };

  const handleSincronizarATodas = () => {
    const globalCfg = storageService.getConfiguracionGlobal();
    // Buscar la plantilla que tenga logos personalizados cargados, o usar globalCfg
    const plantillaReferencia = plantillas.find(
      (p) =>
        (p.logoIzquierdoUrl && p.logoIzquierdoUrl !== DEFAULT_LOGO_IZQUIERDO) ||
        (p.logoDerechoUrl && p.logoDerechoUrl !== DEFAULT_LOGO_DERECHO)
    ) || plantillas[0];

    const logoIzq = plantillaReferencia?.logoIzquierdoUrl || globalCfg.logoIzquierdoUrl;
    const logoDer = plantillaReferencia?.logoDerechoUrl || globalCfg.logoDerechoUrl;
    const colPri = plantillaReferencia?.colorPrimario || globalCfg.colorPrimario;
    const colSec = plantillaReferencia?.colorSecundario || globalCfg.colorSecundario;
    const colTxt = plantillaReferencia?.colorTextoEncabezado || globalCfg.colorTextoEncabezado;

    storageService.aplicarLogosYColoresATodasLasPlantillas(
      {
        logoIzquierdoUrl: logoIzq,
        logoDerechoUrl: logoDer,
        colorPrimario: colPri,
        colorSecundario: colSec,
        colorTextoEncabezado: colTxt,
        incluirColores: true,
      },
      usuarioActual
    );
    recargar();
    setMensajeExito(
      `¡Logotipos y colores sincronizados con éxito en todas las ${plantillas.length} plantillas del sistema!`
    );
    setTimeout(() => setMensajeExito(null), 4000);
  };

  const handleGuardarModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!plantillaEnEdicion) return;

    if (!plantillaEnEdicion.tituloReporteEs.trim()) {
      alert('El título del certificado en español es obligatorio.');
      return;
    }

    if (replicarLogosATodas) {
      // 1. Guardar primero la plantilla en edición para asegurar sus títulos, normas y códigos
      storageService.guardarPlantilla(plantillaEnEdicion, usuarioActual);

      // 2. Replicar los logos y colores de esta plantilla a todas las demás
      storageService.aplicarLogosYColoresATodasLasPlantillas(
        {
          logoIzquierdoUrl: plantillaEnEdicion.logoIzquierdoUrl,
          logoDerechoUrl: plantillaEnEdicion.logoDerechoUrl,
          colorPrimario: plantillaEnEdicion.colorPrimario,
          colorSecundario: plantillaEnEdicion.colorSecundario,
          colorTextoEncabezado: plantillaEnEdicion.colorTextoEncabezado,
          incluirColores: replicarColoresATodas,
        },
        usuarioActual
      );
    } else {
      storageService.guardarPlantilla(plantillaEnEdicion, usuarioActual);
    }

    recargar();
    setModalAbierto(false);
    setPlantillaEnEdicion(null);
    setMensajeExito(
      replicarLogosATodas
        ? `¡Plantilla guardada y logotipos ${replicarColoresATodas ? 'y colores ' : ''}copiados a todas las ${plantillas.length} plantillas del sistema!`
        : 'Plantilla documental y diseño visual guardados exitosamente.'
    );
    setTimeout(() => setMensajeExito(null), 4000);
  };

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-6">
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <FileText className="w-7 h-7 text-emerald-600" />
            Configuración de Plantillas, Logos & Colores de Certificados
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Personaliza el logo izquierdo y derecho, los colores del certificado (encabezados de tablas y títulos), subtítulo normativo y código de formato según cada tipo de elemento o disciplina.
          </p>
        </div>

        {puedeEditar && (
          <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
            <button
              type="button"
              onClick={handleSincronizarATodas}
              className="flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold transition border border-slate-300 shadow-xs cursor-pointer"
              title="Aplica los logotipos y colores configurados a todas las plantillas del catálogo"
            >
              <RefreshCw className="w-3.5 h-3.5 text-emerald-600" />
              <span>Sincronizar Logos a Todas</span>
            </button>
            <button
              onClick={handleNueva}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition shadow-xs cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Nueva Plantilla</span>
            </button>
          </div>
        )}
      </div>

      {mensajeExito && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs px-4 py-3 rounded-lg flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{mensajeExito}</span>
        </div>
      )}

      {!puedeEditar && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 text-xs px-4 py-3 rounded-lg flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
          <span>
            Estás visualizando las plantillas en modo lectura. Solo <strong>Administrador</strong> y <strong>Director Técnico</strong> pueden modificar logotipos, títulos o colores.
          </span>
        </div>
      )}

      {/* Barra de Filtros */}
      <div className="bg-white p-4 rounded-xl shadow-xs border border-slate-200 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-700">Filtrar por Disciplina:</span>
          <select
            value={filtroClasificacion}
            onChange={(e) => setFiltroClasificacion(e.target.value)}
            className="text-xs py-1.5 px-3 border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
          >
            <option value="TODAS">Todas las Disciplinas ({plantillas.length})</option>
            <option value="VT">VT - Válvulas</option>
            <option value="TB">TB - Tubería</option>
            <option value="PR">PR - Magnitud Presión</option>
            <option value="TM">TM - Magnitud Temperatura</option>
            <option value="EL">EL - Magnitudes Eléctricas</option>
          </select>
        </div>

        <span className="text-xs text-slate-500 font-mono">
          Mostrando {plantillasFiltradas.length} de {plantillas.length} plantillas configuradas
        </span>
      </div>

      {/* Grid de Plantillas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {plantillasFiltradas.map((p) => {
          const cPrimario = p.colorPrimario || DEFAULT_COLOR_PRIMARIO;
          const cSecundario = p.colorSecundario || DEFAULT_COLOR_SECUNDARIO;
          const logoIzq = p.logoIzquierdoUrl || DEFAULT_LOGO_IZQUIERDO;
          const logoDer = p.logoDerechoUrl || DEFAULT_LOGO_DERECHO;

          return (
            <div
              key={p.id}
              className={`bg-white rounded-xl border ${
                p.activa ? 'border-slate-200' : 'border-slate-300 bg-slate-50/70 opacity-75'
              } shadow-xs hover:border-slate-300 transition flex flex-col justify-between overflow-hidden`}
            >
              <div className="p-5 space-y-3">
                {/* Badges superiores y Paleta de Colores */}
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-emerald-50 text-emerald-800 border border-emerald-200 font-mono">
                    {p.clasificacionCodigo}
                  </span>
                  <div className="flex items-center gap-2">
                    {/* Indicadores visuales de colores configurados */}
                    <div className="flex items-center gap-1 bg-slate-50 px-2 py-0.5 rounded border border-slate-200" title="Colores del Certificado">
                      <span
                        className="w-3 h-3 rounded-full border border-black/10 inline-block"
                        style={{ backgroundColor: cPrimario }}
                        title={`Color Primario (Tablas): ${cPrimario}`}
                      />
                      <span
                        className="w-3 h-3 rounded-full border border-black/10 inline-block"
                        style={{ backgroundColor: cSecundario }}
                        title={`Color Secundario (Títulos): ${cSecundario}`}
                      />
                    </div>

                    <span className="font-mono text-[10px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                      {p.codigoFormato}
                    </span>
                    <span
                      className={`w-2 h-2 rounded-full ${
                        p.activa ? 'bg-emerald-500' : 'bg-slate-400'
                      }`}
                      title={p.activa ? 'Plantilla Activa' : 'Plantilla Inactiva'}
                    />
                  </div>
                </div>

                {/* Previsualización miniatura de logos */}
                <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50/80 border border-slate-200/80">
                  <div className="flex items-center gap-2">
                    <img
                      src={logoIzq}
                      alt="Logo Izq"
                      className="w-7 h-7 object-contain rounded bg-white p-0.5 border border-slate-200"
                    />
                    <span className="text-[10px] text-slate-500 font-medium">Logo Izq</span>
                  </div>
                  <div className="h-4 w-px bg-slate-200" />
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-slate-500 font-medium">Logo Der</span>
                    <img
                      src={logoDer}
                      alt="Logo Der"
                      className="w-7 h-7 object-contain rounded bg-white p-0.5 border border-slate-200"
                    />
                  </div>
                </div>

                {/* Nombre e Identificador */}
                <div>
                  <span className="text-[11px] font-semibold text-slate-500 block uppercase">
                    {p.tipoElemento}
                  </span>
                  <h3 className="font-bold text-slate-900 text-sm leading-snug">
                    {p.nombreIdentificador}
                  </h3>
                </div>

                {/* Título Oficial en Español e Inglés */}
                <div
                  className="p-3 rounded-lg border space-y-1.5"
                  style={{
                    borderColor: `${cSecundario}40`,
                    backgroundColor: `${cSecundario}08`,
                  }}
                >
                  <div>
                    <span className="text-[9px] font-bold uppercase text-slate-500 block flex items-center gap-1">
                      <Languages className="w-3 h-3 text-emerald-600" /> Título Principal (Español):
                    </span>
                    <p
                      className="font-bold text-xs uppercase tracking-tight"
                      style={{ color: cSecundario }}
                    >
                      {p.tituloReporteEs}
                    </p>
                  </div>

                  {p.tituloReporteEn && (
                    <div className="pt-1 border-t border-slate-200">
                      <span className="text-[9px] font-bold uppercase text-slate-500 block">
                        Equivalente en Inglés:
                      </span>
                      <p className="text-xs text-slate-600 italic">
                        {p.tituloReporteEn}
                      </p>
                    </div>
                  )}
                </div>

                {/* Muestra de barra de tabla con el color primario */}
                <div
                  className="px-2 py-1 rounded text-[10px] font-bold uppercase flex items-center justify-between"
                  style={{
                    backgroundColor: cPrimario,
                    color: p.colorTextoEncabezado || DEFAULT_COLOR_TEXTO,
                  }}
                >
                  <span>Encabezado de Tablas</span>
                  <span className="font-mono text-[9px] opacity-80">{cPrimario}</span>
                </div>

                {/* Subtítulo Normativo */}
                <div>
                  <span className="text-[10px] font-medium text-slate-500 block">
                    Referencia Normativa por Defecto:
                  </span>
                  <p className="text-xs text-slate-700 font-medium">
                    {p.subtituloNormativo || 'Sin norma específica'}
                  </p>
                </div>

                <div className="text-[10px] text-slate-400 font-mono pt-1">
                  Versión Documental: {p.versionRevision}
                </div>
              </div>

              {/* Acciones */}
              <div className="bg-slate-50 px-5 py-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <button
                  type="button"
                  onClick={() => setPreviewPlantilla(p)}
                  className="text-emerald-700 hover:text-emerald-900 font-medium flex items-center gap-1 cursor-pointer"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Vista Previa</span>
                </button>

                <div className="flex items-center gap-1">
                  {puedeEditar && (
                    <>
                      <button
                        type="button"
                        onClick={() => handleEditar(p)}
                        title="Editar Plantilla, Logos y Colores"
                        className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-200 rounded transition cursor-pointer"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDuplicar(p)}
                        title="Duplicar como base"
                        className="p-1.5 text-purple-600 hover:text-purple-800 hover:bg-purple-50 rounded transition cursor-pointer"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleEliminar(p.id, p.nombreIdentificador)}
                        title="Eliminar Plantilla"
                        className="p-1.5 text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded transition cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal de Creación / Edición */}
      {modalAbierto && plantillaEnEdicion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full my-8 overflow-hidden border border-slate-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-emerald-600" />
                <h3 className="font-bold text-slate-800 text-base">
                  {plantillaEnEdicion.id.startsWith('plan-') && !plantillas.some((p) => p.id === plantillaEnEdicion.id)
                    ? 'Nueva Plantilla Documental'
                    : 'Personalizar Plantilla, Logos y Colores'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setModalAbierto(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleGuardarModal} className="p-6 space-y-5 max-h-[80vh] overflow-y-auto text-xs">
              {/* Sección 1: Logos Institucionales (Izquierdo y Derecho) */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800 flex items-center gap-1.5 text-xs">
                    <ImageIcon className="w-4 h-4 text-emerald-600" />
                    Logos del Certificado (Izquierdo y Derecho)
                  </span>
                  <span className="text-[10px] text-slate-500">
                    PNG, JPG, WebP o SVG (Máx 2MB)
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Logo Izquierdo */}
                  <div className="bg-white p-3.5 rounded-lg border border-slate-200 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-700 text-[11px]">Logo Lado Izquierdo</span>
                      <span className="text-[9px] text-slate-400 uppercase">Empresa / BI</span>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="w-16 h-16 rounded-lg border border-slate-300 bg-slate-50 flex items-center justify-center p-1 shrink-0 overflow-hidden">
                        {plantillaEnEdicion.logoIzquierdoUrl ? (
                          <img
                            src={plantillaEnEdicion.logoIzquierdoUrl}
                            alt="Logo Izquierdo"
                            className="max-h-full max-w-full object-contain"
                          />
                        ) : (
                          <span className="text-[9px] text-slate-400 text-center">Sin Logo</span>
                        )}
                      </div>

                      <div className="space-y-1.5 flex-1">
                        <label className="flex items-center justify-center gap-1 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[11px] font-semibold cursor-pointer border border-slate-300 transition">
                          <Upload className="w-3 h-3" />
                          <span>Subir Imagen</span>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => handleLogoUpload(e, 'izquierdo')}
                          />
                        </label>

                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() =>
                              setPlantillaEnEdicion({
                                ...plantillaEnEdicion,
                                logoIzquierdoUrl: DEFAULT_LOGO_IZQUIERDO,
                              })
                            }
                            className="px-2 py-1 text-[10px] text-emerald-700 hover:bg-emerald-50 rounded border border-emerald-200 transition"
                            title="Restaurar logo corporativo BI por defecto"
                          >
                            Restaurar BI
                          </button>
                          {plantillaEnEdicion.logoIzquierdoUrl && (
                            <button
                              type="button"
                              onClick={() =>
                                setPlantillaEnEdicion({
                                  ...plantillaEnEdicion,
                                  logoIzquierdoUrl: '',
                                })
                              }
                              className="px-2 py-1 text-[10px] text-rose-600 hover:bg-rose-50 rounded border border-rose-200 transition"
                            >
                              Quitar
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Logo Derecho */}
                  <div className="bg-white p-3.5 rounded-lg border border-slate-200 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-700 text-[11px]">Logo Lado Derecho</span>
                      <span className="text-[9px] text-slate-400 uppercase">Sello / Laboratorio</span>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="w-16 h-16 rounded-lg border border-slate-300 bg-slate-50 flex items-center justify-center p-1 shrink-0 overflow-hidden">
                        {plantillaEnEdicion.logoDerechoUrl ? (
                          <img
                            src={plantillaEnEdicion.logoDerechoUrl}
                            alt="Logo Derecho"
                            className="max-h-full max-w-full object-contain"
                          />
                        ) : (
                          <span className="text-[9px] text-slate-400 text-center">Sin Logo</span>
                        )}
                      </div>

                      <div className="space-y-1.5 flex-1">
                        <label className="flex items-center justify-center gap-1 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[11px] font-semibold cursor-pointer border border-slate-300 transition">
                          <Upload className="w-3 h-3" />
                          <span>Subir Imagen</span>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => handleLogoUpload(e, 'derecho')}
                          />
                        </label>

                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() =>
                              setPlantillaEnEdicion({
                                ...plantillaEnEdicion,
                                logoDerechoUrl: DEFAULT_LOGO_DERECHO,
                              })
                            }
                            className="px-2 py-1 text-[10px] text-emerald-700 hover:bg-emerald-50 rounded border border-emerald-200 transition"
                            title="Restaurar sello de laboratorio por defecto"
                          >
                            Restaurar Sello
                          </button>
                          {plantillaEnEdicion.logoDerechoUrl && (
                            <button
                              type="button"
                              onClick={() =>
                                setPlantillaEnEdicion({
                                  ...plantillaEnEdicion,
                                  logoDerechoUrl: '',
                                })
                              }
                              className="px-2 py-1 text-[10px] text-rose-600 hover:bg-rose-50 rounded border border-rose-200 transition"
                            >
                              Quitar
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Banner de Replicación de Logos a Todos los Grupos */}
                <div className="bg-emerald-50/90 border border-emerald-200 rounded-lg p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
                  <div className="flex items-start gap-2.5">
                    <input
                      type="checkbox"
                      id="replicarLogos"
                      checked={replicarLogosATodas}
                      onChange={(e) => setReplicarLogosATodas(e.target.checked)}
                      className="mt-0.5 w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500 cursor-pointer"
                    />
                    <div>
                      <label htmlFor="replicarLogos" className="font-bold text-emerald-950 text-xs cursor-pointer block">
                        Copiar estos logotipos a todos los demás grupos de plantillas
                      </label>
                      <p className="text-[11px] text-emerald-800 mt-0.5">
                        Al guardar, se actualizarán automáticamente en Válvulas de Seguridad, Control, On/Off, Manuales, Tubería, Presión, Temperatura y Eléctricas ({plantillas.length} plantillas configuradas).
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleCopiarLogosATodasAhora}
                    className="flex items-center justify-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-xs transition shrink-0 cursor-pointer"
                    title="Copiar logotipos inmediatamente a todas las plantillas"
                  >
                    <Layers className="w-3.5 h-3.5" />
                    <span>Copiar a todas ahora</span>
                  </button>
                </div>
              </div>

              {/* Sección 2: Paleta de Colores del Certificado */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800 flex items-center gap-1.5 text-xs">
                    <Palette className="w-4 h-4 text-emerald-600" />
                    Colores Personalizados del Certificado
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      setPlantillaEnEdicion({
                        ...plantillaEnEdicion,
                        colorPrimario: DEFAULT_COLOR_PRIMARIO,
                        colorSecundario: DEFAULT_COLOR_SECUNDARIO,
                        colorTextoEncabezado: DEFAULT_COLOR_TEXTO,
                      })
                    }
                    className="flex items-center gap-1 text-[10px] text-slate-500 hover:text-slate-800"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Valores por defecto</span>
                  </button>
                </div>

                {/* Botones de Paletas Predefinidas */}
                <div>
                  <span className="text-[10px] font-semibold text-slate-500 uppercase block mb-1.5">
                    Paletas Predefinidas (Clic para aplicar):
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
                    {PALETAS_PREDEFINIDAS.map((paleta) => {
                      const activa =
                        plantillaEnEdicion.colorPrimario?.toLowerCase() === paleta.primario.toLowerCase() &&
                        plantillaEnEdicion.colorSecundario?.toLowerCase() === paleta.secundario.toLowerCase();

                      return (
                        <button
                          key={paleta.nombre}
                          type="button"
                          onClick={() =>
                            setPlantillaEnEdicion({
                              ...plantillaEnEdicion,
                              colorPrimario: paleta.primario,
                              colorSecundario: paleta.secundario,
                              colorTextoEncabezado: paleta.texto,
                            })
                          }
                          className={`p-2 rounded-lg border text-left transition flex flex-col justify-between ${
                            activa
                              ? 'border-emerald-600 bg-emerald-50/50 ring-1 ring-emerald-500'
                              : 'border-slate-200 bg-white hover:border-slate-300'
                          }`}
                        >
                          <div className="flex items-center gap-1 mb-1.5">
                            <span
                              className="w-4 h-4 rounded-full border border-black/10 shrink-0"
                              style={{ backgroundColor: paleta.primario }}
                            />
                            <span
                              className="w-4 h-4 rounded-full border border-black/10 shrink-0"
                              style={{ backgroundColor: paleta.secundario }}
                            />
                          </div>
                          <span className="font-bold text-[10px] text-slate-800 leading-tight block">
                            {paleta.nombre}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Inputs de Colores Específicos */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                  <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                    <label className="block font-semibold text-slate-700 text-[11px] mb-1">
                      Color Primario (Tablas)
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={plantillaEnEdicion.colorPrimario || DEFAULT_COLOR_PRIMARIO}
                        onChange={(e) =>
                          setPlantillaEnEdicion({
                            ...plantillaEnEdicion,
                            colorPrimario: e.target.value,
                          })
                        }
                        className="w-8 h-8 rounded border border-slate-300 cursor-pointer p-0.5"
                      />
                      <input
                        type="text"
                        value={plantillaEnEdicion.colorPrimario || DEFAULT_COLOR_PRIMARIO}
                        onChange={(e) =>
                          setPlantillaEnEdicion({
                            ...plantillaEnEdicion,
                            colorPrimario: e.target.value,
                          })
                        }
                        className="w-full font-mono text-xs border border-slate-300 rounded px-2 py-1 uppercase"
                      />
                    </div>
                    <span className="text-[9px] text-slate-400 mt-1 block">
                      Fondo de cabeceras de tablas y datos
                    </span>
                  </div>

                  <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                    <label className="block font-semibold text-slate-700 text-[11px] mb-1">
                      Color Secundario (Títulos)
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={plantillaEnEdicion.colorSecundario || DEFAULT_COLOR_SECUNDARIO}
                        onChange={(e) =>
                          setPlantillaEnEdicion({
                            ...plantillaEnEdicion,
                            colorSecundario: e.target.value,
                          })
                        }
                        className="w-8 h-8 rounded border border-slate-300 cursor-pointer p-0.5"
                      />
                      <input
                        type="text"
                        value={plantillaEnEdicion.colorSecundario || DEFAULT_COLOR_SECUNDARIO}
                        onChange={(e) =>
                          setPlantillaEnEdicion({
                            ...plantillaEnEdicion,
                            colorSecundario: e.target.value,
                          })
                        }
                        className="w-full font-mono text-xs border border-slate-300 rounded px-2 py-1 uppercase"
                      />
                    </div>
                    <span className="text-[9px] text-slate-400 mt-1 block">
                      Títulos principales, subtítulos y marcos
                    </span>
                  </div>

                  <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                    <label className="block font-semibold text-slate-700 text-[11px] mb-1">
                      Texto de Encabezados
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={plantillaEnEdicion.colorTextoEncabezado || DEFAULT_COLOR_TEXTO}
                        onChange={(e) =>
                          setPlantillaEnEdicion({
                            ...plantillaEnEdicion,
                            colorTextoEncabezado: e.target.value,
                          })
                        }
                        className="w-8 h-8 rounded border border-slate-300 cursor-pointer p-0.5"
                      />
                      <input
                        type="text"
                        value={plantillaEnEdicion.colorTextoEncabezado || DEFAULT_COLOR_TEXTO}
                        onChange={(e) =>
                          setPlantillaEnEdicion({
                            ...plantillaEnEdicion,
                            colorTextoEncabezado: e.target.value,
                          })
                        }
                        className="w-full font-mono text-xs border border-slate-300 rounded px-2 py-1 uppercase"
                      />
                    </div>
                    <span className="text-[9px] text-slate-400 mt-1 block">
                      Color de la letra sobre fondo de tabla
                    </span>
                  </div>
                </div>

                {/* Opción para replicar también la paleta de colores */}
                <div className="bg-white border border-slate-200 rounded-lg p-2.5 flex items-center justify-between gap-2 shadow-xs">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="replicarColores"
                      checked={replicarColoresATodas}
                      onChange={(e) => setReplicarColoresATodas(e.target.checked)}
                      className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500 cursor-pointer"
                    />
                    <label htmlFor="replicarColores" className="text-xs font-semibold text-slate-800 cursor-pointer">
                      Copiar también esta paleta de colores (tablas y títulos) a todas las demás plantillas
                    </label>
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono hidden sm:inline">
                    Tablas: {plantillaEnEdicion.colorPrimario} | Títulos: {plantillaEnEdicion.colorSecundario}
                  </span>
                </div>
              </div>

              {/* Sección 3: Previsualización en Vivo del Certificado */}
              <div className="space-y-1.5">
                <span className="font-bold text-slate-700 text-[11px] block">
                  Previsualización en Tiempo Real del Encabezado & Tablas:
                </span>
                <div
                  className="border-2 p-3 bg-white shadow-xs rounded"
                  style={{
                    borderColor: plantillaEnEdicion.colorSecundario || DEFAULT_COLOR_SECUNDARIO,
                  }}
                >
                  <div className="grid grid-cols-12 items-center text-center gap-2">
                    {/* Logo Izquierdo */}
                    <div className="col-span-3 border-r border-slate-200 pr-2 flex flex-col items-center justify-center min-h-[64px]">
                      {plantillaEnEdicion.logoIzquierdoUrl ? (
                        <img
                          src={plantillaEnEdicion.logoIzquierdoUrl}
                          alt="Logo Izquierdo"
                          className="h-14 max-w-full object-contain"
                        />
                      ) : (
                        <span className="text-[10px] text-slate-400 italic">Logo Izquierdo</span>
                      )}
                    </div>

                    {/* Títulos Centrales */}
                    <div className="col-span-6 px-1">
                      <h1
                        className="text-xs font-black uppercase tracking-tight"
                        style={{
                          color: plantillaEnEdicion.colorSecundario || DEFAULT_COLOR_SECUNDARIO,
                        }}
                      >
                        {plantillaEnEdicion.tituloReporteEs || 'TÍTULO DEL CERTIFICADO'}
                      </h1>
                      {plantillaEnEdicion.tituloReporteEn && (
                        <span className="text-[9px] text-slate-500 italic block">
                          {plantillaEnEdicion.tituloReporteEn}
                        </span>
                      )}
                      <span className="text-[9px] text-slate-600 font-medium block mt-0.5">
                        {plantillaEnEdicion.subtituloNormativo || 'Norma o Procedimiento de Referencia'}
                      </span>
                    </div>

                    {/* Logo Derecho */}
                    <div className="col-span-3 border-l border-slate-200 pl-2 flex flex-col items-center justify-center min-h-[64px]">
                      {plantillaEnEdicion.logoDerechoUrl ? (
                        <img
                          src={plantillaEnEdicion.logoDerechoUrl}
                          alt="Logo Derecho"
                          className="h-14 max-w-full object-contain"
                        />
                      ) : (
                        <span className="text-[10px] text-slate-400 italic">Logo Derecho</span>
                      )}
                    </div>
                  </div>

                  {/* Barra de Muestra de Tabla con Color Primario */}
                  <div
                    className="mt-3 px-3 py-1 font-bold text-[10px] uppercase tracking-wider flex items-center justify-between"
                    style={{
                      backgroundColor: plantillaEnEdicion.colorPrimario || DEFAULT_COLOR_PRIMARIO,
                      color: plantillaEnEdicion.colorTextoEncabezado || DEFAULT_COLOR_TEXTO,
                    }}
                  >
                    <span>1. DATOS DEL ENSAYO Y RESULTADOS METROLÓGICOS</span>
                    <span className="text-[8px] opacity-80">NORMA APLICABLE</span>
                  </div>
                </div>
              </div>

              {/* Sección 4: Datos Documentales y Títulos */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Disciplina / Clasificación
                  </label>
                  <select
                    value={plantillaEnEdicion.clasificacionCodigo}
                    onChange={(e) =>
                      setPlantillaEnEdicion({
                        ...plantillaEnEdicion,
                        clasificacionCodigo: e.target.value as CodigoClasificacion,
                      })
                    }
                    className="w-full border border-slate-300 rounded-lg p-2 bg-white"
                  >
                    <option value="VT">VT - Válvulas</option>
                    <option value="TB">TB - Tubería</option>
                    <option value="PR">PR - Magnitud Presión</option>
                    <option value="TM">TM - Magnitud Temperatura</option>
                    <option value="EL">EL - Magnitudes Eléctricas</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Tipo de Elemento / Aplicación
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. Válvula de Control, Válvula On/Off, Manómetro..."
                    value={plantillaEnEdicion.tipoElemento}
                    onChange={(e) =>
                      setPlantillaEnEdicion({ ...plantillaEnEdicion, tipoElemento: e.target.value })
                    }
                    className="w-full border border-slate-300 rounded-lg p-2"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Nombre Identificador de la Plantilla
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Válvulas de Control - Fuga y Recorrido"
                  value={plantillaEnEdicion.nombreIdentificador}
                  onChange={(e) =>
                    setPlantillaEnEdicion({ ...plantillaEnEdicion, nombreIdentificador: e.target.value })
                  }
                  className="w-full border border-slate-300 rounded-lg p-2"
                />
              </div>

              {/* Títulos bilingües */}
              <div className="bg-emerald-50/50 p-4 rounded-xl border border-emerald-200 space-y-3">
                <span className="font-bold text-emerald-900 block flex items-center gap-1.5">
                  <Languages className="w-4 h-4 text-emerald-600" />
                  Textos Oficiales del Encabezado
                </span>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Título Oficial en Español (Mayúsculas)
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. REPORTE DE PRUEBA DE VALVULAS DE CONTROL"
                    value={plantillaEnEdicion.tituloReporteEs}
                    onChange={(e) =>
                      setPlantillaEnEdicion({
                        ...plantillaEnEdicion,
                        tituloReporteEs: e.target.value.toUpperCase(),
                      })
                    }
                    className="w-full border border-slate-300 rounded-lg p-2 font-bold uppercase tracking-tight text-slate-900 bg-white"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Título Oficial en Inglés
                  </label>
                  <input
                    type="text"
                    placeholder="Ej. Control Valve Test Report"
                    value={plantillaEnEdicion.tituloReporteEn}
                    onChange={(e) =>
                      setPlantillaEnEdicion({ ...plantillaEnEdicion, tituloReporteEn: e.target.value })
                    }
                    className="w-full border border-slate-300 rounded-lg p-2 italic bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Subtítulo / Norma de Referencia por Defecto
                </label>
                <input
                  type="text"
                  placeholder="Ej. Conforme a Estándar ANSI/FCI 70-2 / IEC 60534-4"
                  value={plantillaEnEdicion.subtituloNormativo}
                  onChange={(e) =>
                    setPlantillaEnEdicion({ ...plantillaEnEdicion, subtituloNormativo: e.target.value })
                  }
                  className="w-full border border-slate-300 rounded-lg p-2"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Código de Formato Documental
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. FOR-MET-VT-02"
                    value={plantillaEnEdicion.codigoFormato}
                    onChange={(e) =>
                      setPlantillaEnEdicion({ ...plantillaEnEdicion, codigoFormato: e.target.value })
                    }
                    className="w-full border border-slate-300 rounded-lg p-2 font-mono uppercase"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Versión / Revisión
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. v1.0 (Rev 01)"
                    value={plantillaEnEdicion.versionRevision}
                    onChange={(e) =>
                      setPlantillaEnEdicion({ ...plantillaEnEdicion, versionRevision: e.target.value })
                    }
                    className="w-full border border-slate-300 rounded-lg p-2 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Declaración de Trazabilidad por Defecto
                </label>
                <textarea
                  rows={2}
                  value={plantillaEnEdicion.declaracionTrazabilidadPorDefecto || ''}
                  onChange={(e) =>
                    setPlantillaEnEdicion({
                      ...plantillaEnEdicion,
                      declaracionTrazabilidadPorDefecto: e.target.value,
                    })
                  }
                  className="w-full border border-slate-300 rounded-lg p-2"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Declaración de Conformidad por Defecto
                </label>
                <textarea
                  rows={2}
                  value={plantillaEnEdicion.declaracionesConformidadPorDefecto || ''}
                  onChange={(e) =>
                    setPlantillaEnEdicion({
                      ...plantillaEnEdicion,
                      declaracionesConformidadPorDefecto: e.target.value,
                    })
                  }
                  className="w-full border border-slate-300 rounded-lg p-2"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="activa"
                  checked={plantillaEnEdicion.activa}
                  onChange={(e) =>
                    setPlantillaEnEdicion({ ...plantillaEnEdicion, activa: e.target.checked })
                  }
                  className="rounded text-emerald-600 w-4 h-4"
                />
                <label htmlFor="activa" className="font-semibold text-slate-700 cursor-pointer">
                  Plantilla Activa (disponible para nuevos reportes)
                </label>
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalAbierto(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition shadow-xs"
                >
                  <Check className="w-4 h-4" />
                  <span>Guardar Plantilla & Diseño</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Vista Previa de Encabezado */}
      {previewPlantilla && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full overflow-hidden border border-slate-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
              <h3 className="font-bold text-slate-800 text-sm">
                Vista Previa Institucional: {previewPlantilla.nombreIdentificador}
              </h3>
              <button
                type="button"
                onClick={() => setPreviewPlantilla(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-xs text-slate-500">
                Así se renderizará el encabezado institucional y las tablas en la Página 1 del PDF final:
              </p>

              {/* Render del encabezado exacto con ambos logos y colores */}
              <div
                className="border-2 p-3 bg-white shadow-xs rounded"
                style={{
                  borderColor: previewPlantilla.colorSecundario || DEFAULT_COLOR_SECUNDARIO,
                }}
              >
                <div className="grid grid-cols-12 items-center text-center gap-2">
                  {/* Logo Izquierdo */}
                  <div className="col-span-3 border-r border-slate-300 pr-2 flex items-center justify-center">
                    <img
                      src={previewPlantilla.logoIzquierdoUrl || DEFAULT_LOGO_IZQUIERDO}
                      alt="Logo Izquierdo"
                      className="h-16 max-w-full object-contain"
                    />
                  </div>

                  {/* Título Central */}
                  <div className="col-span-6 px-1">
                    <h1
                      className="text-xs font-black uppercase tracking-tight"
                      style={{
                        color: previewPlantilla.colorSecundario || DEFAULT_COLOR_SECUNDARIO,
                      }}
                    >
                      {previewPlantilla.tituloReporteEs}
                    </h1>
                    {previewPlantilla.tituloReporteEn && (
                      <span className="text-[9px] text-slate-500 italic block">
                        {previewPlantilla.tituloReporteEn}
                      </span>
                    )}
                    <span className="text-[9px] text-slate-600 font-medium block mt-0.5">
                      {previewPlantilla.subtituloNormativo}
                    </span>
                  </div>

                  {/* Logo Derecho */}
                  <div className="col-span-3 border-l border-slate-300 pl-2 flex items-center justify-center">
                    <img
                      src={previewPlantilla.logoDerechoUrl || DEFAULT_LOGO_DERECHO}
                      alt="Logo Derecho"
                      className="h-16 max-w-full object-contain"
                    />
                  </div>
                </div>

                {/* Muestra de barra de tabla */}
                <div
                  className="mt-3 px-3 py-1 font-bold text-[10px] uppercase tracking-wider flex items-center justify-between"
                  style={{
                    backgroundColor: previewPlantilla.colorPrimario || DEFAULT_COLOR_PRIMARIO,
                    color: previewPlantilla.colorTextoEncabezado || DEFAULT_COLOR_TEXTO,
                  }}
                >
                  <span>1. DATOS DEL SOLICITANTE Y SERVICIO</span>
                  <span className="text-[8px] opacity-80">FORMATO TÉCNICO OFICIAL</span>
                </div>
              </div>

              <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono pt-1">
                <span>Color Tablas: {previewPlantilla.colorPrimario || DEFAULT_COLOR_PRIMARIO}</span>
                <span>Formato: {previewPlantilla.codigoFormato} | Versión: {previewPlantilla.versionRevision}</span>
              </div>
            </div>

            <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={() => setPreviewPlantilla(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200 rounded-lg transition"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
