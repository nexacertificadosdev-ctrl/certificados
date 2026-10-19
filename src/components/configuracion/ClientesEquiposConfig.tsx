import React, { useState } from 'react';
import type { Cliente, EquipoInstrumento, Usuario, EquipoPatron } from '../../types';
import { storageService } from '../../services/storageService';
import {
  Users,
  Wrench,
  Plus,
  Search,
  Edit2,
  Trash2,
  Building2,
  X,
  CheckCircle2,
  Mail,
  Phone,
  MapPin,
  Tag,
  Scale,
  AlertTriangle,
  ShieldCheck,
  CheckCircle,
} from 'lucide-react';

interface ClientesEquiposConfigProps {
  usuarioActual: Usuario;
}

export const ClientesEquiposConfig: React.FC<ClientesEquiposConfigProps> = ({ usuarioActual: _usuarioActual }) => {
  const [tabActiva, setTabActiva] = useState<'clientes' | 'equipos' | 'patrones'>('clientes');

  // Estados de Clientes
  const [clientes, setClientes] = useState<Cliente[]>(storageService.getClientes());
  const [busquedaCliente, setBusquedaCliente] = useState('');
  const [modalClienteAbierto, setModalClienteAbierto] = useState(false);
  const [clienteEnEdicion, setClienteEnEdicion] = useState<Cliente | null>(null);

  // Estados de Equipos
  const [equipos, setEquipos] = useState<EquipoInstrumento[]>(storageService.getEquipos());
  const [busquedaEquipo, setBusquedaEquipo] = useState('');
  const [filtroClienteEquipo, setFiltroClienteEquipo] = useState('');
  const [modalEquipoAbierto, setModalEquipoAbierto] = useState(false);
  const [equipoEnEdicion, setEquipoEnEdicion] = useState<EquipoInstrumento | null>(null);

  // Estados de Patrones Metrológicos (ISO 17025)
  const [patrones, setPatrones] = useState<EquipoPatron[]>(storageService.getPatrones());
  const [busquedaPatron, setBusquedaPatron] = useState('');
  const [filtroEstadoPatron, setFiltroEstadoPatron] = useState<'todos' | 'vigente' | 'por_vencer' | 'vencido'>('todos');
  const [modalPatronAbierto, setModalPatronAbierto] = useState(false);
  const [patronEnEdicion, setPatronEnEdicion] = useState<EquipoPatron | null>(null);

  const [mensajeExito, setMensajeExito] = useState<string | null>(null);

  const mostrarExito = (msg: string) => {
    setMensajeExito(msg);
    setTimeout(() => setMensajeExito(null), 3000);
  };

  // CLIENTES - Handlers
  const handleNuevoCliente = () => {
    setClienteEnEdicion({
      id: `cli-${Date.now()}`,
      razonSocial: '',
      identificacion: '',
      direccion: '',
      contacto: '',
      telefono: '',
      email: '',
    });
    setModalClienteAbierto(true);
  };

  const handleEditarCliente = (c: Cliente) => {
    setClienteEnEdicion({ ...c });
    setModalClienteAbierto(true);
  };

  const handleEliminarCliente = (id: string) => {
    if (confirm('¿Estás seguro de eliminar este cliente? Se mantendrán los reportes históricos.')) {
      storageService.eliminarCliente(id);
      setClientes(storageService.getClientes());
      mostrarExito('Cliente eliminado con éxito.');
    }
  };

  const handleGuardarCliente = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clienteEnEdicion || !clienteEnEdicion.razonSocial || !clienteEnEdicion.identificacion) return;

    storageService.guardarCliente(clienteEnEdicion);
    setClientes(storageService.getClientes());
    setModalClienteAbierto(false);
    setClienteEnEdicion(null);
    mostrarExito('Cliente guardado y sincronizado con éxito.');
  };

  // EQUIPOS - Handlers
  const handleNuevoEquipo = () => {
    setEquipoEnEdicion({
      id: `eq-${Date.now()}`,
      clasificacionCodigo: 'VT',
      tipo: 'Válvula de Seguridad y/o Alivio (PSV)',
      fabricante: '',
      modelo: '',
      numeroSerie: '',
      tagIdentificacion: '',
      rangoPresion: '0 a 300 psi',
      tamanio: '2" x 3"',
      clasePresion: '150# ANSI',
      clienteId: clientes[0]?.id || '',
    });
    setModalEquipoAbierto(true);
  };

  const handleEditarEquipo = (eq: EquipoInstrumento) => {
    setEquipoEnEdicion({ ...eq });
    setModalEquipoAbierto(true);
  };

  const handleEliminarEquipo = (id: string) => {
    if (confirm('¿Estás seguro de eliminar este equipo/instrumento del catálogo?')) {
      storageService.eliminarEquipo(id);
      setEquipos(storageService.getEquipos());
      mostrarExito('Equipo eliminado con éxito.');
    }
  };

  const handleGuardarEquipo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!equipoEnEdicion || !equipoEnEdicion.tagIdentificacion || !equipoEnEdicion.clienteId) return;

    storageService.guardarEquipo(equipoEnEdicion);
    setEquipos(storageService.getEquipos());
    setModalEquipoAbierto(false);
    setEquipoEnEdicion(null);
    mostrarExito('Equipo guardado y sincronizado con éxito.');
  };

  // PATRONES - Handlers
  const handleNuevoPatron = () => {
    setPatronEnEdicion({
      id: `pat-${Date.now()}`,
      codigo: '',
      nombre: '',
      marca: '',
      modelo: '',
      serie: '',
      rangoMedida: '',
      resolucion: '',
      incertidumbre: '',
      certificadoCalibracion: '',
      laboratorioCalibrador: 'Laboratorio Acreditado ONAC',
      fechaCalibracion: new Date().toISOString().split('T')[0],
      vigencia: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      activo: true,
    });
    setModalPatronAbierto(true);
  };

  const handleEditarPatron = (p: EquipoPatron) => {
    setPatronEnEdicion({ ...p });
    setModalPatronAbierto(true);
  };

  const handleEliminarPatron = (id: string) => {
    if (confirm('¿Estás seguro de eliminar este patrón de referencia? Podría afectar la trazabilidad metrológica.')) {
      storageService.eliminarPatron(id);
      setPatrones(storageService.getPatrones());
      mostrarExito('Patrón metrológico eliminado con éxito.');
    }
  };

  const handleToggleActivoPatron = (p: EquipoPatron) => {
    const actualizado = { ...p, activo: !p.activo };
    storageService.guardarPatron(actualizado);
    setPatrones(storageService.getPatrones());
    mostrarExito(`Patrón ${actualizado.codigo} ${actualizado.activo ? 'activado' : 'inactivado'}.`);
  };

  const handleGuardarPatron = (e: React.FormEvent) => {
    e.preventDefault();
    if (!patronEnEdicion || !patronEnEdicion.codigo || !patronEnEdicion.nombre || !patronEnEdicion.certificadoCalibracion) return;

    storageService.guardarPatron(patronEnEdicion);
    setPatrones(storageService.getPatrones());
    setModalPatronAbierto(false);
    setPatronEnEdicion(null);
    mostrarExito('Patrón metrológico guardado y sincronizado.');
  };

  const getEstadoPatron = (vigencia: string) => {
    if (!vigencia) return { estado: 'desconocido', label: 'Sin Vigencia', color: 'bg-slate-100 text-slate-700 border-slate-200', dias: 0 };
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const v = new Date(vigencia);
    v.setHours(0, 0, 0, 0);
    const diffDays = Math.ceil((v.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays < 0) {
      return { estado: 'vencido', label: `Vencido (${Math.abs(diffDays)}d)`, color: 'bg-rose-50 text-rose-700 border-rose-200', dias: diffDays };
    }
    if (diffDays <= 30) {
      return { estado: 'por_vencer', label: `Por vencer (${diffDays}d)`, color: 'bg-amber-50 text-amber-700 border-amber-200', dias: diffDays };
    }
    return { estado: 'vigente', label: `Vigente (${diffDays}d)`, color: 'bg-emerald-50 text-emerald-700 border-emerald-200', dias: diffDays };
  };

  // Filtrado
  const clientesFiltrados = clientes.filter(
    (c) =>
      c.razonSocial.toLowerCase().includes(busquedaCliente.toLowerCase()) ||
      c.identificacion.toLowerCase().includes(busquedaCliente.toLowerCase()) ||
      c.contacto.toLowerCase().includes(busquedaCliente.toLowerCase())
  );

  const equiposFiltrados = equipos.filter((eq) => {
    const matchBusqueda =
      eq.tagIdentificacion.toLowerCase().includes(busquedaEquipo.toLowerCase()) ||
      eq.numeroSerie.toLowerCase().includes(busquedaEquipo.toLowerCase()) ||
      eq.tipo.toLowerCase().includes(busquedaEquipo.toLowerCase()) ||
      eq.fabricante.toLowerCase().includes(busquedaEquipo.toLowerCase());
    const matchCliente = filtroClienteEquipo ? eq.clienteId === filtroClienteEquipo : true;
    return matchBusqueda && matchCliente;
  });

  const patronesFiltrados = patrones.filter((p) => {
    const matchBusqueda =
      p.codigo.toLowerCase().includes(busquedaPatron.toLowerCase()) ||
      p.nombre.toLowerCase().includes(busquedaPatron.toLowerCase()) ||
      p.certificadoCalibracion.toLowerCase().includes(busquedaPatron.toLowerCase()) ||
      (p.marca && p.marca.toLowerCase().includes(busquedaPatron.toLowerCase())) ||
      (p.serie && p.serie.toLowerCase().includes(busquedaPatron.toLowerCase()));
    
    if (!matchBusqueda) return false;

    if (filtroEstadoPatron === 'todos') return true;
    const est = getEstadoPatron(p.vigencia).estado;
    return est === filtroEstadoPatron;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Encabezado */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Building2 className="w-6 h-6 text-[#00875a]" />
            <span>Gestión de Clientes, Equipos & Instrumentos</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Administra los solicitantes de servicios y el catálogo maestro de ítems de ensayo y calibración.
          </p>
        </div>

        {mensajeExito && (
          <div className="flex items-center gap-2 bg-emerald-50 text-emerald-800 border border-emerald-200 px-3 py-1.5 rounded-lg text-xs font-medium animate-fadeIn">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{mensajeExito}</span>
          </div>
        )}
      </div>

      {/* Selector de Pestañas */}
      <div className="flex border-b border-slate-200 mb-6 gap-2">
        <button
          onClick={() => setTabActiva('clientes')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition cursor-pointer rounded-t-xl ${
            tabActiva === 'clientes'
              ? 'border-[#00875a] text-[#00875a] bg-[#eef8f1]'
              : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Clientes / Solicitantes ({clientes.length})</span>
        </button>

        <button
          onClick={() => setTabActiva('equipos')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition cursor-pointer rounded-t-xl ${
            tabActiva === 'equipos'
              ? 'border-[#00875a] text-[#00875a] bg-[#eef8f1]'
              : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
          }`}
        >
          <Wrench className="w-4 h-4" />
          <span>Equipos & Instrumentos ({equipos.length})</span>
        </button>

        <button
          onClick={() => setTabActiva('patrones')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition cursor-pointer rounded-t-xl ${
            tabActiva === 'patrones'
              ? 'border-[#00875a] text-[#00875a] bg-[#eef8f1]'
              : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
          }`}
        >
          <Scale className="w-4 h-4" />
          <span>Patrones Metrológicos ISO 17025 ({patrones.length})</span>
          {patrones.some((p) => getEstadoPatron(p.vigencia).estado === 'vencido') && (
            <span
              className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"
              title="Existen patrones vencidos"
            />
          )}
        </button>
      </div>

      {/* PESTAÑA 1: CLIENTES */}
      {tabActiva === 'clientes' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Buscar por razón social, NIT o contacto..."
                value={busquedaCliente}
                onChange={(e) => setBusquedaCliente(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <button
              onClick={handleNuevoCliente}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-medium shadow-xs transition cursor-pointer shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Nuevo Cliente</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {clientesFiltrados.map((c) => {
              const equiposCount = equipos.filter((eq) => eq.clienteId === c.id).length;
              return (
                <div
                  key={c.id}
                  className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs hover:border-blue-300 transition flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h4 className="font-bold text-slate-900 text-sm">{c.razonSocial}</h4>
                      <span className="font-mono text-[11px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded shrink-0">
                        {c.identificacion}
                      </span>
                    </div>

                    <div className="space-y-1.5 text-xs text-slate-600 my-3">
                      <p className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{c.direccion}</span>
                      </p>
                      <p className="flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{c.contacto || 'Contacto no especificado'}</span>
                      </p>
                      <p className="flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{c.telefono || 'Sin teléfono'}</span>
                      </p>
                      <p className="flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{c.email || 'Sin correo'}</span>
                      </p>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="text-slate-500 font-mono text-[11px]">
                      {equiposCount} equipo(s)
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleEditarCliente(c)}
                        className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition cursor-pointer"
                        title="Editar cliente"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleEliminarCliente(c.id)}
                        className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                        title="Eliminar cliente"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* PESTAÑA 2: EQUIPOS */}
      {tabActiva === 'equipos' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
            <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto">
              <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Buscar por tag, serial, modelo..."
                  value={busquedaEquipo}
                  onChange={(e) => setBusquedaEquipo(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <select
                aria-label="Filtrar equipos por cliente"
                value={filtroClienteEquipo}
                onChange={(e) => setFiltroClienteEquipo(e.target.value)}
                className="w-full sm:w-56 px-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-white"
              >
                <option value="">Todos los Clientes</option>
                {clientes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.razonSocial}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={handleNuevoEquipo}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-medium shadow-xs transition cursor-pointer shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Nuevo Equipo / Instrumento</span>
            </button>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                  <th className="p-3">Tag / Identificación</th>
                  <th className="p-3">Tipo de Equipo</th>
                  <th className="p-3">Fabricante & Modelo</th>
                  <th className="p-3">No. Serie</th>
                  <th className="p-3">Rango / Rating</th>
                  <th className="p-3">Cliente Solicitante</th>
                  <th className="p-3 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {equiposFiltrados.map((eq) => {
                  const cliente = clientes.find((c) => c.id === eq.clienteId);
                  return (
                    <tr key={eq.id} className="hover:bg-slate-50 transition">
                      <td className="p-3 font-mono font-bold text-blue-700 flex items-center gap-1.5">
                        <Tag className="w-3.5 h-3.5 text-slate-400" />
                        <span>{eq.tagIdentificacion}</span>
                      </td>
                      <td className="p-3 font-medium text-slate-800">{eq.tipo}</td>
                      <td className="p-3 text-slate-600">
                        {eq.fabricante} {eq.modelo ? `(${eq.modelo})` : ''}
                      </td>
                      <td className="p-3 font-mono text-slate-600">{eq.numeroSerie}</td>
                      <td className="p-3 text-slate-600">
                        {eq.rangoPresion || eq.clasePresion || '-'}
                      </td>
                      <td className="p-3 text-slate-700 font-medium">
                        {cliente?.razonSocial || 'Sin asignar'}
                      </td>
                      <td className="p-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => handleEditarEquipo(eq)}
                            className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition cursor-pointer"
                            title="Editar equipo"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleEliminarEquipo(eq.id)}
                            className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                            title="Eliminar equipo"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
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

      {/* PESTAÑA 3: PATRONES METROLÓGICOS (ISO/IEC 17025) */}
      {tabActiva === 'patrones' && (
        <div className="space-y-6">
          {/* Métricas de Salud Metrológica */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <span className="text-[11px] font-bold text-slate-500 uppercase">Flota de Patrones</span>
              <div className="text-2xl font-black text-slate-900 mt-1 font-mono">{patrones.length}</div>
              <span className="text-[10px] text-slate-400">Total registrados</span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-emerald-200 shadow-xs bg-emerald-50/20">
              <span className="text-[11px] font-bold text-emerald-700 uppercase flex items-center gap-1.5">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                Vigentes (&gt; 30d)
              </span>
              <div className="text-2xl font-black text-emerald-700 mt-1 font-mono">
                {patrones.filter((p) => getEstadoPatron(p.vigencia).estado === 'vigente').length}
              </div>
              <span className="text-[10px] text-emerald-600/80">Listos para ensayos</span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-amber-200 shadow-xs bg-amber-50/20">
              <span className="text-[11px] font-bold text-amber-700 uppercase flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                Por Vencer (≤ 30d)
              </span>
              <div className="text-2xl font-black text-amber-700 mt-1 font-mono">
                {patrones.filter((p) => getEstadoPatron(p.vigencia).estado === 'por_vencer').length}
              </div>
              <span className="text-[10px] text-amber-600/80">Programar calibración</span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-rose-200 shadow-xs bg-rose-50/20">
              <span className="text-[11px] font-bold text-rose-700 uppercase flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-rose-600" />
                Vencidos
              </span>
              <div className="text-2xl font-black text-rose-700 mt-1 font-mono">
                {patrones.filter((p) => getEstadoPatron(p.vigencia).estado === 'vencido').length}
              </div>
              <span className="text-[10px] text-rose-600/80">Bloqueados para emisión</span>
            </div>
          </div>

          {/* Alerta de Auditoría ISO 17025 */}
          {patrones.some((p) => getEstadoPatron(p.vigencia).estado === 'vencido') && (
            <div className="flex items-start gap-3 bg-rose-50 border border-rose-200 p-4 rounded-xl text-rose-900">
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div className="text-xs">
                <strong className="font-bold block text-sm mb-0.5">
                  Alerta Metrológica (ISO/IEC 17025:2017 Numeral 6.4.7)
                </strong>
                Uno o más patrones tienen su certificado de calibración vencido. No deben seleccionarse ni asignarse a certificados oficiales hasta completar su recalibración con trazabilidad al INM / ONAC.
              </div>
            </div>
          )}

          {/* Barra de Filtros y Acción */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <div className="relative w-full sm:w-80">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Buscar por código, nombre, certificado o marca..."
                  value={busquedaPatron}
                  onChange={(e) => setBusquedaPatron(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <select
                value={filtroEstadoPatron}
                onChange={(e) => setFiltroEstadoPatron(e.target.value as any)}
                className="px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-slate-700"
              >
                <option value="todos">Todos los Estados</option>
                <option value="vigente">Solo Vigentes (&gt; 30d)</option>
                <option value="por_vencer">Por Vencer (≤ 30d)</option>
                <option value="vencido">Vencidos</option>
              </select>
            </div>

            <button
              onClick={handleNuevoPatron}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-medium shadow-xs transition cursor-pointer shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Nuevo Patrón de Referencia</span>
            </button>
          </div>

          {/* Tabla de Patrones */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">Código & Patrón</th>
                  <th className="px-4 py-3">Certificado & Laboratorio</th>
                  <th className="px-4 py-3">Calibración & Vigencia</th>
                  <th className="px-4 py-3">Rango & Incertidumbre U</th>
                  <th className="px-4 py-3 text-center">Estado</th>
                  <th className="px-4 py-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {patronesFiltrados.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                      No se encontraron patrones de calibración con los criterios aplicados.
                    </td>
                  </tr>
                ) : (
                  patronesFiltrados.map((p) => {
                    const est = getEstadoPatron(p.vigencia);
                    return (
                      <tr key={p.id} className="hover:bg-slate-50/80 transition">
                        <td className="px-4 py-3 font-medium text-slate-900">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-bold bg-blue-50 text-blue-800 border border-blue-200 px-1.5 py-0.5 rounded">
                              {p.codigo}
                            </span>
                            {!p.activo && (
                              <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded font-normal">
                                Inactivo
                              </span>
                            )}
                          </div>
                          <span className="block text-slate-800 font-semibold mt-1">{p.nombre}</span>
                          <span className="text-[11px] text-slate-500">
                            {p.marca || 'N/A'} {p.modelo ? `• Mod. ${p.modelo}` : ''} {p.serie ? `• S/N: ${p.serie}` : ''}
                          </span>
                        </td>

                        <td className="px-4 py-3">
                          <span className="font-mono font-bold text-slate-900 block">
                            {p.certificadoCalibracion}
                          </span>
                          <span className="text-[11px] text-slate-500">
                            {p.laboratorioCalibrador || 'Laboratorio Acreditado'}
                          </span>
                        </td>

                        <td className="px-4 py-3">
                          <span className="text-[11px] text-slate-500 block">
                            Calibrado: {p.fechaCalibracion}
                          </span>
                          <div className="flex items-center gap-1.5 mt-1">
                            <span
                              className={`px-2 py-0.5 text-[10px] font-bold rounded-md border ${est.color}`}
                            >
                              {est.label}
                            </span>
                          </div>
                        </td>

                        <td className="px-4 py-3">
                          <span className="block font-mono text-slate-800">
                            {p.rangoMedida || 'No especificado'}
                          </span>
                          <span className="text-[11px] text-slate-500 block">
                            U = {p.incertidumbre || 'N/A'} {p.resolucion ? `(Res: ${p.resolucion})` : ''}
                          </span>
                        </td>

                        <td className="px-4 py-3 text-center">
                          <button
                            type="button"
                            onClick={() => handleToggleActivoPatron(p)}
                            className={`px-2 py-1 text-[11px] font-bold rounded-lg border cursor-pointer transition ${
                              p.activo
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100'
                                : 'bg-slate-100 text-slate-500 border-slate-300 hover:bg-slate-200'
                            }`}
                          >
                            {p.activo ? 'Activo' : 'Inactivo'}
                          </button>
                        </td>

                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => handleEditarPatron(p)}
                              className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition cursor-pointer"
                              title="Editar patrón"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleEliminarPatron(p.id)}
                              className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                              title="Eliminar patrón"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL CLIENTE */}
      {modalClienteAbierto && clienteEnEdicion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
              <h3 className="font-bold text-slate-900 text-sm">
                {clienteEnEdicion.id.startsWith('cli-') && !clientes.some((c) => c.id === clienteEnEdicion.id)
                  ? 'Nuevo Cliente'
                  : 'Editar Cliente'}
              </h3>
              <button
                onClick={() => setModalClienteAbierto(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleGuardarCliente} className="p-6 space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Razón Social / Empresa *
                </label>
                <input
                  type="text"
                  required
                  value={clienteEnEdicion.razonSocial}
                  onChange={(e) =>
                    setClienteEnEdicion({ ...clienteEnEdicion, razonSocial: e.target.value })
                  }
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                  placeholder="Ej. ECOPETROL S.A."
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    NIT / Identificación *
                  </label>
                  <input
                    type="text"
                    required
                    value={clienteEnEdicion.identificacion}
                    onChange={(e) =>
                      setClienteEnEdicion({ ...clienteEnEdicion, identificacion: e.target.value })
                    }
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg font-mono"
                    placeholder="900.123.456-7"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Contacto Principal</label>
                  <input
                    type="text"
                    value={clienteEnEdicion.contacto}
                    onChange={(e) =>
                      setClienteEnEdicion({ ...clienteEnEdicion, contacto: e.target.value })
                    }
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                    placeholder="Ing. Juan Pérez"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Dirección / Sede</label>
                <input
                  type="text"
                  value={clienteEnEdicion.direccion}
                  onChange={(e) =>
                    setClienteEnEdicion({ ...clienteEnEdicion, direccion: e.target.value })
                  }
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                  placeholder="Zona Industrial Mamonal Km 5, Cartagena"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Teléfono</label>
                  <input
                    type="text"
                    value={clienteEnEdicion.telefono}
                    onChange={(e) =>
                      setClienteEnEdicion({ ...clienteEnEdicion, telefono: e.target.value })
                    }
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                    placeholder="+57 (605) 668 5500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Correo Electrónico</label>
                  <input
                    type="email"
                    value={clienteEnEdicion.email}
                    onChange={(e) =>
                      setClienteEnEdicion({ ...clienteEnEdicion, email: e.target.value })
                    }
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                    placeholder="calidad@empresa.com"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalClienteAbierto(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-medium shadow-xs cursor-pointer"
                >
                  Guardar Cliente
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL EQUIPO */}
      {modalEquipoAbierto && equipoEnEdicion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
              <h3 className="font-bold text-slate-900 text-sm">
                {equipoEnEdicion.id.startsWith('eq-') && !equipos.some((eq) => eq.id === equipoEnEdicion.id)
                  ? 'Nuevo Equipo / Instrumento'
                  : 'Editar Equipo'}
              </h3>
              <button
                onClick={() => setModalEquipoAbierto(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleGuardarEquipo} className="p-6 space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Cliente Propietario *</label>
                <select
                  required
                  value={equipoEnEdicion.clienteId}
                  onChange={(e) =>
                    setEquipoEnEdicion({ ...equipoEnEdicion, clienteId: e.target.value })
                  }
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white"
                >
                  {clientes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.razonSocial}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Tag / Identificación *
                  </label>
                  <input
                    type="text"
                    required
                    value={equipoEnEdicion.tagIdentificacion}
                    onChange={(e) =>
                      setEquipoEnEdicion({ ...equipoEnEdicion, tagIdentificacion: e.target.value })
                    }
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg font-mono font-bold"
                    placeholder="PSV-001 / PI-201"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Tipo de Equipo</label>
                  <input
                    type="text"
                    value={equipoEnEdicion.tipo}
                    onChange={(e) => setEquipoEnEdicion({ ...equipoEnEdicion, tipo: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                    placeholder="Válvula / Manómetro / Spool"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Fabricante</label>
                  <input
                    type="text"
                    value={equipoEnEdicion.fabricante}
                    onChange={(e) =>
                      setEquipoEnEdicion({ ...equipoEnEdicion, fabricante: e.target.value })
                    }
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                    placeholder="TECVAL / WIKA / Fluke"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Modelo / Referencia</label>
                  <input
                    type="text"
                    value={equipoEnEdicion.modelo}
                    onChange={(e) => setEquipoEnEdicion({ ...equipoEnEdicion, modelo: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                    placeholder="SAI-M / 232.50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Número de Serie</label>
                  <input
                    type="text"
                    value={equipoEnEdicion.numeroSerie}
                    onChange={(e) =>
                      setEquipoEnEdicion({ ...equipoEnEdicion, numeroSerie: e.target.value })
                    }
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg font-mono"
                    placeholder="SN-123456"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Clase / Rating</label>
                  <input
                    type="text"
                    value={equipoEnEdicion.clasePresion || ''}
                    onChange={(e) =>
                      setEquipoEnEdicion({ ...equipoEnEdicion, clasePresion: e.target.value })
                    }
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                    placeholder="150# ANSI / 300#"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Rango / Tamaño</label>
                <input
                  type="text"
                  value={equipoEnEdicion.rangoPresion || ''}
                  onChange={(e) =>
                    setEquipoEnEdicion({ ...equipoEnEdicion, rangoPresion: e.target.value })
                  }
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                  placeholder='0 a 300 psi / 2" x 3"'
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalEquipoAbierto(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-medium shadow-xs cursor-pointer"
                >
                  Guardar Equipo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL PATRÓN METROLÓGICO (ISO 17025) */}
      {modalPatronAbierto && patronEnEdicion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden border border-slate-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
              <div className="flex items-center gap-2">
                <Scale className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-slate-900 text-sm">
                  {patronEnEdicion.id.startsWith('pat-') && !patrones.some((p) => p.id === patronEnEdicion.id)
                    ? 'Nuevo Patrón de Referencia Metrológica'
                    : 'Editar Patrón Metrológico'}
                </h3>
              </div>
              <button
                onClick={() => setModalPatronAbierto(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleGuardarPatron} className="p-6 space-y-3 max-h-[80vh] overflow-y-auto">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Código Interno *
                  </label>
                  <input
                    type="text"
                    required
                    value={patronEnEdicion.codigo}
                    onChange={(e) =>
                      setPatronEnEdicion({ ...patronEnEdicion, codigo: e.target.value })
                    }
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg font-mono font-bold"
                    placeholder="Ej. PAT-PR-05"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Nombre / Descripción del Patrón *
                  </label>
                  <input
                    type="text"
                    required
                    value={patronEnEdicion.nombre}
                    onChange={(e) =>
                      setPatronEnEdicion({ ...patronEnEdicion, nombre: e.target.value })
                    }
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                    placeholder="Ej. Manómetro Patrón Digital XP2i"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Marca</label>
                  <input
                    type="text"
                    value={patronEnEdicion.marca || ''}
                    onChange={(e) =>
                      setPatronEnEdicion({ ...patronEnEdicion, marca: e.target.value })
                    }
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                    placeholder="Crystal / Ametek / Fluke"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Modelo</label>
                  <input
                    type="text"
                    value={patronEnEdicion.modelo || ''}
                    onChange={(e) =>
                      setPatronEnEdicion({ ...patronEnEdicion, modelo: e.target.value })
                    }
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                    placeholder="XP2i-3000"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Número de Serie</label>
                  <input
                    type="text"
                    value={patronEnEdicion.serie || ''}
                    onChange={(e) =>
                      setPatronEnEdicion({ ...patronEnEdicion, serie: e.target.value })
                    }
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg font-mono"
                    placeholder="SN-123456"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Certificado de Calibración *
                  </label>
                  <input
                    type="text"
                    required
                    value={patronEnEdicion.certificadoCalibracion}
                    onChange={(e) =>
                      setPatronEnEdicion({ ...patronEnEdicion, certificadoCalibracion: e.target.value })
                    }
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg font-mono"
                    placeholder="Ej. CERT-MET-2026-1104"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Laboratorio Calibrador *
                  </label>
                  <input
                    type="text"
                    required
                    value={patronEnEdicion.laboratorioCalibrador || ''}
                    onChange={(e) =>
                      setPatronEnEdicion({ ...patronEnEdicion, laboratorioCalibrador: e.target.value })
                    }
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                    placeholder="Ej. Instituto Nacional de Metrología (INM)"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Fecha de Última Calibración *
                  </label>
                  <input
                    type="date"
                    required
                    value={patronEnEdicion.fechaCalibracion}
                    onChange={(e) =>
                      setPatronEnEdicion({ ...patronEnEdicion, fechaCalibracion: e.target.value })
                    }
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Fecha de Vigencia / Vencimiento *
                  </label>
                  <input
                    type="date"
                    required
                    value={patronEnEdicion.vigencia}
                    onChange={(e) =>
                      setPatronEnEdicion({ ...patronEnEdicion, vigencia: e.target.value })
                    }
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Rango de Medida</label>
                  <input
                    type="text"
                    value={patronEnEdicion.rangoMedida || ''}
                    onChange={(e) =>
                      setPatronEnEdicion({ ...patronEnEdicion, rangoMedida: e.target.value })
                    }
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg font-mono"
                    placeholder="0 a 3000 psi"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Resolución</label>
                  <input
                    type="text"
                    value={patronEnEdicion.resolucion || ''}
                    onChange={(e) =>
                      setPatronEnEdicion({ ...patronEnEdicion, resolucion: e.target.value })
                    }
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg font-mono"
                    placeholder="0.1 psi"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Incertidumbre U(k=2)</label>
                  <input
                    type="text"
                    value={patronEnEdicion.incertidumbre || ''}
                    onChange={(e) =>
                      setPatronEnEdicion({ ...patronEnEdicion, incertidumbre: e.target.value })
                    }
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg font-mono"
                    placeholder="± 0.05% de lectura"
                  />
                </div>
              </div>

              <div className="pt-2">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700">
                  <input
                    type="checkbox"
                    checked={patronEnEdicion.activo ?? true}
                    onChange={(e) =>
                      setPatronEnEdicion({ ...patronEnEdicion, activo: e.target.checked })
                    }
                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                  />
                  <span>Patrón Activo para selección en Ensayos & Certificados</span>
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalPatronAbierto(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-medium shadow-xs cursor-pointer"
                >
                  Guardar Patrón
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
