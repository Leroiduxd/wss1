import express from 'express';
import fetch from 'node-fetch';

const app = express();
const PORT = process.env.PORT || 3000;
const API_KEY = '1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2';
const API_URL = 'https://prod-kline-rest.supra.com/latest?trading_pair=link_usdt';

let cachedPrice = null;
let lastUpdate = 0;

// Mise à jour automatique toutes les 2 secondes
const fetchPrice = async () => {
  try {
    const res = await fetch(API_URL, {
      headers: { 'x-api-key': API_KEY }
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();

    if (data && data.price) {
      cachedPrice = data.price;
      lastUpdate = Date.now();
      console.log('✅ Prix mis à jour:', cachedPrice);
    } else {
      console.warn('❌ Donnée manquante dans la réponse:', data);
    }
  } catch (err) {
    console.error('❌ Erreur de récupération:', err.message);
  }
};

setInterval(fetchPrice, 2000);
fetchPrice(); // Lancer au démarrage

app.get('/price', (req, res) => {
  if (cachedPrice) {
    res.json({ price: cachedPrice, updatedAt: lastUpdate });
  } else {
    res.status(503).json({ error: 'Prix non encore disponible' });
  }
});

// ✅ Modification ici : écoute sur toutes les interfaces, pas juste localhost
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Serveur lancé sur http://0.0.0.0:${PORT}`);
});

