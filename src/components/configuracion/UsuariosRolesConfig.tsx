import React, { useState } from 'react';
import type { Usuario, RolUsuario, ModuloPermiso, MatrizPermisos } from '../../types';
import { storageService } from '../../services/storageService';
import { PERMISOS_DEFINICIONES, MATRIZ_PERMISOS_INICIAL } from '../../services/mockData';
import {
  Users,
  ShieldCheck,
  Plus,
  Edit,
  Trash2,
  Check,
  X,
  Search,
  Mail,
  UserCheck,
  UserX,
  FileCheck2,
  Key,
  Shield,
  RotateCcw,
  Sliders,
  CheckSquare,
  Square,
} from 'lucide-react';

interface UsuariosRolesConfigProps {
  usuarioActual: Usuario;
}

const ROLES_INFO: { id: RolUsuario; nombre: string; color: string; descripcion: string }[] = [
  {
    id: 'administrador',
    nombre: 'Administrador',
    color: 'bg-purple-100 text-purple-800 border-purple-200',
    descripcion: 'Control total de la plataforma, roles, series, plantillas maestras y auditoría general.',
  },
  {
    id: 'director_tecnico',
    nombre: 'Director Técnico',
    color: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    descripcion: 'Aprobación final, firma metrológica y emisión de certificados oficiales.',
  },
  {
    id: 'revisor_tecnico',
    nombre: 'Revisor Técnico',
    color: 'bg-blue-100 text-blue-800 border-blue-200',
    descripcion: 'Aseguramiento de calidad, revisión metrológica y visto bueno técnico.',
  },
  {
    id: 'tecnico',
    nombre: 'Técnico Metrólogo',
    color: 'bg-amber-100 text-amber-800 border-amber-200',
    descripcion: 'Captura de mediciones en campo, ensayos, pruebas y creación de borradores.',
  },
  {
    id: 'auditor',
    nombre: 'Auditor de Calidad',
    color: 'bg-slate-100 text-slate-800 border-slate-200',
    descripcion: 'Modo lectura estricta para trazabilidad metrológica e inspección ISO/IEC 17025.',
  },
];

