const WebSocket = require('ws');
const net = require('net');

const wss = new WebSocket.Server({ port: 8080 });

wss.on('connection', (ws) => {
  ws.on('message', (message) => {
    if (message.length < 3) return;
    const targetPort = message.readUInt16BE(0);
    const hostLen = message.readUInt8(2);
    const targetHost = message.toString('utf8', 3, 3 + hostLen);
    const payload = message.slice(3 + hostLen);

    const client = net.createConnection({ port: targetPort, host: targetHost }, () => {
      client.write(payload);
    });

    client.on('data', (data) => {
      if (ws.readyState === WebSocket.OPEN) ws.send(data);
    });

    socketErrorCleanup(client, ws);
  });
});

function socketErrorCleanup(client, ws) {
  client.on('error', () => ws.close());
  ws.on('error', () => client.destroy());
}

console.log('Tünel Sunucusu (server.js) 8080 portunda dinliyor...');
