import React from 'react';
import type { Usuario } from '../../types';
import { estaConfiguradoSupabase } from '../../services/supabaseClient';
import {
  LayoutDashboard,
  FileCheck2,
  Users,
  Wrench,
  Scale,
  Hash,
  FileSpreadsheet,
  Shield,
  QrCode,
  PenTool,
  ChevronLeft,
  ChevronRight,
  Database,
  Award,
  LogOut,
  UserCog,
} from 'lucide-react';

interface SidebarProps {
  vistaActual: string;
  onCambiarVista: (vista: string) => void;
  usuarioActual: Usuario;
  usuariosDisponibles: Usuario[];
  onCambiarUsuario: (usuario: Usuario) => void;
  onCerrarSesion: () => void;
  onAbrirModalFirma: () => void;
  colapsado: boolean;
  onToggleColapsado: () => void;
  reportesEnRevision?: number;
  patronesVencidos?: number;
}

interface NavItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number | string;
  badgeColor?: string;
  tag?: string;
  vistaDestino?: string;
}

interface NavGroup {
  categoria: string;
  items: NavItem[];
}

export const Sidebar: React.FC<SidebarProps> = ({
  vistaActual,
  onCambiarVista,
  usuarioActual,
  usuariosDisponibles: _usuariosDisponibles,
  onCambiarUsuario: _onCambiarUsuario,
  onCerrarSesion,
  onAbrirModalFirma,
  colapsado,
  onToggleColapsado,
  reportesEnRevision = 0,
  patronesVencidos = 0,
}) => {
  const puedeGestionarUsuarios = ['administrador', 'director_tecnico'].includes(usuarioActual.rol);

  const gruposNavegacion: NavGroup[] = [
    {
      categoria: 'MENÚ PRINCIPAL',
      items: [
        {
          id: 'dashboard',
          label: 'Dashboard',
          icon: LayoutDashboard,
        },
        {
          id: 'reportes',
          label: 'Certificados & Reportes',
          icon: FileCheck2,
          badge: reportesEnRevision > 0 ? reportesEnRevision : undefined,
          badgeColor: 'bg-amber-100 text-amber-800',
        },
        {
          id: 'verificar',
          label: 'Validador QR Público',
          icon: QrCode,
          tag: 'Público',
        },
      ],
    },
    {
      categoria: 'GESTIÓN TÉCNICA',
      items: [
        {
          id: 'clientes-equipos',
          label: 'Clientes & Solicitantes',
          icon: Users,
        },
        {
          id: 'clientes-equipos-eq',
          label: 'Equipos & Instrumentos',
          icon: Wrench,
          vistaDestino: 'clientes-equipos',
        },
        {
          id: 'clientes-equipos-pat',
          label: 'Patrones ISO 17025',
          icon: Scale,
          vistaDestino: 'clientes-equipos',
          badge: patronesVencidos > 0 ? 'Alerta' : undefined,
          badgeColor: 'bg-rose-100 text-rose-700',
        },
      ],
    },
    {
      categoria: 'CONFIGURACIÓN & SISTEMA',
      items: [
        ...(puedeGestionarUsuarios
          ? [
              {
                id: 'usuarios-roles',
                label: 'Usuarios & Permisos RBAC',
                icon: UserCog,
              },
            ]
          : []),
        {
          id: 'series',
          label: 'Series & Consecutivos',
          icon: Hash,
        },
        {
          id: 'plantillas',
          label: 'Plantillas Documentales',
          icon: FileSpreadsheet,
        },
        {
          id: 'auditoria',
          label: 'Registro de Auditoría',
          icon: Shield,
        },
      ],
    },
  ];

  return (
    <aside
      className={`bg-white border-r border-slate-200/80 flex flex-col justify-between transition-all duration-300 select-none z-30 no-print shrink-0 ${
        colapsado ? 'w-20' : 'w-64'
      }`}
    >
      {/* 1. Header con Logo y Botón de Colapso */}
      <div>
        <div className="h-20 flex items-center justify-between px-5 border-b border-slate-100">
          <div
            onClick={() => onCambiarVista('dashboard')}
            className="flex items-center gap-3 cursor-pointer group overflow-hidden"
          >
            {/* Logo estilo Oripio: verde esmeralda con esquinas redondeadas */}
            <div className="w-10 h-10 rounded-2xl bg-[#00875a] flex items-center justify-center text-white shadow-xs shrink-0 group-hover:scale-105 transition-transform">
              <Award className="w-6 h-6 stroke-[2.2]" />
            </div>

            {!colapsado && (
              <div className="truncate">
                <span className="font-extrabold text-base tracking-tight text-slate-900 block leading-tight">
                  CertiGest
                </span>
                <span className="text-[11px] font-medium text-slate-400 block -mt-0.5">
                  Metrología & Ensayos
                </span>
              </div>
            )}
          </div>

          <button
            onClick={onToggleColapsado}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
            title={colapsado ? 'Expandir menú' : 'Colapsar menú'}
          >
            {colapsado ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* 2. Lista de Menúes por Categoría */}
        <div className="py-4 px-3 space-y-6 overflow-y-auto max-h-[calc(100vh-280px)]">
          {gruposNavegacion.map((grupo) => (
            <div key={grupo.categoria} className="space-y-1">
              {!colapsado && (
                <span className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-2 font-mono">
                  {grupo.categoria}
                </span>
              )}

              {grupo.items.map((item) => {
                const destino = item.vistaDestino || item.id;
                const estaActivo =
                  vistaActual === destino || (item.id === 'dashboard' && vistaActual === 'dashboard');
                const IconComponent = item.icon;

                return (
                  <button
                    key={item.id}
                    onClick={() => onCambiarVista(destino)}
                    title={colapsado ? item.label : undefined}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition cursor-pointer relative ${
                      estaActivo
                        ? 'bg-[#eef8f1] text-[#00875a]'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    }`}
                  >
                    {/* Indicador de activo a la izquierda estilo Oripio */}
                    {estaActivo && (
                      <span className="absolute left-1 top-2.5 bottom-2.5 w-1 bg-[#00875a] rounded-full" />
                    )}

                    <IconComponent
                      className={`w-4 h-4 shrink-0 ${
                        estaActivo ? 'text-[#00875a]' : 'text-slate-400 group-hover:text-slate-600'
                      }`}
                    />

                    {!colapsado && (
                      <div className="flex-1 flex items-center justify-between truncate">
                        <span className="truncate">{item.label}</span>

                        {item.badge !== undefined && (
                          <span
                            className={`px-1.5 py-0.5 text-[10px] font-bold rounded-full ${
                              item.badgeColor || 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {item.badge}
                          </span>
                        )}

                        {item.tag && (
                          <span className="px-1.5 py-0.5 text-[9px] font-bold rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                            {item.tag}
                          </span>
                        )}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* 3. Bloque Inferior: Tarjeta Verde "Upgrade/Cloud" & Perfil de Usuario */}
      <div className="p-3 border-t border-slate-100 space-y-3">
        {/* Tarjeta tipo "Upgrade Pro" verde de la imagen */}
        {!colapsado ? (
          <div className="bg-gradient-to-br from-[#064e3b] via-[#047857] to-[#059669] text-white rounded-2xl p-4 shadow-sm relative overflow-hidden">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-200 flex items-center gap-1.5">
                <Database className="w-3.5 h-3.5" />
                {estaConfiguradoSupabase() ? 'Supabase Cloud' : 'Almacenamiento'}
              </span>
              <span
                className={`w-2 h-2 rounded-full ${
                  estaConfiguradoSupabase() ? 'bg-emerald-300 animate-pulse' : 'bg-amber-300'
                }`}
                title={estaConfiguradoSupabase() ? 'Conectado a la nube' : 'Modo local'}
              />
            </div>
            <p className="text-[11px] text-emerald-100 leading-snug mb-3">
              Firma digital y sellado SHA-256 inmutable de certificados.
            </p>
            <button
              onClick={onAbrirModalFirma}
              className="w-full py-1.5 px-3 bg-white hover:bg-emerald-50 text-[#064e3b] rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
            >
              <PenTool className="w-3.5 h-3.5 text-[#059669]" />
              <span>Mi Firma Digital</span>
              {usuarioActual.firmaUrl && (
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              )}
            </button>
          </div>
        ) : (
          <div className="flex justify-center">
            <button
              onClick={onAbrirModalFirma}
              title="Mi Firma Digital"
              className="p-2.5 rounded-xl bg-emerald-50 text-[#00875a] hover:bg-emerald-100 transition cursor-pointer"
            >
              <PenTool className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Perfil del Usuario Autenticado & Botón Cerrar Sesión */}
        <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-200/60">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
              {usuarioActual.nombre
                .split(' ')
                .map((n) => n[0])
                .slice(0, 2)
                .join('')}
            </div>

            {!colapsado && (
              <div className="flex-1 min-w-0">
                <div className="text-xs font-bold text-slate-900 truncate">
                  {usuarioActual.nombre}
                </div>
                <div className="text-[10px] text-emerald-700 font-bold uppercase tracking-wider truncate flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                  <span>{usuarioActual.rol.replace('_', ' ')}</span>
                </div>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={onCerrarSesion}
            title="Cerrar Sesión"
            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer shrink-0"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};
