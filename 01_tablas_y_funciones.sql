-- ==============================================================================
-- PASO 1: ESTRUCTURA, TABLAS, ENUMS, FUNCIONES Y RLS
-- Copia y pega este script primero en el SQL Editor de Supabase y dale a RUN
-- ==============================================================================

-- 1. Extensiones y Enums
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

-- 2. Perfiles de usuario (vinculado a auth.users de Supabase)
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

-- 3. Clasificaciones Documentales
CREATE TABLE IF NOT EXISTS public.clasificaciones (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  codigo codigo_clasificacion_enum NOT NULL UNIQUE,
  nombre TEXT NOT NULL,
  descripcion TEXT,
  activa BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Series Consecutivas
CREATE TABLE IF NOT EXISTS public.series_consecutivas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clasificacion_codigo codigo_clasificacion_enum NOT NULL REFERENCES public.clasificaciones(codigo),
  nombre TEXT NOT NULL,
  prefijo TEXT NOT NULL,
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

-- 5. Plantillas Documentales y Títulos
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

-- 6. Clientes
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

-- 7. Equipos e Instrumentos
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

-- 8. Tabla Maestra: Reportes y Certificados
CREATE TABLE IF NOT EXISTS public.reportes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  temp_id TEXT NOT NULL,
  numero_consecutivo TEXT UNIQUE,
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
  
  datos_tecnicos JSONB NOT NULL DEFAULT '{}'::jsonb,
  
  motivo_anulacion TEXT,
  pdf_storage_path TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 9. Historial de Transiciones
CREATE TABLE IF NOT EXISTS public.reporte_transiciones (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reporte_id UUID REFERENCES public.reportes(id) ON DELETE CASCADE,
  estado_anterior estado_reporte_enum,
  estado_nuevo estado_reporte_enum NOT NULL,
  usuario_id UUID REFERENCES public.usuarios_perfiles(id) NOT NULL,
  observaciones TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 10. Auditoría Inmutable
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

-- 11. Función Atómica de Consecutivos con Reinicio Anual
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

  SELECT * INTO v_serie
  FROM public.series_consecutivas
  WHERE clasificacion_codigo = p_clasificacion_codigo AND activa = true
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'No se encontró una serie activa para la clasificación: %', p_clasificacion_codigo;
  END IF;

  IF v_serie.reinicio_anual AND v_serie.anio_vigente <> v_anio_actual THEN
    v_serie.anio_vigente := v_anio_actual;
    v_serie.ultimo_numero := 0;
  END IF;

  v_proximo_numero := v_serie.ultimo_numero + 1;

  UPDATE public.series_consecutivas
  SET ultimo_numero = v_proximo_numero,
      anio_vigente = v_serie.anio_vigente,
      updated_at = NOW()
  WHERE id = v_serie.id;

  v_numero_formateado := LPAD(v_proximo_numero::TEXT, v_serie.longitud_digitos, '0');

  v_consecutivo_final := v_serie.prefijo || v_serie.separador || v_serie.clasificacion_codigo;
  IF v_serie.incluye_anio THEN
    v_consecutivo_final := v_consecutivo_final || v_serie.separador || v_serie.anio_vigente;
  END IF;
  v_consecutivo_final := v_consecutivo_final || v_serie.separador || v_numero_formateado;

  RETURN v_consecutivo_final;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 12. Políticas RLS
ALTER TABLE public.usuarios_perfiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clasificaciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.series_consecutivas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plantillas_documentales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.equipos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reportes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reporte_transiciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.auditoria ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Lectura general autenticados" ON public.clasificaciones FOR SELECT TO authenticated USING (true);
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE POLICY "Lectura plantillas autenticados" ON public.plantillas_documentales FOR SELECT TO authenticated USING (true);
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE POLICY "Lectura clientes autenticados" ON public.clientes FOR SELECT TO authenticated USING (true);
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE POLICY "Lectura equipos autenticados" ON public.equipos FOR SELECT TO authenticated USING (true);
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE POLICY "Lectura reportes autenticados" ON public.reportes FOR SELECT TO authenticated USING (true);
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE POLICY "Impedir modificar auditoria" ON public.auditoria FOR UPDATE TO authenticated USING (false);
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE POLICY "Impedir borrar auditoria" ON public.auditoria FOR DELETE TO authenticated USING (false);
EXCEPTION WHEN duplicate_object THEN null; END $$;
