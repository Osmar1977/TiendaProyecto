from flask import Flask, jsonify, request
import sqlite3, os

aplicacion = Flask(__name__)
BASE_DATOS = '/data/pedidos.db'
PUERTO     = int(os.environ.get('PUERTO', 3007))

# Crear tablas
def iniciar_base_datos():
    conexion = sqlite3.connect(BASE_DATOS)
    conexion.executescript('''
        CREATE TABLE IF NOT EXISTS pedidos (
            id              INTEGER PRIMARY KEY AUTOINCREMENT,
            numero_pedido   TEXT NOT NULL,
            sesion_id       TEXT NOT NULL,
            total           REAL NOT NULL,
            metodo_pago     TEXT NOT NULL,
            tiempo_estimado INTEGER,
            creado_en       TEXT DEFAULT (datetime('now'))
        );
        CREATE TABLE IF NOT EXISTS detalle_pedido (
            id          INTEGER PRIMARY KEY AUTOINCREMENT,
            pedido_id   INTEGER NOT NULL,
            producto_id INTEGER NOT NULL,
            nombre      TEXT    NOT NULL,
            precio      REAL    NOT NULL,
            cantidad    INTEGER NOT NULL
        );
    ''')
    conexion.commit()
    conexion.close()

# Abrir base de datos
def abrir():
    conexion = sqlite3.connect(BASE_DATOS)
    conexion.row_factory = sqlite3.Row
    return conexion

# Crear pedido
@aplicacion.route('/api/pedidos', methods=['POST'])
def crear_pedido():
    datos = request.json or {}
    campos_requeridos = ['sessionId', 'items', 'total', 'metodoPago', 'numeroPedido', 'tiempoEstimado']
    for campo in campos_requeridos:
        if campo not in datos:
            return jsonify({'exito': False, 'mensaje': f'Falta el campo: {campo}'}), 400

    conexion = abrir()
    cursor = conexion.execute(
        'INSERT INTO pedidos (numero_pedido, sesion_id, total, metodo_pago, tiempo_estimado) VALUES (?,?,?,?,?)',
        (datos['numeroPedido'], datos['sessionId'], datos['total'], datos['metodoPago'], datos['tiempoEstimado'])
    )
    conexion.commit()
    id_pedido = cursor.lastrowid

    for articulo in datos['items']:
        conexion.execute(
            'INSERT INTO detalle_pedido (pedido_id, producto_id, nombre, precio, cantidad) VALUES (?,?,?,?,?)',
            (id_pedido, articulo.get('productoId', 0), articulo.get('nombre', ''), articulo.get('precio', 0), articulo.get('cantidad', 1))
        )
    conexion.commit()
    conexion.close()
    return jsonify({'exito': True, 'mensaje': 'Pedido guardado', 'datos': {'id_pedido': id_pedido}}), 201

# Ver historial de pedidos
@aplicacion.route('/api/pedidos/sesion/<sesion_id>', methods=['GET'])
def historial(sesion_id):
    conexion = abrir()
    filas    = conexion.execute(
        'SELECT * FROM pedidos WHERE sesion_id=? ORDER BY creado_en DESC', (sesion_id,)
    ).fetchall()
    conexion.close()
    return jsonify({'exito': True, 'datos': [dict(f) for f in filas]})

# Ver detalle de un pedido
@aplicacion.route('/api/pedidos/<int:id_pedido>', methods=['GET'])
def detalle(id_pedido):
    conexion = abrir()
    pedido   = conexion.execute('SELECT * FROM pedidos WHERE id=?', (id_pedido,)).fetchone()
    if not pedido:
        conexion.close()
        return jsonify({'exito': False, 'mensaje': 'Pedido no encontrado'}), 404
    articulos = conexion.execute('SELECT * FROM detalle_pedido WHERE pedido_id=?', (id_pedido,)).fetchall()
    conexion.close()
    return jsonify({'exito': True, 'datos': {**dict(pedido), 'articulos': [dict(a) for a in articulos]}})

# Estado del servicio
@aplicacion.route('/health')
def estado():
    return jsonify({'estado': 'OK', 'servicio': 'Pedidos'})

if __name__ == '__main__':
    iniciar_base_datos()
    aplicacion.run(host='0.0.0.0', port=PUERTO)
