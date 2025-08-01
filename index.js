require('dotenv').config();
const WebSocket = require('ws');
const fetch = require('node-fetch');
const https = require('https');

const wss = new WebSocket.Server({ port: 8081 }, () => {
  console.log('✅ wss1 lancé sur le port 8081');
});

const clients = new Set();
const agent = new https.Agent({ family: 4 }); // Force IPv4

const PAIRS = [
  "aapl_usd", "amzn_usd", "coin_usd", "goog_usd", "gme_usd",
  "intc_usd", "ko_usd", "mcd_usd", "msft_usd", "ibm_usd",
  "meta_usd", "nvda_usd", "tsla_usd",
  "aud_usd", "eur_usd", "gbp_usd", "nzd_usd",
  "usd_cad", "usd_chf", "usd_jpy",
  "xag_usd", "xau_usd",
  "btc_usdt", "eth_usdt", "sol_usdt", "xrp_usdt",
  "avax_usdt", "doge_usdt", "trx_usdt", "ada_usdt",
  "sui_usdt", "link_usdt"
];

wss.on('connection', (ws) => {
  console.log('✅ Client connecté à wss1');
  clients.add(ws);

  ws.on('close', () => {
    clients.delete(ws);
    console.log('❌ Client déconnecté');
  });
});

setInterval(async () => {
  try {
    const results = {};

    const responses = await Promise.allSettled(
      PAIRS.map(pair =>
        fetch(`https://prod-kline-rest.supra.com/latest?trading_pair=${pair}`, {
          headers: { 'x-api-key': process.env.API_KEY },
          agent
        }).then(res => res.ok ? res.json() : res.text().then(t => { throw new Error(t); }))
      )
    );

    for (let i = 0; i < responses.length; i++) {
      const pair = PAIRS[i];
      const result = responses[i];

      if (result.status === 'fulfilled') {
        const instrument = result.value?.instruments?.[0];
        if (instrument && instrument.currentPrice) {
          results[pair] = {
            price: instrument.currentPrice,
            timestamp: instrument.timestamp
          };
        }
      } else {
        console.error(`❌ ${pair}:`, result.reason.message || result.reason);
      }

