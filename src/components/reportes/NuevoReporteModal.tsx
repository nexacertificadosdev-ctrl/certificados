import React from 'react';
import type { CodigoClasificacion } from '../../types';
import { Shield, Activity, Gauge, Thermometer, Zap, X, ArrowRight } from 'lucide-react';

interface NuevoReporteModalProps {
  onSeleccionarClasificacion: (codigo: CodigoClasificacion) => void;
  onClose: () => void;
}

export const NuevoReporteModal: React.FC<NuevoReporteModalProps> = ({
  onSeleccionarClasificacion,
  onClose,
}) => {
  const disciplinas: {
    codigo: CodigoClasificacion;
    nombre: string;
    subtitulo: string;
    descripcion: string;
    icon: React.ReactNode;
    color: string;
  }[] = [
    {
      codigo: 'VT',
      nombre: 'Válvulas Industriales',
      subtitulo: 'Seguridad, Alivio, Control, On/Off, Manuales',
      descripcion: 'Pruebas de ajuste (set point), sello y reasiento según ASME Sec. VIII, API 527 y API 598.',
      icon: <Shield className="w-6 h-6 text-blue-600" />,
      color: 'hover:border-blue-500 hover:bg-blue-50/40',
    },
    {
      codigo: 'TB',
      nombre: 'Tuberías y Spools',
      subtitulo: 'Pruebas Hidrostáticas y Neumáticas',
      descripcion: 'Ensayo de resistencia mecánica y hermeticidad con agua o nitrógeno conforme a ASME B31.3.',
      icon: <Activity className="w-6 h-6 text-emerald-600" />,
      color: 'hover:border-emerald-500 hover:bg-emerald-50/40',
    },
    {
      codigo: 'PR',
      nombre: 'Magnitud Presión',
      subtitulo: 'Calibración de Manómetros y Transmisores',
      descripcion: 'Ciclos de carga y descarga, cálculo de error, histéresis e incertidumbre expandida según DKD-R 6-1.',
      icon: <Gauge className="w-6 h-6 text-purple-600" />,
      color: 'hover:border-purple-500 hover:bg-purple-50/40',
    },
    {
      codigo: 'TM',
      nombre: 'Magnitud Temperatura',
      subtitulo: 'Termómetros, RTDs Pt100 y Termocuplas',
      descripcion: 'Calibración por comparación en bloques secos y baños de temperatura según EURAMET cg-11.',
      icon: <Thermometer className="w-6 h-6 text-amber-600" />,
      color: 'hover:border-amber-500 hover:bg-amber-50/40',
    },
    {
      codigo: 'EL',
      nombre: 'Magnitudes Eléctricas',
      subtitulo: 'Multímetros, Pinzas y Calibradores de Lazo',
      descripcion: 'Calibración de señales de 4-20 mA, tensión DC/AC, resistencia y frecuencia.',
      icon: <Zap className="w-6 h-6 text-rose-600" />,
      color: 'hover:border-rose-500 hover:bg-rose-50/40',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden border border-slate-200">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
          <div>
            <h3 className="font-bold text-slate-800 text-base">Crear Nuevo Certificado o Reporte</h3>
            <p className="text-xs text-slate-500">
              Selecciona la disciplina técnica para cargar el formulario y criterios correspondientes.
            </p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-3 max-h-[70vh] overflow-y-auto">
          {disciplinas.map((d) => (
            <div
              key={d.codigo}
              onClick={() => onSeleccionarClasificacion(d.codigo)}
              className={`border border-slate-200 rounded-xl p-4 flex items-center justify-between cursor-pointer transition ${d.color} group`}
            >
              <div className="flex items-start gap-4">
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 group-hover:scale-110 transition shrink-0">
                  {d.icon}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                      {d.codigo}
                    </span>
                    <h4 className="font-bold text-slate-900 text-sm">{d.nombre}</h4>
                  </div>
                  <span className="text-[11px] font-semibold text-slate-600 block mt-0.5">
                    {d.subtitulo}
                  </span>
                  <p className="text-xs text-slate-500 mt-1 max-w-md">{d.descripcion}</p>
                </div>
              </div>

              <div className="text-slate-400 group-hover:text-blue-600 group-hover:translate-x-1 transition pl-2">
                <ArrowRight className="w-5 h-5" />
              </div>
            </div>
          ))}
        </div>

        <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-lg transition cursor-pointer"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
};
