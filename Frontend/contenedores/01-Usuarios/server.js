// ============================================================
// CONTENEDOR 1 - AUTENTICACIÓN DE USUARIOS Y FRONTEND
// ============================================================
// Este contenedor maneja:
// 1. Login y registro de usuarios
// 2. Validación de sesiones
// 3. Interfaz gráfica (Frontend) - Página web completa
// 4. Proxy hacia los otros contenedores

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(bodyParser.json());
app.use('/videos', express.static(path.join(__dirname, 'videos')));

// URLs de otros contenedores
const CATEGORIAS_URL = process.env.CATEGORIAS_URL || 'http://categorias:3002';
const PRODUCTOS_URL = process.env.PRODUCTOS_URL || 'http://productos:3003';
const PAGOS_URL = process.env.PAGOS_URL || 'http://pagos-original:3004';
const CARRITO_URL = process.env.CARRITO_URL || 'http://carrito:3006';
const USUARIOS_URL = process.env.USUARIOS_URL || 'http://usuarios:3005';
const METODOS_URL = process.env.METODOS_URL || 'http://metodos-pago:3008';

// Base de datos simulada de usuarios
const usuarios = [
  { id: 1, username: 'admin', password: 'admin123', rol: 'administrador' },
  { id: 2, username: 'cliente1', password: 'cliente123', rol: 'cliente' },
  { id: 3, username: 'cliente2', password: 'pass123', rol: 'cliente' }
];

// Almacenamiento de tokens de sesión
const sesiones = new Map();

// Middleware para validar token
function validarToken(req, res, next) {
  const token = req.headers['authorization'];
  
  if (!token) {
    return res.status(401).json({ 
      success: false, 
      message: 'Token no proporcionado' 
    });
  }
  
  if (!sesiones.has(token)) {
    return res.status(401).json({ 
      success: false, 
      message: 'Token inválido o expirado' 
    });
  }
  
  req.usuario = sesiones.get(token);
  next();
}

// ==================== API DE AUTENTICACIÓN ====================

// POST /api/login - Iniciar sesión
app.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const response = await fetch(USUARIOS_URL + '/api/usuarios/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ usuario: username, contrasena: password })
    });
    const data = await response.json();
    if (data.exito) {
      const token = 'token_' + Date.now() + '_' + data.datos.id;
      res.json({ success: true, message: data.mensaje, data: { token, usuario: { id: data.datos.id, username: data.datos.usuario, rol: 'cliente' } } });
    } else {
      res.status(401).json({ success: false, message: data.mensaje });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error de conexión con usuarios' });
  }
});

// POST /api/logout - Cerrar sesión
app.post('/api/logout', validarToken, (req, res) => {
  const token = req.headers['authorization'];
  sesiones.delete(token);
  
  res.json({
    success: true,
    message: 'Sesión cerrada correctamente'
  });
});

// GET /api/validar - Validar token
app.get('/api/validar', validarToken, (req, res) => {
  res.json({
    success: true,
    message: 'Token válido',
    data: req.usuario
  });
});

// POST /api/register - Registrar usuario
app.post('/api/register', async (req, res) => {
  try {
    const { username, password } = req.body;
    const response = await fetch(USUARIOS_URL + '/api/usuarios/registro', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ usuario: username, contrasena: password })
    });
    const data = await response.json();
    if (data.exito) {
      res.status(201).json({ success: true, message: data.mensaje, data: { id: data.datos.id, username: data.datos.usuario, rol: 'cliente' } });
    } else {
      res.status(409).json({ success: false, message: data.mensaje });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error de conexión con usuarios' });
  }
});

// ==================== PROXY A OTROS CONTENEDORES ====================

// GET /api/categorias - Obtener categorías
app.get('/api/categorias', async (req, res) => {
  try {
    const response = await fetch(CATEGORIAS_URL + '/api/categorias');
    const data = await response.json();
    res.json(data);
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error de conexión con categorías' });
  }
});

// GET /api/productos/:categoria - Obtener productos
app.get('/api/productos/:categoria', async (req, res) => {
  try {
    const response = await fetch(PRODUCTOS_URL + '/api/productos/' + req.params.categoria);
    const data = await response.json();
    res.json(data);
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error de conexión con productos' });
  }
});

