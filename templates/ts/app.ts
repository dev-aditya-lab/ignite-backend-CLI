import express from 'express';
import dotenv from 'dotenv';
dotenv.config();

const app = express();
app.use(express.json());

import exampleRoutes from './src/routes/exampleRoutes.js';
app.use('/api/examples', exampleRoutes);

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', service: '{{projectName}}' });
});

export default app;
