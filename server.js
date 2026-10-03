const WebSocket = require('ws');
const net = require('net');

const PORT = process.env.PORT || 8080;
const wss = new WebSocket.Server({ port: PORT });

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

console.log(`Tünel Sunucusu ${PORT} portunda dinliyor...`);