// POST /api/carrito/agregar - Agregar al carrito
app.post('/api/carrito/agregar', async (req, res) => {
  try {
    const response = await fetch(CARRITO_URL + '/api/carrito/agregar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body)
    });
    const data = await response.json();
    if (typeof data.exito !== 'undefined') {
      data.success = data.exito;
      data.message = data.mensaje || data.message;
    }
    res.json(data);
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error de conexión con carrito' });
  }
});

// GET /api/carrito/:sessionId - Ver carrito
app.get('/api/carrito/:sessionId', async (req, res) => {
  try {
    const response = await fetch(CARRITO_URL + '/api/carrito/' + req.params.sessionId);
    const data = await response.json();
    // Normalizar respuesta: el frontend espera data.items, el backend devuelve data.productos
    if (data.datos) {
      data.data = {
        items: data.datos.productos || [],
        cantidadTotal: data.datos.cantidad_total || 0,
        total: data.datos.total || 0
      };
    }
    res.json(data);
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error de conexión con carrito' });
  }
});

// DELETE /api/carrito/:sessionId - Vaciar carrito
app.delete('/api/carrito/:sessionId', async (req, res) => {
  try {
    const response = await fetch(CARRITO_URL + '/api/carrito/' + req.params.sessionId, {
      method: 'DELETE'
    });
    const data = await response.json();
    res.json(data);
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error de conexión con carrito' });
  }
});

// POST /api/pagos/procesar - Procesar pago
app.post('/api/pagos/procesar', async (req, res) => {
  try {
    const response = await fetch(METODOS_URL + '/api/pagos/procesar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body)
    });
    const data = await response.json();
    // Normalizar respuesta
    if (data.datos) {
      data.data = data.datos;
      data.success = data.exito;
    }
    res.json(data);
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error de conexión con pagos' });
  }
});

// GET /api/pagos/metodos - Obtener métodos de pago
app.get('/api/pagos/metodos', async (req, res) => {
  try {
    const response = await fetch(METODOS_URL + '/api/pagos/metodos');
    const data = await response.json();
    if (data.datos) {
      data.data = data.datos;
      data.success = data.exito;
    }
    res.json(data);
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error de conexión con pagos' });
  }
});

// ==================== FRONTEND HTML ====================

