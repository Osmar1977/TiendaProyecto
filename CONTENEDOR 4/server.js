// ============================================================
// CONTENEDOR 4 - PROCESAMIENTO DE PAGOS
// ============================================================
// Este contenedor maneja:
// - Procesar pagos
// - Confirmar pedidos
// - Cancelar pedidos
// - Generar números de pedido
// - Calcular tiempo estimado de entrega

// Importamos librerías
const express = require('express');       // Framework servidor web
const cors = require('cors');             // Permite CORS
const bodyParser = require('body-parser'); // Procesa JSON

// Creamos la aplicación
const app = express();
const PORT = process.env.PORT || 3004;

// Middlewares
app.use(cors());
app.use(bodyParser.json());

// ============================================================
// ALMACENAMIENTO DE PEDIDOS
// ============================================================
// Simulamos una base de datos de pedidos
// Key: sessionId
// Value: objeto con los datos del pedido

const pedidos = new Map();
let contadorPedidos = 1;  // Contador para generar números de pedido

// ============================================================
// MÉTODOS DE PAGO VALIDOS
// ============================================================
// Definimos los métodos de pago aceptados
const metodosPago = ['efectivo', 'tarjeta_credito', 'tarjeta_debito', 'transferencia'];

// ============================================================
// RUTAS DE LA API
// ============================================================

// POST /api/pagos/procesar
// Procesa el pago de un pedido
// Recibe: { sessionId, items, total, metodoPago, datosPago }
app.post('/api/pagos/procesar', (req, res) => {
  // Obtenemos los datos del cuerpo de la petición
  const { 
    sessionId,      // ID de la sesión del usuario
    items,         // Array de productos
    total,         // Total a pagar
    metodoPago,    // Método de pago seleccionado
    datosPago      // Datos adicionales del pago
  } = req.body;
  
  // ---------- VALIDACIONES ----------
  
  // Verificar que todos los datos estén presentes
  if (!sessionId || !items || !total || !metodoPago) {
    return res.status(400).json({
      success: false,
      message: 'Datos incompletos: sessionId, items, total y metodoPago son requeridos'
    });
  }
  
  // Verificar que el método de pago sea válido
  if (!metodosPago.includes(metodoPago)) {
    return res.status(400).json({
      success: false,
      message: 'Método de pago no válido'
    });
  }
  
  // Verificar que el carrito no esté vacío
  if (items.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'El carrito está vacío'
    });
  }
  
  // ---------- PROCESAMIENTO DEL PAGO ----------
  
  // Simulamos el procesamiento del pago
  const pagoExitoso = procesarPagoSimulado(metodoPago, total, datosPago);
  
  // Si el pago falla
  if (!pagoExitoso) {
    return res.status(400).json({
      success: false,
      message: 'Error en el procesamiento del pago'
    });
  }
  
  // ---------- GENERACIÓN DEL PEDIDO ----------
  
  // Generamos un número de pedido único
  // Formato: PED-00001, PED-00002, etc.
  const numeroPedido = 'PED-' + String(contadorPedidos++).padStart(5, '0');
  const fechaPedido = new Date().toISOString();
  
  // Calculamos tiempo estimado de entrega (entre 15 y 35 minutos)
  const tiempoEstimado = Math.floor(Math.random() * 20) + 15;
  
  // Creamos el objeto del pedido
  const pedido = {
    numeroPedido,           // Número único del pedido
    sessionId,              // ID de sesión
    items,                  // Productos pedidos
    total,                  // Total pagado
    metodoPago,             // Método de pago usado
    estado: 'confirmado',   // Estado inicial
    fechaPedido,            // Fecha y hora del pedido
    tiempoEstimado,         // Minutos estimados de entrega
    estadoPago: 'pagado'   // El pago fue exitoso
  };
  
  // Guardamos el pedido en nuestra "base de datos"
  pedidos.set(sessionId, pedido);
  
  // ---------- RESPUESTA EXITOSA ----------
  
  res.json({
    success: true,
    message: 'Pago procesado exitosamente',
    data: {
      numeroPedido,
      estado: 'confirmado',
      tiempoEstimado,
      // Mensaje de confirmación que verá el usuario
      mensajeConfirmacion: '¡Compra procesada! Tu pedido #' + numeroPedido + ' está en camino. Tiempo estimado: ' + tiempoEstimado + ' minutos.'
    }
  });
});

