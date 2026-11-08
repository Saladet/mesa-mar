// Primera vez en una casa con bienvenida guiada: dos preguntas con botones grandes (día de compra y
// qué comidas), se prepara la primera semana y se pasa a la explicación de la app.
// El tester (demo) ve lo mismo, pero no cambia la configuración de la casa.
import { useState } from 'react';
import { useDatos } from '../datos.jsx';
import { Dibujo } from '../ui/Portada.jsx';
import Icono from '../ui/Icono.jsx';
import { marcaDe } from '../tema.js';
import { enumerar } from '../ui/textos.jsx';

const DIAS = [
  [1, 'Lunes'],
  [2, 'Martes'],
  [3, 'Miércoles'],
  [4, 'Jueves'],
  [5, 'Viernes'],
  [6, 'Sábado'],
  [0, 'Domingo'],
];

const OPCIONES_COMIDAS = [
  { id: 'ambas', comidas: ['comida', 'cena'], texto: 'La comida y la cena', ayuda: 'Lo más cómodo' },
  { id: 'comida', comidas: ['comida'], texto: 'Solo la comida', ayuda: 'Las cenas las improvisáis' },
  { id: 'cena', comidas: ['cena'], texto: 'Solo la cena', ayuda: 'A mediodía coméis fuera' },
];

function opcionDe(comidas) {
  const clave = [...(comidas || [])].sort().join(',');
  return OPCIONES_COMIDAS.find((o) => [...o.comidas].sort().join(',') === clave)?.id ?? null;
}