// GET / - Página principal con la interfaz gráfica
app.get('/', (req, res) => {
  const html = '<!DOCTYPE html>' +
'<html lang="es">' +
'<head>' +
'  <meta charset="UTF-8">' +
'  <meta name="viewport" content="width=device-width, initial-scale=1.0">' +
'  <title>Restaurante - Sistema de Pedidos</title>' +
'  <style>' +
'    * { margin: 0; padding: 0; box-sizing: border-box; }' +
'    body { font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif; min-height: 100vh; padding: 20px; position: relative; overflow-x: hidden; }' +
'    .video-background { position: fixed; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover; z-index: -1; }' +
'    .video-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); z-index: 0; }' +
'    .container { max-width: 1200px; margin: 0 auto; position: relative; z-index: 1; }' +
'    h1 { color: white; text-align: center; margin-bottom: 30px; font-size: 2.5em; text-shadow: 2px 2px 4px rgba(0,0,0,0.3); }' +
'    .auth-box { background: linear-gradient(180deg, #ffffff 0%, #e8f5e9 100%); border-radius: 15px; padding: 40px; max-width: 400px; margin: 50px auto; box-shadow: 0 10px 40px rgba(0,0,0,0.2); }' +
'    .auth-box h2 { color: #333; margin-bottom: 20px; text-align: center; }' +
'    .form-group { margin-bottom: 15px; }' +
'    .form-group label { display: block; margin-bottom: 5px; color: #555; font-weight: 500; }' +
'    .form-group input { width: 100%; padding: 12px; border: 2px solid #ddd; border-radius: 8px; font-size: 14px; transition: border-color 0.3s; }' +
'    .form-group input:focus { outline: none; border-color: #28a745; }' +
'    .btn { width: 100%; padding: 14px; background: linear-gradient(135deg, #28a745 0%, #20c997 100%); color: white; border: none; border-radius: 8px; font-size: 16px; font-weight: 600; cursor: pointer; transition: transform 0.2s, box-shadow 0.2s; }' +
'    .btn:hover { transform: translateY(-2px); box-shadow: 0 5px 20px rgba(40, 167, 69, 0.4); }' +
'    .toggle-link { text-align: center; margin-top: 15px; color: #28a745; cursor: pointer; }' +
'    .toggle-link:hover { text-decoration: underline; }' +
'    .app-container { display: none; }' +
'    .app-header { background: linear-gradient(180deg, #ffffff 0%, #e8f5e9 100%); border-radius: 15px; padding: 20px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: center; box-shadow: 0 5px 20px rgba(0,0,0,0.1); }' +
'    .app-header h2 { color: #333; }' +
'    .user-info { display: flex; align-items: center; gap: 15px; }' +
'    .logout-btn { padding: 8px 20px; background: #dc3545; color: white; border: none; border-radius: 6px; cursor: pointer; }' +
'    .cart-btn { padding: 8px 20px; background: #28a745; color: white; border: none; border-radius: 6px; cursor: pointer; }' +
'    .categorias-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; margin-bottom: 30px; }' +
'    .categoria-card { background: linear-gradient(180deg, #ffffff 0%, #e8f5e9 100%); border-radius: 15px; padding: 30px; text-align: center; cursor: pointer; transition: transform 0.3s, box-shadow 0.3s; box-shadow: 0 5px 20px rgba(0,0,0,0.1); }' +
'    .categoria-card:hover { transform: translateY(-5px); box-shadow: 0 10px 30px rgba(0,0,0,0.2); }' +
'    .categoria-icon { font-size: 60px; margin-bottom: 15px; }' +
'    .categoria-nombre { font-size: 1.5em; color: #333; font-weight: 600; margin-bottom: 10px; }' +
'    .categoria-desc { color: #777; }' +
'    .section-title { color: white; margin-bottom: 20px; font-size: 1.8em; }' +
'    .back-btn { padding: 10px 25px; background: linear-gradient(180deg, #ffffff 0%, #e8f5e9 100%); color: #28a745; border: none; border-radius: 8px; cursor: pointer; font-weight: 600; margin-bottom: 20px; }' +
'    .productos-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 20px; margin-bottom: 30px; }' +
'    .producto-card { background: linear-gradient(180deg, #ffffff 0%, #e8f5e9 100%); border-radius: 15px; padding: 20px; box-shadow: 0 5px 20px rgba(0,0,0,0.1); overflow: hidden; }' +
'    .producto-imagen { width: 100%; height: 200px; object-fit: cover; border-radius: 10px; margin-bottom: 15px; }' +
'    .producto-nombre { font-size: 1.3em; color: #333; font-weight: 600; margin-bottom: 10px; }' +
'    .producto-desc { color: #777; margin-bottom: 10px; font-size: 0.9em; }' +
'    .producto-precio { color: #28a745; font-size: 1.4em; font-weight: 700; margin-bottom: 15px; }' +
'    .producto-btn { width: 100%; padding: 12px; background: #28a745; color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: 600; }' +
'    .producto-btn:hover { background: #218838; }' +
'    .carrito-section { background: linear-gradient(180deg, #ffffff 0%, #e8f5e9 100%); border-radius: 15px; padding: 30px; margin-top: 30px; }' +
'    .carrito-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }' +
'    .carrito-header h2 { color: #333; }' +
'    .carrito-total { font-size: 1.8em; color: #28a745; font-weight: 700; margin: 20px 0; }' +
'    .carrito-item { display: flex; justify-content: space-between; align-items: center; padding: 15px; border-bottom: 1px solid #eee; }' +
'    .carrito-item:last-child { border-bottom: none; }' +
'    .item-info h4 { color: #333; margin-bottom: 5px; }' +
'    .item-info p { color: #777; font-size: 0.9em; }' +
'    .vaciar-btn { background: #dc3545; color: white; padding: 10px 20px; border: none; border-radius: 8px; cursor: pointer; }' +
'    .pago-section { background: linear-gradient(180deg, #ffffff 0%, #e8f5e9 100%); border-radius: 15px; padding: 30px; margin-top: 30px; }' +
'    .pago-section h2 { color: #333; margin-bottom: 20px; }' +
'    .metodo-pago { display: flex; gap: 15px; flex-wrap: wrap; margin-bottom: 20px; }' +
'    .metodo-opcion { padding: 15px 25px; border: 2px solid #ddd; border-radius: 8px; cursor: pointer; transition: all 0.3s; }' +
'    .metodo-opcion.selected { border-color: #28a745; background: #e8f5e9; }' +
'    .pagar-btn { width: 100%; padding: 16px; background: linear-gradient(135deg, #28a745 0%, #20c997 100%); color: white; border: none; border-radius: 8px; font-size: 18px; font-weight: 700; cursor: pointer; }' +
'    .confirmacion { background: #d4edda; border: 1px solid #c3e6cb; color: #155724; padding: 30px; border-radius: 15px; text-align: center; margin-top: 20px; }' +
'    .confirmacion h2 { font-size: 2em; margin-bottom: 15px; }' +
'    .confirmacion p { font-size: 1.2em; }' +
'    .notification { position: fixed; top: 20px; right: 20px; padding: 15px 25px; border-radius: 8px; color: white; font-weight: 500; z-index: 1000; animation: slideIn 0.3s ease; }' +
'    .notification.success { background: #28a745; }' +
'    .notification.error { background: #dc3545; }' +
'    @keyframes slideIn { from { transform: translateX(400px); } to { transform: translateX(0); } }' +
'    .hidden { display: none !important; }' +
'  </style>' +
'</head>' +
'<body>' +

'  <div class="container">' +
'    <h1>🍔Restaurante Osmar FRV🍺</h1>' +
'    <div id="authSection">' +
'      <div class="auth-box">' +
'        <h2 id="authTitle">Iniciar Sesión</h2>' +
'        <form id="authForm">' +
'          <div class="form-group">' +
'            <label>Usuario</label>' +
'            <input type="text" id="username" required placeholder="Ingresa tu usuario">' +
'          </div>' +
'          <div class="form-group">' +
'            <label>Contraseña</label>' +
'            <input type="password" id="password" required placeholder="Ingresa tu contraseña">' +
'          </div>' +
'          <button type="submit" class="btn" id="authBtn">Iniciar Sesión</button>' +
'        </form>' +
'        <p class="toggle-link" id="toggleAuth">¿No tienes cuenta? Regístrate</p>' +
'      </div>' +
'    </div>' +
'    <div id="appSection" class="app-container">' +
'      <div class="app-header">' +
'        <h2>Bienvenido, <span id="userName">Usuario</span></h2>' +
'        <div class="user-info">' +
'          <span>🛒 <span id="carritoCount">0</span> items</span>' +
'          <button class="cart-btn" onclick="showCarrito()">Ver Carrito</button>' +
'          <button class="logout-btn" onclick="logout()">Cerrar Sesión</button>' +
'        </div>' +
'      </div>' +
'      <div id="categoriasSection">' +
'        <h2 class="section-title">📋 Selecciona una Categoría</h2>' +
'        <div class="categorias-grid" id="categoriasGrid"></div>' +
'      </div>' +
'      <div id="productosSection" class="hidden">' +
'        <button class="back-btn" onclick="showCategorias()">← Volver a Categorías</button>' +
'        <h2 class="section-title" id="productosTitle">Productos</h2>' +
'        <div class="productos-grid" id="productosGrid"></div>' +
'      </div>' +
'      <div class="carrito-section hidden" id="carritoSection">' +
'        <button class="back-btn" onclick="showCategorias()">← Volver</button>' +
'        <div class="carrito-header">' +
'          <h2>🛒 Tu Carrito</h2>' +
'          <button class="vaciar-btn" onclick="vaciarCarrito()">Vaciar Carrito</button>' +
'        </div>' +
'        <div id="carritoItems"></div>' +
'        <div class="carrito-total">Total: $<span id="carritoTotal">0</span></div>' +
'        <button class="btn" style="margin-top: 20px;" onclick="showPago()">Proceder al Pago →</button>' +
'      </div>' +
'      <div class="pago-section hidden" id="pagoSection">' +
'        <button class="back-btn" onclick="showCarritoFromPago()">← Volver al Carrito</button>' +
'        <h2>💳 Método de Pago</h2>' +
'        <div class="metodo-pago" id="metodosPago"></div>' +
'        <button class="pagar-btn" onclick="procesarPago()">PAGAR AHORA</button>' +
'      </div>' +
'      <div class="confirmacion hidden" id="confirmacionSection">' +
'        <h2>🎉 ¡Pedido Confirmado!</h2>' +
'        <p id="confirmacionMensaje"></p>' +
'        <button class="btn" style="margin-top: 20px;" onclick="nuevoPedido()">Hacer Nuevo Pedido</button>' +
'      </div>' +
'    </div>' +
'  </div>' +
'  <script>' +
'    let currentUser = null;' +
'    let sessionId = "session_" + Date.now();' +
'    let currentCategoria = null;' +
'    let selectedMetodoPago = "efectivo";' +
'    let isLoginMode = true;' +
'    document.getElementById("toggleAuth").addEventListener("click", function() {' +
'      isLoginMode = !isLoginMode;' +
'      document.getElementById("authTitle").textContent = isLoginMode ? "Iniciar Sesión" : "Registrarse";' +
'      document.getElementById("authBtn").textContent = isLoginMode ? "Iniciar Sesión" : "Registrarse";' +
'      document.getElementById("toggleAuth").textContent = isLoginMode ? "¿No tienes cuenta? Regístrate" : "¿Ya tienes cuenta? Inicia Sesión";' +
'    });' +
'    document.getElementById("authForm").addEventListener("submit", async function(e) {' +
'      e.preventDefault();' +
'      var username = document.getElementById("username").value;' +
'      var password = document.getElementById("password").value;' +
'      var endpoint = isLoginMode ? "/api/login" : "/api/register";' +
'      var res = await fetch(endpoint, {' +
'        method: "POST",' +
'        headers: { "Content-Type": "application/json" },' +
'        body: JSON.stringify({ username: username, password: password })' +
'      });' +
'      var data = await res.json();' +
'      if (data.success) {' +
'        currentUser = data.data.usuario || { username: username };' +
'        document.getElementById("userName").textContent = currentUser.username;' +
'        showApp();' +
'        loadCategorias();' +
'        showNotification(isLoginMode ? "¡Bienvenido!" : "¡Registro exitoso!", "success");' +
'      } else {' +
'        showNotification(data.message || "Error en la autenticación", "error");' +
'      }' +
'    });' +
'    function logout() {' +
'      currentUser = null;' +
'      document.getElementById("authSection").style.display = "block";' +
'      document.getElementById("appSection").style.display = "none";' +
'      document.getElementById("username").value = "";' +
'      document.getElementById("password").value = "";' +
'    }' +
'    function showApp() {' +
'      document.getElementById("authSection").style.display = "none";' +
'      document.getElementById("appSection").style.display = "block";' +
'    }' +
'    async function loadCategorias() {' +
'      var res = await fetch("/api/categorias");' +
'      var data = await res.json();' +
'      var grid = document.getElementById("categoriasGrid");' +
'      var html = "";' +
'      for (var i = 0; i < data.data.length; i++) {' +
'        var cat = data.data[i];' +
'        html += "<div class=\\"categoria-card\\" onclick=\\"loadProducts(\'" + cat.id + "\', \'" + cat.nombre + "\')\\">";' +
'        html += "<div class=\\"categoria-icon\\">" + cat.icono + "</div>";' +
'        html += "<div class=\\"categoria-nombre\\">" + cat.nombre + "</div>";' +
'        html += "<div class=\\"categoria-desc\\">" + cat.descripcion + "</div>";' +
'        html += "</div>";' +
'      }' +
'      grid.innerHTML = html;' +
'    }' +
'    async function loadProducts(categoria, nombre) {' +
'      currentCategoria = categoria;' +
'      document.getElementById("categoriasSection").classList.add("hidden");' +
'      document.getElementById("productosSection").classList.remove("hidden");' +
'      document.getElementById("carritoSection").classList.add("hidden");' +
'      document.getElementById("pagoSection").classList.add("hidden");' +
'      document.getElementById("productosTitle").textContent = nombre;' +
'      var res = await fetch("/api/productos/" + categoria);' +
'      var data = await res.json();' +
'      var grid = document.getElementById("productosGrid");' +
'      var html = "";' +
'      for (var i = 0; i < data.data.length; i++) {' +
'        var prod = data.data[i];' +
'        var imagenUrl = prod.imagen || "https://via.placeholder.com/300x200?text=Imagen+no+disponible";' +
'        html += "<div class=\\"producto-card\\">";' +
'        html += "<img class=\\"producto-imagen\\" src=\\"" + imagenUrl + "\\" alt=\\"" + prod.nombre + "\\">";' +
'        html += "<div class=\\"producto-nombre\\">" + prod.nombre + "</div>";' +
'        html += "<div class=\\"producto-desc\\">" + prod.descripcion + "</div>";' +
'        html += "<div class=\\"producto-precio\\">$" + prod.precio.toLocaleString() + "</div>";' +
'        html += "<button class=\\"producto-btn\\" onclick=\\"addToCart(" + prod.id + ", \'" + prod.nombre + "\', " + prod.precio + ")\\">Agregar al Carrito</button>";' +
'        html += "</div>";' +
'      }' +
'      grid.innerHTML = html;' +
'    }' +
'    function showCategorias() {' +
'      document.getElementById("categoriasSection").classList.remove("hidden");' +
'      document.getElementById("productosSection").classList.add("hidden");' +
'      document.getElementById("carritoSection").classList.add("hidden");' +
'      document.getElementById("pagoSection").classList.add("hidden");' +
'    }' +
'    async function addToCart(productoId, nombre, precio) {' +
'      var res = await fetch("/api/carrito/agregar", {' +
'        method: "POST",' +
'        headers: { "Content-Type": "application/json" },' +
'        body: JSON.stringify({' +
'          sessionId: sessionId,' +
'          productoId: productoId,' +
'          nombre: nombre,' +
'          precio: precio,' +
'          categoria: currentCategoria,' +
'          cantidad: 1' +
'        })' +
'      });' +
'      var data = await res.json();' +
'      if (data.success || data.exito) {' +
'        showNotification("Producto agregado al carrito", "success");' +
'        await loadCarrito();' +
'      }' +
'    }' +
'    async function loadCarrito() {' +
'      var res = await fetch("/api/carrito/" + sessionId);' +
'      var data = await res.json();' +
'      if (!data.data && data.datos) {' +
'        data.data = {' +
'          items: data.datos.productos || [],' +
'          cantidadTotal: data.datos.cantidad_total || 0,' +
'          total: data.datos.total || 0' +
'        };' +
'      }' +
'      var items = (data.data && data.data.items) || [];' +
'      document.getElementById("carritoCount").textContent = (data.data && data.data.cantidadTotal) || 0;' +
'      document.getElementById("carritoTotal").textContent = ((data.data && data.data.total) || 0).toLocaleString();' +
'      var container = document.getElementById("carritoItems");' +
'      if (items.length === 0) {' +
'        container.innerHTML = "<p style=\\"text-align: center; color: #777; padding: 20px;\\">Tu carrito está vacío</p>";' +
'      } else {' +
'        var html = "";' +
'        for (var i = 0; i < items.length; i++) {' +
'          var item = items[i];' +
'          html += "<div class=\\"carrito-item\\">";' +
'          html += "<div class=\\"item-info\\">";' +
'          html += "<h4>" + item.nombre + "</h4>";' +
'          html += "<p>$" + item.precio.toLocaleString() + " x " + item.cantidad + "</p>";' +
'          html += "</div>";' +
'          html += "<strong>$" + (item.precio * item.cantidad).toLocaleString() + "</strong>";' +
'          html += "</div>";' +
'        }' +
'        container.innerHTML = html;' +
'      }' +
'    }' +
'    function showCarrito() {' +
'      document.getElementById("categoriasSection").classList.add("hidden");' +
'      document.getElementById("productosSection").classList.add("hidden");' +
'      document.getElementById("carritoSection").classList.remove("hidden");' +
'      document.getElementById("pagoSection").classList.add("hidden");' +
'      loadCarrito();' +
'    }' +
'    async function vaciarCarrito() {' +
'      var res = await fetch("/api/carrito/" + sessionId, { method: "DELETE" });' +
'      var data = await res.json();' +
'      if (data.success) {' +
'        loadCarrito();' +
'        showNotification("Carrito vaciado", "success");' +
'      }' +
'    }' +
'    function showPago() {' +
'      document.getElementById("carritoSection").classList.add("hidden");' +
'      document.getElementById("pagoSection").classList.remove("hidden");' +
'      loadMetodosPago();' +
'    }' +
'    function showCarritoFromPago() {' +
'      document.getElementById("pagoSection").classList.add("hidden");' +
'      document.getElementById("carritoSection").classList.remove("hidden");' +
'    }' +
'    async function loadMetodosPago() {' +
'      var res = await fetch("/api/pagos/metodos");' +
'      var data = await res.json();' +
'      var container = document.getElementById("metodosPago");' +
'      var html = "";' +
'      for (var i = 0; i < data.data.length; i++) {' +
'        var mp = data.data[i];' +
'        var selected = mp.id === selectedMetodoPago ? "selected" : "";' +
'        html += "<div class=\\"metodo-opcion " + selected + "\\" onclick=\\"selectMetodoPago(\'" + mp.id + "\')\\">";' +
'        html += mp.nombre;' +
'        html += "</div>";' +
'      }' +
'      container.innerHTML = html;' +
'    }' +
'    function selectMetodoPago(metodo) {' +
'      selectedMetodoPago = metodo;' +
'      loadMetodosPago();' +
'    }' +
'    async function procesarPago() {' +
'      var resCarrito = await fetch("/api/carrito/" + sessionId);' +
'      var dataCarrito = await resCarrito.json();' +
'      if (!dataCarrito.data.items || dataCarrito.data.items.length === 0) {' +
'        showNotification("El carrito está vacío", "error");' +
'        return;' +
'      }' +
'      var res = await fetch("/api/pagos/procesar", {' +
'        method: "POST",' +
'        headers: { "Content-Type": "application/json" },' +
'        body: JSON.stringify({' +
'          sessionId: sessionId,' +
'          items: dataCarrito.data.items,' +
'          total: dataCarrito.data.total,' +
'          metodoPago: selectedMetodoPago,' +
'          datosPago: {}' +
'        })' +
'      });' +
'      var data = await res.json();' +
'      if (data.success) {' +
'        document.getElementById("pagoSection").classList.add("hidden");' +
'        document.getElementById("confirmacionSection").classList.remove("hidden");' +
'        document.getElementById("confirmacionMensaje").textContent = data.data.mensajeConfirmacion;' +
'      } else {' +
'        showNotification(data.message || "Error en el pago", "error");' +
'      }' +
'    }' +
'    function nuevoPedido() {' +
'      sessionId = "session_" + Date.now();' +
'      document.getElementById("confirmacionSection").classList.add("hidden");' +
'      document.getElementById("carritoSection").classList.add("hidden");' +
'      document.getElementById("categoriasSection").classList.remove("hidden");' +
'      loadCategorias();' +
'      loadCarrito();' +
'    }' +
'    function showNotification(message, type) {' +
'      var notif = document.createElement("div");' +
'      notif.className = "notification " + type;' +
'      notif.textContent = message;' +
'      document.body.appendChild(notif);' +
'      setTimeout(function() { notif.remove(); }, 3000);' +
'    }' +
'  </script>' +
'  <div class="video-overlay"></div>' +
'  <video autoplay muted loop class="video-background">' +
'    <source src="/videos/welcome-video.mp4" type="video/mp4">' +
'  </video>' +
'</body>' +
'</html>';
  
  res.send(html);
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', service: 'Autenticación y Frontend' });
});

app.listen(PORT, '0.0.0.0', function() {
  console.log('Contenedor 1 - Autenticación y Frontend corriendo en puerto ' + PORT);
});
