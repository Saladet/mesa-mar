import { useEffect, useState } from 'react';
import { useDatos, CLAVE_INVITACION } from './datos.jsx';
import { useRuta, ir } from './ruta.js';
import { hoyISO } from './logic/fechas.js';
import { menuDeCompra } from './logic/semanas.js';
import { aplicarTema, marcaDe, temaGuardado } from './tema.js';
import { Dibujo } from './ui/Portada.jsx';
import Tabs from './ui/Tabs.jsx';
import Instalar from './ui/Instalar.jsx';
import Entrar from './pantallas/Entrar.jsx';
import SinHogar from './pantallas/SinHogar.jsx';
import Semana from './pantallas/Semana.jsx';
import PantallaPlato from './pantallas/Plato.jsx';
import Cambiar from './pantallas/Cambiar.jsx';
import Poner from './pantallas/Poner.jsx';
import { PRUEBA } from './config.js';
import Cocinar from './pantallas/Cocinar.jsx';
import Lista from './pantallas/Lista.jsx';
import Recetas from './pantallas/Recetas.jsx';
import Hogar from './pantallas/Hogar.jsx';
import Bienvenida from './pantallas/Bienvenida.jsx';
import Tour from './ui/Tour.jsx';

function Cargando() {
  return (
    <div className="cargando" role="status" aria-label="Cargando">
      <Dibujo paleta={marcaDe(temaGuardado())} tam={64} grande={false} />
    </div>
  );
}

function Aviso() {
  const { aviso } = useDatos();
  if (!aviso) return null;
  return (
    <div key={aviso.id} className={`toast${aviso.tipo === 'error' ? ' error' : ''}`} role={aviso.tipo === 'error' ? 'alert' : 'status'}>
      {aviso.texto}
    </div>
  );
}

const CON_TABS = new Set(['semana', 'lista', 'recetas', 'hogar', 'cambiar']);

// Casas con bienvenida guiada: qué le toca ver a esta persona al entrar (o nada)
function guiaPendiente(hogar, yo) {
  if (!hogar?.bienvenida || !yo) return null;
  if (yo.oculta) {
    // El tester la ve una vez (sin guardar nada); luego puede repetirla desde Hogar
    if (yo.tour_visto) return null;
    return hogar.configurado ? { tipo: 'tour', intro: 'otro' } : { tipo: 'bienvenida', demo: true };
  }
  if (!hogar.configurado) return { tipo: 'bienvenida', demo: false };
  if (!yo.tour_visto) return { tipo: 'tour', intro: 'otro' };
  return null;
}

