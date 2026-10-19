import React from 'react';
import type { ReporteCertificado, Usuario } from '../../types';
import { storageService } from '../../services/storageService';
import {
  Clock,
  CheckCircle2,
  FileText,
  ArrowRight,
  Scale,
  CheckCircle,
  AlertTriangle,
  TrendingUp,
  Download,
  Calendar,
  MoreHorizontal,
  ChevronDown,
  Layers,
  Wrench,
  Gauge,
  Thermometer,
} from 'lucide-react';

interface DashboardViewProps {
  reportes: ReporteCertificado[];
  usuarioActual: Usuario;
  onCrearReporte: () => void;
  onVerReportes: () => void;
  onVerReporteDetalle: (reporte: ReporteCertificado) => void;
  onVerPatrones?: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  reportes,
  usuarioActual,
  onCrearReporte,
  onVerReportes,
  onVerReporteDetalle,
  onVerPatrones,
}) => {
  const emitidos = reportes.filter((r) => r.estado === 'emitido').length;
  const enRevision = reportes.filter((r) => r.estado === 'en_revision').length;
  const borradores = reportes.filter((r) => r.estado === 'borrador').length;

  // Conteo por clasificación
  const porClasificacion = {
    VT: reportes.filter((r) => r.clasificacionCodigo === 'VT').length,
    TB: reportes.filter((r) => r.clasificacionCodigo === 'TB').length,
    PR: reportes.filter((r) => r.clasificacionCodigo === 'PR').length,
    TM: reportes.filter((r) => r.clasificacionCodigo === 'TM').length,
    EL: reportes.filter((r) => r.clasificacionCodigo === 'EL').length,
  };

  const actividadReciente = [...reportes]
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 5);

  // Salud Metrológica (ISO/IEC 17025)
  const patrones = storageService.getPatrones();
  const getDiffDays = (vigencia: string) => {
    if (!vigencia) return 0;
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const v = new Date(vigencia);
    v.setHours(0, 0, 0, 0);
    return Math.ceil((v.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));
  };
  const patronesVencidos = patrones.filter((p) => getDiffDays(p.vigencia) < 0);
  const patronesPorVencer = patrones.filter((p) => {
    const d = getDiffDays(p.vigencia);
    return d >= 0 && d <= 30;
  });
  const patronesVigentes = patrones.filter((p) => getDiffDays(p.vigencia) > 30);
  const porcentajeVigencia =
    patrones.length > 0
      ? Math.round((patronesVigentes.length / patrones.length) * 100)
      : 100;

  // Fecha para el chip
  const hoy = new Date();
  const fechaTexto = hoy.toLocaleDateString('es-ES', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  // Datos para el gráfico de barras mensual estilo Oripio
  const mesesGrafico = [
    { mes: 'Ene', valor: 28 },
    { mes: 'Feb', valor: 38 },
    { mes: 'Mar', valor: 45 },
    { mes: 'Abr', valor: 32 },
    { mes: 'May', valor: 54 },
    { mes: 'Jun', valor: 48 },
    { mes: 'Jul', valor: 62 },
    { mes: 'Ago', valor: 85, activo: true }, // Mes destacado como en la imagen
    { mes: 'Sep', valor: 59 },
    { mes: 'Oct', valor: 68 },
    { mes: 'Nov', valor: 42 },
    { mes: 'Dic', valor: 35 },
  ];

  return (
    <div className="max-w-[1400px] mx-auto px-6 sm:px-8 py-4 space-y-6">
      {/* 1. Header con Saludo y Botón de Acción estilo Oripio */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Bienvenido de nuevo, {usuarioActual.nombre.split(' ')[0]} 👋
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Supervisa el estado operativo, trazabilidad metrológica y emisión de reportes técnicos.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 px-3.5 py-2 bg-white border border-slate-200/80 rounded-2xl text-xs font-semibold text-slate-700 shadow-xs capitalize">
            <Calendar className="w-4 h-4 text-slate-400" />
            <span>{fechaTexto}</span>
          </div>

          <button
            onClick={onVerReportes}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl text-xs font-bold shadow-xs transition cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Repositorio</span>
          </button>
        </div>
      </div>

      {/* 2. Tres Tarjetas Métricas Principales (Estilo Account Balance / Expenses / Savings) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Tarjeta 1: Consecutivos Emitidos (Estilo Account Balance de la imagen) */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-emerald-50 text-[#00875a] flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
              </div>
              <span className="text-xs font-bold text-slate-700">Reportes Oficiales Emitidos</span>
            </div>

            <div className="flex items-center gap-1 bg-slate-50 border border-slate-200/80 px-2.5 py-1 rounded-xl text-[11px] font-bold text-slate-700">
              <span>TEST</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </div>
          </div>

          <div>
            <div className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight font-mono">
              {emitidos} <span className="text-base font-semibold text-slate-400">reportes</span>
            </div>
            <div className="flex items-center gap-2 mt-2">
              <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-[#eef8f1] text-[#00875a] flex items-center gap-1">
                <TrendingUp className="w-3 h-3" />
                <span>+8.4%</span>
              </span>
              <span className="text-[11px] text-slate-400">frente al mes anterior</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2">
            <button
              onClick={onCrearReporte}
              className="w-full py-2.5 px-3 bg-[#00875a] hover:bg-[#047857] text-white rounded-2xl text-xs font-bold shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <span>+ Nuevo Ensayo</span>
            </button>
            <button
              onClick={onVerReportes}
              className="w-full py-2.5 px-3 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200/80 rounded-2xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <span>Consultar</span>
            </button>
          </div>
        </div>

        {/* Tarjeta 2: En Revisión Técnica (Estilo Total Expenses de la imagen) */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <Clock className="w-4 h-4 stroke-[2.5]" />
              </div>
              <span className="text-xs font-bold text-slate-700">En Revisión Técnica</span>
            </div>

            <button className="text-slate-400 hover:text-slate-600 p-1 rounded-lg">
              <MoreHorizontal className="w-4 h-4" />
            </button>
          </div>

          <div>
            <div className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight font-mono">
              {enRevision}
            </div>
            <div className="flex items-center gap-2 mt-2">
              <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-amber-50 text-amber-700">
                Pendientes
              </span>
              <span className="text-[11px] text-slate-400">Validación por Revisor / Director</span>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Requieren firma técnica</span>
            <span className="font-bold text-amber-700 font-mono">{enRevision} certificados</span>
          </div>
        </div>

        {/* Tarjeta 3: Borradores Activos (Estilo Total Savings de la imagen) */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <FileText className="w-4 h-4 stroke-[2.5]" />
              </div>
              <span className="text-xs font-bold text-slate-700">Borradores en Captura</span>
            </div>

            <button className="text-slate-400 hover:text-slate-600 p-1 rounded-lg">
              <MoreHorizontal className="w-4 h-4" />
            </button>
          </div>

          <div>
            <div className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight font-mono">
              {borradores}
            </div>
            <div className="flex items-center gap-2 mt-2">
              <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-blue-50 text-blue-700">
                En edición
              </span>
              <span className="text-[11px] text-slate-400">Identificador temporal BORR-XXX</span>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Captura por técnicos</span>
            <span className="font-bold text-blue-700 font-mono">{borradores} ítems</span>
          </div>
        </div>
      </div>

      {/* 3. Fila Intermedia: "Disciplinas Técnicas" (My Wallet) & "Overview de Emisión" (Bar Chart) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Lado Izquierdo: Catálogo de Disciplinas (Estilo My Wallet de la imagen) */}
        <div className="lg:col-span-5 bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Layers className="w-4 h-4 text-[#00875a]" />
              <span>Disciplinas de Ensayo</span>
            </h3>

            <button
              onClick={onVerReportes}
              className="text-xs font-bold text-[#00875a] hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>+ Ver todas</span>
            </button>
          </div>

          {/* Grilla 2x2 de tarjetas de disciplinas estilo billeteras de la imagen */}
          <div className="grid grid-cols-2 gap-3">
            {/* VT: Válvulas */}
            <div className="p-3.5 bg-slate-50 hover:bg-slate-100/80 rounded-2xl border border-slate-200/70 transition">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
                    <Wrench className="w-3.5 h-3.5" />
                  </div>
                  <span className="font-bold text-xs text-slate-800">VT: Válvulas</span>
                </div>
                <MoreHorizontal className="w-3.5 h-3.5 text-slate-400" />
              </div>
              <div className="text-lg font-black text-slate-900 font-mono">
                {porClasificacion.VT} <span className="text-xs font-normal text-slate-500">ensayos</span>
              </div>
              <span className="text-[10px] font-bold text-emerald-600 mt-1 block">● Activo</span>
            </div>

            {/* TB: Tuberías */}
            <div className="p-3.5 bg-slate-50 hover:bg-slate-100/80 rounded-2xl border border-slate-200/70 transition">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                    <Gauge className="w-3.5 h-3.5" />
                  </div>
                  <span className="font-bold text-xs text-slate-800">TB: Tuberías</span>
                </div>
                <MoreHorizontal className="w-3.5 h-3.5 text-slate-400" />
              </div>
              <div className="text-lg font-black text-slate-900 font-mono">
                {porClasificacion.TB} <span className="text-xs font-normal text-slate-500">ensayos</span>
              </div>
              <span className="text-[10px] font-bold text-emerald-600 mt-1 block">● Activo</span>
            </div>

            {/* PR: Presión */}
            <div className="p-3.5 bg-slate-50 hover:bg-slate-100/80 rounded-2xl border border-slate-200/70 transition">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center">
                    <Scale className="w-3.5 h-3.5" />
                  </div>
                  <span className="font-bold text-xs text-slate-800">PR: Presión</span>
                </div>
                <MoreHorizontal className="w-3.5 h-3.5 text-slate-400" />
              </div>
              <div className="text-lg font-black text-slate-900 font-mono">
                {porClasificacion.PR} <span className="text-xs font-normal text-slate-500">ensayos</span>
              </div>
              <span className="text-[10px] font-bold text-emerald-600 mt-1 block">● Activo</span>
            </div>

            {/* TM / EL: Temperatura / Eléctricas */}
            <div className="p-3.5 bg-slate-50 hover:bg-slate-100/80 rounded-2xl border border-slate-200/70 transition">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
                    <Thermometer className="w-3.5 h-3.5" />
                  </div>
                  <span className="font-bold text-xs text-slate-800">TM & EL</span>
                </div>
                <MoreHorizontal className="w-3.5 h-3.5 text-slate-400" />
              </div>
              <div className="text-lg font-black text-slate-900 font-mono">
                {porClasificacion.TM + porClasificacion.EL} <span className="text-xs font-normal text-slate-500">ensayos</span>
              </div>
              <span className="text-[10px] font-bold text-emerald-600 mt-1 block">● Activo</span>
            </div>
          </div>
        </div>

        {/* Lado Derecho: Gráfico de Barras Estilo "Overview" de la imagen */}
        <div className="lg:col-span-7 bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-[#00875a]" />
              <span>Overview de Emisión Mensual</span>
            </h3>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                <span className="w-2.5 h-2.5 rounded-full bg-[#00875a]"></span>
                <span>Emitidos</span>
              </div>

              <div className="flex items-center gap-1 bg-slate-50 border border-slate-200/80 px-2.5 py-1 rounded-xl text-xs font-bold text-slate-700">
                <span>Este Año 2026</span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </div>
            </div>
          </div>

          {/* Gráfico de Barras Verde Estilo Oripio */}
          <div className="pt-6 pb-2">
            <div className="h-44 flex items-end justify-between gap-2 sm:gap-3 px-2">
              {mesesGrafico.map((m) => (
                <div key={m.mes} className="flex-1 flex flex-col items-center gap-2 group relative">
                  {/* Tooltip en hover o en barra activa */}
                  {m.activo && (
                    <div className="absolute -top-10 bg-slate-900 text-white text-[10px] font-bold py-1 px-2 rounded-lg shadow-md whitespace-nowrap pointer-events-none">
                      85 emitidos
                    </div>
                  )}

                  {/* Barra */}
                  <div className="w-full bg-slate-100/60 rounded-xl h-36 flex items-end p-1">
                    <div
                      className={`w-full rounded-lg transition-all duration-500 ${
                        m.activo
                          ? 'bg-[#00875a] shadow-sm'
                          : 'bg-[#d1fae5] group-hover:bg-[#a7f3d0]'
                      }`}
                      style={{ height: `${(m.valor / 90) * 100}%` }}
                    />
                  </div>

                  {/* Etiqueta del Mes */}
                  <span
                    className={`text-[10px] font-semibold ${
                      m.activo ? 'text-slate-900 font-bold' : 'text-slate-400'
                    }`}
                  >
                    {m.mes}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 4. Fila Inferior: "Salud Metrológica" (Savings Plan) & "Ensayos Recientes" (Recent Transaction) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Salud Metrológica ISO 17025 (Estilo My Savings Plan de la imagen) */}
        <div className="lg:col-span-5 bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-5">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Scale className="w-4 h-4 text-[#00875a]" />
              <span>Salud Metrológica (ISO 17025)</span>
            </h3>

            {onVerPatrones && (
              <button
                onClick={onVerPatrones}
                className="text-xs font-bold text-[#00875a] hover:underline cursor-pointer"
              >
                Gestionar
              </button>
            )}
          </div>

          <div className="space-y-4">
            {/* Meta 1: Flota de Patrones Vigentes */}
            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/70 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-800 flex items-center gap-1.5">
                  <CheckCircle className="w-4 h-4 text-emerald-600" />
                  Flota de Patrones al Día
                </span>
                <span className="font-mono font-bold text-slate-900">
                  {patronesVigentes.length}/{patrones.length} ({porcentajeVigencia}%)
                </span>
              </div>
              <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
                <div
                  className="bg-[#00875a] h-full rounded-full transition-all duration-500"
                  style={{ width: `${porcentajeVigencia}%` }}
                />
              </div>
            </div>

            {/* Meta 2: Desglose Rápido */}
            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="p-2.5 bg-emerald-50/50 border border-emerald-200 rounded-xl">
                <span className="text-[10px] font-bold text-emerald-800 uppercase block">Vigentes</span>
                <span className="font-black text-emerald-700 font-mono text-base">{patronesVigentes.length}</span>
              </div>
              <div className="p-2.5 bg-amber-50/50 border border-amber-200 rounded-xl">
                <span className="text-[10px] font-bold text-amber-800 uppercase block">Por Vencer</span>
                <span className="font-black text-amber-700 font-mono text-base">{patronesPorVencer.length}</span>
              </div>
              <div className="p-2.5 bg-rose-50/50 border border-rose-200 rounded-xl">
                <span className="text-[10px] font-bold text-rose-800 uppercase block">Vencidos</span>
                <span className="font-black text-rose-700 font-mono text-base">{patronesVencidos.length}</span>
              </div>
            </div>

            {patronesVencidos.length > 0 && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 text-xs flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span className="text-[11px]">
                    <strong>Alerta:</strong> {patronesVencidos.length} patrón requiere recalibración.
                  </span>
                </div>
                {onVerPatrones && (
                  <button
                    onClick={onVerPatrones}
                    className="px-2 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-[10px] font-bold shrink-0 cursor-pointer"
                  >
                    Ver Patrón
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Actividad y Ensayos Recientes (Estilo Recent Transaction de la imagen) */}
        <div className="lg:col-span-7 bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#00875a]" />
              <span>Ensayos & Certificados Recientes</span>
            </h3>

            <button
              onClick={onVerReportes}
              className="text-xs font-bold text-slate-600 hover:text-slate-900 flex items-center gap-1 bg-slate-50 border border-slate-200/80 px-2.5 py-1 rounded-xl cursor-pointer"
            >
              <span>Ver Todo</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Tabla Limpia Estilo Recent Transaction */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase text-[10px]">
                  <th className="pb-2.5 font-bold">Elemento / Tag</th>
                  <th className="pb-2.5 font-bold">Fecha</th>
                  <th className="pb-2.5 font-bold">Consecutivo / ID</th>
                  <th className="pb-2.5 font-bold text-right">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {actividadReciente.map((rep) => {
                  const tag =
                    rep.datosValvula?.identificacionTag ||
                    rep.datosTuberia?.tagSpoolLinea ||
                    rep.datosCalibracion?.tagIdentificacion ||
                    rep.tempId;

                  const dictamen =
                    rep.datosValvula?.conclusionGeneral ||
                    rep.datosTuberia?.conclusionGeneral ||
                    rep.datosCalibracion?.conclusionGeneral ||
                    rep.estado;

                  return (
                    <tr
                      key={rep.id}
                      onClick={() => onVerReporteDetalle(rep)}
                      className="hover:bg-slate-50/80 transition cursor-pointer group"
                    >
                      <td className="py-3 font-semibold text-slate-900">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-xl bg-[#eef8f1] text-[#00875a] flex items-center justify-center font-bold text-[10px]">
                            {rep.clasificacionCodigo}
                          </div>
                          <div>
                            <span className="block font-bold text-slate-800 text-xs">
                              {tag}
                            </span>
                            <span className="block text-[10px] text-slate-400 truncate max-w-[150px]">
                              {rep.clienteNombre}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 text-slate-500 font-medium">
                        {rep.fechaPrueba}
                      </td>

                      <td className="py-3 font-mono font-bold text-slate-700">
                        {rep.numeroConsecutivo || rep.tempId}
                      </td>

                      <td className="py-3 text-right">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold ${
                            dictamen === 'CONFORME' || rep.estado === 'emitido'
                              ? 'bg-[#eef8f1] text-[#00875a]'
                              : rep.estado === 'en_revision'
                              ? 'bg-amber-50 text-amber-700'
                              : 'bg-rose-50 text-rose-700'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              dictamen === 'CONFORME' || rep.estado === 'emitido'
                                ? 'bg-[#00875a]'
                                : rep.estado === 'en_revision'
                                ? 'bg-amber-500'
                                : 'bg-rose-500'
                            }`}
                          />
                          <span>
                            {rep.numeroConsecutivo ? 'Emitido' : rep.estado.toUpperCase()}
                          </span>
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
