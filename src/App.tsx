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
import { AuditoriaView } from './components/auditoria/AuditoriaView';
import { VerificadorPublico } from './components/verificacion/VerificadorPublico';

export function App() {
  // Inicialización de la persistencia local
  useEffect(() => {
    storageService.init();
  }, []);

  const [usuarioActual, setUsuarioActual] = useState<Usuario>(storageService.getUsuarioActual());
  const usuariosDisponibles = storageService.getUsuarios();

  const [reportes, setReportes] = useState<ReporteCertificado[]>(storageService.getReportes());
  const clientes = storageService.getClientes();
  const equipos = storageService.getEquipos();

  // Navegación de vistas
  const [vistaActual, setVistaActual] = useState<string>('dashboard');
  const [reporteSeleccionado, setReporteSeleccionado] = useState<ReporteCertificado | null>(null);
  const [sidebarColapsado, setSidebarColapsado] = useState<boolean>(false);

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
    // Clonar datos técnicos sin copiar consecutivos ni estados previos
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
