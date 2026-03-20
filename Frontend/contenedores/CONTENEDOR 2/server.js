// ============================================================
// CONTENEDOR 2 - SELECCIÓN DE CATEGORÍAS
// ============================================================
// Este contenedor maneja:
// - Mostrar las categorías del menú
// - Permitir seleccionar una categoría
// - Devolver información de cada categoría

// Importamos las librerías necesarias
const express = require('express');       // Framework para crear el servidor web
const cors = require('cors');           // Permite conexiones desde otros dominios
const bodyParser = require('body-parser'); // Para procesar datos JSON

// Creamos la aplicación Express
const app = express();

// Puerto donde correra el servidor (3002 por defecto)
const PORT = process.env.PORT || 3002;

// Configuramos los middlewares
app.use(cors());              // Permite CORS
app.use(bodyParser.json());   // Lee JSON en las peticiones

// ============================================================
// DEFINICIÓN DE CATEGORÍAS
// ============================================================
// Aquí definimos las 4 categorías del menú del restaurante
// Cada categoría tiene: id, nombre, descripción, icono y ruta

const categorias = [
  {
    id: 'bebidas',                              // Identificador único
    nombre: 'Bebidas',                          // Nombre para mostrar
    descripcion: 'Refrescos, jugos, aguas y más', // Descripción
    icono: '🥤',                               // Emoji representativo
    ruta: '/api/productos/bebidas'              // Ruta para obtener productos
  },
  {
    id: 'almuerzos',
    nombre: 'Almuerzos',
    descripcion: 'Menús completos del día',
    icono: '🍱',
    ruta: '/api/productos/almuerzos'
  },
  {
    id: 'comida-chatarra',
    nombre: 'Comida Chatarra',
    descripcion: 'Hamburgesas, pizzas, hotdogs y más',
    icono: '🍔',
    ruta: '/api/productos/comida-chatarra'
  },
  {
    id: 'mecato',
    nombre: 'Mecato',
    descripcion: 'Snacks, frituras y botanas',
    icono: '🍟',
    ruta: '/api/productos/mecato'
  }
];

// ============================================================
// RUTAS DE LA API
// ============================================================

// GET /api/categorias
// Devuelve todas las categorías disponibles
// Esta ruta es llamada por el Contenedor 1 (Frontend)
// Ejemplo de respuesta:
// {
//   success: true,
//   data: [
//     { id: 'bebidas', nombre: 'Bebidas', descripcion: '...', icono: '🥤' },
//     ...
//   ]
// }
app.get('/api/categorias', (req, res) => {
  // Mapeamos las categorías para devolver solo los datos necesarios
  res.json({
    success: true,
    data: categorias.map(cat => ({
      id: cat.id,
      nombre: cat.nombre,
      descripcion: cat.descripcion,
      icono: cat.icono
    }))
  });
});

// GET /api/categorias/:id
// Devuelve una categoría específica por su ID
// :id es un parámetro dinámico (ej: /api/categorias/bebidas)
app.get('/api/categorias/:id', (req, res) => {
  // Obtenemos el ID de los parámetros de la URL
  const { id } = req.params;
  
  // Buscamos la categoría en nuestro array
  const categoria = categorias.find(cat => cat.id === id);
  
  // Si no existe, devolvemos error 404
  if (!categoria) {
    return res.status(404).json({
      success: false,
      message: 'Categoría no encontrada'
    });
  }
  
  // Si existe, devolvemos los datos
  res.json({
    success: true,
    data: categoria
  });
});

// POST /api/seleccionar-categoria
// Permite seleccionar una categoría (para el flujo del usuario)
// Recibe: { categoriaId: 'bebidas' }
// Devuelve: { categoriaId, nombre, rutaProductos }
app.post('/api/seleccionar-categoria', (req, res) => {
  // Obtenemos el ID del cuerpo de la petición
  const { categoriaId } = req.body;
  
  // Validamos que nos envíen el ID
  if (!categoriaId) {
    return res.status(400).json({
      success: false,
      message: 'ID de categoría requerido'
    });
  }
  
  // Buscamos la categoría
  const categoria = categorias.find(cat => cat.id === categoriaId);
  
  // Si no existe
  if (!categoria) {
    return res.status(404).json({
      success: false,
      message: 'Categoría no encontrada'
    });
  }
  
  // Si existe, confirmamos la selección
  res.json({
    success: true,
    message: 'Categoría ' + categoria.nombre + ' seleccionada',
    data: {
      categoriaId: categoria.id,
      nombre: categoria.nombre,
      rutaProductos: categoria.ruta
    }
  });
});

// ============================================================
// RUTA DE SALUD (Health Check)
// ============================================================
// Esta ruta se usa para verificar que el contenedor está funcionando
// Docker la usa para saber si el contenedor está healthy
app.get('/health', (req, res) => {
  res.json({ status: 'OK', service: 'Selección de Categorías' });
});

// ============================================================
// INICIO DEL SERVIDOR
// ============================================================
app.listen(PORT, '0.0.0.0', () => {
  console.log('Contenedor 2 - Selección de Categorías corriendo en puerto ' + PORT);
});
