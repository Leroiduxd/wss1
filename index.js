import { WebSocketServer } from 'ws';
import fetch from 'node-fetch';

// Configuration
const PORT = 8081;
const API_KEY = '1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2';
const BASE_URL = 'https://prod-kline-rest.supra.com';
const PAIR = 'link_usdt';

const PAIR_METADATA = {
  id: 2,
  name: 'CHAINLINK',
  tradingPair: 'link_usdt'
};

// WebSocket server
const wss = new WebSocketServer({
  port: PORT,
  perMessageDeflate: {
    zlibDeflateOptions: { level: 9 },
    zlibInflateOptions: { chunkSize: 1024 },
    clientNoContextTakeover: true,
    serverNoContextTakeover: true,
    threshold: 0
  }
});

console.log(`✅ Serveur WebSocket lancé sur le port ${PORT}`);

// Fonction principale de récupération & broadcast
async function fetchAndBroadcast() {
  try {
    const res = await fetch(`${BASE_URL}/latest?trading_pair=${PAIR}`, {
      headers: { 'x-api-key': API_KEY }
    });

    const raw = await res.json();

    const result = {
      [PAIR]: {
        id: PAIR_METADATA.id,
        name: PAIR_METADATA.name,
        ...raw
      }
    };

    const payload = JSON.stringify(result);

    wss.clients.forEach(client => {
      if (client.readyState === 1) {
        client.send(payload);
      }
    });
  } catch (err) {
    console.error("❌ Erreur récupération prix:", err.message);
  }
}

// Mise à jour toutes les 1.5s
setInterval(fetchAndBroadcast, 1500);

// Déconnexion automatique après inactivité
wss.on('connection', ws => {
  console.log("🟢 Nouveau client connecté");

  let timeout = setTimeout(() => {
    ws.terminate();
    console.log("🔴 Déconnecté après 5 minutes d'inactivité");
  }, 5 * 60 * 1000);

  ws.on('message', () => {
    clearTimeout(timeout);
    timeout = setTimeout(() => {
      ws.terminate();
      console.log("🔴 Déconnecté après 5 minutes d'inactivité");
    }, 5 * 60 * 1000);
  });

  ws.on('close', () => {
    clearTimeout(timeout);
  });
});
