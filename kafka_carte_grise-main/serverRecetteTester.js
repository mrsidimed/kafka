/**
 * Minimal endpoint that just logs every recette it receives.
 *
 *   $ node mock-recette-endpoint.js
 *   → listening on http://localhost:4000/recettes
 *
 * Point your consumer’s `envVars.endpointUrl`
 * at:  http://localhost:4000/recettes
 */

const express = require('express');
const fs       = require('fs');
const app      = express();

app.use(express.json({ limit: '2mb' }));     // parse JSON bodies

// POST /recettes  — the target your consumer will hit
app.post('/recettes', (req, res) => {
  const recette = req.body;

  // 1) Print to console
  console.log('\n📥  Recette received at mock endpoint:');
  console.dir(recette, { depth: null, colors: true });

  // 3) Reply 200 OK
  res.status(200).json({ status: 'mock-ok' });
});

// Basic health check
app.get('/health', (_, res) => res.json({ ok: true }));

const PORT = 4000;
app.listen(PORT, () => console.log(`🚀  Mock endpoint listening on :${PORT}/recettes`));
