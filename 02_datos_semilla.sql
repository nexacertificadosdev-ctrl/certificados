-- ==============================================================================
-- PASO 2: INSERCIÓN DE DATOS SEMILLA (PLANTILLAS, SERIES, CLASIFICACIONES)
-- Ejecutar en el SQL Editor de Supabase DESPUÉS de haber ejecutado el Paso 1
-- ==============================================================================

-- 1. Clasificaciones
INSERT INTO public.clasificaciones (codigo, nombre, descripcion) VALUES
  ('VT', 'Válvulas de Seguridad y/o Alivio', 'Ensayos de presión de ajuste (set point), sello y reasiento de válvulas.'),
  ('TB', 'Tuberías y Spools', 'Pruebas hidrostáticas y neumáticas de hermeticidad y resistencia estructural.'),
  ('PR', 'Magnitud Presión', 'Calibración de manómetros, transmisores de presión y transductores.'),
  ('TM', 'Magnitud Temperatura', 'Calibración de termómetros digitales, RTD y termocuplas.'),
  ('EL', 'Magnitudes Eléctricas', 'Calibración de multímetros, pinzas amperimétricas y calibradores de procesos.')
ON CONFLICT (codigo) DO NOTHING;

-- 2. Series Consecutivas para el año 2026
INSERT INTO public.series_consecutivas (clasificacion_codigo, nombre, prefijo, separador, longitud_digitos, incluye_anio, reinicio_anual, anio_vigente, ultimo_numero) VALUES
  ('VT', 'Prueba de Válvulas', 'TEST', '-', 4, true, true, 2026, 32),
  ('TB', 'Prueba de Tubería', 'TEST', '-', 4, true, true, 2026, 1),
  ('PR', 'Calibración Presión', 'CAL', '-', 4, true, true, 2026, 1),
  ('TM', 'Calibración Temperatura', 'CAL', '-', 4, true, true, 2026, 0),
  ('EL', 'Calibración Eléctrica', 'CAL', '-', 4, true, true, 2026, 0)
ON CONFLICT (clasificacion_codigo) DO NOTHING;

-- 3. Plantillas Documentales y Títulos Oficiales
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

-- 4. Clientes Demo
INSERT INTO public.clientes (id, razon_social, identificacion, direccion, contacto, telefono, email) VALUES
  ('c1111111-1111-1111-1111-111111111111', 'INGCO INTERNACIONAL S.A.S.', '900.548.219-4', 'Zona Industrial Mamonal Km 7, Cartagena', 'Ing. Mauricio Peña', '+57 (605) 668 5500', 'calidad@ingco-latam.com'),
  ('c2222222-2222-2222-2222-222222222222', 'PETROSERVICIOS DEL CARIBE LTDA', '890.102.443-1', 'Parque Industrial Malambo Bodega 12', 'Dra. Andrea Morales', '+57 (605) 345 8899', 'operaciones@petroservicios.com')
ON CONFLICT (identificacion) DO NOTHING;

-- 5. Bucket de almacenamiento privado
DO $$
BEGIN
  INSERT INTO storage.buckets (id, name, public) 
  VALUES ('certificados-pdf', 'certificados-pdf', false)
  ON CONFLICT (id) DO NOTHING;
EXCEPTION
  WHEN OTHERS THEN
    NULL;
END $$;
