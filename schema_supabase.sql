-- ==============================================================================
-- SISTEMA INTEGRADO DE GESTIÓN DE CERTIFICADOS Y REPORTES TÉCNICOS
-- ESQUEMA DDL POSTGRESQL / SUPABASE CON RLS Y CONSECUTIVOS ATÓMICOS
-- Versión: 1.0 | Fecha: Octubre 2026
-- ==============================================================================

-- 1. EXTENSIONES Y ENUMS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

DO $$ BEGIN
  CREATE TYPE rol_usuario_enum AS ENUM (
    'administrador',
    'tecnico',
    'revisor_tecnico',
    'director_tecnico',
    'auditor'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE estado_reporte_enum AS ENUM (
    'borrador',
    'en_revision',
    'devuelto',
    'aprobado',
    'emitido',
    'anulado'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE codigo_clasificacion_enum AS ENUM (
    'VT', -- Válvulas
    'TB', -- Tuberías y Spools
    'PR', -- Magnitud Presión
    'TM', -- Magnitud Temperatura
    'EL'  -- Magnitudes Eléctricas
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 2. TABLA: USUARIOS Y PERFILES (Vinculado a auth.users de Supabase)
CREATE TABLE IF NOT EXISTS public.usuarios_perfiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  cargo TEXT NOT NULL,
  rol rol_usuario_enum NOT NULL DEFAULT 'tecnico',
  firma_url TEXT,
  activo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. TABLA: CLASIFICACIONES DOCUMENTALES
CREATE TABLE IF NOT EXISTS public.clasificaciones (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  codigo codigo_clasificacion_enum NOT NULL UNIQUE,
  nombre TEXT NOT NULL,
  descripcion TEXT,
  activa BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. TABLA: SERIES CONSECUTIVAS (CONTROL ATÓMICO)
CREATE TABLE IF NOT EXISTS public.series_consecutivas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clasificacion_codigo codigo_clasificacion_enum NOT NULL REFERENCES public.clasificaciones(codigo),
  nombre TEXT NOT NULL,
  prefijo TEXT NOT NULL, -- Ej: 'TEST', 'CAL'
  separador VARCHAR(2) NOT NULL DEFAULT '-',
  longitud_digitos INT NOT NULL DEFAULT 4,
  incluye_anio BOOLEAN NOT NULL DEFAULT true,
  reinicio_anual BOOLEAN NOT NULL DEFAULT true,
  anio_vigente INT NOT NULL DEFAULT EXTRACT(YEAR FROM CURRENT_DATE),
  ultimo_numero INT NOT NULL DEFAULT 0,
  activa BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_serie_clasificacion UNIQUE (clasificacion_codigo)
);

-- 5. TABLA: PLANTILLAS DOCUMENTALES Y TÍTULOS
CREATE TABLE IF NOT EXISTS public.plantillas_documentales (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clasificacion_codigo codigo_clasificacion_enum NOT NULL REFERENCES public.clasificaciones(codigo),
  nombre_identificador TEXT NOT NULL,
  tipo_elemento TEXT NOT NULL,
  titulo_reporte_es TEXT NOT NULL,
  titulo_reporte_en TEXT,
  subtitulo_normativo TEXT,
  codigo_formato TEXT NOT NULL,
  version_revision TEXT NOT NULL,
  declaracion_trazabilidad TEXT,
  declaraciones_conformidad TEXT,
  activa BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. TABLA: CLIENTES
CREATE TABLE IF NOT EXISTS public.clientes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  razon_social TEXT NOT NULL,
  identificacion TEXT NOT NULL UNIQUE,
  direccion TEXT NOT NULL,
  contacto TEXT,
  telefono TEXT,
  email TEXT,
  activo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. TABLA: EQUIPOS E INSTRUMENTOS
CREATE TABLE IF NOT EXISTS public.equipos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cliente_id UUID REFERENCES public.clientes(id) ON DELETE SET NULL,
  clasificacion_codigo codigo_clasificacion_enum NOT NULL REFERENCES public.clasificaciones(codigo),
  tipo TEXT NOT NULL,
  fabricante TEXT NOT NULL,
  modelo TEXT NOT NULL,
  numero_serie TEXT NOT NULL,
  tag_identificacion TEXT NOT NULL,
  rango_alcance TEXT,
  tamanio TEXT,
  clase_presion TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. TABLA MAESTRA: REPORTES Y CERTIFICADOS
CREATE TABLE IF NOT EXISTS public.reportes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  temp_id TEXT NOT NULL,
  numero_consecutivo TEXT UNIQUE, -- Asignado atómicamente al emitir
  clasificacion_codigo codigo_clasificacion_enum NOT NULL REFERENCES public.clasificaciones(codigo),
  estado estado_reporte_enum NOT NULL DEFAULT 'borrador',
  plantilla_id UUID REFERENCES public.plantillas_documentales(id),
  titulo_reporte_es TEXT NOT NULL,
  titulo_reporte_en TEXT,
  subtitulo_normativo TEXT,
  codigo_formato TEXT NOT NULL,
  version_plantilla TEXT NOT NULL,
  
  cliente_id UUID REFERENCES public.clientes(id),
  cliente_nombre TEXT NOT NULL,
  direccion_servicio TEXT NOT NULL,
  contrato_oc TEXT NOT NULL,
  ubicacion_servicio TEXT NOT NULL,
  
  equipo_id UUID REFERENCES public.equipos(id),
  
  fecha_recepcion DATE NOT NULL DEFAULT CURRENT_DATE,
  fecha_prueba DATE NOT NULL DEFAULT CURRENT_DATE,
  fecha_emision DATE,
  
  creado_por UUID REFERENCES public.usuarios_perfiles(id) NOT NULL,
  revisado_por UUID REFERENCES public.usuarios_perfiles(id),
  aprobado_por UUID REFERENCES public.usuarios_perfiles(id),
  
  -- Datos técnicos específicos en JSONB estructurado
  datos_tecnicos JSONB NOT NULL DEFAULT '{}'::jsonb,
  
  motivo_anulacion TEXT,
  pdf_storage_path TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 9. TABLA: HISTORIAL DE TRANSICIONES Y REVISIONES
CREATE TABLE IF NOT EXISTS public.reporte_transiciones (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reporte_id UUID REFERENCES public.reportes(id) ON DELETE CASCADE,
  estado_anterior estado_reporte_enum,
  estado_nuevo estado_reporte_enum NOT NULL,
  usuario_id UUID REFERENCES public.usuarios_perfiles(id) NOT NULL,
  observaciones TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 10. TABLA: AUDITORÍA INMUTABLE
CREATE TABLE IF NOT EXISTS public.auditoria (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  usuario_id UUID REFERENCES public.usuarios_perfiles(id),
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

-- ==============================================================================
-- 11. FUNCIÓN TRANSACCIONAL ATÓMICA DE CONSECUTIVOS CON REINICIO ANUAL
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.asignar_siguiente_consecutivo(p_clasificacion_codigo codigo_clasificacion_enum)
RETURNS TEXT AS $$
DECLARE
  v_serie RECORD;
  v_anio_actual INT;
  v_proximo_numero INT;
  v_numero_formateado TEXT;
  v_consecutivo_final TEXT;
BEGIN
  v_anio_actual := EXTRACT(YEAR FROM CURRENT_DATE);

  -- Bloqueo pesimista exclusivo de la fila de la serie para prevenir condiciones de carrera
  SELECT * INTO v_serie
  FROM public.series_consecutivas
  WHERE clasificacion_codigo = p_clasificacion_codigo AND activa = true
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'No se encontró una serie activa para la clasificación: %', p_clasificacion_codigo;
  END IF;

  -- Regla de reinicio anual
  IF v_serie.reinicio_anual AND v_serie.anio_vigente <> v_anio_actual THEN
    v_serie.anio_vigente := v_anio_actual;
    v_serie.ultimo_numero := 0;
  END IF;

  -- Incremento atómico
  v_proximo_numero := v_serie.ultimo_numero + 1;

  UPDATE public.series_consecutivas
  SET ultimo_numero = v_proximo_numero,
      anio_vigente = v_serie.anio_vigente,
      updated_at = NOW()
  WHERE id = v_serie.id;

  -- Formatear con ceros a la izquierda
  v_numero_formateado := LPAD(v_proximo_numero::TEXT, v_serie.longitud_digitos, '0');

  -- Construir código según formato [PREFIJO]-[CODIGO]-[AÑO]-[NUMERO]
  v_consecutivo_final := v_serie.prefijo || v_serie.separador || v_serie.clasificacion_codigo;
  IF v_serie.incluye_anio THEN
    v_consecutivo_final := v_consecutivo_final || v_serie.separador || v_serie.anio_vigente;
  END IF;
  v_consecutivo_final := v_consecutivo_final || v_serie.separador || v_numero_formateado;

  RETURN v_consecutivo_final;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==============================================================================
-- 12. SEGURIDAD A NIVEL DE FILA (ROW LEVEL SECURITY - RLS)
-- ==============================================================================
ALTER TABLE public.usuarios_perfiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clasificaciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.series_consecutivas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plantillas_documentales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.equipos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reportes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reporte_transiciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.auditoria ENABLE ROW LEVEL SECURITY;

-- Lectura para usuarios autenticados
CREATE POLICY "Lectura general autenticados" ON public.clasificaciones FOR SELECT TO authenticated USING (true);
CREATE POLICY "Lectura plantillas autenticados" ON public.plantillas_documentales FOR SELECT TO authenticated USING (true);
CREATE POLICY "Lectura clientes autenticados" ON public.clientes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Lectura equipos autenticados" ON public.equipos FOR SELECT TO authenticated USING (true);
CREATE POLICY "Lectura reportes autenticados" ON public.reportes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Lectura auditoria auditor y admin" ON public.auditoria FOR SELECT TO authenticated USING (
  EXISTS (
    SELECT 1 FROM public.usuarios_perfiles
    WHERE id = auth.uid() AND rol IN ('auditor', 'administrador', 'director_tecnico')
  )
);

-- Inmutabilidad estricta de auditoría (Nadie puede UPDATE ni DELETE en auditoría)
CREATE POLICY "Impedir modificar auditoria" ON public.auditoria FOR UPDATE TO authenticated USING (false);
CREATE POLICY "Impedir borrar auditoria" ON public.auditoria FOR DELETE TO authenticated USING (false);

-- ==============================================================================
-- 13. DATOS SEMILLA INICIALES (CLASIFICACIONES, SERIES 2026 Y PLANTILLAS)
-- ==============================================================================

-- Clasificaciones
INSERT INTO public.clasificaciones (codigo, nombre, descripcion) VALUES
  ('VT', 'Válvulas de Seguridad y/o Alivio', 'Ensayos de presión de ajuste (set point), sello y reasiento de válvulas.'),
  ('TB', 'Tuberías y Spools', 'Pruebas hidrostáticas y neumáticas de hermeticidad y resistencia estructural.'),
  ('PR', 'Magnitud Presión', 'Calibración de manómetros, transmisores de presión y transductores.'),
  ('TM', 'Magnitud Temperatura', 'Calibración de termómetros digitales, RTD y termocuplas.'),
  ('EL', 'Magnitudes Eléctricas', 'Calibración de multímetros, pinzas amperimétricas y calibradores de procesos.')
ON CONFLICT (codigo) DO NOTHING;

-- Series Consecutivas para el año 2026
INSERT INTO public.series_consecutivas (clasificacion_codigo, nombre, prefijo, separador, longitud_digitos, incluye_anio, reinicio_anual, anio_vigente, ultimo_numero) VALUES
  ('VT', 'Prueba de Válvulas', 'TEST', '-', 4, true, true, 2026, 32),
  ('TB', 'Prueba de Tubería', 'TEST', '-', 4, true, true, 2026, 1),
  ('PR', 'Calibración Presión', 'CAL', '-', 4, true, true, 2026, 1),
  ('TM', 'Calibración Temperatura', 'CAL', '-', 4, true, true, 2026, 0),
  ('EL', 'Calibración Eléctrica', 'CAL', '-', 4, true, true, 2026, 0)
ON CONFLICT (clasificacion_codigo) DO NOTHING;

-- Plantillas Documentales y Títulos Oficiales
INSERT INTO public.plantillas_documentales (clasificacion_codigo, nombre_identificador, tipo_elemento, titulo_reporte_es, titulo_reporte_en, subtitulo_normativo, codigo_formato, version_revision) VALUES
  ('VT', 'Válvula de Seguridad y/o Alivio (PSV)', 'Válvula de Seguridad y/o Alivio', 'REPORTE DE PRUEBA DE VALVULAS DE SEGURIDAD Y/O ALIVIO', 'Safety and/or Relief Valve Test Report', 'Conforme a Código ASME Sec. VIII Div. 1 & Norma API 527', 'FOR-MET-VT-01', 'v1.0 (Rev 03)'),
  ('VT', 'Válvulas de Control', 'Válvula de Control', 'REPORTE DE PRUEBA DE VALVULAS DE CONTROL', 'Control Valve Test Report', 'Conforme a Estándar ANSI/FCI 70-2 / IEC 60534-4', 'FOR-MET-VT-02', 'v1.0 (Rev 01)'),
  ('VT', 'Válvulas ON/OFF', 'Válvula ON/OFF', 'REPORTE DE PRUEBA DE VALVULAS ON/OFF', 'Valve Test Report (ON/OFF)', 'Conforme a Norma API 598 / ISO 5208', 'FOR-MET-VT-03', 'v1.0 (Rev 01)'),
  ('VT', 'Válvulas Manuales', 'Válvula Manual', 'REPORTE DE PRUEBA DE VALVULAS MANUALES', 'Manual Valve Test Report', 'Conforme a Norma API 598 / ASME B16.34', 'FOR-MET-VT-04', 'v1.0 (Rev 01)'),
  ('VT', 'Reporte General de Prueba de Válvulas', 'Válvula Industrial', 'REPORTE DE PRUEBA DE VALVULAS', 'Valve Test Report', 'Procedimiento Estándar de Ensayos', 'FOR-MET-VT-00', 'v1.0 (Rev 02)'),
  ('VT', 'Válvulas de Presión-Vacío', 'Válvula Presión-Vacío', 'REPORTE DE PRUEBA DE VALVULAS DE PRESIÓN-VACÍO', 'Pressure-Vacuum Valve Test Report', 'Conforme a Norma API 2000', 'FOR-MET-VT-05', 'v1.0 (Rev 01)'),
  ('PR', 'Certificado de Calibración - Presión', 'Manómetros / Transmisores', 'CERTIFICADO DE CALIBRACION', 'Calibration Certificate', 'Guía Técnica DKD-R 6-1 / NTC-ISO/IEC 17025', 'FOR-MET-PR-01', 'v1.0 (Rev 02)'),
  ('TM', 'Certificado de Calibración - Temperatura', 'Termómetros / Sensores RTD', 'CERTIFICADO DE CALIBRACION', 'Calibration Certificate', 'Guía Técnica EURAMET cg-11 / NTC-ISO/IEC 17025', 'FOR-MET-TM-01', 'v1.0 (Rev 02)'),
  ('EL', 'Certificado de Calibración - Eléctrica', 'Multímetros / Calibradores', 'CERTIFICADO DE CALIBRACION', 'Calibration Certificate', 'Guía Técnica EURAMET cg-15 / NTC-ISO/IEC 17025', 'FOR-MET-EL-01', 'v1.0 (Rev 01)'),
  ('VT', 'Reporte de Verificación Técnica', 'Verificación Operativa', 'REPORTE DE VERIFICACIÓN', 'Verification Report', 'Procedimiento de Verificación Operativa en Sitio y Banco', 'FOR-MET-GEN-01', 'v1.0 (Rev 01)'),
  ('VT', 'Suplemento a Reporte de Verificación', 'Suplemento / Adenda', 'SUPLEMENTO A REPORTE DE VERIFICACIÓN', 'Verification Report Supplement', 'Adenda Técnica al Informe Principal de Ensayos', 'FOR-MET-GEN-02', 'v1.0 (Rev 01)'),
  ('TB', 'Prueba Hidrostática de Tubería', 'Tubería y Spools', 'REPORTE DE PRUEBA HIDROSTÁTICA DE TUBERÍA Y SPOOLS', 'Hydrostatic Piping Test Report', 'Conforme a Código ASME B31.3 Sección 345.4', 'FOR-MET-TB-01', 'v1.0 (Rev 01)');

-- Clientes Demo
INSERT INTO public.clientes (id, razon_social, identificacion, direccion, contacto, telefono, email) VALUES
  ('c1111111-1111-1111-1111-111111111111', 'INGCO INTERNACIONAL S.A.S.', '900.548.219-4', 'Zona Industrial Mamonal Km 7, Cartagena', 'Ing. Mauricio Peña', '+57 (605) 668 5500', 'calidad@ingco-latam.com'),
  ('c2222222-2222-2222-2222-222222222222', 'PETROSERVICIOS DEL CARIBE LTDA', '890.102.443-1', 'Parque Industrial Malambo Bodega 12', 'Dra. Andrea Morales', '+57 (605) 345 8899', 'operaciones@petroservicios.com')
ON CONFLICT (identificacion) DO NOTHING;

-- Bucket privado en Supabase Storage para certificados PDF
DO $$
BEGIN
  INSERT INTO storage.buckets (id, name, public) 
  VALUES ('certificados-pdf', 'certificados-pdf', false)
  ON CONFLICT (id) DO NOTHING;
EXCEPTION
  WHEN OTHERS THEN
    -- Si storage no está disponible directamente o requiere crearse por UI
    NULL;
END $$;


