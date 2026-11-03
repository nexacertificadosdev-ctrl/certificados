import { useState, useEffect } from 'react';
import type { CodigoClasificacion, ReporteCertificado, Usuario } from './types';
import { storageService } from './services/storageService';
import { Sidebar } from './components/layout/Sidebar';
import { TopHeader } from './components/layout/TopHeader';
import { DashboardView } from './components/dashboard/DashboardView';
import { ReportesList } from './components/reportes/ReportesList';
import { ValvulasForm } from './components/reportes/ValvulasForm';
import { TuberiaForm } from './components/reportes/TuberiaForm';
import { CalibracionForm } from './components/reportes/CalibracionForm';
import { ValvulasPdfPreview } from './components/reportes/ValvulasPdfPreview';
import { TuberiaPdfPreview } from './components/reportes/TuberiaPdfPreview';
import { CalibracionPdfPreview } from './components/reportes/CalibracionPdfPreview';
import { NuevoReporteModal } from './components/reportes/NuevoReporteModal';
import { RevisionModal } from './components/reportes/RevisionModal';
import { FirmaModal } from './components/common/FirmaModal';
import { SeriesConfig } from './components/configuracion/SeriesConfig';
import { PlantillasConfig } from './components/configuracion/PlantillasConfig';
import { ClientesEquiposConfig } from './components/configuracion/ClientesEquiposConfig';
import { UsuariosRolesConfig } from './components/configuracion/UsuariosRolesConfig';
import { AuditoriaView } from './components/auditoria/AuditoriaView';
import { VerificadorPublico } from './components/verificacion/VerificadorPublico';
import { LoginView } from './components/auth/LoginView';
import { LogIn, Award } from 'lucide-react';

