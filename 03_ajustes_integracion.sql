-- ==============================================================================
-- PASO 3: AJUSTES DE INTEGRACIÓN DIRECTA CON CLIENTE WEB (POLÍTICAS & FLEXIBILIDAD)
-- Ejecutar en el SQL Editor de Supabase
-- ==============================================================================

-- 1. Eliminar tablas secundarias vacías con restricciones estrictas de UUID
DROP TABLE IF EXISTS public.reporte_transiciones CASCADE;
DROP TABLE IF EXISTS public.reportes CASCADE;
DROP TABLE IF EXISTS public.auditoria CASCADE;
DROP TABLE IF EXISTS public.usuarios_perfiles CASCADE;

-- 2. Recrear usuarios_perfiles con ID de texto compatible con frontend y auth
CREATE TABLE public.usuarios_perfiles (
  id TEXT PRIMARY KEY,
  nombre TEXT NOT NULL,
  email TEXT NOT NULL,
  cargo TEXT NOT NULL,
  rol rol_usuario_enum NOT NULL DEFAULT 'tecnico',
  firma_url TEXT,
  activo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Recrear reportes con compatibilidad para IDs generados en frontend (ej. rep-1234)
CREATE TABLE public.reportes (
  id TEXT PRIMARY KEY,
  temp_id TEXT NOT NULL,
  numero_consecutivo TEXT UNIQUE,
  clasificacion_codigo codigo_clasificacion_enum NOT NULL REFERENCES public.clasificaciones(codigo),
  estado estado_reporte_enum NOT NULL DEFAULT 'borrador',
  plantilla_id TEXT,
  titulo_reporte_es TEXT NOT NULL,
  titulo_reporte_en TEXT,
  subtitulo_normativo TEXT,
  codigo_formato TEXT NOT NULL,
  version_plantilla TEXT NOT NULL,
  
  cliente_id TEXT,
  cliente_nombre TEXT NOT NULL,
  direccion_servicio TEXT NOT NULL,
  contrato_oc TEXT NOT NULL,
  ubicacion_servicio TEXT NOT NULL,
  
  equipo_id TEXT,
  
  fecha_recepcion DATE NOT NULL DEFAULT CURRENT_DATE,
  fecha_prueba DATE NOT NULL DEFAULT CURRENT_DATE,
  fecha_emision DATE,
  
  creado_por TEXT NOT NULL DEFAULT 'usr-1',
  revisado_por TEXT,
  aprobado_por TEXT,
  
  datos_tecnicos JSONB NOT NULL DEFAULT '{}'::jsonb,
  
  motivo_anulacion TEXT,
  pdf_storage_path TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Recrear historial de transiciones
CREATE TABLE public.reporte_transiciones (
  id TEXT PRIMARY KEY,
  reporte_id TEXT NOT NULL REFERENCES public.reportes(id) ON DELETE CASCADE,
  estado_anterior estado_reporte_enum,
  estado_nuevo estado_reporte_enum NOT NULL,
  usuario_id TEXT NOT NULL,
  observaciones TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Recrear auditoría inmutable
CREATE TABLE public.auditoria (
  id TEXT PRIMARY KEY,
  usuario_id TEXT,
  usuario_nombre TEXT NOT NULL,
  rol rol_usuario_enum NOT NULL,
  accion VARCHAR(50) NOT NULL,
  entidad VARCHAR(50) NOT NULL,
  entidad_id TEXT NOT NULL,
  detalles TEXT NOT NULL,
  valores_previos JSONB,
  valores_nuevos JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. Insertar los perfiles de usuario técnicos iniciales
INSERT INTO public.usuarios_perfiles (id, nombre, email, cargo, rol, firma_url) VALUES
  ('usr-1', 'Ing. Carlos Mendoza', 'carlos.mendoza@empresa.com', 'Técnico de Ensayos y Metrología', 'tecnico', 'https://placehold.co/200x80/png?text=Firma+Carlos+M.'),
  ('usr-2', 'Ing. Diana Gutiérrez', 'diana.gutierrez@empresa.com', 'Revisora de Aseguramiento Técnico', 'revisor_tecnico', 'https://placehold.co/200x80/png?text=Firma+Diana+G.'),
  ('usr-3', 'Ing. Roberto Silva', 'roberto.silva@empresa.com', 'Director Técnico de Laboratorio', 'director_tecnico', 'https://placehold.co/200x80/png?text=Firma+Roberto+S.+DirTec'),
  ('usr-4', 'Administrador General', 'admin@empresa.com', 'Administrador del Sistema', 'administrador', NULL),
  ('usr-5', 'Auditor de Calidad', 'auditor@empresa.com', 'Auditor Interno de Calidad', 'auditor', NULL)
ON CONFLICT (id) DO UPDATE SET
  nombre = EXCLUDED.nombre,
  cargo = EXCLUDED.cargo,
  rol = EXCLUDED.rol,
  firma_url = EXCLUDED.firma_url;

-- 7. Habilitar RLS
ALTER TABLE public.usuarios_perfiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reportes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reporte_transiciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.auditoria ENABLE ROW LEVEL SECURITY;

-- 8. Políticas directas (sin bloques DO $$)
DROP POLICY IF EXISTS "Permitir todo clasificaciones" ON public.clasificaciones;
CREATE POLICY "Permitir todo clasificaciones" ON public.clasificaciones FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir todo series" ON public.series_consecutivas;
CREATE POLICY "Permitir todo series" ON public.series_consecutivas FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir todo plantillas" ON public.plantillas_documentales;
CREATE POLICY "Permitir todo plantillas" ON public.plantillas_documentales FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir todo clientes" ON public.clientes;
CREATE POLICY "Permitir todo clientes" ON public.clientes FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir todo equipos" ON public.equipos;
CREATE POLICY "Permitir todo equipos" ON public.equipos FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir todo reportes" ON public.reportes;
CREATE POLICY "Permitir todo reportes" ON public.reportes FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir todo transiciones" ON public.reporte_transiciones;
CREATE POLICY "Permitir todo transiciones" ON public.reporte_transiciones FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir todo auditoria" ON public.auditoria;
CREATE POLICY "Permitir todo auditoria" ON public.auditoria FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir todo usuarios" ON public.usuarios_perfiles;
CREATE POLICY "Permitir todo usuarios" ON public.usuarios_perfiles FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- 9. Conceder permisos de ejecución para la función atómica al rol anon y authenticated
GRANT EXECUTE ON FUNCTION public.asignar_siguiente_consecutivo(codigo_clasificacion_enum) TO anon;
GRANT EXECUTE ON FUNCTION public.asignar_siguiente_consecutivo(codigo_clasificacion_enum) TO authenticated;
