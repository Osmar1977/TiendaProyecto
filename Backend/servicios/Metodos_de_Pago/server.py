from flask import Flask, jsonify, request
import sqlite3, uuid, random, os

aplicacion = Flask(__name__)
BASE_DATOS = '/data/metodos_pago.db'
PUERTO     = int(os.environ.get('PUERTO', 3008))

METODOS_DISPONIBLES = [
    {'id': 'efectivo',        'nombre': 'Efectivo'},
    {'id': 'tarjeta_credito', 'nombre': 'Tarjeta Crédito'},
    {'id': 'tarjeta_debito',  'nombre': 'Tarjeta Débito'},
    {'id': 'transferencia',   'nombre': 'Transferencia'},
    {'id': 'nequi',           'nombre': 'Nequi'},
    {'id': 'daviplata',       'nombre': 'Daviplata'},
]

# Crear tabla
def iniciar_base_datos():
    conexion = sqlite3.connect(BASE_DATOS)
    conexion.execute('''
        CREATE TABLE IF NOT EXISTS transacciones (
            id            INTEGER PRIMARY KEY AUTOINCREMENT,
            sesion_id     TEXT NOT NULL,
            metodo_pago   TEXT NOT NULL,
            monto         REAL NOT NULL,
            numero_pedido TEXT NOT NULL,
            referencia    TEXT NOT NULL,
            creado_en     TEXT DEFAULT (datetime('now'))
        )
    ''')
    conexion.commit()
    conexion.close()

# Abrir base de datos
def abrir():
    conexion = sqlite3.connect(BASE_DATOS)
    conexion.row_factory = sqlite3.Row
    return conexion

# Listar métodos de pago
@aplicacion.route('/api/pagos/metodos', methods=['GET'])
def listar_metodos():
    return jsonify({'exito': True, 'datos': METODOS_DISPONIBLES})

# Procesar pago
@aplicacion.route('/api/pagos/procesar', methods=['POST'])
def procesar_pago():
    datos = request.json or {}
    campos_requeridos = ['sessionId', 'items', 'total', 'metodoPago']
    for campo in campos_requeridos:
        if campo not in datos:
            return jsonify({'exito': False, 'mensaje': f'Falta el campo: {campo}'}), 400

    if not datos['items']:
        return jsonify({'exito': False, 'mensaje': 'El carrito está vacío'}), 400

    metodos_validos = [m['id'] for m in METODOS_DISPONIBLES]
    if datos['metodoPago'] not in metodos_validos:
        return jsonify({'exito': False, 'mensaje': 'Método de pago no válido'}), 400

    numero_pedido   = 'PED-' + str(uuid.uuid4())[:5].upper()
    referencia      = str(uuid.uuid4())[:12].upper()
    tiempo_estimado = random.randint(15, 35)

    conexion = abrir()
    conexion.execute(
        'INSERT INTO transacciones (sesion_id, metodo_pago, monto, numero_pedido, referencia) VALUES (?,?,?,?,?)',
        (datos['sessionId'], datos['metodoPago'], datos['total'], numero_pedido, referencia)
    )
    conexion.commit()
    conexion.close()

    return jsonify({
        'exito': True,
        'mensaje': 'Pago procesado exitosamente',
        'datos': {
            'numeroPedido':        numero_pedido,
            'estado':              'confirmado',
            'tiempoEstimado':      tiempo_estimado,
            'mensajeConfirmacion': f'¡Compra procesada! Tu pedido #{numero_pedido} está en camino. Tiempo estimado: {tiempo_estimado} minutos.'
        }
    }), 201

# Ver historial de pagos
@aplicacion.route('/api/pagos/historial/<sesion_id>', methods=['GET'])
def historial(sesion_id):
    conexion = abrir()
    filas    = conexion.execute(
        'SELECT * FROM transacciones WHERE sesion_id=? ORDER BY creado_en DESC', (sesion_id,)
    ).fetchall()
    conexion.close()
    return jsonify({'exito': True, 'datos': [dict(f) for f in filas]})

# Estado del servicio
@aplicacion.route('/health')
def estado():
    return jsonify({'estado': 'OK', 'servicio': 'Metodos de Pago'})

if __name__ == '__main__':
    iniciar_base_datos()
    aplicacion.run(host='0.0.0.0', port=PUERTO)
