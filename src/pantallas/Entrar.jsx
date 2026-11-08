import { useEffect, useState } from 'react';
import { useDatos, CLAVE_INVITACION } from '../datos.jsx';
import { leerRuta } from '../ruta.js';
import { enumerar } from '../ui/textos.jsx';
import { mensajeError } from '../supabase.js';
import { Dibujo } from '../ui/Portada.jsx';
import { marcaDe, temaGuardado } from '../tema.js';
import { enPantallaDeInicio } from '../ui/Instalar.jsx';

export function Marca({ texto, titulo = 'Mesa' }) {
  return (
    <div className="marca">
      <Dibujo paleta={marcaDe(temaGuardado())} tam={72} grande={false} />
      <h1>{titulo}</h1>
      {texto ? <p>{texto}</p> : null}
    </div>
  );
}

export default function Entrar({ invitado }) {
  const { acciones } = useDatos();
  const [modo, setModo] = useState(invitado ? 'crear' : 'entrar');
  const [email, setEmail] = useState('');
  const [clave, setClave] = useState('');
  const [ver, setVer] = useState(false);
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [invitacion, setInvitacion] = useState(null); // en casas con bienvenida: a quién se invita
  const crear = modo === 'crear';

  useEffect(() => {
    if (!invitado) return undefined;
    const r = leerRuta();
    let token = r.nombre === 'unirse' ? r.id : null;
    try {
      token = token || localStorage.getItem(CLAVE_INVITACION);
    } catch {
      /* sin almacenamiento */
    }
    if (!token) return undefined;
    let vivo = true;
    acciones
      .leerInvitacion(token)
      .then((x) => {
        if (!vivo || !x?.bienvenida) return;
        setInvitacion(x);
        // El tester suele tener ya su cuenta: se le ofrece entrar con ella
        if (x.oculta) setModo((m) => (m === 'crear' ? 'entrar' : m));
      })
      .catch(() => {});
    return () => {
      vivo = false;
    };
  }, [invitado]); // eslint-disable-line react-hooks/exhaustive-deps

  let titulo = 'Mesa';
  let texto = invitado
    ? 'Te han invitado a compartir el menú de la semana y la lista de la compra. Crea tu cuenta para entrar.'
    : enPantallaDeInicio()
      ? 'Entra con el email y la contraseña que elegiste al crear tu cuenta.'
      : 'El menú de la semana y la lista de la compra, para toda la casa.';
  if (invitacion) {
    titulo = `¡Hola, ${invitacion.nombre}!`;
    const otros = invitacion.otros || [];
    texto = invitacion.oculta
      ? `Entras como tester en la casa de ${enumerar(otros) || 'esta casa'}: lo ves todo como ellos, pero no cuentas para las raciones.`
      : otros.length
        ? `Aquí vais a tener ${enumerar(otros)} y tú el menú de la semana y la lista de la compra. Para entrar, crea tu cuenta.`
        : 'Aquí vas a tener el menú de la semana y la lista de la compra. Para entrar, crea tu cuenta.';
  }

  async function enviar(e) {
    e.preventDefault();
    setError('');
    setMensaje('');
    if (!email.trim() || !clave) {
      setError('Escribe tu email y una contraseña.');
      return;
    }
    if (crear && clave.length < 6) {
      setError('La contraseña necesita al menos 6 caracteres.');
      return;
    }
    setEnviando(true);
    try {
      if (crear) {
        const r = await acciones.crearCuenta(email, clave);
        if (r.necesitaConfirmar) setMensaje('Cuenta creada. Te ha llegado un correo para confirmarla: ábrelo y volverás aquí ya dentro.');
      } else {
        await acciones.entrar(email, clave);
      }
    } catch (err) {
      const m = mensajeError(err);
      setError(!crear && /incorrectos/.test(m) ? `${m} Si todavía no tienes cuenta, toca «¿Primera vez? Crear cuenta».` : m);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="pantalla-verde">
      <Marca titulo={titulo} texto={texto} />
      <form className="formulario" onSubmit={enviar} noValidate>
        <label htmlFor="email">Email</label>
        <input
          id="email"
          className="campo oscuro"
          type="email"
          inputMode="email"
          autoComplete="email"
          autoCapitalize="none"
          spellCheck={false}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <label htmlFor="clave">{crear ? 'Elige una contraseña' : 'Contraseña'}</label>
        <div className="campo-clave">
          <input
            id="clave"
            className="campo oscuro"
            type={ver ? 'text' : 'password'}
            autoComplete={crear ? 'new-password' : 'current-password'}
            value={clave}
            onChange={(e) => setClave(e.target.value)}
          />
          <button type="button" onClick={() => setVer(!ver)} aria-label={ver ? 'Ocultar contraseña' : 'Mostrar contraseña'}>
            {ver ? 'Ocultar' : 'Ver'}
          </button>
        </div>
        {invitacion && crear ? (
          <span className="nota-clave">Elige una fácil de recordar y apúntala: te la pedirá otra vez al abrir Mesa desde el icono del móvil.</span>
        ) : null}
        {error ? <div className="error-form" role="alert">{error}</div> : null}
        {mensaje ? <div className="mensaje-form" role="status">{mensaje}</div> : null}
        <button className="boton lima ancho" type="submit" disabled={enviando}>
          {enviando ? 'Un momento…' : crear ? (invitacion ? 'Crear mi cuenta y entrar' : 'Crear cuenta') : 'Entrar'}
        </button>
        <button
          type="button"
          className="boton-texto claro"
          onClick={() => {
            setModo(crear ? 'entrar' : 'crear');
            setError('');
            setMensaje('');
          }}
        >
          {crear ? 'Ya tengo cuenta: entrar' : '¿Primera vez? Crear cuenta'}
        </button>
      </form>
    </div>
  );
}