export default function App() {
  const ruta = useRuta();
  const d = useDatos();
  const tema = d.hogar?.tema;
  // La guía que se está viendo. La pendiente se fija al empezar, para que no cambie a medias
  const [guia, setGuia] = useState(null);
  const [descartada, setDescartada] = useState(false);
  // Solo con lo recién llegado del servidor: lo guardado en el móvil puede ser de antes de configurar
  const pendiente = d.fresco ? guiaPendiente(d.hogar, d.yo) : null;
  const activa = guia || (descartada ? null : pendiente);

  useEffect(() => {
    if (!guia && !descartada && pendiente) setGuia(pendiente);
  }, [guia, descartada, pendiente?.tipo]); // eslint-disable-line react-hooks/exhaustive-deps

  // Desde Hogar: «Ver la explicación otra vez» / «Probar la bienvenida»
  useEffect(() => {
    const pedir = (e) => setGuia(e.detail);
    window.addEventListener('mesa-guia', pedir);
    return () => window.removeEventListener('mesa-guia', pedir);
  }, []);

  function cerrarGuia() {
    setGuia(null);
    setDescartada(true);
  }

  // Los colores de la casa
  useEffect(() => {
    if (tema) aplicarTema(tema);
  }, [tema]);

  // Un enlace de invitación se guarda hasta que haya sesión
  useEffect(() => {
    if (ruta.nombre === 'unirse' && ruta.id) {
      try {
        localStorage.setItem(CLAVE_INVITACION, ruta.id);
      } catch {
        /* sin almacenamiento */
      }
      if (d.uid) {
        d.recargar().then(() => ir('semana', { reemplazar: true }));
      }
    }
  }, [ruta.nombre, ruta.id, d.uid]); // eslint-disable-line react-hooks/exhaustive-deps

  if (d.estado === 'iniciando' || d.sesion === undefined) return <Cargando />;
  if (!d.sesion) {
    let invitado = ruta.nombre === 'unirse';
    try {
      invitado = invitado || !!localStorage.getItem(CLAVE_INVITACION);
    } catch {
      /* nada */
    }
    return (
      <>
        <Entrar invitado={invitado} />
        <Aviso />
      </>
    );
  }
  if (!d.hogar || !d.yo) {
    if (d.estado === 'cargando' || ruta.nombre === 'unirse') return <Cargando />;
    return (
      <>
        <SinHogar />
        <Aviso />
      </>
    );
  }

  if (activa?.tipo === 'bienvenida') {
    return (
      <>
        <Bienvenida
          demo={activa.demo}
          alTerminar={(siguiente) => {
            if (siguiente === 'tour') setGuia({ tipo: 'tour', intro: 'nueva' });
            else cerrarGuia();
            ir('semana', { reemplazar: true });
          }}
        />
        <Aviso />
      </>
    );
  }

  let pantalla;
  switch (ruta.nombre) {
    case 'plato':
      pantalla = <PantallaPlato comidaId={ruta.id} />;
      break;
    case 'receta':
      pantalla = <PantallaPlato recetaId={ruta.id} />;
      break;
    case 'cocinar':
      pantalla = <Cocinar recetaId={ruta.id} comidaId={ruta.extra} />;
      break;
    case 'cambiar': {
      const comida = d.comidas.find((c) => c.id === ruta.id);
      pantalla = (
        <>
          <Semana diaForzado={comida?.fecha} menuForzado={comida?.menu_id} />
          <Cambiar comidaId={ruta.id} />
        </>
      );
      break;
    }
    case 'poner':
      pantalla = (
        <>
          <PantallaPlato recetaId={ruta.id} />
          <Poner recetaId={ruta.id} />
        </>
      );
      break;
    case 'lista':
      pantalla = <Lista />;
      break;
    case 'recetas':
      pantalla = <Recetas />;
      break;
    case 'hogar':
      pantalla = <Hogar />;
      break;
    default:
      pantalla = <Semana />;
  }

  const actual = ruta.nombre === 'cambiar' ? 'semana' : CON_TABS.has(ruta.nombre) ? ruta.nombre : 'semana';
  const conTabs = CON_TABS.has(ruta.nombre) || !['plato', 'receta', 'cocinar', 'poner'].includes(ruta.nombre);
  const compra = menuDeCompra(d.menus, d.comidas, hoyISO());
  const pendientes = compra ? d.lista.filter((x) => x.menu_id === compra.id && !x.en_casa && !x.marcado).length : 0;

  return (
    <>
      {PRUEBA ? <div className="cinta-prueba">Prueba · no se guarda nada</div> : null}
      {!d.enLinea ? <div className="sin-red">Sin conexión: ves lo último guardado. Lo que marques se guardará al volver la red.</div> : null}
      {pantalla}
      {conTabs ? <Tabs actual={actual} pendientes={pendientes} /> : null}
      {activa?.tipo === 'tour' ? (
        <Tour
          key={`tour-${activa.intro}`}
          intro={activa.intro}
          alTerminar={() => {
            d.acciones.tourVisto();
            cerrarGuia();
            ir('semana');
          }}
        />
      ) : null}
      {PRUEBA || activa ? null : <Instalar />}
      <Aviso />
    </>
  );
}
