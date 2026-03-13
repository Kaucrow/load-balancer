import express from 'express';
import Monitor from './monitor.js';

const app = express();
const HOST = process.env.HOST || '0.0.0.0';
const PORT = process.env.PORT || 3000;

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

app.listen(PORT, () => {
  console.log(`gateway escuchando en http://${HOST}:${PORT}`);
});


process.on('SIGINT', async () => {
    console.log('\n\n🛑 Deteniendo...');
    process.exit();
});