// ============================================================
// CONTENEDOR 3 - MÓDULO DE PRODUCTOS
// ============================================================
// Este contenedor maneja:
// - Mostrar productos por categoría
// - Gestionar el carrito de compras
// - Agregar, ver y eliminar productos del carrito

// Importamos las librerías necesarias
const express = require('express');       // Framework servidor web
const cors = require('cors');             // Permite CORS
const bodyParser = require('body-parser'); // Procesa JSON

// Creamos la aplicación
const app = express();
const PORT = process.env.PORT || 3003;

// Middlewares
app.use(cors());
app.use(bodyParser.json());

// ============================================================
// BASE DE DATOS DE PRODUCTOS
// ============================================================
// Aquí guardamos todos los productos del restaurante
// Organizados por categoría
// Cada producto tiene: id, nombre, precio, descripción, disponibilidad

const productos = {
  // ---------- BEBIDAS ----------
  bebidas: [
    { id: 1, nombre: 'Gaseosa Coca cola', precio: 2500, descripcion: 'Refresco de cola 350ml', disponible: true },
    { id: 2, nombre: 'Jugo Hit', precio: 2500, descripcion: 'Refresco de naranja 350ml', disponible: true },
    { id: 3, nombre: 'Agua Mineral', precio: 2000, descripcion: 'Agua sin gas 500ml', disponible: true },
    { id: 4, nombre: 'Jugo Natural', precio: 3500, descripcion: 'Jugo de fruta naturales', disponible: true },
    { id: 5, nombre: 'Cerveza', precio: 4500, descripcion: 'Cerveza nacional', disponible: true },
    { id: 6, nombre: 'Limonada', precio: 3000, descripcion: 'Limonada natural', disponible: true }
  ],
  
  // ---------- ALMUERZOS ----------
  almuerzos: [
    { id: 7, nombre: 'Almuerzo Ejecutivo', precio: 15000, descripcion: 'Pollo, arroz, ensalada, sopa', disponible: true },
    { id: 8, nombre: 'Almuerzo Casero', precio: 12000, descripcion: 'Carne, frijoles, plátano, arroz', disponible: true },
    { id: 9, nombre: 'Almuerzo Vegetariano', precio: 11000, descripcion: 'Legumbres, arroz, ensalada', disponible: true },
    { id: 10, nombre: 'Bandeja Paisa', precio: 18000, descripcion: 'Frijoles, arroz, carne, chicharrón, huevo', disponible: true },
    { id: 11, nombre: 'Lentejas', precio: 14000, descripcion: 'Lentejas con arroz y carne', disponible: true },
    { id: 12, nombre: 'Spaghetti', precio: 13000, descripcion: 'Spaghetti con salsa de tomate', disponible: true }
  ],
  
  // ---------- COMIDA CHATARRA ----------
  'comida-chatarra': [
    { id: 13, nombre: 'Hamburguesa Simple', precio: 8000, descripcion: 'Pan, carne, queso, lechuga, salsas', disponible: true },
    { id: 14, nombre: 'Hamburguesa Doble', precio: 12000, descripcion: 'Pan, dos carnes, doble queso, tocineta, tomate, lechuga, salsas', disponible: true },
    { id: 15, nombre: 'Pizza Personal', precio: 10000, descripcion: 'Pizza de queso 8 pulgadas', disponible: true },
    { id: 16, nombre: 'Hot Dog', precio: 6000, descripcion: 'Pan, salchicha, toppings', disponible: true },
    { id: 17, nombre: 'Salchipapa', precio: 9000, descripcion: 'Papas fritas con salchicha', disponible: true },
    { id: 18, nombre: 'Arepa con Queso', precio: 5000, descripcion: 'Arepa rellena de queso', disponible: true },
    { id: 19, nombre: 'Patacón', precio: 7000, descripcion: 'Patacón con toppings', disponible: true }
  ],
  
  // ---------- MECATO ----------
  mecato: [
    { id: 20, nombre: 'Papas Fritas', precio: 4000, descripcion: 'Papas fritas medianas', disponible: true },
    { id: 21, nombre: 'Nachos', precio: 6000, descripcion: 'Nachos con queso', disponible: true },
    { id: 22, nombre: 'Galletas', precio: 2500, descripcion: 'Paquete de galletas', disponible: true },
    { id: 23, nombre: 'Churrería', precio: 5000, descripcion: '6 churros con azúcar', disponible: true },
    { id: 24, nombre: 'Popcorn', precio: 4500, descripcion: 'Palomitas de maíz', disponible: true },
    { id: 25, nombre: 'Empanada', precio: 3000, descripcion: 'Empanada de carne o pollo', disponible: true }
  ]
};

// ============================================================
// GESTIÓN DEL CARRITO
// ============================================================
// Usamos un Map para guardar los carritos de cada sesión
// Key: sessionId (identificador único de la sesión del usuario)
// Value: array de productos en el carrito

const carritos = new Map();

// ============================================================
// RUTAS DE LA API
// ============================================================

