// Explicación paso a paso sobre la propia app: oscurece la pantalla, ilumina una parte y la explica
// en un bocadillo con «Siguiente». Va pasando por la semana, la lista, las recetas y Hogar.
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useDatos } from '../datos.jsx';
import { ir, leerRuta } from '../ruta.js';
import { enumerar } from './textos.jsx';

const MARGEN = 8; // aire alrededor de lo iluminado

// En la semana, la explicación es sobre la vista «Día a día». Devuelve si ya está (o no hace falta)
function verDiaADia() {
  if (!document.querySelector('.app .cabecera')) return false; // la semana aún no se ha pintado
  const b = document.querySelector('.cabecera .segmentado button');
  if (b && b.getAttribute('aria-pressed') === 'false') b.click();
  return true;
}

function pasosPara(d, intro) {
  const yo = d.yo;
  const otros = d.personas.filter((p) => p.id !== yo?.id);
  const quien = d.personasMap.get(d.hogar?.configurado_por);
  let entrada;
  if (intro === 'repaso') {
    entrada = { titulo: 'Vamos allá', texto: 'Te enseño la app otra vez, paso a paso. Toca «Siguiente» para ir avanzando.' };
  } else if (intro === 'otro' && quien && quien.id !== yo?.id && !quien.oculta) {
    entrada = {
      titulo: `¡Hola, ${yo?.nombre}!`,
      texto: `${quien.nombre} ya ha preparado el menú de esta semana y la lista de la compra. Te enseño cómo funciona la app: es un minuto.`,
    };
  } else if (intro === 'otro') {
    entrada = { titulo: `¡Hola, ${yo?.nombre}!`, texto: 'El menú de esta semana ya está preparado. Te enseño cómo funciona la app: es un minuto.' };
  } else {
    entrada = { titulo: 'Así funciona', texto: 'Te enseño cada parte de la app. Toca «Siguiente» para ir avanzando.' };
  }

  // «Lo que tache Aina lo ve Manu»
  let compartida = '';
  if (yo?.oculta && otros.length >= 2) compartida = ` Lo que tache ${otros[0].nombre}, ${otros[1].nombre} lo ve tachado en su móvil al momento.`;
  else if (otros.length) compartida = ` Lo que taches tú, ${enumerar(otros.map((p) => p.nombre))} lo ve${otros.length > 1 ? 'n' : ''} tachado en su móvil al momento.`;

  return [
    { ruta: 'semana', antes: verDiaADia, ...entrada },
    {
      ruta: 'semana',
      sel: '.cabecera .dias',
      titulo: 'Los días de la semana',
      texto: 'Toca un día para ver qué hay de comer ese día. El de hoy está marcado.',
    },
    {
      ruta: 'semana',
      sel: '.tarjeta .tarjeta-enlace, .fila-comida .fila-enlace, .hueco-vacio',
      titulo: 'Cada plato',
      texto: 'Si tocas el plato, ves los ingredientes y cómo se hace, paso a paso.',
    },
    {
      ruta: 'semana',
      sel: '.tarjeta .boton-flotante, .fila-comida .boton-flotante',
      titulo: '¿No os apetece?',
      texto: 'Con este botón lo cambiáis por otro plato, o buscáis el que queráis. La lista de la compra se arregla sola.',
    },
    {
      ruta: 'lista',
      sel: '.seccion-lista .fila-lista',
      titulo: 'La lista de la compra',
      texto: `Ya está hecha con todo lo del menú, por secciones. En la tienda, toca cada cosa al cogerla y se tacha.${compartida}`,
    },
    {
      ruta: 'lista',
      sel: 'form.anadir-lista',
      titulo: '¿Falta algo?',
      texto: 'Si necesitáis algo que no es del menú, como pan o detergente, escribidlo aquí y se añade.',
    },
    {
      ruta: 'recetas',
      sel: '.cabecera .boton-redondo-oscuro',
      titulo: 'Las recetas',
      texto: 'Aquí están todas. Con la lupa buscáis una, y dentro de la receta, «Al menú» la pone el día que queráis.',
    },
    {
      ruta: 'hogar',
      sel: '.guia-hogar',
      titulo: 'Hogar',
      texto: 'Aquí se cambia el día de la compra y qué comidas planificar. Y si algún día no os acordáis de algo, aquí podéis ver esta explicación otra vez.',
    },
    {
      ruta: 'semana',
      titulo: '¡Ya está!',
      texto: 'Cuando la semana esté a punto de acabar, en esta pantalla os saldrá un botón para preparar la siguiente. ¡Que aproveche!',
    },
  ];
}

