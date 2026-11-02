// Poner una receta del recetario en un hueco del menú (de hoy en adelante). Si había otro plato, lo sustituye.
import { useEffect, useMemo, useState } from 'react';
import { useDatos } from '../datos.jsx';
import Icono from '../ui/Icono.jsx';
import { DIAS, parseFecha, capital, hoyISO, nombreDia, fechaCorta } from '../logic/fechas.js';
import { menusVivos, diasDelMenu, TIPOS_ORDEN, NOMBRE_TIPO } from '../logic/semanas.js';
import { avisosHueco } from '../logic/elegir.js';
import { volver, ir } from '../ruta.js';
import { verDia } from './Semana.jsx';

// "Mié 4"
function diaCorto(f) {
  const d = parseFecha(f);
  return `${capital(DIAS[d.getDay()].slice(0, 3))} ${d.getDate()}`;
}

function nombreSemana(menu, dias, hoy, i) {
  if (dias[0] <= hoy) return 'Esta semana';
  return i === 1 ? 'Próxima' : `Del ${fechaCorta(dias[0])}`;
}

export default function Poner({ recetaId }) {
  const d = useDatos();
  const receta = d.recetasMap.get(recetaId);
  const hoy = hoyISO();
  const vivos = menusVivos(d.menus, d.comidas, hoy);
  const [menuId, setMenuId] = useState(() => vivos[0]?.id ?? null);
  const [elegida, setElegida] = useState(null);
  const [guardando, setGuardando] = useState(false);
  const menu = vivos.find((m) => m.id === menuId) || vivos[0] || null;

  const cerrar = () => volver(`receta/${recetaId}`);

  useEffect(() => {
    const tecla = (e) => e.key === 'Escape' && cerrar();
    window.addEventListener('keydown', tecla);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', tecla);
      document.body.style.overflow = '';
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const comidasMenu = menu ? d.comidas.filter((c) => c.menu_id === menu.id) : [];
  const dias = menu ? diasDelMenu(menu, d.comidas).filter((f) => f >= hoy) : [];
  const tipos = [...new Set(comidasMenu.map((c) => c.tipo))].sort((a, b) => TIPOS_ORDEN[a] - TIPOS_ORDEN[b]);
  const hueco = comidasMenu.find((c) => c.id === elegida) || null;
  const actual = hueco?.receta_id ? d.recetasMap.get(hueco.receta_id) : null;

  const avisos = useMemo(() => {
    if (!hueco || !receta) return [];
    return avisosHueco({
      receta,
      fecha: hueco.fecha,
      tipo: hueco.tipo,
      comidasMenu,
      recetasMap: d.recetasMap,
      recetas: d.recetas,
      restricciones: d.restricciones,
      ingMap: d.ingMap,
      reglas: d.hogar?.reglas,
      personasMap: d.personasMap,
    });
  }, [hueco, receta, comidasMenu, d.recetasMap, d.recetas, d.restricciones, d.ingMap, d.hogar, d.personasMap]);

  async function poner() {
    if (!hueco || !receta) return;
    setGuardando(true);
    const ok = await d.acciones.cambiarComida(hueco, receta.id);
    setGuardando(false);
    if (!ok) return;
    d.avisar(`Puesta el ${nombreDia(hueco.fecha)} en la ${NOMBRE_TIPO[hueco.tipo].toLowerCase()}. La lista ya está al día.`);
    verDia(hueco.menu_id, hueco.fecha);
    ir('semana');
  }

  if (!receta) return null;

  return (
    <>
      <div className="velo" onClick={cerrar} />
      <section className="hoja" role="dialog" aria-modal="true" aria-labelledby="titulo-poner">
        <span className="tirador" aria-hidden="true" />
        <div className="hoja-cab">
          <div className="cab-textos">
            <span className="momento" style={{ fontSize: 13 }}>
              {receta.titulo}
            </span>
            <h1 id="titulo-poner" className="hoja-titulo">
              ¿Cuándo la ponéis?
            </h1>
          </div>
          <button className="boton-cerrar" type="button" onClick={cerrar} aria-label="Cerrar">
            <Icono n="cerrar" t={18} />
          </button>
        </div>

        {!menu || !dias.length ? (
          <>
            <div className="vacio-suave">Todavía no hay ninguna semana preparada de hoy en adelante. Preparadla y luego ponéis esta receta donde queráis.</div>
            <button className="boton" type="button" onClick={() => ir('semana')}>
              Ir a la semana
            </button>
          </>
        ) : (
          <>
            {vivos.length > 1 ? (
              <div className="segmentado claro" role="group" aria-label="Semana">
                {vivos.map((m, i) => (
                  <button
                    key={m.id}
                    type="button"
                    className={m.id === menu.id ? 'on' : ''}
                    aria-pressed={m.id === menu.id}
                    onClick={() => {
                      setMenuId(m.id);
                      setElegida(null);
                    }}
                  >
                    {nombreSemana(m, diasDelMenu(m, d.comidas), hoy, i)}
                  </button>
                ))}
              </div>
            ) : null}

            <div className="poner-tabla" style={{ gridTemplateColumns: `52px repeat(${tipos.length}, minmax(0, 1fr))` }}>
              <span aria-hidden="true" />
              {tipos.map((t) => (
                <span key={t} className="poner-cab">
                  {NOMBRE_TIPO[t]}
                </span>
              ))}
              {dias.map((f) => (
                <div key={f} className="poner-fila" style={{ display: 'contents' }}>
                  <span className="poner-dia">{diaCorto(f)}</span>
                  {tipos.map((t) => {
                    const c = comidasMenu.find((x) => x.fecha === f && x.tipo === t);
                    if (!c) return <span key={t} aria-hidden="true" />;
                    const r = c.receta_id ? d.recetasMap.get(c.receta_id) : null;
                    const yaEsta = c.receta_id === receta.id;
                    const on = elegida === c.id;
                    return (
                      <button
                        key={t}
                        type="button"
                        className={`poner-celda${r ? '' : ' libre'}${on ? ' on' : ''}`}
                        aria-pressed={on}
                        disabled={yaEsta || guardando}
                        aria-label={`${NOMBRE_TIPO[t]} del ${diaCorto(f)}: ${yaEsta ? 'ya es esta receta' : r ? r.titulo : 'libre'}`}
                        onClick={() => setElegida(on ? null : c.id)}
                      >
                        {on ? <Icono n="check" t={14} /> : null}
                        <span>{yaEsta ? 'Ya está' : r ? r.titulo : 'Libre'}</span>
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>

            {hueco ? (
              <div className="poner-resumen" aria-live="polite">
                <span>
                  {actual ? (
                    <>
                      Sustituye a <b>{actual.titulo}</b>
                    </>
                  ) : (
                    'Hueco libre'
                  )}{' '}
                  · {nombreDia(hueco.fecha)}, {NOMBRE_TIPO[hueco.tipo].toLowerCase()}
                </span>
                {avisos.map((a) => (
                  <span key={a} className="aviso-opcion">
                    <Icono n="aviso" t={13} /> {a}
                  </span>
                ))}
              </div>
            ) : (
              <span className="nota-gris">Toca el hueco donde la queréis. Si ya hay un plato, se sustituye.</span>
            )}

            <button className="boton" type="button" disabled={!hueco || guardando} onClick={poner}>
              {guardando ? 'Poniendo…' : 'Poner'}
            </button>
          </>
        )}
      </section>
    </>
  );
}
