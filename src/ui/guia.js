// Abrir la bienvenida o la explicación paso a paso desde cualquier pantalla (la muestra App).
// detalle: { tipo: 'tour', intro?: 'repaso' } o { tipo: 'bienvenida', demo: true }
export function pedirGuia(detalle) {
  window.dispatchEvent(new CustomEvent('mesa-guia', { detail: detalle }));
}
