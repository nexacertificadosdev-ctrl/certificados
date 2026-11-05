import React, { useState, useEffect, useRef } from 'react';
import type { GraficaServicio } from '../../types';
import { 
  Image as ImageIcon, 
  Upload, 
  Trash2, 
  Check, 
  Sparkles, 
  Plus, 
  AlertCircle,
  Eye
} from 'lucide-react';

interface GraficasServicioUploaderProps {
  graficas: GraficaServicio[];
  onChange: (nuevasGraficas: GraficaServicio[]) => void;
  titulosSugeridos?: string[];
  maxGraficas?: number;
}

export const GraficasServicioUploader: React.FC<GraficasServicioUploaderProps> = ({
  graficas,
  onChange,
  titulosSugeridos = [
    'Prueba de Sello / Disparo - Entrada',
    'Prueba de Sello / Disparo - Salida',
  ],
  maxGraficas = 4,
}) => {
  const [graficaSeleccionadaIdx, setGraficaSeleccionadaIdx] = useState<number>(0);
  const [vistaPreviaModal, setVistaPreviaModal] = useState<string | null>(null);
  const [avisoPegado, setAvisoPegado] = useState<string | null>(null);
  const contenedorRef = useRef<HTMLDivElement>(null);

  // Escuchar evento de pegado (Ctrl + V) desde el portapapeles
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.type.indexOf('image') !== -1) {
          const blob = item.getAsFile();
          if (blob) {
            const reader = new FileReader();
            reader.onload = (event) => {
              const base64 = event.target?.result as string;
              if (base64) {
                asignarImagenAGrafica(base64, 'Captura pegada del portapapeles');
              }
            };
            reader.readAsDataURL(blob);
            break;
          }
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [graficas, graficaSeleccionadaIdx]);

  const asignarImagenAGrafica = (imagenUrl: string, nombreFuente?: string) => {
    // Si ya hay gráficas creadas, asignar a la seleccionada o la primera vacía
    const nuevas = [...graficas];
    let idx = graficaSeleccionadaIdx;

    if (idx >= nuevas.length) {
      const tituloDefault = titulosSugeridos[idx] || `Gráfica de Servicio #${idx + 1}`;
      nuevas.push({
        id: `graf-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
        titulo: tituloDefault,
        imagenUrl,
      });
    } else {
      nuevas[idx] = {
        ...nuevas[idx],
        imagenUrl,
      };
    }

    onChange(nuevas);
    setAvisoPegado(`¡Imagen cargada exitosamente ${nombreFuente ? `(${nombreFuente})` : ''}!`);
    setTimeout(() => setAvisoPegado(null), 3500);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, idx: number) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      if (base64) {
        setGraficaSeleccionadaIdx(idx);
        asignarImagenAGrafica(base64, file.name);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleActualizarTitulo = (idx: number, nuevoTitulo: string) => {
    const nuevas = [...graficas];
    if (nuevas[idx]) {
      nuevas[idx] = { ...nuevas[idx], titulo: nuevoTitulo };
      onChange(nuevas);
    }
  };

  const handleEliminarGrafica = (idx: number) => {
    const nuevas = graficas.filter((_, i) => i !== idx);
    onChange(nuevas);
    if (graficaSeleccionadaIdx >= nuevas.length && nuevas.length > 0) {
      setGraficaSeleccionadaIdx(nuevas.length - 1);
    }
  };

  const handleAgregarSlot = () => {
    if (graficas.length >= maxGraficas) return;
    const siguienteIdx = graficas.length;
    const tituloNuevo = titulosSugeridos[siguienteIdx] || `Gráfica #${siguienteIdx + 1}`;
    onChange([
      ...graficas,
      {
        id: `graf-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
        titulo: tituloNuevo,
        imagenUrl: '',
      },
    ]);
    setGraficaSeleccionadaIdx(siguienteIdx);
  };

  return (
    <div ref={contenedorRef} className="space-y-4 bg-slate-50 border border-slate-200 rounded-2xl p-5 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-200 pb-3">
        <div>
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <ImageIcon className="w-4 h-4 text-indigo-600" />
            <span>Representación Gráfica del Servicio (Imágenes de Curvas)</span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Carga las curvas de presión, temperatura o calibración registradas durante el ensayo para el reporte final.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {graficas.length < maxGraficas && (
            <button
              type="button"
              onClick={handleAgregarSlot}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold rounded-lg text-xs border border-indigo-200 transition cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Agregar Gráfica</span>
            </button>
          )}
        </div>
      </div>

      {avisoPegado && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-emerald-800 text-xs animate-fade-in font-medium">
          <Check className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{avisoPegado}</span>
        </div>
      )}

      {/* Tarjeta Informativa de Pegado Rápido */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50/50 border border-blue-200/80 rounded-xl p-3 flex items-start gap-2.5 text-xs text-blue-900">
        <Sparkles className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <span className="font-semibold">Atajo ultra-rápido:</span> Puedes copiar la captura de pantalla de tu banco de pruebas o registrador y presionar <kbd className="px-1.5 py-0.5 bg-white border border-blue-300 rounded font-mono font-bold text-blue-700 shadow-2xs">Ctrl + V</kbd> en cualquier parte de esta ventana para pegarla directamente sin tener que guardar archivos.
        </div>
      </div>

      {/* Lista de Gráficas Configuradas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
        {(graficas.length === 0 ? titulosSugeridos.slice(0, 2).map((t, i) => ({ id: `sug-${i}`, titulo: t, imagenUrl: '' })) : graficas).map((item, idx) => {
          const tieneImagen = Boolean(item.imagenUrl);

          return (
            <div
              key={item.id || idx}
              onClick={() => setGraficaSeleccionadaIdx(idx)}
              className={`relative border rounded-xl p-3.5 transition-all ${
                graficaSeleccionadaIdx === idx
                  ? 'border-indigo-500 bg-white shadow-sm ring-2 ring-indigo-500/10'
                  : 'border-slate-200 bg-white/70 hover:bg-white'
              }`}
            >
              {/* Título de la Gráfica */}
              <div className="flex items-center justify-between gap-2 mb-2.5">
                <input
                  type="text"
                  value={item.titulo}
                  onChange={(e) => handleActualizarTitulo(idx, e.target.value)}
                  placeholder={`Título de la gráfica #${idx + 1}`}
                  className="w-full text-xs font-bold text-slate-800 bg-transparent border-b border-dashed border-slate-300 focus:border-indigo-500 pb-0.5 outline-none"
                />
                {graficas.length > 0 && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEliminarGrafica(idx);
                    }}
                    title="Eliminar esta gráfica"
                    className="text-slate-400 hover:text-rose-600 p-1 rounded transition cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Contenedor de la Imagen */}
              {tieneImagen ? (
                <div className="relative group rounded-lg overflow-hidden border border-slate-200 bg-slate-900/5 aspect-video flex items-center justify-center">
                  <img
                    src={item.imagenUrl}
                    alt={item.titulo}
                    className="max-h-full max-w-full object-contain"
                  />

                  {/* Acciones flotantes al pasar el cursor */}
                  <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <button
                      type="button"
                      onClick={() => setVistaPreviaModal(item.imagenUrl)}
                      className="px-2.5 py-1.5 bg-white/90 hover:bg-white text-slate-800 font-semibold text-xs rounded-lg shadow-sm flex items-center gap-1.5 cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Ampliar</span>
                    </button>

                    <label className="px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-lg shadow-sm flex items-center gap-1.5 cursor-pointer">
                      <Upload className="w-3.5 h-3.5" />
                      <span>Cambiar</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleFileChange(e, idx)}
                      />
                    </label>
                  </div>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center border-2 border-dashed border-slate-300 hover:border-indigo-400 bg-slate-50 hover:bg-indigo-50/30 rounded-lg p-5 cursor-pointer transition-colors aspect-video text-center">
                  <Upload className="w-6 h-6 text-slate-400 mb-1.5" />
                  <span className="text-xs font-semibold text-slate-700">
                    Arrastra o selecciona imagen
                  </span>
                  <span className="text-[10px] text-slate-400 mt-0.5">
                    O presiona Ctrl+V para pegar captura
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleFileChange(e, idx)}
                  />
                </label>
              )}
            </div>
          );
        })}
      </div>

      <div className="flex items-center gap-2 text-[11px] text-slate-500 pt-1">
        <AlertCircle className="w-3.5 h-3.5 text-slate-400 shrink-0" />
        <span>Las gráficas se procesan en el navegador para incrustarse en el PDF final sin sobrecargar la cuota de la base de datos.</span>
      </div>

      {/* Modal para ampliar vista previa de imagen */}
      {vistaPreviaModal && (
        <div 
          onClick={() => setVistaPreviaModal(null)}
          className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-4 cursor-zoom-out"
        >
          <div className="max-w-4xl max-h-[90vh] bg-white rounded-2xl overflow-hidden shadow-2xl p-2 relative">
            <img
              src={vistaPreviaModal}
              alt="Vista Previa de Gráfica"
              className="max-h-[85vh] w-auto mx-auto rounded-lg object-contain"
            />
          </div>
        </div>
      )}
    </div>
  );
};