// ============================================================
// FUNCIÓN SIMULADA DE PAGO
// ============================================================
// Esta función simula el procesamiento real de un pago
// En un caso real, se conectaría a una pasarela de pago (PayU, Stripe, etc.)
function procesarPagoSimulado(metodoPago, total, datosPago) {
  // Si es tarjeta de crédito o débito, validamos datos de tarjeta
  if (metodoPago === 'tarjeta_credito' || metodoPago === 'tarjeta_debito') {
    // Validamos que existan datos de tarjeta
    if (!datosPago || !datosPago.numeroTarjeta) {
      return false;  // Pago fallido
    }
  }
  
  // Simulamos éxito con 90% de probabilidad
  // (Esto es solo para simulación, en realidad siempre sería true)
  return Math.random() > 0.1;
}

// ============================================================
// OTRAS RUTAS
// ============================================================

// GET /api/pedidos/:sessionId
// Consulta el estado de un pedido
app.get('/api/pedidos/:sessionId', (req, res) => {
  const { sessionId } = req.params;
  
  const pedido = pedidos.get(sessionId);
  
  if (!pedido) {
    return res.status(404).json({
      success: false,
      message: 'Pedido no encontrado'
    });
  }
  
  res.json({
    success: true,
    data: pedido
  });
});

// POST /api/pedidos/confirmar
// Confirma un pedido sin procesar pago (para pagos en efectivo en entrega)
app.post('/api/pedidos/confirmar', (req, res) => {
  const { sessionId, items, total } = req.body;
  
  if (!sessionId || !items || !total) {
    return res.status(400).json({
      success: false,
      message: 'Datos incompletos'
    });
  }
  
  const numeroPedido = 'PED-' + String(contadorPedidos++).padStart(5, '0');
  const tiempoEstimado = Math.floor(Math.random() * 20) + 15;
  
  const pedido = {
    numeroPedido,
    sessionId,
    items,
    total,
    estado: 'confirmado',
    fechaPedido: new Date().toISOString(),
    tiempoEstimado,
    estadoPago: 'pendiente'  // Pago pendiente (efectivo en entrega)
  };
  
  pedidos.set(sessionId, pedido);
  
  res.json({
    success: true,
    message: 'Pedido confirmado exitosamente',
    data: {
      numeroPedido,
      estado: 'confirmado',
      tiempoEstimado,
      mensajeConfirmacion: 'Tu pedido #' + numeroPedido + ' ha sido confirmado. Tiempo estimado: ' + tiempoEstimado + ' minutos.'
    }
  });
});

// POST /api/pedidos/cancelar
// Cancela un pedido
app.post('/api/pedidos/cancelar', (req, res) => {
  const { sessionId } = req.body;
  
  if (!sessionId) {
    return res.status(400).json({
      success: false,
      message: 'Session ID requerido'
    });
  }
  
  const pedido = pedidos.get(sessionId);
  
  if (!pedido) {
    return res.status(404).json({
      success: false,
      message: 'Pedido no encontrado'
    });
  }
  
  // No se puede cancelar un pedido ya entregado
  if (pedido.estado === 'entregado') {
    return res.status(400).json({
      success: false,
      message: 'No se puede cancelar un pedido ya entregado'
    });
  }
  
  // Actualizamos el estado
  pedido.estado = 'cancelado';
  pedidos.set(sessionId, pedido);
  
  res.json({
    success: true,
    message: 'Pedido cancelado exitosamente'
  });
});

// GET /api/pagos/metodos
// Devuelve la lista de métodos de pago disponibles
app.get('/api/pagos/metodos', (req, res) => {
  res.json({
    success: true,
    data: metodosPago.map(mp => ({
      id: mp,
      nombre: mp.replace(/_/g, ' ').toUpperCase()  //Efectivo, TARJETA CREDITO, etc.
    }))
  });
});

// ============================================================
// RUTA DE SALUD
// ============================================================
app.get('/health', (req, res) => {
  res.json({ status: 'OK', service: 'Procesamiento de Pagos' });
});

// ============================================================
// INICIO DEL SERVIDOR
// ============================================================
app.listen(PORT, '0.0.0.0', () => {
  console.log('Contenedor 4 - Procesamiento de Pagos corriendo en puerto ' + PORT);
});