export default function Bienvenida({ demo = false, alTerminar }) {
  const d = useDatos();
  const [paso, setPaso] = useState('hola');
  const [dia, setDia] = useState(demo ? null : d.hogar?.configurado ? d.hogar.dia_compra : null);
  const [opcion, setOpcion] = useState(demo ? null : d.hogar?.configurado ? opcionDe(d.hogar.comidas) : null);
  const [error, setError] = useState(false);
  const [semanaDePrueba, setSemanaDePrueba] = useState(false);
  const yo = d.yo;
  const otros = d.personas.filter((p) => p.id !== yo?.id).map((p) => p.nombre);
  const nombreDiaElegido = DIAS.find(([v]) => v === dia)?.[1];

  async function preparar(diaCompra, comidas) {
    setPaso('preparando');
    setError(false);
    const habiaSemana = d.menus.length > 0;
    try {
      await d.acciones.configurarCasa({ diaCompra, comidas, demo });
      setSemanaDePrueba(demo && !habiaSemana);
      setPaso('listo');
    } catch (e) {
      console.error(e);
      setError(true);
    }
  }

  function elegirComidas(o) {
    setOpcion(o.id);
    preparar(dia, o.comidas);
  }

  if (paso === 'hola') {
    return (
      <div className="bienvenida">
        <Dibujo paleta={marcaDe(d.hogar?.tema)} tam={84} grande={false} />
        {demo ? <span className="chip-tester">Modo tester · aquí no se guarda nada</span> : null}
        <h1>¡Hola, {yo?.nombre}!</h1>
        <p>
          Esta es {demo ? 'la app' : 'vuestra app'} de las comidas: dice qué cocinar cada día de la semana y hace sola la lista de la compra
          {!demo && otros.length ? `, compartida con ${enumerar(otros)}` : ''}.
        </p>
        <p>Antes de empezar, {demo ? 'te hago' : 'os hago'} dos preguntas rápidas.</p>
        <div className="bienvenida-acciones">
          <button type="button" className="boton lima ancho grande" onClick={() => setPaso('dia')}>
            Empezar
          </button>
        </div>
      </div>
    );
  }

  if (paso === 'dia') {
    const elegir = (v) => {
      setDia(v);
      setPaso('comidas');
    };
    return (
      <div className="bienvenida">
        <span className="bienvenida-paso">Pregunta 1 de 2</span>
        <h1>¿Qué día soléis hacer la compra grande?</h1>
        <p>Cada semana del menú empezará ese día. Se puede cambiar cuando queráis.</p>
        <div className="opciones-grandes" role="group" aria-label="Día de la compra">
          {DIAS.map(([v, t]) => (
            <button key={v} type="button" className={`opcion-grande${dia === v ? ' on' : ''}`} aria-pressed={dia === v} onClick={() => elegir(v)}>
              {t}
            </button>
          ))}
          <button type="button" className="opcion-grande" onClick={() => elegir(new Date().getDay())}>
            No tenemos día fijo
            <small>Empezamos hoy</small>
          </button>
        </div>
        <button type="button" className="boton-texto claro" onClick={() => setPaso('hola')}>
          <Icono n="izquierda" t={18} />
          Atrás
        </button>
      </div>
    );
  }

  if (paso === 'comidas') {
    return (
      <div className="bienvenida">
        <span className="bienvenida-paso">Pregunta 2 de 2</span>
        <h1>¿Qué queréis tener planeado?</h1>
        <p>Los desayunos no entran. Esto también se puede cambiar cuando queráis.</p>
        <div className="opciones-grandes una" role="group" aria-label="Qué comidas planificar">
          {OPCIONES_COMIDAS.map((o) => (
            <button key={o.id} type="button" className={`opcion-grande${opcion === o.id ? ' on' : ''}`} aria-pressed={opcion === o.id} onClick={() => elegirComidas(o)}>
              {o.texto}
              <small>{o.ayuda}</small>
            </button>
          ))}
        </div>
        <button type="button" className="boton-texto claro" onClick={() => setPaso('dia')}>
          <Icono n="izquierda" t={18} />
          Atrás
        </button>
      </div>
    );
  }

  if (paso === 'preparando') {
    const opcionElegida = OPCIONES_COMIDAS.find((o) => o.id === opcion);
    return (
      <div className="bienvenida" aria-live="polite">
        <span className="cargando-disco">
          <Dibujo paleta={marcaDe(d.hogar?.tema)} tam={84} grande={false} />
        </span>
        {error ? (
          <>
            <h1>No ha salido bien</h1>
            <p>Comprueba que tienes internet y prueba otra vez.</p>
            <div className="bienvenida-acciones">
              <button type="button" className="boton lima ancho grande" onClick={() => preparar(dia, opcionElegida?.comidas || ['comida', 'cena'])}>
                Probar otra vez
              </button>
              <button type="button" className="boton-texto claro" onClick={() => setPaso('comidas')}>
                <Icono n="izquierda" t={18} />
                Atrás
              </button>
            </div>
          </>
        ) : (
          <>
            <h1>Preparando {demo ? 'el' : 'vuestro'} menú…</h1>
            <p>Un momento: {demo ? 'se eligen' : 'elijo'} los platos de la semana y se hace la lista de la compra.</p>
          </>
        )}
      </div>
    );
  }

  // listo
  return (
    <div className="bienvenida">
      <Dibujo paleta={marcaDe(d.hogar?.tema)} tam={84} grande={false} />
      <h1>¡Listo!</h1>
      {demo ? (
        <>
          <p>
            Así lo verán {enumerar(otros) || 'ellos'}. <b>No se ha cambiado nada</b>: el día de compra y las comidas los elegirán ellos al entrar.
          </p>
          {semanaDePrueba ? <p>Te he preparado una semana de prueba para que veas la app. Se borrará cuando ellos hagan la bienvenida.</p> : null}
        </>
      ) : (
        <p>
          Ya tenéis el menú de esta semana, desde hoy, y la lista de la compra hecha. Las próximas semanas empezarán el <b>{nombreDiaElegido?.toLowerCase()}</b>.
        </p>
      )}
      <p>Ahora te enseño cómo funciona la app. Es un minuto.</p>
      <div className="bienvenida-acciones">
        <button type="button" className="boton lima ancho grande" onClick={() => alTerminar('tour')}>
          Ver cómo funciona
        </button>
        <button type="button" className="boton-texto claro" onClick={() => alTerminar('nada')}>
          Ahora no
        </button>
      </div>
    </div>
  );
}