// GET /api/productos/:categoria
// Devuelve todos los productos de una categoría específica
// Ejemplo: /api/productos/bebidas
app.get('/api/productos/:categoria', (req, res) => {
  const { categoria } = req.params;
  
  // Verificamos si la categoría existe
  if (!productos[categoria]) {
    return res.status(404).json({
      success: false,
      message: 'Categoría no encontrada'
    });
  }
  
  // Filtramos solo los productos disponibles
  const productosCategoria = productos[categoria].filter(p => p.disponible);
  
  res.json({
    success: true,
    data: productosCategoria
  });
});

// GET /api/productos/:categoria/:id
// Devuelve un producto específico por su ID
app.get('/api/productos/:categoria/:id', (req, res) => {
  const { categoria, id } = req.params;
  const productoId = parseInt(id);
  
  if (!productos[categoria]) {
    return res.status(404).json({
      success: false,
      message: 'Categoría no encontrada'
    });
  }
  
  const producto = productos[categoria].find(p => p.id === productoId);
  
  if (!producto) {
    return res.status(404).json({
      success: false,
      message: 'Producto no encontrado'
    });
  }
  
  res.json({
    success: true,
    data: producto
  });
});

// POST /api/carrito/agregar
// Agrega un producto al carrito
// Recibe: { sessionId, productoId, categoria, cantidad }
app.post('/api/carrito/agregar', (req, res) => {
  const { sessionId, productoId, categoria, cantidad = 1 } = req.body;
  
  // Validación de datos requeridos
  if (!sessionId || !productoId || !categoria) {
    return res.status(400).json({
      success: false,
      message: 'Datos incompletos: sessionId, productoId y categoria son requeridos'
    });
  }
  
  // Verificar que la categoría existe
  if (!productos[categoria]) {
    return res.status(404).json({
      success: false,
      message: 'Categoría no válida'
    });
  }
  
  // Buscar el producto
  const producto = productos[categoria].find(p => p.id === productoId);
  
  if (!producto) {
    return res.status(404).json({
      success: false,
      message: 'Producto no encontrado'
    });
  }
  
  // Si no existe carrito para esta sesión, lo creamos
  if (!carritos.has(sessionId)) {
    carritos.set(sessionId, []);
  }
  
  const carrito = carritos.get(sessionId);
  
  // Verificar si el producto ya está en el carrito
  const itemExistente = carrito.find(item => item.productoId === productoId);
  
  if (itemExistente) {
    // Si ya existe, aumentamos la cantidad
    itemExistente.cantidad += cantidad;
  } else {
    // Si no existe, lo agregamos
    carrito.push({
      productoId,
      categoria,
      nombre: producto.nombre,
      precio: producto.precio,
      cantidad
    });
  }
  
  res.json({
    success: true,
    message: 'Producto agregado al carrito',
    data: {
      items: carrito.length,
      total: calcularTotal(carrito)
    }
  });
});

// GET /api/carrito/:sessionId
// Devuelve el contenido del carrito de una sesión
app.get('/api/carrito/:sessionId', (req, res) => {
  const { sessionId } = req.params;
  const carrito = carritos.get(sessionId) || [];
  
  res.json({
    success: true,
    data: {
      items: carrito,
      cantidadTotal: carrito.reduce((sum, item) => sum + item.cantidad, 0),
      total: calcularTotal(carrito)
    }
  });
});

// DELETE /api/carrito/:sessionId/:productoId
// Elimina un producto específico del carrito
app.delete('/api/carrito/:sessionId/:productoId', (req, res) => {
  const { sessionId, productoId } = req.params;
  const productoIdInt = parseInt(productoId);
  
  if (!carritos.has(sessionId)) {
    return res.status(404).json({
      success: false,
      message: 'Carrito no encontrado'
    });
  }
  
  const carrito = carritos.get(sessionId);
  const indice = carrito.findIndex(item => item.productoId === productoIdInt);
  
  if (indice === -1) {
    return res.status(404).json({
      success: false,
      message: 'Producto no encontrado en el carrito'
    });
  }
  
  // Eliminamos el producto
  const productoEliminado = carrito.splice(indice, 1)[0];
  
  res.json({
    success: true,
    message: 'Producto eliminado del carrito',
    data: {
      items: carrito.length,
      total: calcularTotal(carrito)
    }
  });
});

// DELETE /api/carrito/:sessionId
// Vacía completamente el carrito
app.delete('/api/carrito/:sessionId', (req, res) => {
  const { sessionId } = req.params;
  carritos.delete(sessionId);
  
  res.json({
    success: true,
    message: 'Carrito vaciado'
  });
});

// ============================================================
// FUNCIÓN AUXILIAR
// ============================================================
// Calcula el total del carrito
function calcularTotal(carrito) {
  return carrito.reduce((sum, item) => sum + (item.precio * item.cantidad), 0);
}

// ============================================================
// RUTA DE SALUD
// ============================================================
app.get('/health', (req, res) => {
  res.json({ status: 'OK', service: 'Módulo de Productos' });
});

// ============================================================
// INICIO DEL SERVIDOR
// ============================================================
app.listen(PORT, '0.0.0.0', () => {
  console.log('Contenedor 3 - Módulo de Productos corriendo en puerto ' + PORT);
});
