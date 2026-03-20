# Sistema de Pedidos para Restaurante de Comidas Rápidas

Sistema de pedidos en línea con arquitectura de microservicios basados en contenedores Docker.

## Arquitectura

El sistema está compuesto por **4 contenedores independientes**:

| Contenedor | Servicio | Puerto | Descripción |
|------------|----------|--------|-------------|
| 1 | Autenticación | 3001 | Gestión de inicio de sesión, validación de credenciales y control de acceso |
| 2 | Categorías | 3002 | Menú principal: bebidas, almuerzos, comida chatarra y mecato |
| 3 | Productos | 3003 | Productos por categoría y gestión del carrito de compras |
| 4 | Pagos | 3004 | Procesamiento de pagos y confirmación de pedidos |

## Requisitos Previos

- Docker Desktop instalado
- Docker Compose instalado

## Instrucciones de Uso

### 1. Iniciar todos los contenedores

```bash
docker-compose up -d
```

### 2. Ver logs de los contenedores

```bash
docker-compose logs -f
```

### 3. Detener los contenedores

```bash
docker-compose down
```

### 4. Reconstruir contenedores (si hay cambios)

```bash
docker-compose up -d --build
```

## Endpoints de la API

### Contenedor 1 - Autenticación (Puerto 3001)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/api/login` | Iniciar sesión |
| POST | `/api/logout` | Cerrar sesión |
| POST | `/api/register` | Registrar nuevo usuario |
| GET | `/api/validar` | Validar token |

### Contenedor 2 - Categorías (Puerto 3002)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/categorias` | Obtener todas las categorías |
| GET | `/api/categorias/:id` | Obtener categoría específica |
| POST | `/api/seleccionar-categoria` | Seleccionar una categoría |

### Contenedor 3 - Productos (Puerto 3003)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/productos/:categoria` | Obtener productos por categoría |
| GET | `/api/productos/:categoria/:id` | Obtener producto específico |
| POST | `/api/carrito/agregar` | Agregar producto al carrito |
| GET | `/api/carrito/:sessionId` | Ver carrito |
| DELETE | `/api/carrito/:sessionId/:productoId` | Eliminar producto del carrito |
| DELETE | `/api/carrito/:sessionId` | Vaciar carrito |

### Contenedor 4 - Pagos (Puerto 3004)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/api/pagos/procesar` | Procesar pago |
| GET | `/api/pedidos/:sessionId` | Consultar estado del pedido |
| POST | `/api/pedidos/confirmar` | Confirmar pedido |
| POST | `/api/pedidos/cancelar` | Cancelar pedido |
| GET | `/api/pagos/metodos` | Obtener métodos de pago |

## Comunicación Entre Contenedores

Los contenedores se comunican a través de la red interna `red-restaurante` con la subred `172.20.0.0/16`.

Los contenedores pueden comunicarse entre sí usando los nombres de servicio:
- `http://autenticacion:3001`
- `http://categorias:3002`
- `http://productos:3003`
- `http://pagos:3004`

## Estructura de Proyecto

```
COMIDA 2/
├── CONTENEDOR 1/
│   ├── package.json          # Dependencias Node.js
│   ├── server.js             # Servidor y lógica
│   ├── Dockerfile            # Imagen Docker
│   └── requirements.txt      # Lista de dependencias
├── CONTENEDOR 2/
│   ├── package.json
│   ├── server.js
│   ├── Dockerfile
│   └── requirements.txt
├── CONTENEDOR 3/
│   ├── package.json
│   ├── server.js
│   ├── Dockerfile
│   └── requirements.txt
├── CONTENEDOR 4/
│   ├── package.json
│   ├── server.js
│   ├── Dockerfile
│   └── requirements.txt
├── docker-compose.yml        # Orquestación de contenedores
└── README.md                 # Este archivo
```

## Ejemplo de Flujo de Usuario

1. **Autenticación**: El usuario inicia sesión en el Contenedor 1
2. **Selección de Categoría**: El usuario ve las categorías en el Contenedor 2
3. **Selección de Productos**: El usuario selecciona productos del Contenedor 3
4. **Pago**: El usuario realiza el pago en el Contenedor 4 y recibe confirmación

## Usuarios de Prueba

| Usuario | Contraseña | Rol |
|---------|------------|-----|
| admin | admin123 | Administrador |
| cliente1 | cliente123 | Cliente |
| cliente2 | pass123 | Cliente |

## Cómo Funciona el Sistema

### Paso 1: El usuario accede al sistema
- Abre http://localhost:3001
- Ve la página de login/registro

### Paso 2: Autenticación
- El usuario inicia sesión o se registra
- El Contenedor 1 valida las credenciales
- Si es exitoso, genera un token de sesión

### Paso 3: Ver categorías
- El Frontend llama al Contenedor 2
- Devuelve las 4 categorías disponibles

### Paso 4: Seleccionar productos
- El usuario elige una categoría
- El Frontend llama al Contenedor 3
- Muestra los productos de esa categoría
- El usuario agrega productos al carrito

### Paso 5: Pagar
- El usuario revisa su carrito
- Selecciona método de pago
- El Contenedor 4 procesa el pago
- Genera número de pedido y tiempo estimado

### Paso 6: Confirmación
- El usuario ve el mensaje de confirmación
- "Tu pedido está en camino"
