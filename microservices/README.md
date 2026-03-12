# Microservicios

Colección de 4 microservicios que demuestran diferentes protocolos de comunicación y tecnologías: gRPC, RPC personalizado, MQTT y REST con MessagePack.

| Servicio | Lenguaje | Protocolo | Puerto | Descripción |
|----------|----------|-----------|--------|-------------|
| grpc-java | Java 17 | gRPC | 50051 | Cálculo de determinantes de matrices |
| minirsi-node | JavaScript | RPC/TCP | 50052 | Calculadora con stubs generados |
| mqtt-node-ts | TypeScript | MQTT | 1883 (broker) | Sensor climático simulado |
| msgpack-python | Python 3.12 | HTTP/MessagePack | 50044 | CRUD de equipos de fútbol |

---

## grpc-java — Determinante de Matrices

Servicio gRPC que calcula el determinante de matrices cuadradas usando expansión por cofactores. El servidor genera matrices aleatorias con valores entre -10 y +10, y calcula su determinante de forma recursiva.

### Tecnologías

- Java 17, gRPC 1.68.1, Protocol Buffers (proto3), Maven

### Instalación y uso

```bash
cd grpc-java/matrix-det

# Compilar
mvn clean compile

# Ejecutar el servidor (escucha en puerto 50051)
mvn exec:java
```

**Requisitos:** Java 17+, Maven 3.x

### Archivos principales

- `src/main/proto/matrix_determinant.proto` — Definición del servicio gRPC
- `src/main/java/com/matrix/det/App.java` — Punto de entrada del servidor
- `src/main/java/com/matrix/det/MatrixDeterminantServiceImpl.java` — Implementación del cálculo de determinantes

---

## minirsi-node — Calculadora RPC

Sistema RPC personalizado con generación de código. Un compilador lee un archivo de definición de protocolo (`proto.txt`) y genera stubs de servidor y cliente para un servicio de calculadora con operaciones de suma, resta, multiplicación y división.

### Tecnologías

- Node.js, TCP Sockets (`node:net`), JSON como formato de serialización

### Instalación y uso

```bash
cd minirsi-node

# (Opcional) Regenerar stubs desde proto.txt
cd compiler && node Compiler.js && cd ..

# Terminal 1: Iniciar el servidor
cd server
npm start
# Escucha en puerto 50052

# Terminal 2: Ejecutar el cliente interactivo
cd client
npm start
# Menú interactivo: seleccionar operación (1-4), ingresar números
```

**Requisitos:** Node.js

### Archivos principales

- `compiler/proto.txt` — Definición del servicio (puerto, métodos, parámetros)
- `compiler/Compiler.js` — Generador de código que produce stubs de servidor y cliente
- `server/Dispatcher.js` — Servidor TCP con despacho dinámico de métodos
- `server/Calculator.js` — Implementación de las operaciones
- `client/cli.js` — Cliente CLI interactivo

### Protocolo

- Transporte: TCP con JSON delimitado por saltos de línea
- Request: `{"class": "Calculator", "method": "add", "params": [1, 2]}`
- Response: `{"status": "ok", "response": 3}`

---

## mqtt-node-ts — Sensor Climático MQTT

Sistema pub/sub con MQTT que simula un sensor climático. El sensor publica lecturas simuladas de temperatura y humedad, y responde a solicitudes de datos a través de topics MQTT.

### Tecnologías

- TypeScript 5.9, Node.js, MQTT (mqtt 5.15), pnpm

### Instalación y uso

```bash
cd mqtt-node-ts

# Instalar dependencias
pnpm install

# Prerequisito: broker MQTT en localhost:1883
# Puedes usar Mosquitto con Docker:
docker run -d -p 1883:1883 eclipse-mosquitto

# Terminal 1: Ejecutar el sensor
npm run sensor
# Publica lecturas cada 200ms

# Terminal 2: Ejecutar el consumidor
npm run consumer
# Comandos: "temp", "hum", "all", "ex" (salir)

# Compilar TypeScript a JavaScript
npm run build
```

**Requisitos:** Node.js, pnpm, broker MQTT (ej. Mosquitto)

### Archivos principales

- `src/sensor.ts` — Simulador de sensor (temperatura: -10 a 45°C, humedad: 10 a 95%)
- `src/consumer.ts` — Cliente CLI interactivo que solicita lecturas
- `tsconfig.json` — Configuración de TypeScript (ES2022, strict mode)

### Topics MQTT

- `sensor/climate/request` — Solicitudes del consumidor al sensor
- `sensor/climate/response` — Respuestas del sensor con datos JSON

---

## msgpack-python — API REST de Equipos de Fútbol

API REST construida con FastAPI que gestiona datos de equipos de fútbol, usando MessagePack como formato de serialización binaria en lugar de JSON. Los datos se almacenan en PostgreSQL.

### Tecnologías

- Python 3.12, FastAPI 0.135, Uvicorn, PostgreSQL, MessagePack, Pydantic

### Instalación y uso

```bash
cd msgpack-python

# Crear y activar entorno virtual
python3 -m venv .venv
source .venv/bin/activate

# Instalar dependencias
pip install -r requirements.txt

# Configurar la base de datos PostgreSQL
# Editar .env con tus credenciales:
#   DATABASE_URL=postgresql://postgres:PASSWORD@localhost:5432/teams
#   PORT=50044

# Crear la base de datos (si es necesario)
psql -U postgres -f teams_backup.sql

# Ejecutar el servidor
python main.py
# Uvicorn en http://0.0.0.0:50044

# Ejecutar el cliente de prueba
python client.py
```

**Requisitos:** Python 3.12+, PostgreSQL

### Endpoints

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/teams` | Listar todos los equipos |
| GET | `/teams/{teamId}` | Obtener un equipo por UUID |
| POST | `/teams` | Crear un nuevo equipo |
| PUT | `/teams/{teamId}` | Actualizar un equipo |
| DELETE | `/teams/{teamId}` | Eliminar un equipo |

Todas las respuestas usan `Content-Type: application/msgpack`.

### Archivos principales

- `main.py` — Punto de entrada, configura FastAPI y Uvicorn
- `app/api/routes/teamRoutes.py` — Endpoints REST (CRUD)
- `app/schemas/teamSchemas.py` — Modelos Pydantic de validación
- `app/utils/messagePack.py` — Serialización/deserialización MessagePack
- `app/db/session.py` — Gestión de conexión a PostgreSQL
- `.env` — Configuración de base de datos y puerto