export default function Tour({ intro, alTerminar }) {
  const d = useDatos();
  const [pasos] = useState(() => pasosPara(d, intro));
  const [i, setI] = useState(0);
  const [hueco, setHueco] = useState(null); // { top, left, width, height } o null (bocadillo centrado)
  const [listo, setListo] = useState(false);
  const [alto, setAlto] = useState(250); // del bocadillo, para que no se salga de la pantalla
  const elemento = useRef(null);
  const siguienteRef = useRef(null);
  const bocadilloRef = useRef(null);
  const paso = pasos[i];
  const ultimo = i === pasos.length - 1;

  const medir = useCallback(() => {
    const el = elemento.current;
    if (!el || !el.isConnected) return;
    const r = el.getBoundingClientRect();
    const alto = window.innerHeight;
    // Lo muy alto se recorta a la pantalla para que quepa el bocadillo
    const top = Math.max(r.top - MARGEN, 6);
    const bottom = Math.min(r.bottom + MARGEN, alto - 6);
    setHueco({ top, left: Math.max(r.left - MARGEN, 6), width: Math.min(r.width + MARGEN * 2, window.innerWidth - 12), height: Math.max(bottom - top, 24) });
  }, []);

  // Cada paso: ir a su pantalla, esperar a que aparezca lo que se explica y enfocarlo
  useEffect(() => {
    let vivo = true;
    let intentos = 0;
    let preparado = !paso.antes;
    let espera = null;
    setListo(false);
    elemento.current = null;
    setHueco(null);
    if (paso.ruta && leerRuta().nombre !== paso.ruta) ir(paso.ruta);
    const buscar = () => {
      if (!vivo) return;
      if (!preparado && intentos < 15) {
        preparado = paso.antes() === true;
        intentos += 1;
        espera = setTimeout(buscar, preparado ? 160 : 80);
        return;
      }
      const el = paso.sel ? document.querySelector(paso.sel) : null;
      if (el || !paso.sel || intentos > 30) {
        if (el) {
          el.scrollIntoView({ block: 'center', inline: 'nearest' });
          elemento.current = el;
        }
        espera = setTimeout(() => {
          if (!vivo) return;
          medir();
          setListo(true);
        }, el ? 260 : 60);
        return;
      }
      intentos += 1;
      espera = setTimeout(buscar, 80);
    };
    espera = setTimeout(buscar, 60);
    return () => {
      vivo = false;
      clearTimeout(espera);
    };
  }, [i]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const alCambiar = () => medir();
    window.addEventListener('resize', alCambiar);
    window.addEventListener('scroll', alCambiar, true);
    return () => {
      window.removeEventListener('resize', alCambiar);
      window.removeEventListener('scroll', alCambiar, true);
    };
  }, [medir]);

  useLayoutEffect(() => {
    if (!listo) return;
    siguienteRef.current?.focus({ preventScroll: true });
    const h = bocadilloRef.current?.offsetHeight;
    if (h && Math.abs(h - alto) > 2) setAlto(h);
  }, [listo, i]); // eslint-disable-line react-hooks/exhaustive-deps

  function terminar(como) {
    alTerminar(como);
  }

  // Al cambiar de paso se quita el bocadillo a la vez, para que no salga un momento el texto nuevo en el sitio viejo
  function irAPaso(n) {
    setListo(false);
    setHueco(null);
    setI(n);
  }

  // Dónde va el bocadillo: debajo de lo iluminado si está arriba; encima si está abajo; si no hay nada, centrado
  const vh = window.innerHeight;
  const tope = Math.max(12, vh - alto - 12);
  let estilo;
  if (!hueco) estilo = { top: '50%', transform: 'translate(-50%, -50%)' };
  else if (hueco.top + hueco.height / 2 < vh / 2) estilo = { top: Math.min(hueco.top + hueco.height + 14, tope) };
  else estilo = { bottom: Math.min(vh - hueco.top + 14, tope) };

  return (
    <>
      <div className={`tour-velo${hueco ? '' : ' oscuro'}`} aria-hidden="true" />
      {hueco ? <div className="tour-foco" style={hueco} aria-hidden="true" /> : null}
      {listo ? (
        <section ref={bocadilloRef} className="tour-bocadillo" style={estilo} role="dialog" aria-modal="true" aria-labelledby="tour-titulo" aria-describedby="tour-texto">
          <span className="tour-cuenta">
            {i + 1} de {pasos.length}
          </span>
          {!ultimo ? (
            <button type="button" className="tour-saltar" onClick={() => terminar('saltado')}>
              Saltar
            </button>
          ) : null}
          <h2 id="tour-titulo">{paso.titulo}</h2>
          <p id="tour-texto">{paso.texto}</p>
          <div className="tour-botones">
            {i > 0 ? (
              <button type="button" className="boton-texto gris" onClick={() => irAPaso(i - 1)}>
                Atrás
              </button>
            ) : (
              <span />
            )}
            <button ref={siguienteRef} type="button" className="boton lima" onClick={() => (ultimo ? terminar('hecho') : irAPaso(i + 1))}>
              {ultimo ? '¡Entendido!' : 'Siguiente'}
            </button>
          </div>
        </section>
      ) : null}
    </>
  );
}
