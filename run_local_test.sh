#!/bin/bash

ROOT="$(cd "$(dirname "$0")" && pwd)"

cleanup() {
    echo ""
    echo "Deteniendo todo..."
    kill $PID_MSGPACK $PID_RSI $PID_GRPC $PID_MQTT $PID_GW1 $PID_GW2 $PID_LB 2>/dev/null
    wait 2>/dev/null
    echo "Listo."
    exit 0
}
trap cleanup SIGINT SIGTERM

echo "=== Iniciando microservicios ==="

cd "$ROOT/microservices"

./msgpack-python/run.sh &
PID_MSGPACK=$!
echo "[OK] msgpack-python (puerto 50044) PID=$PID_MSGPACK"

node ./minirsi-node/server/Dispatcher.js &
PID_RSI=$!
echo "[OK] minirsi-node RSI (puerto 50052) PID=$PID_RSI"

mvn -f ./grpc-java/matrix-det/pom.xml exec:java -q &
PID_GRPC=$!
echo "[OK] grpc-java (puerto 50051) PID=$PID_GRPC"

npm run --prefix mqtt-node-ts sensor &
PID_MQTT=$!
echo "[OK] mqtt sensor (puerto 1883) PID=$PID_MQTT"

echo ""
echo "Esperando 5s para que los microservicios inicien..."
sleep 5

# echo ""
# echo "=== Iniciando load balancer ==="

# cd "$ROOT/load-balancer"
# cargo run --release &
# PID_LB=$!
# echo "[OK] load-balancer en http://127.0.0.1:8080 PID=$PID_LB"

# echo ""
# echo "============================================"
# echo "  Todo corriendo. Endpoints disponibles:"
# echo "  POST http://127.0.0.1:8080/rsi"
# echo "  POST http://127.0.0.1:8080/grpc"
# echo "  POST http://127.0.0.1:8080/msgpack"
# echo "  POST http://127.0.0.1:8080/mqtt"
# echo "  GET  http://127.0.0.1:8080/info"
# echo ""
# echo "  Presiona Ctrl+C para detener todo."
# echo "============================================"

wait
