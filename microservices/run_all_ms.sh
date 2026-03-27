#!/bin/bash

echo "Iniciando MSGPack..."
./msgpack-python/run.sh &
PID_MSGPACK=$!

echo "Iniciando minirsi..."
node ./minirsi-node/server/Dispatcher.js &
PID_RSI=$!

echo "Iniciando grpc"
mvn -f ./grpc-java/matrix-det/pom.xml exec:java &
PID_GRPC=$!

echo "Iniciando mqtt"
npm run --prefix mqtt-node-ts sensor &
PID_MQTT=$!

# Esperar a que terminen (opcional)
wait $PID_MSGPACK
wait $PID_RSI
wait $PID_GRPC
wait $PID_MQTT

echo "Todos los scripts han terminado"
