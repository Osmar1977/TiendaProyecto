from flask import Flask, jsonify, request
import sqlite3, os

aplicacion = Flask(__name__)
BASE_DATOS = '/data/carrito.db'
PUERTO     = int(os.environ.get('PUERTO', 3006))

# Crear tabla
def iniciar_base_datos():
    conexion = sqlite3.connect(BASE_DATOS)
    conexion.execute('''
        CREATE TABLE IF NOT EXISTS carrito (
            id          INTEGER PRIMARY KEY AUTOINCREMENT,
            sesion_id   TEXT    NOT NULL,
            producto_id INTEGER NOT NULL,
            nombre      TEXT    NOT NULL,
            precio      REAL    NOT NULL,
            cantidad    INTEGER DEFAULT 1
        )
    ''')
    conexion.commit()
    conexion.close()

# Abrir base de datos
def abrir():
    conexion = sqlite3.connect(BASE_DATOS)
    conexion.row_factory = sqlite3.Row
    return conexion

# Ver carrito
@aplicacion.route('/api/carrito/<sesion_id>', methods=['GET'])
def ver_carrito(sesion_id):
    conexion  = abrir()
    productos = conexion.execute('SELECT * FROM carrito WHERE sesion_id=?', (sesion_id,)).fetchall()
    conexion.close()

    lista  = [dict(p) for p in productos]
    total  = sum(p['precio'] * p['cantidad'] for p in lista)
    cantidad_total = sum(p['cantidad'] for p in lista)

    return jsonify({'exito': True, 'datos': {'productos': lista, 'cantidad_total': cantidad_total, 'total': round(total, 2)}})

# Agregar producto
@aplicacion.route('/api/carrito/agregar', methods=['POST'])
def agregar():
    datos       = request.json or {}
    sesion_id   = datos.get('sessionId') or datos.get('sesion_id')
    producto_id = datos.get('productoId') or datos.get('producto_id')
    nombre      = datos.get('nombre', '')
    precio      = float(datos.get('precio', 0))
    cantidad    = int(datos.get('cantidad', 1))

    if not sesion_id or not producto_id:
        return jsonify({'exito': False, 'mensaje': 'Faltan datos obligatorios'}), 400

    conexion  = abrir()
    existente = conexion.execute(
        'SELECT * FROM carrito WHERE sesion_id=? AND producto_id=?', (sesion_id, producto_id)
    ).fetchone()

    if existente:
        nueva_cantidad = existente['cantidad'] + cantidad
        conexion.execute('UPDATE carrito SET cantidad=? WHERE id=?', (nueva_cantidad, existente['id']))
    else:
        conexion.execute(
            'INSERT INTO carrito (sesion_id, producto_id, nombre, precio, cantidad) VALUES (?,?,?,?,?)',
            (sesion_id, producto_id, nombre, precio, cantidad)
        )

    conexion.commit()
    conexion.close()
    return jsonify({'exito': True, 'mensaje': 'Producto agregado al carrito'}), 201

# Vaciar carrito
@aplicacion.route('/api/carrito/<sesion_id>', methods=['DELETE'])
def vaciar(sesion_id):
    conexion = abrir()
    conexion.execute('DELETE FROM carrito WHERE sesion_id=?', (sesion_id,))
    conexion.commit()
    conexion.close()
    return jsonify({'exito': True, 'mensaje': 'Carrito vaciado'})

# Estado del servicio
@aplicacion.route('/health')
def estado():
    return jsonify({'estado': 'OK', 'servicio': 'Carrito'})

if __name__ == '__main__':
    iniciar_base_datos()
    aplicacion.run(host='0.0.0.0', port=PUERTO)
