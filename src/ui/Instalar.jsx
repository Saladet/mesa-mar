// Tener Mesa en la pantalla de inicio. En iPhone no se puede instalar con un toque (Apple no lo
// permite a las webs): se explica el camino de Safari. En Android, el botón abre el aviso del sistema.
import { useEffect, useState } from 'react';
import Icono from './Icono.jsx';
import { PREFIJO } from '../config.js';

const CLAVE = `${PREFIJO}-instalar-visto`;
const ESPERA = 7 * 24 * 3600 * 1000; // si no la instalan, se vuelve a ofrecer a la semana

export function enPantallaDeInicio() {
  try {
    return window.navigator.standalone === true || window.matchMedia('(display-mode: standalone)').matches;
  } catch {
    return false;
  }
}

function sistema() {
  const ua = navigator.userAgent || '';
  if (/iPhone|iPad|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1)) return 'iphone';
  if (/Android/.test(ua)) return 'android';
  return null;
}

// Chrome en Android avisa cuando se puede instalar: se guarda para lanzarlo desde el botón
let avisoAndroid = null;
if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    avisoAndroid = e;
    window.dispatchEvent(new Event('mesa-instalable'));
  });
}

function tocaMostrar() {
  if (enPantallaDeInicio() || !sistema()) return false;
  try {
    const visto = Number(localStorage.getItem(CLAVE) || 0);
    return !visto || Date.now() - visto > ESPERA;
  } catch {
    return true;
  }
}

function Paso({ n, children }) {
  return (
    <li className="paso-instalar">
      <span className="paso-instalar-n" aria-hidden="true">
        {n}
      </span>
      <span>{children}</span>
    </li>
  );
}

export default function Instalar() {
  const [abierta, setAbierta] = useState(tocaMostrar);
  const [instalable, setInstalable] = useState(() => !!avisoAndroid);

  useEffect(() => {
    const listo = () => setInstalable(true);
    window.addEventListener('mesa-instalable', listo);
    return () => window.removeEventListener('mesa-instalable', listo);
  }, []);

  if (!abierta) return null;
  const so = sistema();

  function cerrar() {
    try {
      localStorage.setItem(CLAVE, String(Date.now()));
    } catch {
      /* nada */
    }
    setAbierta(false);
  }

  async function instalarAndroid() {
    const aviso = avisoAndroid;
    if (!aviso) return;
    avisoAndroid = null;
    await aviso.prompt();
    cerrar();
  }

  return (
    <>
      <div className="velo" onClick={cerrar} />
      <section className="hoja" role="dialog" aria-modal="true" aria-labelledby="titulo-instalar">
        <span className="tirador" aria-hidden="true" />
        <div className="hoja-cab">
          <h1 id="titulo-instalar" className="hoja-titulo">
            Ten Mesa en tu pantalla de inicio
          </h1>
          <button className="boton-cerrar" type="button" onClick={cerrar} aria-label="Cerrar">
            <Icono n="cerrar" t={18} />
          </button>
        </div>
        <p className="texto-instalar">Así la abres con un toque, como cualquier otra app del móvil.</p>

        {so === 'iphone' ? (
          <ol className="pasos-instalar">
            <Paso n={1}>
              En Safari, toca <b className="tecla">•••</b> abajo, junto a la dirección, y luego <b>Compartir</b>{' '}
              <Icono n="compartir" t={17} />. Si ves ese botón abajo, tócalo directamente.
            </Paso>
            <Paso n={2}>
              Elige <b>Añadir a pantalla de inicio</b> <Icono n="anadir" t={17} />, deja activado «Abrir como app web» y toca{' '}
              <b>Añadir</b>.
            </Paso>
            <Paso n={3}>Abre Mesa desde el icono y entra con tu email y tu contraseña. Solo la primera vez.</Paso>
          </ol>
        ) : instalable ? null : (
          <ol className="pasos-instalar">
            <Paso n={1}>
              En Chrome, toca el menú <b className="tecla">⋮</b> de arriba a la derecha.
            </Paso>
            <Paso n={2}>
              Elige <b>Instalar aplicación</b> (o «Añadir a pantalla de inicio»).
            </Paso>
          </ol>
        )}

        {so === 'android' && instalable ? (
          <button className="boton ancho" type="button" onClick={instalarAndroid}>
            Instalar Mesa
          </button>
        ) : (
          <button className="boton ancho" type="button" onClick={cerrar}>
            Entendido
          </button>
        )}
      </section>
    </>
  );
}
