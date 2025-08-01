require('dotenv').config();
const WebSocket = require('ws');
const fetch = require('node-fetch');
const https = require('https');

const wss = new WebSocket.Server({ port: 8081 }, () => {
  console.log('✅ wss1 lancé sur le port 8081');
});

const clients = new Set();
const agent = new https.Agent({ family: 4 }); // Force IPv4
const PAIR = 'link_usdt';
const API_URL = `https://prod-kline-rest.supra.com/latest?trading_pair=${PAIR}`;

wss.on('connection', (ws) => {
  console.log('✅ Client connecté à wss1');
  clients.add(ws);

  ws.on('close', () => {
    clients.delete(ws);
    console.log('❌ Client déconnecté');
  });
});

// Stream toutes les 2 secondes
setInterval(async () => {
  try {
    const res = await fetch(API_URL, {
      headers: { 'x-api-key': process.env.API_KEY },
      agent
    });

    if (!res.ok) {
      const text = await res.text();
      console.error(`❌ HTTP ${res.status}: ${text}`);
      return;
    }

    const json = await res.json();
    const instrument = json.instruments?.[0];

    if (instrument && instrument.currentPrice) {
      const payload = {
        pair: PAIR,
        price: instrument.currentPrice,
        timestamp: instrument.timestamp
      };

      for (const client of clients) {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify(payload));
        }
      }

      console.log(`📤 Diffusé: ${instrument.currentPrice}`);
    }

  } catch (err) {
    console.error('❌ Erreur fetch:', err.message);
  }
}, 2000);

