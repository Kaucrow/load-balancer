#!/bin/bash

ROOT="$(cd "$(dirname "$0")" && pwd)"

cleanup() {
    echo ""
    echo "Deteniendo microservicios..."
    kill $PID_MSGPACK $PID_RSI $PID_GRPC $PID_MQTT 2>/dev/null
    wait 2>/dev/null
    echo "Listo."
    exit 0
}
trap cleanup SIGINT SIGTERM

echo "Iniciando MSGPack (puerto 50044)..."
cd "$ROOT/msgpack-python"
.venv/bin/uvicorn main:app --port 50044 &
PID_MSGPACK=$!

echo "Iniciando minirsi (puerto 50052)..."
node "$ROOT/minirsi-node/server/Dispatcher.js" &
PID_RSI=$!

echo "Iniciando grpc-java (puerto 50051)..."
mvn -f "$ROOT/grpc-java/matrix-det/pom.xml" exec:java -q &
PID_GRPC=$!

echo "Iniciando mqtt sensor (puerto 1883)..."
npm run sensor --prefix "$ROOT/mqtt-node-ts" &
PID_MQTT=$!

echo ""
echo "Todos los microservicios iniciados. Presiona Ctrl+C para detener."
wait
