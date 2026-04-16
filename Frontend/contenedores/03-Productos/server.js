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
    { id: 1, nombre: 'Gaseosa Coca cola', precio: 2500, descripcion: 'Refresco de cola 350ml', disponible: true, imagen: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=300&h=300&fit=crop' },
    { id: 2, nombre: 'Cafe', precio: 2500, descripcion: 'Cafe caliente', disponible: true, imagen: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=300&h=300&fit=crop' },
    { id: 3, nombre: 'Agua Mineral', precio: 2000, descripcion: 'Agua sin gas 500ml', disponible: true, imagen: 'https://images.unsplash.com/photo-1559839914-17aae19cec71?w=300&h=300&fit=crop' },
    { id: 4, nombre: 'Jugo Natural', precio: 3500, descripcion: 'Jugo de fruta naturales', disponible: true, imagen: 'https://images.unsplash.com/photo-1621506289937-a8e4df240d0b?w=300&h=300&fit=crop' },
    { id: 5, nombre: 'Cerveza', precio: 4500, descripcion: 'Cerveza nacional', disponible: true, imagen: 'https://images.unsplash.com/photo-1608270586620-248524c67de9?w=300&h=300&fit=crop' },
    { id: 6, nombre: 'Limonada', precio: 3000, descripcion: 'Limonada natural', disponible: true, imagen: 'https://images.unsplash.com/photo-1621263764928-df1444c5e859?w=300&h=300&fit=crop' }
  ],
  
  // ---------- ALMUERZOS ----------
  almuerzos: [
    { id: 7, nombre: 'Almuerzo Ejecutivo', precio: 20000, descripcion: 'Arroz, carne, papa, frijoles y sopa', disponible: true, imagen: 'https://www.colombianisimo.digitalfutureagency.com/images/menu/ejecutivo/ejecutivo-4.png' },
    { id: 8, nombre: 'Sancocho', precio: 15000, descripcion: 'Sancocho', disponible: true, imagen: 'https://www.elespectador.com/resizer/v2/BDCW5WGPNFDU3JQCFJV4CSFVRA.jpg?auth=6f2e83f4bfa4f466b3c28bcf642b27c9e7481166de4ce700ecb0e1b4c90f4fd4&width=920&height=613&smart=true&quality=60' },
    { id: 9, nombre: 'Almuerzo Vegetariano', precio: 11000, descripcion: 'vegetales, arroz y huevo', disponible: true, imagen: 'https://image.freepik.com/foto-gratis/almuerzo-vegetariano-verde-saludable-tazon-buda-huevos-arroz-tomate-aguacate-queso-azul-mesa_2829-18818.jpg' },
    { id: 10, nombre: 'Bandeja Paisa', precio: 18000, descripcion: 'Frijoles, arroz, carne, chicharrón, huevo, tajada, arepa, aguacate y guiso', disponible: true, imagen: 'https://buengusto.co/wp-content/uploads/2019/08/co_mde_bandeja_paisa-1920x1080.jpg' },
    { id: 11, nombre: 'Lentejas', precio: 14000, descripcion: 'Lentejas con arroz, huevo y aguacate', disponible: true, imagen: 'https://i.pinimg.com/originals/33/f3/61/33f361c1820fdf5b680c12ac2b9a23ef.jpg' },
    { id: 12, nombre: 'Spaghetti', precio: 15000, descripcion: 'Spaghetti bolognese', disponible: true, imagen: 'https://asset.jamieoliver.com/images/cq7w2e71/production/123c983a6327bf692877ddbfdcc6910e6b57049a-958x1280.jpg/143846725?rect=0,2,958,1277&w=700&h=933&fm=webp&q=80&fit=crop&auto=format' }
  ],
  
  // ---------- COMIDA CHATARRA ----------
  'comida-chatarra': [
    { id: 13, nombre: 'Hamburguesa Simple', precio: 12000, descripcion: 'Pan, carne, queso, lechuga, salsas', disponible: true, imagen: 'https://statics.diariomendoza.com.ar/2023/12/658b398ac548e.jpg' },
    { id: 14, nombre: 'Hamburguesa Doble', precio: 20000, descripcion: 'Pan, dos carnes, doble queso, tocineta, tomate, lechuga, salsas', disponible: true, imagen: 'https://images.unsplash.com/photo-1553979459-d2229ba7433b?w=300&h=300&fit=crop' },
    { id: 15, nombre: 'Pizza Personal', precio: 10000, descripcion: 'Pizza de queso 8 pulgadas', disponible: true, imagen: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=300&h=300&fit=crop' },
    { id: 16, nombre: 'Hot Dog', precio: 9500, descripcion: 'Pan, salchicha, toppings', disponible: true, imagen: 'https://www.thecookierookie.com/wp-content/uploads/2023/05/featured-grilled-hotdogs-recipe.jpg' },
    { id: 17, nombre: 'Salchipapa', precio: 11500, descripcion: 'Papas fritas con salchicha y mucho más', disponible: true, imagen: 'https://i.ytimg.com/vi/I2_NmNHa-2M/maxresdefault.jpg' },
    { id: 18, nombre: 'Arepa con Queso', precio: 7000, descripcion: 'Arepa rellena de queso', disponible: true, imagen: 'https://www.lemonblossoms.com/wp-content/uploads/2023/02/Arepas-con-Queso-Recipe-S4.jpg' },
    { id: 19, nombre: 'Patacón', precio: 7000, descripcion: 'Patacón con salsas', disponible: true, imagen: 'https://victoria.com.co/cdn/shop/articles/Patacones-con-carne-de-hierro-fundido.png' }
  ],
  
  // ---------- MECATO ----------
  mecato: [
    { id: 20, nombre: 'Papas Fritas', precio: 4500, descripcion: 'Papas fritas medianas', disponible: true, imagen: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=400&h=300&fit=crop' },
    { id: 21, nombre: 'Nachos', precio: 6000, descripcion: 'Nachos con queso y mas', disponible: true, imagen: 'https://images.unsplash.com/photo-1513456852971-30c0b8199d4d?w=300&h=300&fit=crop' },
    { id: 22, nombre: 'Galletas', precio: 3000, descripcion: 'Paquete de galletas de muchos sabores', disponible: true, imagen: 'https://w7.pngwing.com/pngs/550/874/png-transparent-biscuits-lebkuchen-macaroon-chocolate-food-gift-baskets-oatmeal-raisin-cookies-food-gluten-biscuits.png' },
    { id: 23, nombre: 'Churrería', precio: 5000, descripcion: '6 churros con azúcar', disponible: true, imagen: 'https://img.freepik.com/psd-premium/churros-aislados-sobre-fondo-transparente-png-psd_888962-429.jpg' },
    { id: 24, nombre: 'Popcorn', precio: 5500, descripcion: 'Palomitas de maíz', disponible: true, imagen: 'https://img.freepik.com/fotos-premium/palomitas-maiz-caramelo-miel-sobre-fondo-blanco_51524-31837.jpg' },
    { id: 25, nombre: 'Empanada', precio: 3500, descripcion: 'Empanada de carne o pollo', disponible: true, imagen: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ6MTS9nwQeRBI7fvNeWbVMsFAigBXI9kHBAw&s' }
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
