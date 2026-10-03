const WebSocket = require('ws');
const net = require('net');
const http = require('http');

const PORT = process.env.PORT || 8080;

// 1. Render'ın aktif görebilmesi için basit bir HTTP sunucusu oluşturuyoruz
const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('Tunnel Server Active\n');
});

// 2. WebSocket sunucusunu bu HTTP sunucusu üzerine kuruyoruz
const wss = new WebSocket.Server({ server });

wss.on('connection', (ws) => {
  let targetClient = null;

  ws.on('message', (message) => {
    if (!targetClient && message.length >= 3) {
      const targetPort = message.readUInt16BE(0);
      const hostLen = message.readUInt8(2);
      const targetHost = message.toString('utf8', 3, 3 + hostLen);

      targetClient = net.createConnection({ port: targetPort, host: targetHost });

      targetClient.on('data', (data) => {
        if (ws.readyState === WebSocket.OPEN) ws.send(data);
      });

      targetClient.on('error', () => ws.close());
      targetClient.on('close', () => ws.close());
      return;
    }

    if (targetClient && !targetClient.destroyed) {
      targetClient.write(message);
    }
  });

  ws.on('close', () => targetClient && targetClient.destroy());
  ws.on('error', () => targetClient && targetClient.destroy());
});

// 3. Sunucuyu başlatıyoruz
server.listen(PORT, () => {
  console.log(`Tünel Sunucusu ve HTTP Pinger ${PORT} portunda dinliyor...`);
});

// 4. Otomatik Self-Pinger (Her 10 dakikada bir kendi Render URL'sine istek atar)
const RENDER_URL = 'https://custom-vpn-server.onrender.com';
setInterval(() => {
  http.get(RENDER_URL, (res) => {
    console.log(`[Pinger] Self-ping gönderildi. Durum: ${res.statusCode}`);
  }).on('error', (err) => {
    console.error('[Pinger] Self-ping hatası:', err.message);
  });
}, 10 * 60 * 1000); // 10 dakikada bir
