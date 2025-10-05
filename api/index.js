// Fichier: api/index.js
// C'est un serveur de test "Hello World"

const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());

// Une seule route pour tester
app.get('/api/books', (req, res) => {
  console.log("La route de test /api/books a été appelée !");
  res.status(200).json([
    { isbn: '123', title: 'Livre de Test 1' },
    { isbn: '456', title: 'Livre de Test 2' }
  ]);
});

// Exporter pour Vercel
module.exports = app;
