import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { ProveedorDatos } from './datos.jsx';
import App from './App.jsx';
import { aplicarTema, temaAlAbrir } from './tema.js';
import '@fontsource-variable/bricolage-grotesque/opsz.css';
import '@fontsource-variable/manrope/wght.css';
// Letra del tema «Rock»: el navegador solo la descarga si se usa
import '@fontsource/shrikhand/latin-400.css';
import './estilos.css';
import { PRUEBA } from './config.js';

aplicarTema(temaAlAbrir());

createRoot(document.getElementById('app')).render(
  <StrictMode>
    <ProveedorDatos>
      <App />
    </ProveedorDatos>
  </StrictMode>,
);

if (PRUEBA) {
  document.title = 'Mesa · prueba';
  document.documentElement.classList.add('es-prueba');
}

if ('serviceWorker' in navigator && import.meta.env.PROD && !PRUEBA) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(() => {});
  });
}