export const UsuariosRolesConfig: React.FC<UsuariosRolesConfigProps> = ({ usuarioActual }) => {
  const [pestanaActiva, setPestanaActiva] = useState<'usuarios' | 'permisos'>('usuarios');
  const [usuarios, setUsuarios] = useState<Usuario[]>(storageService.getUsuarios());
  const [matrizPermisos, setMatrizPermisos] = useState<MatrizPermisos>(storageService.getMatrizPermisos());
  const [busqueda, setBusqueda] = useState('');
  const [filtroRol, setFiltroRol] = useState<string>('TODOS');
  const [mensajeExito, setMensajeExito] = useState<string | null>(null);

  // Modales
  const [modalUsuarioAbierto, setModalUsuarioAbierto] = useState(false);
  const [usuarioEnEdicion, setUsuarioEnEdicion] = useState<Usuario | null>(null);
  const [passwordForm, setPasswordForm] = useState('');

  const esSuperAdmin = usuarioActual.rol === 'administrador';

  const recargar = () => {
    setUsuarios([...storageService.getUsuarios()]);
    setMatrizPermisos({ ...storageService.getMatrizPermisos() });
  };

  const mostrarMensaje = (msg: string) => {
    setMensajeExito(msg);
    setTimeout(() => setMensajeExito(null), 3500);
  };

  const handleNuevoUsuario = () => {
    setUsuarioEnEdicion({
      id: `usr-${Date.now()}`,
      nombre: '',
      email: '',
      cargo: 'Técnico de Ensayos',
      rol: 'tecnico',
      activo: true,
    });
    setPasswordForm('CertiGest2026*');
    setModalUsuarioAbierto(true);
  };

  const handleEditarUsuario = (u: Usuario) => {
    setUsuarioEnEdicion({ ...u });
    setPasswordForm(u.password || '');
    setModalUsuarioAbierto(true);
  };

  const handleGuardarUsuarioModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!usuarioEnEdicion) return;

    if (!usuarioEnEdicion.nombre.trim() || !usuarioEnEdicion.email.trim()) {
      alert('Nombre y correo electrónico son campos obligatorios.');
      return;
    }

    const usuarioFinal: Usuario = {
      ...usuarioEnEdicion,
      nombre: usuarioEnEdicion.nombre.trim(),
      email: usuarioEnEdicion.email.trim().toLowerCase(),
      password: passwordForm.trim() || usuarioEnEdicion.password || 'CertiGest2026*',
    };

    storageService.guardarUsuario(usuarioFinal, usuarioActual);
    recargar();
    setModalUsuarioAbierto(false);
    setUsuarioEnEdicion(null);
    mostrarMensaje(`Usuario "${usuarioFinal.nombre}" guardado con éxito.`);
  };

  const handleToggleEstadoActivo = (u: Usuario) => {
    if (u.id === usuarioActual.id) {
      alert('No puedes desactivar tu propia cuenta activa.');
      return;
    }
    const nuevoEstado = !(u.activo ?? true);
    storageService.guardarUsuario({ ...u, activo: nuevoEstado }, usuarioActual);
    recargar();
    mostrarMensaje(`Usuario "${u.nombre}" ${nuevoEstado ? 'activado' : 'desactivado'}.`);
  };

  const handleEliminarUsuario = (u: Usuario) => {
    if (u.id === usuarioActual.id) {
      alert('No puedes eliminar tu propio usuario de la sesión actual.');
      return;
    }
    if (confirm(`¿Estás seguro de eliminar al usuario "${u.nombre}" (${u.email})? Esta acción no se puede deshacer.`)) {
      storageService.eliminarUsuario(u.id, usuarioActual);
      recargar();
      mostrarMensaje(`Usuario "${u.nombre}" eliminado correctamente.`);
    }
  };

  // Matriz de Permisos: Toggle de un permiso específico para un rol
  const handleTogglePermiso = (rol: RolUsuario, permisoId: ModuloPermiso) => {
    if (rol === 'administrador') {
      alert('Por directriz de seguridad, el rol Administrador conserva siempre todos los privilegios del sistema.');
      return;
    }

    const permisosActuales = matrizPermisos[rol] || [];
    const existe = permisosActuales.includes(permisoId);

    const nuevosPermisos = existe
      ? permisosActuales.filter((p) => p !== permisoId)
      : [...permisosActuales, permisoId];

    const nuevaMatriz: MatrizPermisos = {
      ...matrizPermisos,
      [rol]: nuevosPermisos,
    };

    setMatrizPermisos(nuevaMatriz);
    storageService.guardarMatrizPermisos(nuevaMatriz, usuarioActual);
    mostrarMensaje(`Permisos actualizados para el rol [${rol}].`);
  };

  const handleRestablecerPermisosPorDefecto = () => {
    if (confirm('¿Deseas restablecer la matriz de permisos a los valores estándar de fábrica?')) {
      storageService.guardarMatrizPermisos(MATRIZ_PERMISOS_INICIAL, usuarioActual);
      recargar();
      mostrarMensaje('Matriz de permisos restablecida a valores estándar.');
    }
  };

  // Filtros
  const usuariosFiltrados = usuarios.filter((u) => {
    const coincideBusqueda =
      u.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      u.email.toLowerCase().includes(busqueda.toLowerCase()) ||
      u.cargo.toLowerCase().includes(busqueda.toLowerCase());
    const coincideRol = filtroRol === 'TODOS' || u.rol === filtroRol;
    return coincideBusqueda && coincideRol;
  });

  // Categorías de permisos agrupadas
  const categoriasPermisos = Array.from(
    new Set(PERMISOS_DEFINICIONES.map((p) => p.categoria))
  );

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-6">
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <ShieldCheck className="w-7 h-7 text-emerald-600" />
            Control de Usuarios, Roles & Permisos (RBAC)
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Administra las cuentas autorizadas para emitir reportes, asigna roles de responsabilidad y personaliza la matriz de privilegios según norma ISO/IEC 17025.
          </p>
        </div>

        {esSuperAdmin && pestanaActiva === 'usuarios' && (
          <button
            onClick={handleNuevoUsuario}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition shadow-xs cursor-pointer self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Nuevo Usuario</span>
          </button>
        )}
      </div>

      {mensajeExito && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs px-4 py-3 rounded-lg flex items-center gap-2 shadow-xs">
          <Check className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{mensajeExito}</span>
        </div>
      )}

      {/* Tabs Principales: Directorio de Usuarios vs Matriz de Permisos */}
      <div className="flex items-center gap-3 border-b border-slate-200">
        <button
          type="button"
          onClick={() => setPestanaActiva('usuarios')}
          className={`flex items-center gap-2 pb-3 px-2 text-xs font-bold border-b-2 transition cursor-pointer ${
            pestanaActiva === 'usuarios'
              ? 'border-emerald-600 text-emerald-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Directorio de Usuarios ({usuarios.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setPestanaActiva('permisos')}
          className={`flex items-center gap-2 pb-3 px-2 text-xs font-bold border-b-2 transition cursor-pointer ${
            pestanaActiva === 'permisos'
              ? 'border-emerald-600 text-emerald-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Sliders className="w-4 h-4" />
          <span>Matriz de Permisos por Rol</span>
        </button>
      </div>

      {/* ========================================================= */}
      {/* PESTAÑA 1: DIRECTORIO DE USUARIOS */}
      {/* ========================================================= */}
      {pestanaActiva === 'usuarios' && (
        <div className="space-y-4">
          {/* Tarjetas Resumen de Roles */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {ROLES_INFO.map((r) => {
              const cantidad = usuarios.filter((u) => u.rol === r.id).length;
              return (
                <div
                  key={r.id}
                  onClick={() => setFiltroRol(filtroRol === r.id ? 'TODOS' : r.id)}
                  className={`p-3 rounded-xl border bg-white transition cursor-pointer ${
                    filtroRol === r.id
                      ? 'border-emerald-500 ring-2 ring-emerald-500/20 shadow-xs'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded border inline-block ${r.color}`}>
                    {r.nombre}
                  </span>
                  <div className="text-xl font-black text-slate-900 mt-2">{cantidad}</div>
                  <span className="text-[10px] text-slate-400 block mt-0.5">cuentas registradas</span>
                </div>
              );
            })}
          </div>

          {/* Barra de Búsqueda y Filtro */}
          <div className="bg-white p-4 rounded-xl shadow-xs border border-slate-200 flex flex-wrap items-center justify-between gap-4">
            <div className="relative flex-1 min-w-[260px] max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar por nombre, correo o cargo técnico..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-600">Filtrar por Rol:</span>
              <select
                value={filtroRol}
                onChange={(e) => setFiltroRol(e.target.value)}
                className="text-xs py-1.5 px-3 border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              >
                <option value="TODOS">Todos los Roles ({usuarios.length})</option>
                <option value="administrador">Administrador</option>
                <option value="director_tecnico">Director Técnico</option>
                <option value="revisor_tecnico">Revisor Técnico</option>
                <option value="tecnico">Técnico Metrólogo</option>
                <option value="auditor">Auditor de Calidad</option>
              </select>
            </div>
          </div>

          {/* Tabla de Usuarios */}
          <div className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4">Usuario & Identidad</th>
                  <th className="py-3 px-4">Cargo Técnico</th>
                  <th className="py-3 px-4">Rol Asignado</th>
                  <th className="py-3 px-4">Firma Digital</th>
                  <th className="py-3 px-4">Estado</th>
                  <th className="py-3 px-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {usuariosFiltrados.map((u) => {
                  const rolMeta = ROLES_INFO.find((r) => r.id === u.rol);
                  const activo = u.activo ?? true;

                  return (
                    <tr key={u.id} className="hover:bg-slate-50/60 transition">
                      {/* Avatar y Datos Principales */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-slate-900 text-white font-bold flex items-center justify-center text-xs shrink-0">
                            {u.nombre
                              .split(' ')
                              .map((n) => n[0])
                              .slice(0, 2)
                              .join('')}
                          </div>
                          <div>
                            <span className="font-bold text-slate-900 block">{u.nombre}</span>
                            <span className="text-[11px] text-slate-500 font-mono flex items-center gap-1">
                              <Mail className="w-3 h-3 text-slate-400" />
                              {u.email}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Cargo */}
                      <td className="py-3 px-4 font-medium text-slate-700">{u.cargo}</td>

                      {/* Badge de Rol */}
                      <td className="py-3 px-4">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${rolMeta?.color}`}>
                          {rolMeta?.nombre || u.rol}
                        </span>
                      </td>

                      {/* Firma Digital Registrada */}
                      <td className="py-3 px-4">
                        {u.firmaUrl ? (
                          <div className="flex items-center gap-1.5 text-emerald-600 font-medium text-[11px]">
                            <FileCheck2 className="w-4 h-4" />
                            <span>Registrada</span>
                          </div>
                        ) : (
                          <span className="text-slate-400 text-[11px] italic">Sin firma</span>
                        )}
                      </td>

                      {/* Estado Activo / Inactivo */}
                      <td className="py-3 px-4">
                        <button
                          type="button"
                          onClick={() => handleToggleEstadoActivo(u)}
                          className={`flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full transition cursor-pointer ${
                            activo
                              ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                              : 'bg-rose-50 text-rose-700 hover:bg-rose-100'
                          }`}
                          title="Clic para cambiar estado"
                        >
                          {activo ? <UserCheck className="w-3 h-3" /> : <UserX className="w-3 h-3" />}
                          <span>{activo ? 'Activo' : 'Inactivo'}</span>
                        </button>
                      </td>

                      {/* Acciones */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => handleEditarUsuario(u)}
                            className="p-1.5 text-slate-500 hover:text-emerald-600 hover:bg-slate-100 rounded-lg transition"
                            title="Editar Usuario"
                          >
                            <Edit className="w-4 h-4" />
                          </button>

                          {esSuperAdmin && u.id !== usuarioActual.id && (
                            <button
                              type="button"
                              onClick={() => handleEliminarUsuario(u)}
                              className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                              title="Eliminar Usuario"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* PESTAÑA 2: MATRIZ DE PERMISOS POR ROL */}
      {/* ========================================================= */}
      {pestanaActiva === 'permisos' && (
        <div className="space-y-4">
          {/* Banner Informativo */}
          <div className="bg-slate-900 text-white rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md">
            <div>
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-emerald-400" />
                <h3 className="font-bold text-sm">Control Granular de Privilegios Metrológicos</h3>
              </div>
              <p className="text-xs text-slate-300 mt-1 max-w-3xl">
                Define qué acciones operativas y de emisión puede ejecutar cada rol. Los cambios se aplican de forma inmediata en las pantallas y funciones de todos los usuarios.
              </p>
            </div>

            {esSuperAdmin && (
              <button
                type="button"
                onClick={handleRestablecerPermisosPorDefecto}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold border border-slate-700 transition cursor-pointer self-start sm:self-auto shrink-0"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Valores por Defecto</span>
              </button>
            )}
          </div>

          {/* Tabla de Matriz */}
          <div className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-x-auto">
            <table className="w-full text-left text-xs min-w-[700px]">
              <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                <tr>
                  <th className="py-3.5 px-4 w-2/5">Módulo o Acción Operativa</th>
                  {ROLES_INFO.map((r) => (
                    <th key={r.id} className="py-3.5 px-3 text-center">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded border inline-block ${r.color}`}>
                        {r.nombre}
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {categoriasPermisos.map((categoria) => {
                  const permisosDeCategoria = PERMISOS_DEFINICIONES.filter(
                    (p) => p.categoria === categoria
                  );

                  return (
                    <React.Fragment key={categoria}>
                      {/* Cabecera de Categoría */}
                      <tr className="bg-slate-100/70 border-t border-slate-200">
                        <td
                          colSpan={1 + ROLES_INFO.length}
                          className="py-2 px-4 font-bold text-[11px] text-slate-600 uppercase tracking-wider"
                        >
                          {categoria}
                        </td>
                      </tr>

                      {/* Filas de Permisos */}
                      {permisosDeCategoria.map((permiso) => (
                        <tr key={permiso.id} className="hover:bg-slate-50/70 transition">
                          <td className="py-3 px-4">
                            <span className="font-bold text-slate-900 block">{permiso.nombre}</span>
                            <span className="text-[11px] text-slate-500 block mt-0.5">
                              {permiso.descripcion}
                            </span>
                          </td>

                          {ROLES_INFO.map((rol) => {
                            const esAdmin = rol.id === 'administrador';
                            const tiene = esAdmin || (matrizPermisos[rol.id] || []).includes(permiso.id);

                            return (
                              <td key={rol.id} className="py-3 px-3 text-center">
                                <button
                                  type="button"
                                  disabled={!esSuperAdmin || esAdmin}
                                  onClick={() => handleTogglePermiso(rol.id, permiso.id)}
                                  className={`inline-flex items-center justify-center w-7 h-7 rounded-lg transition ${
                                    esAdmin
                                      ? 'bg-purple-50 text-purple-600 cursor-not-allowed opacity-90'
                                      : tiene
                                      ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100 cursor-pointer'
                                      : 'bg-slate-100 text-slate-400 hover:bg-slate-200 cursor-pointer'
                                  }`}
                                  title={
                                    esAdmin
                                      ? 'Permiso inherente de Administrador'
                                      : tiene
                                      ? 'Clic para revocar permiso'
                                      : 'Clic para conceder permiso'
                                  }
                                >
                                  {tiene ? (
                                    <CheckSquare className="w-4 h-4" />
                                  ) : (
                                    <Square className="w-4 h-4 text-slate-300" />
                                  )}
                                </button>
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: CREAR / EDITAR USUARIO */}
      {/* ========================================================= */}
      {modalUsuarioAbierto && usuarioEnEdicion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            {/* Header Modal */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
              <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                <Users className="w-4 h-4 text-emerald-600" />
                <span>
                  {usuarioEnEdicion.nombre ? `Editar Usuario: ${usuarioEnEdicion.nombre}` : 'Nuevo Usuario'}
                </span>
              </h3>
              <button
                type="button"
                onClick={() => setModalUsuarioAbierto(false)}
                className="text-slate-400 hover:text-slate-600 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Formulario */}
            <form onSubmit={handleGuardarUsuarioModal} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Nombre Completo y Título</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Ing. Carlos Mendoza"
                  value={usuarioEnEdicion.nombre}
                  onChange={(e) => setUsuarioEnEdicion({ ...usuarioEnEdicion, nombre: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg p-2.5 bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Correo Electrónico de Acceso</label>
                <input
                  type="email"
                  required
                  placeholder="carlos.mendoza@empresa.com"
                  value={usuarioEnEdicion.email}
                  onChange={(e) => setUsuarioEnEdicion({ ...usuarioEnEdicion, email: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg p-2.5 bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Cargo Técnico</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. Técnico de Ensayos"
                    value={usuarioEnEdicion.cargo}
                    onChange={(e) => setUsuarioEnEdicion({ ...usuarioEnEdicion, cargo: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg p-2.5 bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Rol Operativo</label>
                  <select
                    value={usuarioEnEdicion.rol}
                    onChange={(e) =>
                      setUsuarioEnEdicion({ ...usuarioEnEdicion, rol: e.target.value as RolUsuario })
                    }
                    className="w-full border border-slate-300 rounded-lg p-2.5 bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none font-semibold text-slate-800"
                  >
                    <option value="tecnico">Técnico Metrólogo</option>
                    <option value="revisor_tecnico">Revisor Técnico</option>
                    <option value="director_tecnico">Director Técnico</option>
                    <option value="administrador">Administrador</option>
                    <option value="auditor">Auditor de Calidad</option>
                  </select>
                </div>
              </div>

              {/* Contraseña */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Contraseña de Acceso (mínimo 6 caracteres)
                </label>
                <div className="relative">
                  <Key className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={passwordForm}
                    onChange={(e) => setPasswordForm(e.target.value)}
                    placeholder="Contraseña segura"
                    className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg bg-white font-mono text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
                <span className="text-[10px] text-slate-400 mt-1 block">
                  El usuario podrá usar esta contraseña para iniciar sesión en la plataforma.
                </span>
              </div>

              {/* Estado Activo */}
              <div className="pt-2 flex items-center gap-2">
                <input
                  type="checkbox"
                  id="activoCheck"
                  checked={usuarioEnEdicion.activo ?? true}
                  onChange={(e) =>
                    setUsuarioEnEdicion({ ...usuarioEnEdicion, activo: e.target.checked })
                  }
                  className="w-4 h-4 rounded text-emerald-600 border-slate-300 focus:ring-emerald-500 cursor-pointer"
                />
                <label htmlFor="activoCheck" className="font-semibold text-slate-700 cursor-pointer">
                  Cuenta de usuario activa (permite iniciar sesión)
                </label>
              </div>

              {/* Footer Modal */}
              <div className="pt-4 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalUsuarioAbierto(false)}
                  className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-1.5 px-4 py-2 font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition shadow-xs cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>Guardar Usuario</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
