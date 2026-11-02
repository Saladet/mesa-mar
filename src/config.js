// Datos públicos del proyecto de Supabase (la clave publicable está pensada para ir en la app;
// lo que protege los datos son las políticas de seguridad de cada tabla).
export const SUPABASE_URL = 'https://ijvbladbmesqaztbbcpt.supabase.co';
export const SUPABASE_KEY = 'sb_publishable_SIbvvUIkwvQ-Midac-wGOA_V2xdwE4x';
export const VERSION = '1.1';

// Esta Mesa comparte dominio (saladet.github.io) con otras: todo lo que guarda en el móvil
// lleva este prefijo para no pisarse con ellas.
export const PREFIJO = 'mesa-mar';

// Colores con los que abre la app la primera vez (cada casa puede cambiarlos en Hogar)
export const TEMA = 'mar';

// Copia de prueba (se publica aparte en /prueba/): enseña los datos de verdad pero no guarda nada
export const PRUEBA = import.meta.env.VITE_PRUEBA === '1';
