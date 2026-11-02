import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_KEY, PREFIJO, PRUEBA } from './config.js';

// En la copia de prueba, lo que escribiría (guardar, cambiar, borrar, subir fotos…) no sale del móvil:
// se contesta como si se hubiera guardado. Se lee todo de verdad y se puede entrar con la cuenta.
async function fetchPrueba(entrada, opciones = {}) {
  const url = typeof entrada === 'string' ? entrada : entrada.url;
  const metodo = String(opciones.method || (typeof entrada === 'string' ? 'GET' : entrada.method) || 'GET').toUpperCase();
  if (['GET', 'HEAD', 'OPTIONS'].includes(metodo) || !/\/(rest|storage|functions)\/v1\//.test(url)) return fetch(entrada, opciones);
  let cuerpo = null;
  try {
    cuerpo = typeof opciones.body === 'string' ? JSON.parse(opciones.body) : null;
  } catch {
    cuerpo = null;
  }
  const filas = (Array.isArray(cuerpo) ? cuerpo : cuerpo && typeof cuerpo === 'object' ? [cuerpo] : []).map((f) => ({
    id: crypto.randomUUID(),
    created_at: new Date().toISOString(),
    ...f,
  }));
  const objeto = (new Headers(opciones.headers || {}).get('Accept') || '').includes('vnd.pgrst.object');
  const respuesta = /\/rpc\//.test(url) ? 'null' : JSON.stringify(objeto ? filas[0] ?? null : filas);
  return new Response(respuesta, { status: 200, headers: { 'Content-Type': 'application/json' } });
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true, storageKey: `${PREFIJO}-auth` },
  ...(PRUEBA ? { global: { fetch: fetchPrueba } } : {}),
});

// Traduce los errores habituales a algo entendible
export function mensajeError(error) {
  const m = (error && (error.message || String(error))) || '';
  if (/invalid login credentials/i.test(m)) return 'Email o contraseña incorrectos.';
  if (/already registered|already exists/i.test(m)) return 'Ya hay una cuenta con ese email. Entra con tu contraseña.';
  if (/password should be at least|weak password/i.test(m)) return 'La contraseña necesita al menos 6 caracteres.';
  if (/email not confirmed/i.test(m)) return 'Falta confirmar el email: abre el correo que te ha llegado.';
  if (/invalid format|validate email/i.test(m)) return 'Ese email no parece válido.';
  if (/rate limit|too many/i.test(m)) return 'Demasiados intentos seguidos. Espera un minuto.';
  if (/fetch|network|load failed|offline/i.test(m)) return 'Sin conexión. Prueba otra vez en un momento.';
  return 'No se ha podido guardar. Prueba otra vez.';
}

export function esErrorDeRed(error) {
  const m = (error && (error.message || String(error))) || '';
  return !navigator.onLine || /fetch|network|load failed/i.test(m);
}
