import { useState } from 'react';
import axios from 'axios';

const API = 'https://backend-grupo8.onrender.com';

export default function App() {
  const [user, setUser] = useState(null);
  const [email, setEmail] = useState('admin@crocanti.pe');
  const [password, setPassword] = useState('1234');
  const [vista, setVista] = useState('inicio');

  const [cuentas, setCuentas] = useState([]);
  const [pedidos, setPedidos] = useState([]);
  const [demos, setDemos] = useState([]);
  const [ventas, setVentas] = useState([]);
  const [imagen, setImagen] = useState(null);
  const [msg, setMsg] = useState('');

  const [razonSocial, setRazonSocial] = useState('Crocanti Chicken SAC');
  const [ruc, setRuc] = useState('20601234567');
  const [producto, setProducto] = useState('Combo Familiar 8 Piezas');
  const [monto, setMonto] = useState('38.90');
  const [cuentaSel, setCuentaSel] = useState('');

  const login = async (e) => {
    e.preventDefault();
    try {
      const { data } = await axios.post(`${API}/api/login`, { email, password });
      setUser(data);
      setVista('inicio');
      setMsg('');
      cargarDatos(data.id);
    } catch {
      alert('Credenciales inválidas o el servidor en Render está despertando (espera 30 seg y reintenta)');
    }
  };

  const cargarDatos = async (userId) => {
    const [resCtas, resPeds, resDemos, resVentas, resMisCtas] = await Promise.all([
      axios.get(`${API}/api/banco/solicitudes`),
      axios.get(`${API}/api/crocanti/pedidos`),
      axios.get(`${API}/api/erp/solicitudes`),
      axios.get(`${API}/api/erp/ventas`),
      axios.get(`${API}/api/crocanti/cuentas-aprobadas/${userId}`)
    ]);
    setCuentas(resCtas.data);
    setPedidos(resPeds.data);
    setDemos(resDemos.data);
    setVentas(resVentas.data);
    if (resMisCtas.data.length > 0) setCuentaSel(resMisCtas.data[0].id);
  };

  const tieneRol = (modulo, rol) => user?.roles?.some(r => r.modulo === modulo && r.rol === rol);

  const abrirCuenta = async (e) => {
    e.preventDefault();
    const fd = new FormData();
    fd.append('id_usuario', user.id);
    fd.append('razon_social', razonSocial);
    fd.append('ruc', ruc);
    fd.append('tipo_cuenta', 'Empresarial');
    fd.append('moneda', 'Soles');
    if (imagen) fd.append('imagen', imagen);

    const { data } = await axios.post(`${API}/api/banco/apertura`, fd);
    setMsg(`Solicitud registrada en Banco Andino: ${data.codigo}`);
    setImagen(null);
    cargarDatos(user.id);
  };

  const pagarPedido = async (e) => {
    e.preventDefault();
    if (!cuentaSel) return alert('Necesitas una cuenta aprobada en Banco Andino');
    const fd = new FormData();
    fd.append('id_usuario', user.id);
    fd.append('id_cuenta', cuentaSel);
    fd.append('producto', producto);
    fd.append('local_recojo', 'Real Plaza Huancayo');
    fd.append('monto', monto);
    if (imagen) fd.append('imagen', imagen);

    const { data } = await axios.post(`${API}/api/crocanti/pedido`, fd);
    setMsg(`Pedido pagado con Banco Andino: ${data.codigo}`);
    setImagen(null);
    cargarDatos(user.id);
  };

  const solicitarErp = async (e) => {
    e.preventDefault();
    const { data } = await axios.post(`${API}/api/erp/demo`, {
      id_usuario: user.id, empresa: 'Crocanti Chicken SAC', modulo_solicitado: 'Ventas', usuarios_cant: 3
    });
    setMsg(`Demo ERP solicitada: ${data.codigo}`);
    cargarDatos(user.id);
  };

  if (!user) {
    return (
      <div style={{ maxWidth: 420, margin: '60px auto', fontFamily: 'sans-serif', padding: 24, border: '1px solid #ccc', borderRadius: 10 }}>
        <h2>Grupo 8 · Sistema Integrado</h2>
        <p style={{ color: '#555', fontSize: 14 }}>Crocanti · Banco Andino · ERP Andino</p>
        <form onSubmit={login} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <input style={{ padding: 8 }} value={email} onChange={e => setEmail(e.target.value)} placeholder="Correo" required />
          <input style={{ padding: 8 }} type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Contraseña" required />
          <button style={{ padding: 10, background: '#0f3d24', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer' }} type="submit">Ingresar</button>
        </form>
        <div style={{ marginTop: 20, fontSize: 13, background: '#f4f4f4', padding: 10, borderRadius: 6 }}>
          <strong>Cuentas de prueba (clave: 1234):</strong><br/>
          • <code>admin@crocanti.pe</code> (Admin Crocanti / Cliente Banco y ERP)<br/>
          • <code>cliente1@correo.com</code> (Cliente Crocanti y Banco)<br/>
          • <code>empleado@banco.pe</code> (Empleado Banco)<br/>
          • <code>empleado@crocanti.pe</code> (Empleado Crocanti)<br/>
          • <code>admin@erp.pe</code> (Admin ERP)
        </div>
      </div>
    );
  }

  return (
    <div style={{ fontFamily: 'sans-serif', maxWidth: 1000, margin: '0 auto', padding: 20 }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#0f3d24', color: '#fff', padding: '14px 20px', borderRadius: 8 }}>
        <strong>Grupo 8 · Crocanti · Banco Andino · ERP</strong>
        <div>
          <span style={{ fontSize: 14 }}>{user.nombre} ({user.roles.map(r => `${r.modulo}:${r.rol}`).join(' | ')}) </span>
          <button onClick={() => setUser(null)} style={{ marginLeft: 10, padding: '4px 10px', cursor: 'pointer' }}>Salir</button>
        </div>
      </header>

      <nav style={{ display: 'flex', gap: 10, margin: '15px 0', flexWrap: 'wrap' }}>
        <button onClick={() => setVista('inicio')}>Inicio</button>
        {tieneRol('banco', 'cliente') && <button onClick={() => setVista('banco-cliente')}>Banco: Abrir Cuenta</button>}
        {tieneRol('banco', 'empleado') && <button onClick={() => setVista('banco-empleado')}>Banco: Panel Empleado</button>}
        {tieneRol('crocanti', 'cliente') && <button onClick={() => setVista('crocanti-cliente')}>Crocanti: Hacer Pedido</button>}
        {tieneRol('crocanti', 'empleado') && <button onClick={() => setVista('crocanti-empleado')}>Crocanti: Panel Cocina</button>}
        {tieneRol('erp', 'cliente') && <button onClick={() => setVista('erp-cliente')}>ERP: Solicitar Demo / Reporte</button>}
        {tieneRol('erp', 'administrador') && <button onClick={() => setVista('erp-admin')}>ERP: Panel Admin</button>}
      </nav>

      {msg && <div style={{ background: '#dcfce7', color: '#166534', padding: 12, borderRadius: 6, marginBottom: 15 }}>✅ {msg}</div>}

      {vista === 'inicio' && (
        <div style={{ padding: 20, border: '1px solid #ddd', borderRadius: 8 }}>
          <h3>Bienvenido, {user.nombre}</h3>
          <p>Usa el menú superior para navegar entre tus módulos asignados según tu rol en Neon PostgreSQL.</p>
        </div>
      )}

      {vista === 'banco-cliente' && (
        <form onSubmit={abrirCuenta} style={{ display: 'flex', flexDirection: 'column', gap: 10, maxWidth: 420 }}>
          <h3>Banco Andino · Abrir Cuenta Empresarial</h3>
          <input style={{ padding: 8 }} value={razonSocial} onChange={e => setRazonSocial(e.target.value)} placeholder="Razón Social" />
          <input style={{ padding: 8 }} value={ruc} onChange={e => setRuc(e.target.value)} placeholder="RUC" />
          <label>Logo / Documento (Object Storage): <input type="file" onChange={e => setImagen(e.target.files[0])} /></label>
          <button style={{ padding: 10, background: '#16a34a', color: '#fff', border: 'none', borderRadius: 6 }} type="submit">Enviar Solicitud</button>
        </form>
      )}

      {vista === 'banco-empleado' && (
        <div>
          <h3>Banco Andino · Solicitudes (Rol Empleado)</h3>
          <table border="1" cellPadding="8" style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr><th>Código</th><th>Solicitante</th><th>RUC</th><th>Archivo (Cloudinary)</th><th>Estado</th><th>Acción</th></tr></thead>
            <tbody>
              {cuentas.map(c => (
                <tr key={c.id}>
                  <td>{c.codigo}</td><td>{c.razon_social}</td><td>{c.ruc}</td>
                  <td>{c.imagen_url ? <a href={c.imagen_url} target="_blank" rel="noreferrer">Ver imagen</a> : 'Sin archivo'}</td>
                  <td><strong>{c.estado}</strong></td>
                  <td>{c.estado === 'registrado' && <button onClick={async () => { await axios.put(`${API}/api/banco/aprobar/${c.id}`); cargarDatos(user.id); }}>Aprobar</button>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {vista === 'crocanti-cliente' && (
        <form onSubmit={pagarPedido} style={{ display: 'flex', flexDirection: 'column', gap: 10, maxWidth: 420 }}>
          <h3>Crocanti · Pedido para Recojo</h3>
          <input style={{ padding: 8 }} value={producto} onChange={e => setProducto(e.target.value)} />
          <input style={{ padding: 8 }} value={monto} onChange={e => setMonto(e.target.value)} />
          <label>Cuenta Banco Andino Aprobada:
            <select style={{ marginLeft: 8, padding: 6 }} value={cuentaSel} onChange={e => setCuentaSel(e.target.value)}>
              {cuentas.filter(c => c.id_usuario === user.id && c.estado === 'aprobada').map(c => (
                <option key={c.id} value={c.id}>{c.codigo} - {c.razon_social}</option>
              ))}
            </select>
          </label>
          <label>Comprobante / Foto (Object Storage): <input type="file" onChange={e => setImagen(e.target.files[0])} /></label>
          <button style={{ padding: 10, background: '#16a34a', color: '#fff', border: 'none', borderRadius: 6 }} type="submit">Pagar Pedido</button>
        </form>
      )}

      {vista === 'crocanti-empleado' && (
        <div>
          <h3>Crocanti · Pedidos del Día (Rol Empleado)</h3>
          <table border="1" cellPadding="8" style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr><th>Código</th><th>Cliente</th><th>Producto</th><th>Monto</th><th>Imagen (Cloudinary)</th><th>Estado</th><th>Acción</th></tr></thead>
            <tbody>
              {pedidos.map(p => (
                <tr key={p.id}>
                  <td>{p.codigo}</td><td>{p.cliente}</td><td>{p.producto}</td><td>S/ {p.monto}</td>
                  <td>{p.comprobante_url ? <a href={p.comprobante_url} target="_blank" rel="noreferrer">Ver imagen</a> : '—'}</td>
                  <td><strong>{p.estado}</strong></td>
                  <td>{p.estado === 'pagado' && <button onClick={async () => { await axios.put(`${API}/api/crocanti/pedido-listo/${p.id}`); cargarDatos(user.id); }}>Marcar Listo</button>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {vista === 'erp-cliente' && (
        <div>
          <h3>ERP Andino · Módulo Empresa</h3>
          <button style={{ padding: 10, background: '#0f3d24', color: '#fff', border: 'none', borderRadius: 6 }} onClick={solicitarErp}>Solicitar Demo ERP para Crocanti</button>
          <h4 style={{ marginTop: 20 }}>Reporte de Ventas Pagadas (Consolidado desde Neon)</h4>
          <ul>{ventas.map((v, i) => <li key={i}>Fecha {v.dia}: <strong>S/ {v.total}</strong></li>)}</ul>
        </div>
      )}

      {vista === 'erp-admin' && (
        <div>
          <h3>ERP Andino · Panel Administrador</h3>
          <table border="1" cellPadding="8" style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr><th>Código</th><th>Empresa</th><th>Módulo</th><th>Estado</th><th>Acción</th></tr></thead>
            <tbody>
              {demos.map(d => (
                <tr key={d.id}>
                  <td>{d.codigo}</td><td>{d.empresa}</td><td>{d.modulo_solicitado}</td><td><strong>{d.estado}</strong></td>
                  <td>{d.estado === 'registrado' && <button onClick={async () => { await axios.put(`${API}/api/erp/aprobar/${d.id}`); cargarDatos(user.id); }}>Aprobar Demo</button>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}