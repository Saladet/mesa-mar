// Elegir a mano una receta para un hueco: buscarla en el recetario y avisar de lo que rompe.
// A mano no se bloquea nada: se avisa y decidís vosotros.
import { normalizar, conflictosReceta, esBloqueante, contarSemana, reglasCompletas, nombreRestriccion } from './reglas.js';
import { nombreDia } from './fechas.js';

const minuscula = (t) => (t ? t.charAt(0).toLowerCase() + t.slice(1) : t);

// Recetas del recetario que casan con lo escrito (todas las palabras, en el nombre o en los ingredientes).
// Primero las que lo tienen en el nombre.
export function buscarRecetas({ recetas, texto, excluir = null }) {
  const q = normalizar(texto);
  if (!q) return [];
  const palabras = q.split(' ').filter(Boolean);
  const out = [];
  for (const r of recetas) {
    if (r.id === excluir) continue;
    const m = r.momentos || [];
    // Postres, salsas y bebidas no van en un hueco de comida o cena
    if (!m.some((x) => x === 'desayuno' || x === 'comida' || x === 'cena')) continue;
    const titulo = normalizar(r.titulo);
    const ingredientes = (r.receta_ingredientes || []).map((ri) => normalizar(ri.texto_original)).join(' ');
    const enTitulo = palabras.filter((p) => titulo.includes(p)).length;
    if (!palabras.every((p) => titulo.includes(p) || ingredientes.includes(p))) continue;
    const orden = titulo.startsWith(q) ? 0 : enTitulo === palabras.length ? 1 : enTitulo ? 2 : 3;
    out.push({ receta: r, orden });
  }
  return out.sort((a, b) => a.orden - b.orden || a.receta.titulo.localeCompare(b.receta.titulo, 'es')).map((x) => x.receta);
}

// Avisos de poner `receta` en el hueco (fecha, tipo) de una semana: lo que rompe o conviene saber
export function avisosHueco({ receta, fecha, tipo, comidasMenu, recetasMap, recetas, restricciones, ingMap, reglas, personasMap }) {
  const avisos = [];
  const otraVez = comidasMenu.find((c) => c.receta_id === receta.id && !(c.fecha === fecha && c.tipo === tipo));
  if (otraVez) avisos.push(`Ya está el ${nombreDia(otraVez.fecha)}`);
  const m = receta.momentos || [];
  if (tipo !== 'desayuno' && !m.includes('comida') && !m.includes('cena')) avisos.push('Es de desayuno');

  if (tipo !== 'desayuno') {
    const r = reglasCompletas(reglas);
    const principales = (c) => c.tipo !== 'desayuno' && c.receta_id;
    const otras = comidasMenu.filter((c) => principales(c) && !(c.fecha === fecha && c.tipo === tipo)).map((c) => recetasMap.get(c.receta_id)).filter(Boolean);
    const ahora = contarSemana(comidasMenu.filter(principales).map((c) => recetasMap.get(c.receta_id)).filter(Boolean));
    const con = contarSemana([...otras, receta]);
    // Los máximos solo se avisan si este plato suma; los mínimos, si este cambio os deja cortos
    if (receta.proteina === 'carne' && con.carne > r.carne_max) avisos.push(`Con este, carne ${con.carne} de ${r.carne_max}`);
    if (receta.proteina === 'huevo' && con.huevo > r.huevos_max) avisos.push(`Con este, huevo ${con.huevo} de ${r.huevos_max}`);
    if (receta.capricho && con.capricho > r.caprichos_max) avisos.push(`Con este, caprichos ${con.capricho} de ${r.caprichos_max}`);
    if (con.legumbre < r.legumbre_min && con.legumbre < ahora.legumbre) avisos.push(`Os quedaríais cortos de legumbre: ${con.legumbre} de ${r.legumbre_min}`);
    const comePescado = recetas.some((x) => x.proteina === 'pescado' && !conflictosReceta(x, restricciones, ingMap).some(esBloqueante));
    const pescadoMin = comePescado ? r.pescado_min || 0 : 0;
    if (con.pescado < pescadoMin && con.pescado < ahora.pescado) avisos.push(`Os quedaríais cortos de pescado: ${con.pescado} de ${pescadoMin}`);
  }

  for (const x of conflictosReceta(receta, restricciones, ingMap).filter(esBloqueante)) {
    const quien = personasMap.get(x.persona_id)?.nombre || 'Alguien';
    avisos.push(`Lleva ${minuscula(nombreRestriccion(x, ingMap))}: ${quien} no ${x.nivel === 'alergia' ? 'puede' : 'come'}`);
  }
  return avisos;
}

// "Solo hay que comprar 2 cosas": lo que no está ya en la lista por otros platos de la semana
export function textoCompra(receta, enLista, ingMap) {
  const propios = (receta.receta_ingredientes || []).filter((ri) => {
    const ing = ri.ingrediente_id ? ingMap.get(ri.ingrediente_id) : null;
    return !(ing && (ing.grupos || []).includes('basico'));
  });
  const nuevos = propios.filter((ri) => !(ri.ingrediente_id && enLista.has(ri.ingrediente_id))).length;
  if (nuevos === 0) return 'No hay que comprar nada más';
  if (nuevos === 1) return 'Solo hay que comprar 1 cosa';
  if (nuevos <= 3) return `Solo hay que comprar ${nuevos} cosas`;
  return null;
}

// Ingredientes que ya se compran para el resto de la semana (sin contar el hueco que se cambia)
export function ingredientesEnLista(comidasMenu, recetasMap, salvoId) {
  const enLista = new Set();
  for (const c of comidasMenu) {
    if (c.id === salvoId) continue;
    const r = recetasMap.get(c.receta_id);
    for (const ri of r?.receta_ingredientes || []) if (ri.ingrediente_id) enLista.add(ri.ingrediente_id);
  }
  return enLista;
}
