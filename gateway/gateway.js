import express from 'express';
import Monitor from './monitor.js';
import msgPackClient from './microservices-clients/msgpack/msgpack.js';
import calculatorProxy from './microservices-clients/rsi/CalculatorProxy.js';
import calculateDeterminant from './microservices-clients/grpc/src/grpc-client.js';
import mqttClient from './microservices-clients/mqtt/mqtt.js';

const app = express();
app.use(express.json());
const HOST = process.env.HOST || '0.0.0.0';
const PORT = process.env.PORT || 3000;

app.use(async (req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const ms = Date.now() - start;
    console.log(`[${PORT}] ${req.method} ${req.path} → ${res.statusCode} (${ms}ms)`);
  });
  try {
    const info = await Monitor.getInfo();
    res.set({
      'X-Avail-Ram': info.availRam,
      'X-Avail-CPU': info.availCpu,
      'X-Disk-Free-Size': info.diskFreeSize
    });
  } catch (error) {
    console.error('Error en middleware de headers:', error);
  }
  next(); // Siempre continuar aunque fallen los headers
});

app.get('/info', async (req, res) => {
  try {
    const info = await Monitor.getInfo();
    res.json(info);
  } catch (err) {
    res.status(500).json({ error: 'no se pudo obtener info', details: err.message });
  }
});

app.get('/specs', async (req, res) => {
  try {
    const specs = await Monitor.getSpecs();
    res.json(specs);
  } catch (err) {
    res.status(500).json({ error: 'no se pudo obtener specs', details: err.message });
  }
});

app.post('/msgpack', async (req, res) => {
  try{
    const response = await Reflect.apply(msgPackClient[req.body["action"]], msgPackClient, req.body.params);
    res.json(response);
  } catch(err) {
    res.status(500).json({ error: 'no se pudo procesar msgpack', details: err.message });
  }
});

app.post('/rsi', async (req, res) => {
  try{
    const response = await Reflect.apply(calculatorProxy[req.body["action"]], calculatorProxy, req.body.params);
    res.json(response);
  } catch(err) {
    res.status(500).json({ error: 'no se pudo procesar rsi', details: err.message });
  }
});

app.post('/grpc', async (req, res) => {
  try{
    const rows = req.body.rows ?? 3;
    const response = await calculateDeterminant({ rows, cols: rows });
    res.json(response);
  } catch(err) {
    res.status(500).json({ error: 'no se pudo procesar grpc', details: err.message });
  }
});

app.post('/mqtt', async (req, res) => {
  try{
    const response = await mqttClient.request(req.body.option, 3000);
    res.json(response);
  } catch(err) {
    res.status(500).json({ error: 'no se pudo procesar mqtt', details: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`gateway escuchando en http://${HOST}:${PORT}`);
});

process.on('SIGINT', async () => {
    console.log('\n\n🛑 Deteniendo...');
    process.exit();
});