export function App() {
  // Inicialización de la persistencia local
  useEffect(() => {
    storageService.init();
  }, []);

  const [usuarioActual, setUsuarioActual] = useState<Usuario | null>(() => storageService.getSesionUsuario());
  const [vistaPublicaVerificacion, setVistaPublicaVerificacion] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return window.location.hash.includes('cert=') || window.location.hash.includes('verificar');
    }
    return false;
  });

  const usuariosDisponibles = storageService.getUsuarios();

  const [reportes, setReportes] = useState<ReporteCertificado[]>(storageService.getReportes());
  const clientes = storageService.getClientes();
  const equipos = storageService.getEquipos();

  // Navegación de vistas
  const [vistaActual, setVistaActual] = useState<string>('dashboard');
  const [reporteSeleccionado, setReporteSeleccionado] = useState<ReporteCertificado | null>(null);
  const [sidebarColapsado, setSidebarColapsado] = useState<boolean>(false);

  // Escuchar cambios de hash para validador público QR
  useEffect(() => {
    const handleHash = () => {
      if (window.location.hash.includes('cert=') || window.location.hash.includes('verificar')) {
        if (!storageService.getSesionUsuario()) {
          setVistaPublicaVerificacion(true);
        } else {
          setVistaActual('verificar');
        }
      }
    };
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  // Modales
  const [modalRevisionReporte, setModalRevisionReporte] = useState<ReporteCertificado | null>(null);
  const [modalFirmaAbierto, setModalFirmaAbierto] = useState<boolean>(false);
  const [modalNuevoReporteAbierto, setModalNuevoReporteAbierto] = useState<boolean>(false);
  const [nuevaClasificacion, setNuevaClasificacion] = useState<CodigoClasificacion>('VT');

  const reportesEnRevision = reportes.filter((r) => r.estado === 'en_revision').length;
  const patrones = storageService.getPatrones();
  const patronesVencidos = patrones.filter((p) => {
    if (!p.vigencia) return false;
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const v = new Date(p.vigencia);
    v.setHours(0, 0, 0, 0);
    return v.getTime() < hoy.getTime();
  }).length;

  const recargarReportes = () => {
    setReportes([...storageService.getReportes()]);
  };

  const handleCambiarUsuario = (usuario: Usuario) => {
    storageService.setUsuarioActual(usuario);
    setUsuarioActual(usuario);
  };

  const handleCerrarSesion = () => {
    storageService.cerrarSesion();
    setUsuarioActual(null);
  };

  const handleVerPdf = (reporte: ReporteCertificado) => {
    setReporteSeleccionado(reporte);
    setVistaActual('ver-pdf');
  };

  const handleEditar = (reporte: ReporteCertificado) => {
    setReporteSeleccionado(reporte);
    setVistaActual('editar-reporte');
  };

  const handleNuevoReporte = () => {
    setModalNuevoReporteAbierto(true);
  };

  const handleConfirmarNuevoReporte = (codigo: CodigoClasificacion) => {
    setModalNuevoReporteAbierto(false);
    setNuevaClasificacion(codigo);
    setReporteSeleccionado(null);
    setVistaActual('nuevo-reporte');
  };

  const handleCopiarComoBase = (reporteOriginal: ReporteCertificado) => {
    if (!usuarioActual) return;
    const nuevo = storageService.crearBorrador(
      {
        clasificacionCodigo: reporteOriginal.clasificacionCodigo,
        clienteId: reporteOriginal.clienteId,
        clienteNombre: reporteOriginal.clienteNombre,
        direccionServicio: reporteOriginal.direccionServicio,
        contratoOC: reporteOriginal.contratoOC,
        ubicacionServicio: reporteOriginal.ubicacionServicio,
        equipoId: reporteOriginal.equipoId,
        datosValvula: reporteOriginal.datosValvula ? { ...reporteOriginal.datosValvula } : undefined,
      },
      usuarioActual
    );
    recargarReportes();
    setReporteSeleccionado(nuevo);
    setVistaActual('editar-reporte');
  };

  const handleReporteGuardado = (reporte: ReporteCertificado) => {
    recargarReportes();
    setReporteSeleccionado(reporte);
    setVistaActual('reportes');
  };

  const handleEstadoActualizado = (reporte: ReporteCertificado) => {
    recargarReportes();
    if (reporteSeleccionado?.id === reporte.id) {
      setReporteSeleccionado(reporte);
    }
  };

  // =========================================================
  // CONTROL DE ACCESO: PANTALLA LOGIN O VALIDADOR PÚBLICO
  // =========================================================
  if (!usuarioActual) {
    if (vistaPublicaVerificacion) {
      return (
        <div className="min-h-screen bg-slate-900 flex flex-col font-sans">
          <header className="px-6 py-4 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between sticky top-0 z-20 backdrop-blur-md">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#00875a] flex items-center justify-center text-white shadow-xs">
                <Award className="w-6 h-6 stroke-[2.2]" />
              </div>
              <div>
                <span className="font-extrabold text-base tracking-tight text-white block">
                  CertiGest
                </span>
                <span className="text-[11px] text-slate-400 block -mt-0.5">
                  Validador Público de Integridad Metrológica
                </span>
              </div>
            </div>

            <button
              onClick={() => setVistaPublicaVerificacion(false)}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
            >
              <LogIn className="w-4 h-4" />
              <span>Iniciar Sesión</span>
            </button>
          </header>

          <main className="flex-1 p-4 sm:p-8 max-w-5xl mx-auto w-full">
            <VerificadorPublico onVerReporteDetalle={handleVerPdf} />
          </main>
        </div>
      );
    }

    return (
      <LoginView
        onLoginSuccess={(u) => {
          setUsuarioActual(u);
          setVistaActual('dashboard');
        }}
        onIrAVerificadorPublico={() => setVistaPublicaVerificacion(true)}
      />
    );
  }

  // =========================================================
  // USUARIO AUTENTICADO: APLICACIÓN PRINCIPAL
  // =========================================================
  return (
    <div className="h-screen w-screen bg-[#f8fafc] flex overflow-hidden font-sans print:h-auto print:w-auto print:overflow-visible print:bg-white print:block">
      {/* 1. Menú Lateral Izquierdo (Sidebar) */}
      <Sidebar
        vistaActual={vistaActual}
        onCambiarVista={(v) => {
          setVistaActual(v);
          setReporteSeleccionado(null);
        }}
        usuarioActual={usuarioActual}
        usuariosDisponibles={usuariosDisponibles}
        onCambiarUsuario={handleCambiarUsuario}
        onCerrarSesion={handleCerrarSesion}
        onAbrirModalFirma={() => setModalFirmaAbierto(true)}
        colapsado={sidebarColapsado}
        onToggleColapsado={() => setSidebarColapsado(!sidebarColapsado)}
        reportesEnRevision={reportesEnRevision}
        patronesVencidos={patronesVencidos}
      />

      {/* 2. Área Principal de Contenido con Header Superior */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden print:h-auto print:w-full print:overflow-visible print:block">
        <TopHeader
          usuarioActual={usuarioActual}
          onNuevoReporte={handleNuevoReporte}
          reportesEnRevision={reportesEnRevision}
          patronesVencidos={patronesVencidos}
        />

        <main className="flex-1 overflow-y-auto pb-16 print:h-auto print:overflow-visible print:p-0 print:m-0 print:block">
          {vistaActual === 'dashboard' && (
            <DashboardView
              reportes={reportes}
              usuarioActual={usuarioActual}
              onCrearReporte={handleNuevoReporte}
              onVerReportes={() => setVistaActual('reportes')}
              onVerReporteDetalle={handleVerPdf}
              onVerPatrones={() => setVistaActual('clientes-equipos')}
            />
          )}

          {vistaActual === 'reportes' && (
            <ReportesList
              reportes={reportes}
              usuarioActual={usuarioActual}
              onVerPdf={handleVerPdf}
              onEditar={handleEditar}
              onNuevoReporte={handleNuevoReporte}
              onGestionarEstado={(rep) => setModalRevisionReporte(rep)}
              onCopiarComoBase={handleCopiarComoBase}
            />
          )}

          {(vistaActual === 'nuevo-reporte' || vistaActual === 'editar-reporte') && (
            <>
              {(reporteSeleccionado?.clasificacionCodigo || nuevaClasificacion) === 'TB' ? (
                <TuberiaForm
                  reporteInicial={reporteSeleccionado || undefined}
                  clientes={clientes}
                  equipos={equipos}
                  usuarioActual={usuarioActual}
                  onGuardado={handleReporteGuardado}
                  onCancelar={() => setVistaActual('reportes')}
                />
              ) : ['PR', 'TM', 'EL'].includes(reporteSeleccionado?.clasificacionCodigo || nuevaClasificacion) ? (
                <CalibracionForm
                  reporteInicial={reporteSeleccionado || undefined}
                  clasificacionDefault={nuevaClasificacion}
                  clientes={clientes}
                  equipos={equipos}
                  usuarioActual={usuarioActual}
                  onGuardado={handleReporteGuardado}
                  onCancelar={() => setVistaActual('reportes')}
                />
              ) : (
                <ValvulasForm
                  reporteInicial={reporteSeleccionado || undefined}
                  clientes={clientes}
                  equipos={equipos}
                  usuarioActual={usuarioActual}
                  onGuardado={handleReporteGuardado}
                  onCancelar={() => setVistaActual('reportes')}
                />
              )}
            </>
          )}

          {vistaActual === 'ver-pdf' && reporteSeleccionado && (
            <>
              {reporteSeleccionado.clasificacionCodigo === 'TB' ? (
                <TuberiaPdfPreview
                  reporte={reporteSeleccionado}
                  onVolver={() => setVistaActual('reportes')}
                />
              ) : ['PR', 'TM', 'EL'].includes(reporteSeleccionado.clasificacionCodigo) ? (
                <CalibracionPdfPreview
                  reporte={reporteSeleccionado}
                  onVolver={() => setVistaActual('reportes')}
                />
              ) : (
                <ValvulasPdfPreview
                  reporte={reporteSeleccionado}
                  onVolver={() => setVistaActual('reportes')}
                />
              )}
            </>
          )}

          {vistaActual === 'clientes-equipos' && (
            <ClientesEquiposConfig usuarioActual={usuarioActual} />
          )}

          {vistaActual === 'usuarios-roles' && (
            <UsuariosRolesConfig usuarioActual={usuarioActual} />
          )}

          {vistaActual === 'series' && <SeriesConfig usuarioActual={usuarioActual} />}

          {vistaActual === 'plantillas' && <PlantillasConfig usuarioActual={usuarioActual} />}

          {vistaActual === 'auditoria' && <AuditoriaView />}

          {vistaActual === 'verificar' && (
            <VerificadorPublico onVerReporteDetalle={handleVerPdf} />
          )}
        </main>
      </div>

      {/* Modal de Selección de Disciplina para Nuevo Reporte */}
      {modalNuevoReporteAbierto && (
        <NuevoReporteModal
          onSeleccionarClasificacion={handleConfirmarNuevoReporte}
          onClose={() => setModalNuevoReporteAbierto(false)}
        />
      )}

      {/* Modal de Transición de Estados / Aprobación */}
      {modalRevisionReporte && (
        <RevisionModal
          reporte={modalRevisionReporte}
          usuarioActual={usuarioActual}
          onClose={() => setModalRevisionReporte(null)}
          onActualizado={handleEstadoActualizado}
        />
      )}

      {/* Modal de Firma Digitalizada */}
      {modalFirmaAbierto && (
        <FirmaModal
          usuario={usuarioActual}
          onClose={() => setModalFirmaAbierto(false)}
          onFirmaActualizada={(firmaUrl) => {
            setUsuarioActual({ ...usuarioActual, firmaUrl });
          }}
        />
      )}
    </div>
  );
}

export default App;
