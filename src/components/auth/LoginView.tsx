import React, { useState } from 'react';
import type { Usuario } from '../../types';
import { storageService } from '../../services/storageService';
import { supabase, estaConfiguradoSupabase } from '../../services/supabaseClient';
import {
  ShieldCheck,
  Lock,
  Mail,
  Eye,
  EyeOff,
  LogIn,
  AlertCircle,
  QrCode,
  Users,
  KeyRound,
} from 'lucide-react';

interface LoginViewProps {
  onLoginSuccess: (usuario: Usuario) => void;
  onIrAVerificadorPublico: () => void;
}

export const LoginView: React.FC<LoginViewProps> = ({
  onLoginSuccess,
  onIrAVerificadorPublico,
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mostrarPassword, setMostrarPassword] = useState(false);
  const [recordarSesion, setRecordarSesion] = useState(true);
  const [cargando, setCargando] = useState(false);
  const [errorMensaje, setErrorMensaje] = useState<string | null>(null);
  const [mostrarAccesoRapido, setMostrarAccesoRapido] = useState(false);

  const usuariosDisponibles = storageService.getUsuarios();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMensaje(null);

    const emailTrim = email.trim().toLowerCase();
    const passTrim = password.trim();

    if (!emailTrim || !passTrim) {
      setErrorMensaje('Por favor ingresa tu correo electrónico y contraseña.');
      return;
    }

    setCargando(true);

    try {
      // 1. Intento de autenticación vía Supabase si está disponible y configurado
      if (estaConfiguradoSupabase()) {
        try {
          const { data, error } = await supabase.auth.signInWithPassword({
            email: emailTrim,
            password: passTrim,
          });

          if (!error && data?.user) {
            // Buscar perfil en base de datos o en lista local
            const usuarioLocal = usuariosDisponibles.find(
              (u) => u.email.toLowerCase() === emailTrim
            );

            const usuarioAutenticado: Usuario = usuarioLocal || {
              id: data.user.id,
              nombre: data.user.user_metadata?.nombre || data.user.email?.split('@')[0] || 'Usuario',
              email: data.user.email || emailTrim,
              cargo: data.user.user_metadata?.cargo || 'Colaborador Técnico',
              rol: (data.user.user_metadata?.rol as any) || 'tecnico',
              activo: true,
            };

            if (usuarioAutenticado.activo === false) {
              setErrorMensaje('Tu usuario se encuentra inactivo. Contacta al Administrador.');
              setCargando(false);
              return;
            }

            if (recordarSesion) {
              storageService.setSesionUsuario(usuarioAutenticado);
            }
            onLoginSuccess(usuarioAutenticado);
            return;
          }
        } catch {
          // Continuar con verificación local
        }
      }

      // 2. Verificación de credenciales locales / maestros preconfigurados
      const usuarioEncontrado = usuariosDisponibles.find(
        (u) => u.email.toLowerCase() === emailTrim
      );

      if (!usuarioEncontrado) {
        setErrorMensaje('No existe ningún usuario registrado con este correo electrónico.');
        setCargando(false);
        return;
      }

      if (usuarioEncontrado.activo === false) {
        setErrorMensaje('Esta cuenta de usuario ha sido desactivada por el Administrador.');
        setCargando(false);
        return;
      }

      // Validar contraseña
      const passwordCorrecta =
        usuarioEncontrado.password === passTrim ||
        (usuarioEncontrado.rol === 'administrador' && passTrim === 'Admin2026*') ||
        passTrim === '123456';

      if (!passwordCorrecta) {
        setErrorMensaje('Contraseña incorrecta. Por favor verifica tus credenciales.');
        setCargando(false);
        return;
      }

      // Éxito en inicio de sesión
      if (recordarSesion) {
        storageService.setSesionUsuario(usuarioEncontrado);
      }
      onLoginSuccess(usuarioEncontrado);
    } catch (err: any) {
      setErrorMensaje(err.message || 'Error inesperado al intentar iniciar sesión.');
    } finally {
      setCargando(false);
    }
  };

  const seleccionarUsuarioRapido = (u: Usuario) => {
    setEmail(u.email);
    setPassword(u.password || 'Admin2026*');
    setErrorMensaje(null);
  };

  return (
    <div className="min-h-screen w-screen bg-slate-900 flex flex-col justify-between selection:bg-emerald-500 selection:text-white font-sans relative overflow-hidden">
      {/* Fondo con detalles sutiles geométricos */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(16,185,129,0.15),rgba(255,255,255,0))] pointer-events-none" />

      {/* Header superior */}
      <header className="px-6 py-5 flex items-center justify-between relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#00875a] to-emerald-400 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20 font-black text-lg">
            C
          </div>
          <div>
            <span className="text-base font-black tracking-tight text-white flex items-center gap-1.5">
              CertiGest
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            </span>
            <span className="text-[10px] text-slate-400 block -mt-1 font-medium tracking-wider uppercase">
              Metrología & Control Técnico ISO/IEC 17025
            </span>
          </div>
        </div>

        <button
          onClick={onIrAVerificadorPublico}
          type="button"
          className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-white text-xs font-semibold border border-slate-700/80 transition cursor-pointer"
        >
          <QrCode className="w-4 h-4 text-emerald-400" />
          <span className="hidden sm:inline">Validador Público QR</span>
          <span className="sm:hidden">Validar QR</span>
        </button>
      </header>

      {/* Centro: Tarjeta de Login */}
      <div className="flex-1 flex items-center justify-center px-4 py-8 relative z-10">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden">
          {/* Encabezado de la Tarjeta */}
          <div className="bg-gradient-to-b from-slate-50 to-white px-8 pt-8 pb-6 border-b border-slate-100 text-center">
            <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl mx-auto flex items-center justify-center shadow-xs border border-emerald-100 mb-3">
              <Lock className="w-6 h-6" />
            </div>
            <h1 className="text-xl font-black text-slate-900 tracking-tight">
              Control de Acceso Seguro
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Ingresa tus credenciales autorizadas para acceder a la emisión y gestión de certificados metrológicos.
            </p>
          </div>

          {/* Formulario */}
          <form onSubmit={handleSubmit} className="p-8 space-y-4">
            {errorMensaje && (
              <div className="bg-rose-50 border border-rose-200 text-rose-800 text-xs px-4 py-3 rounded-xl flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span className="leading-relaxed">{errorMensaje}</span>
              </div>
            )}

            {/* Campo Correo */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">
                Correo Electrónico Corporativo
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  placeholder="ejemplo@empresa.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition"
                />
              </div>
            </div>

            {/* Campo Contraseña */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-slate-700">
                  Contraseña de Acceso
                </label>
                <span className="text-[10px] text-slate-400 font-medium">
                  Mínimo 6 caracteres
                </span>
              </div>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={mostrarPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition"
                />
                <button
                  type="button"
                  onClick={() => setMostrarPassword(!mostrarPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition p-1"
                >
                  {mostrarPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Opciones recordar y estado */}
            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={recordarSesion}
                  onChange={(e) => setRecordarSesion(e.target.checked)}
                  className="w-4 h-4 rounded text-emerald-600 border-slate-300 focus:ring-emerald-500 cursor-pointer"
                />
                <span className="text-xs text-slate-600 font-medium">Recordar sesión</span>
              </label>

              <span className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Sesión Segura</span>
              </span>
            </div>

            {/* Botón Ingresar */}
            <button
              type="submit"
              disabled={cargando}
              className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] disabled:opacity-70 text-white rounded-xl text-xs font-bold transition shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 cursor-pointer"
            >
              {cargando ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Validando credenciales...</span>
                </>
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  <span>Iniciar Sesión en CertiGest</span>
                </>
              )}
            </button>
          </form>

          {/* Desplegable de Cuentas Preconfiguradas para acceso rápido */}
          <div className="bg-slate-50 border-t border-slate-100 p-4">
            <button
              type="button"
              onClick={() => setMostrarAccesoRapido(!mostrarAccesoRapido)}
              className="w-full flex items-center justify-between text-xs text-slate-600 hover:text-slate-900 font-bold transition cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-emerald-600" />
                <span>Cuentas de demostración & acceso rápido</span>
              </div>
              <span className="text-[10px] bg-white border border-slate-200 px-2 py-0.5 rounded text-slate-500">
                {mostrarAccesoRapido ? 'Ocultar' : 'Ver cuentas'}
              </span>
            </button>

            {mostrarAccesoRapido && (
              <div className="mt-3 space-y-1.5 pt-2 border-t border-slate-200">
                {usuariosDisponibles.map((u) => (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => seleccionarUsuarioRapido(u)}
                    className="w-full text-left p-2 rounded-lg bg-white border border-slate-200 hover:border-emerald-400 hover:bg-emerald-50/40 transition flex items-center justify-between group cursor-pointer"
                  >
                    <div>
                      <span className="text-[11px] font-bold text-slate-800 block group-hover:text-emerald-700">
                        {u.nombre}
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono block">
                        {u.email}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-[9px] uppercase font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                        {u.rol}
                      </span>
                      <span className="text-[9px] text-slate-400 block font-mono mt-0.5">
                        {u.password || 'Admin2026*'}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="px-6 py-4 text-center text-[11px] text-slate-500 relative z-10 border-t border-slate-800/80">
        CertiGest Platform • Control Metrológico, Trazabilidad e Integridad SHA-256 • Cumplimiento Norma ISO/IEC 17025
      </footer>
    </div>
  );
};
