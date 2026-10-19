export const DEFAULT_LOGO_IZQUIERDO =
  'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200"><circle cx="100" cy="100" r="92" fill="%23c00000" stroke="%238a0000" stroke-width="4"/><circle cx="100" cy="100" r="76" fill="none" stroke="%23ffffff" stroke-width="2"/><text x="100" y="88" text-anchor="middle" font-family="Arial,sans-serif" font-weight="900" font-size="44" fill="%23ffffff">BI</text><text x="100" y="118" text-anchor="middle" font-family="Arial,sans-serif" font-weight="bold" font-size="12" fill="%23ffffff" letter-spacing="1.5">BUSTILLO</text><text x="100" y="134" text-anchor="middle" font-family="Arial,sans-serif" font-weight="600" font-size="9.5" fill="%23ffffff" letter-spacing="0.5">INGENIER%C3%8DA S.A.S.</text></svg>';

export const DEFAULT_LOGO_DERECHO =
  'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200"><circle cx="100" cy="100" r="92" fill="%23002060" stroke="%23001030" stroke-width="4"/><circle cx="100" cy="100" r="76" fill="none" stroke="%23ffffff" stroke-width="2"/><path d="M70,90 L100,60 L130,90 L118,90 L118,125 L82,125 L82,90 Z" fill="%23ffffff"/><text x="100" y="112" text-anchor="middle" font-family="Arial,sans-serif" font-weight="900" font-size="20" fill="%23002060">LAB</text><text x="100" y="152" text-anchor="middle" font-family="Arial,sans-serif" font-weight="bold" font-size="9" fill="%23ffffff" letter-spacing="0.5">INSTRUMENTACI%C3%93N</text><text x="100" y="166" text-anchor="middle" font-family="Arial,sans-serif" font-weight="600" font-size="8" fill="%2393c5fd" letter-spacing="0.5">Y V%C3%81LVULAS</text></svg>';

export const DEFAULT_COLOR_PRIMARIO = '#c00000'; // Encabezados de tablas (Rojo Carmesí Bustillo)
export const DEFAULT_COLOR_SECUNDARIO = '#002060'; // Bordes y títulos principales (Azul Marino)
export const DEFAULT_COLOR_TEXTO = '#ffffff';

export interface PaletaPreset {
  nombre: string;
  primario: string;
  secundario: string;
  texto: string;
  descripcion: string;
}

export const PALETAS_PREDEFINIDAS: PaletaPreset[] = [
  {
    nombre: 'Bustillo Corporativo',
    primario: '#c00000',
    secundario: '#002060',
    texto: '#ffffff',
    descripcion: 'Rojo Carmesí para tablas y Azul Marino para títulos y marco institucional',
  },
  {
    nombre: 'Azul Metrológico Clásico',
    primario: '#1e40af',
    secundario: '#0f172a',
    texto: '#ffffff',
    descripcion: 'Azul Cobalto institucional para tablas con títulos en Azul Noche',
  },
  {
    nombre: 'Verde Esmeralda Industrial',
    primario: '#00875a',
    secundario: '#0f172a',
    texto: '#ffffff',
    descripcion: 'Verde Esmeralda moderno alineado al nuevo portal de software',
  },
  {
    nombre: 'Petróleo / Oil & Gas',
    primario: '#c2410c',
    secundario: '#1e293b',
    texto: '#ffffff',
    descripcion: 'Naranja Quemado industrial con marco Pizarra Oscuro',
  },
  {
    nombre: 'Gris Acero Ejecutivo',
    primario: '#334155',
    secundario: '#0f172a',
    texto: '#ffffff',
    descripcion: 'Gris Grafito de alta sobriedad técnica e ingeniería de precisión',
  },
];
