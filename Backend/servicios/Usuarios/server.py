from flask import Flask, jsonify, request
import sqlite3, hashlib, os

aplicacion = Flask(__name__)
BASE_DATOS = '/data/usuarios.db'
PUERTO     = int(os.environ.get('PUERTO', 3005))

# Crear tabla
def iniciar_base_datos():
    conexion = sqlite3.connect(BASE_DATOS)
    conexion.execute('''
        CREATE TABLE IF NOT EXISTS usuarios (
            id          INTEGER PRIMARY KEY AUTOINCREMENT,
            usuario     TEXT UNIQUE NOT NULL,
            contrasena  TEXT NOT NULL,
            creado_en   TEXT DEFAULT (datetime('now'))
        )
    ''')
    conexion.commit()
    conexion.close()

# Abrir base de datos
def abrir():
    conexion = sqlite3.connect(BASE_DATOS)
    conexion.row_factory = sqlite3.Row
    return conexion

# Registrar usuario
@aplicacion.route('/api/usuarios/registro', methods=['POST'])
def registro():
    datos      = request.json or {}
    usuario    = datos.get('usuario', '').strip()
    contrasena = datos.get('contrasena', '').strip()

    if not usuario or not contrasena:
        return jsonify({'exito': False, 'mensaje': 'usuario y contrasena son requeridos'}), 400

    conexion = abrir()
    if conexion.execute('SELECT id FROM usuarios WHERE usuario=?', (usuario,)).fetchone():
        conexion.close()
        return jsonify({'exito': False, 'mensaje': 'El usuario ya existe'}), 409

    contrasena_cifrada = hashlib.sha256(contrasena.encode()).hexdigest()
    cursor = conexion.execute('INSERT INTO usuarios (usuario, contrasena) VALUES (?,?)', (usuario, contrasena_cifrada))
    conexion.commit()
    nuevo_id = cursor.lastrowid
    conexion.close()
    return jsonify({'exito': True, 'mensaje': 'Usuario registrado', 'datos': {'id': nuevo_id, 'usuario': usuario}}), 201

# Iniciar sesión
@aplicacion.route('/api/usuarios/login', methods=['POST'])
def iniciar_sesion():
    datos      = request.json or {}
    usuario    = datos.get('usuario', '').strip()
    contrasena = datos.get('contrasena', '').strip()

    if not usuario or not contrasena:
        return jsonify({'exito': False, 'mensaje': 'usuario y contrasena son requeridos'}), 400

    contrasena_cifrada = hashlib.sha256(contrasena.encode()).hexdigest()
    conexion = abrir()
    fila = conexion.execute(
        'SELECT * FROM usuarios WHERE usuario=? AND contrasena=?', (usuario, contrasena_cifrada)
    ).fetchone()
    conexion.close()

    if not fila:
        return jsonify({'exito': False, 'mensaje': 'Credenciales inválidas'}), 401

    return jsonify({'exito': True, 'mensaje': 'Sesión iniciada', 'datos': {'id': fila['id'], 'usuario': fila['usuario']}})

# Estado del servicio
@aplicacion.route('/health')
def estado():
    return jsonify({'estado': 'OK', 'servicio': 'Usuarios'})

if __name__ == '__main__':
    iniciar_base_datos()
    aplicacion.run(host='0.0.0.0', port=PUERTO)
