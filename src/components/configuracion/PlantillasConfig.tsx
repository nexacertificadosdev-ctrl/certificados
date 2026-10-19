import React, { useState } from 'react';
import type { PlantillaDocumental, CodigoClasificacion, Usuario } from '../../types';
import { storageService } from '../../services/storageService';
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
      declaracionTrazabilidadPorDefecto: 'Los resultados contenidos en este reporte cuentan con trazabilidad metrológica hacia patrones nacionales e internacionales del Sistema Internacional de Unidades (SI).',
      declaracionesConformidadPorDefecto: 'Los resultados expresados se refieren exclusivamente al ítem inspeccionado y en las condiciones indicadas.',
      activa: true,
    });
    setModalAbierto(true);
  };

  const handleEditar = (p: PlantillaDocumental) => {
    setPlantillaEnEdicion({ ...p });
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

  const handleGuardarModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!plantillaEnEdicion) return;

    if (!plantillaEnEdicion.tituloReporteEs.trim()) {
      alert('El título del certificado en español es obligatorio.');
      return;
    }

    storageService.guardarPlantilla(plantillaEnEdicion, usuarioActual);
    recargar();
    setModalAbierto(false);
    setPlantillaEnEdicion(null);
    setMensajeExito('Plantilla documental guardada exitosamente.');
    setTimeout(() => setMensajeExito(null), 3000);
  };

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-6">
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <FileText className="w-7 h-7 text-blue-600" />
            Configuración de Plantillas & Títulos de Certificados
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Personaliza el título del reporte, subtítulo normativo y código de formato según el tipo de válvula (Control, On/Off, Seguridad, Alivio, Manuales) o magnitud (Presión, Temperatura, Eléctricas).
          </p>
        </div>

        {puedeEditar && (
          <button
            onClick={handleNueva}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition shadow-xs cursor-pointer self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Nueva Plantilla</span>
          </button>
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
            Estás visualizando las plantillas en modo lectura. Solo <strong>Administrador</strong> y <strong>Director Técnico</strong> pueden modificar títulos o crear nuevas plantillas.
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
            className="text-xs py-1.5 px-3 border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
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
        {plantillasFiltradas.map((p) => (
          <div
            key={p.id}
            className={`bg-white rounded-xl border ${
              p.activa ? 'border-slate-200' : 'border-slate-300 bg-slate-50/70 opacity-75'
            } shadow-xs hover:border-slate-300 transition flex flex-col justify-between overflow-hidden`}
          >
            <div className="p-5 space-y-3">
              {/* Badges superiores */}
              <div className="flex items-center justify-between">
                <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-blue-50 text-blue-700 border border-blue-200 font-mono">
                  {p.clasificacionCodigo}
                </span>
                <div className="flex items-center gap-1.5">
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
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-1.5">
                <div>
                  <span className="text-[9px] font-bold uppercase text-slate-500 block flex items-center gap-1">
                    <Languages className="w-3 h-3 text-blue-600" /> Título Principal (Español):
                  </span>
                  <p className="font-bold text-xs text-blue-950 uppercase tracking-tight">
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
                className="text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1 cursor-pointer"
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
                      title="Editar Plantilla"
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
        ))}
      </div>

      {/* Modal de Creación / Edición */}
      {modalAbierto && plantillaEnEdicion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full overflow-hidden border border-slate-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-slate-800 text-base">
                  {plantillaEnEdicion.id.startsWith('plan-') && !plantillas.some(p => p.id === plantillaEnEdicion.id)
                    ? 'Nueva Plantilla Documental'
                    : 'Editar Plantilla Documental'}
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

            <form onSubmit={handleGuardarModal} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto text-xs">
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
              <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-200 space-y-3">
                <span className="font-bold text-blue-900 block flex items-center gap-1.5">
                  <Languages className="w-4 h-4 text-blue-600" />
                  Encabezado Principal del Certificado
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
                      setPlantillaEnEdicion({ ...plantillaEnEdicion, tituloReporteEs: e.target.value.toUpperCase() })
                    }
                    className="w-full border border-slate-300 rounded-lg p-2 font-bold uppercase tracking-tight text-blue-950 bg-white"
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
                  className="rounded text-blue-600 w-4 h-4"
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
                  className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition shadow-xs"
                >
                  <Check className="w-4 h-4" />
                  <span>Guardar Plantilla</span>
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
                Vista Previa del Encabezado del Certificado
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
                Así se renderizará el encabezado institucional en la Página 1 del PDF final:
              </p>

              {/* Render del encabezado exacto */}
              <div className="border border-slate-400 p-3 bg-white shadow-xs">
                <div className="grid grid-cols-12 items-center text-center">
                  <div className="col-span-3 border-r border-slate-300 pr-2">
                    <div className="bg-slate-900 text-white py-2 px-3 rounded font-bold text-sm tracking-widest">
                      LABMET
                    </div>
                    <span className="text-[8px] text-slate-500 block mt-1">Laboratorio de Ensayos & Metrología</span>
                  </div>
                  <div className="col-span-6 px-2">
                    <h1 className="text-xs font-bold text-slate-900 uppercase tracking-tight">
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
                  <div className="col-span-3 border-l border-slate-300 pl-2 text-right">
                    <span className="text-[8px] text-slate-500 block uppercase">Reporte No.</span>
                    <span className="font-mono font-bold text-xs text-blue-900 block">TEST-VT-2026-0033</span>
                    <span className="text-[8px] text-slate-400 block mt-0.5">Página 1 de 3</span>
                  </div>
                </div>
              </div>

              <div className="text-[10px] text-slate-400 font-mono text-right">
                Formato: {previewPlantilla.codigoFormato} | Versión: {previewPlantilla.versionRevision}
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
