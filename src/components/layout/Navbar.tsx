import React from 'react';
import type { Usuario } from '../../types';
import { estaConfiguradoSupabase } from '../../services/supabaseClient';
import { FileCheck2, Shield, PenTool, Database } from 'lucide-react';

interface NavbarProps {
  usuarioActual: Usuario;
  usuariosDisponibles: Usuario[];
  onCambiarUsuario: (usuario: Usuario) => void;
  vistaActual: string;
  onCambiarVista: (vista: string) => void;
  onAbrirModalFirma: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  usuarioActual,
  usuariosDisponibles,
  onCambiarUsuario,
  vistaActual,
  onCambiarVista,
  onAbrirModalFirma,
}) => {
  return (
    <header className="bg-slate-900 text-white sticky top-0 z-50 shadow-md no-print">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Marca */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => onCambiarVista('dashboard')}>
            <div className="bg-blue-600 p-2 rounded-lg text-white shadow">
              <FileCheck2 className="w-6 h-6" />
            </div>
            <div>
              <span className="font-bold text-lg tracking-tight block">CertiGest Web</span>
              <span className="text-xs text-slate-400 font-mono -mt-1 block">Gestión Técnica & Metrología</span>
            </div>
          </div>

          {/* Navegación Principal */}
          <nav className="hidden md:flex items-center space-x-1">
            <button
              onClick={() => onCambiarVista('dashboard')}
              className={`px-3 py-2 rounded-md text-sm font-medium transition ${
                vistaActual === 'dashboard' ? 'bg-slate-800 text-white' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              Dashboard
            </button>
            <button
              onClick={() => onCambiarVista('reportes')}
              className={`px-3 py-2 rounded-md text-sm font-medium transition ${
                vistaActual === 'reportes' ? 'bg-slate-800 text-white' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              Certificados y Reportes
            </button>
            <button
              onClick={() => onCambiarVista('clientes-equipos')}
              className={`px-3 py-2 rounded-md text-sm font-medium transition ${
                vistaActual === 'clientes-equipos' ? 'bg-slate-800 text-white' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              Clientes & Equipos
            </button>
            <button
              onClick={() => onCambiarVista('series')}
              className={`px-3 py-2 rounded-md text-sm font-medium transition ${
                vistaActual === 'series' ? 'bg-slate-800 text-white' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              Series & Consecutivos
            </button>
            <button
              onClick={() => onCambiarVista('plantillas')}
              className={`px-3 py-2 rounded-md text-sm font-medium transition ${
                vistaActual === 'plantillas' ? 'bg-slate-800 text-white' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              Plantillas & Títulos
            </button>
            <button
              onClick={() => onCambiarVista('auditoria')}
              className={`px-3 py-2 rounded-md text-sm font-medium transition ${
                vistaActual === 'auditoria' ? 'bg-slate-800 text-white' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              Auditoría
            </button>
            <button
              onClick={() => onCambiarVista('verificar')}
              className={`px-3 py-2 rounded-md text-sm font-medium transition flex items-center gap-1.5 ${
                vistaActual === 'verificar' ? 'bg-blue-600 text-white shadow-xs' : 'text-blue-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <span>Validador QR</span>
            </button>
          </nav>

          {/* Selector de Rol Simulado para Pruebas en Vivo */}
          <div className="flex items-center gap-3">
            {/* Indicador de conexión */}
            <div
              className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-mono rounded-lg border ${
                estaConfiguradoSupabase()
                  ? 'bg-emerald-950/70 text-emerald-300 border-emerald-700/80'
                  : 'bg-slate-800 text-slate-300 border-slate-700'
              }`}
              title={
                estaConfiguradoSupabase()
                  ? 'Conectado a la base de datos de Supabase en la nube'
                  : 'Modo local activo. Configura VITE_SUPABASE_ANON_KEY en .env para enlazar a Supabase'
              }
            >
              <Database className="w-3 h-3 text-blue-400" />
              <span>{estaConfiguradoSupabase() ? 'Supabase Cloud' : 'Modo Local'}</span>
              <span
                className={`w-2 h-2 rounded-full ${
                  estaConfiguradoSupabase() ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
                }`}
              />
            </div>

            <button
              onClick={onAbrirModalFirma}
              title="Gestionar mi firma digital"
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
            >
              <PenTool className="w-3.5 h-3.5 text-amber-400" />
              <span>Mi Firma</span>
              {usuarioActual.firmaUrl && (
                <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block ml-0.5"></span>
              )}
            </button>

            <div className="flex items-center gap-2 bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700">
              <Shield className="w-4 h-4 text-blue-400 shrink-0" />
              <div className="text-left">
                <span className="text-[10px] text-slate-400 block uppercase font-bold tracking-wider">Rol de Simulación</span>
                <select
                  aria-label="Seleccionar usuario y rol de simulación"
                  value={usuarioActual.id}
                  onChange={(e) => {
                    const u = usuariosDisponibles.find((usr) => usr.id === e.target.value);
                    if (u) onCambiarUsuario(u);
                  }}
                  className="bg-transparent text-xs text-white font-medium focus:outline-none cursor-pointer pr-1"
                >
                  {usuariosDisponibles.map((u) => (
                    <option key={u.id} value={u.id} className="bg-slate-900 text-white">
                      {u.nombre} ({u.cargo} - {u.rol})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
