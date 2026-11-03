import { createClient, SupabaseClient } from '@supabase/supabase-js';

const FALLBACK_URL = 'https://jjqrthvxklufvtzaaugo.supabase.co';
const FALLBACK_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpqcXJ0aHZ4a2x1ZnZ0emFhdWdvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTI0MzUzMDEsImV4cCI6MjEwODAxMTMwMX0.Sjr_S3tG18saFrBVBXZGOB9mdlJ173Q8yHLCNtV_Cks';

// Obtener y sanitizar valores de entorno
const sanitizar = (val: unknown): string => {
  if (typeof val !== 'string') return '';
  return val.trim().replace(/^["']|["']$/g, '');
};

const envUrl = sanitizar(import.meta.env.VITE_SUPABASE_URL);
const envKey = sanitizar(import.meta.env.VITE_SUPABASE_ANON_KEY);

// Validar que la URL comience con http:// o https://
const esUrlValida = (url: string) => url.startsWith('https://') || url.startsWith('http://');

const supabaseUrl = (esUrlValida(envUrl) ? envUrl : FALLBACK_URL)
  .replace(/\/rest\/v1\/?$/, '')
  .replace(/\/+$/, '');

const supabaseAnonKey = envKey || FALLBACK_ANON_KEY;

let client: SupabaseClient;
try {
  client = createClient(supabaseUrl, supabaseAnonKey);
} catch (err) {
  console.warn('[supabaseClient] Error inicializando Supabase con valores actuales, usando fallback:', err);
  client = createClient(FALLBACK_URL, FALLBACK_ANON_KEY);
}

export const supabase = client;

export const estaConfiguradoSupabase = (): boolean => {
  return Boolean(
    (envUrl || FALLBACK_URL) &&
    (envKey || FALLBACK_ANON_KEY) &&
    envKey !== 'tu_anon_public_key_aqui'
  );
};

