import React from 'react';
import type { Usuario } from '../../types';
import { storageService } from '../../services/storageService';
import {
  Search,
  Plus,
  Calendar,
  HelpCircle,
  Bell,
} from 'lucide-react';

interface TopHeaderProps {
  usuarioActual: Usuario;
  onNuevoReporte: () => void;
  onAbrirBuscar?: () => void;
  reportesEnRevision?: number;
  patronesVencidos?: number;
}

export const TopHeader: React.FC<TopHeaderProps> = ({
  usuarioActual,
  onNuevoReporte,
  reportesEnRevision = 0,
  patronesVencidos = 0,
}) => {
  // Fecha formateada en español estilo la imagen (Sun, 12 June 2026)
  const hoy = new Date();
  const fechaTexto = hoy.toLocaleDateString('es-ES', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  const totalNotificaciones = reportesEnRevision + patronesVencidos;

  return (
    <header className="h-20 bg-transparent px-6 sm:px-8 flex items-center justify-between gap-4 no-print select-none">
      {/* 1. Barra de Búsqueda Estilo Oripio (Pill redondeada con atajo ⌘K) */}
      <div className="flex-1 max-w-md">
        <div className="relative flex items-center">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none" />
          <input
            type="text"
            placeholder="Buscar certificados, clientes, tags, seriales..."
            className="w-full pl-10 pr-12 py-2.5 bg-white border border-slate-200/90 rounded-2xl text-xs text-slate-800 placeholder-slate-400 shadow-xs focus:outline-none focus:ring-2 focus:ring-[#00875a]/30 focus:border-[#00875a] transition"
          />
          <div className="absolute right-3 flex items-center gap-1 bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded-md text-[10px] font-mono text-slate-500 font-bold">
            <span>⌘</span>
            <span>K</span>
          </div>
        </div>
      </div>

      {/* 2. Lado Derecho: Fecha, Acción Principal, Notificaciones y Perfil */}
      <div className="flex items-center gap-3">
        {/* Chip de Fecha */}
        <div className="hidden lg:flex items-center gap-2 px-3.5 py-2 bg-white border border-slate-200/80 rounded-2xl text-xs font-semibold text-slate-700 shadow-xs capitalize">
          <Calendar className="w-4 h-4 text-slate-400" />
          <span>{fechaTexto}</span>
        </div>

        {/* Botón Principal "+ Nuevo Ensayo" según permisos */}
        {storageService.tienePermiso(usuarioActual.rol, 'reportes_crear') && (
          <button
            onClick={onNuevoReporte}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#00875a] hover:bg-[#047857] active:scale-95 text-white rounded-2xl text-xs font-bold shadow-sm transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Nuevo Ensayo</span>
          </button>
        )}

        {/* Botón de Ayuda */}
        <button
          type="button"
          className="p-2.5 bg-white hover:bg-slate-50 text-slate-500 hover:text-slate-700 border border-slate-200/80 rounded-2xl shadow-xs transition cursor-pointer"
          title="Ayuda y documentación metrológica"
        >
          <HelpCircle className="w-4 h-4" />
        </button>

        {/* Campana de Notificaciones / Alertas */}
        <div className="relative">
          <button
            type="button"
            className="p-2.5 bg-white hover:bg-slate-50 text-slate-500 hover:text-slate-700 border border-slate-200/80 rounded-2xl shadow-xs transition cursor-pointer"
            title={`${totalNotificaciones} alertas activas`}
          >
            <Bell className="w-4 h-4" />
          </button>
          {totalNotificaciones > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-white rounded-full text-[9px] font-bold flex items-center justify-center animate-pulse">
              {totalNotificaciones}
            </span>
          )}
        </div>

        {/* Avatar de Usuario */}
        <div className="flex items-center gap-2 pl-2">
          <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-slate-800 to-slate-900 text-white flex items-center justify-center font-extrabold text-xs shadow-xs border border-white">
            {usuarioActual.nombre
              .split(' ')
              .map((n) => n[0])
              .slice(0, 2)
              .join('')}
          </div>
        </div>
      </div>
    </header>
  );
};
