const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const WebSocket = require('ws');

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = createServer((req, res) => {
    const parsedUrl = parse(req.url, true);
    handle(req, res, parsedUrl);
  });

  const wss = new WebSocket.Server({ noServer: true });

  server.on('upgrade', (request, socket, head) => {
    const { pathname, query } = parse(request.url, true);
    console.log(`WebSocket upgrade requested for: ${pathname}`);

    if (pathname.startsWith('/_next')) {
        console.log(`Ignoring WebSocket request for ${pathname}`);
        socket.destroy();
        return;
    }

    if (pathname === '/ws/sensor/data') {
      const user_id = query.user_id;
      if (!user_id) {
        console.error('No user_id provided for WebSocket connection');
        socket.destroy();
        return;
      }
      const wsProxy = new WebSocket(`ws://195.7.7.15:8002/sensor/ws/sensor/data?user_id=${user_id}`, {
        headers: request.headers,
      });

      wss.handleUpgrade(request, socket, head, (ws) => {
        wsProxy.on('open', () => {
          console.log('WebSocket proxy connected to backend');
          wss.emit('connection', ws, request);
          ws.on('message', (message) => wsProxy.send(message));
          wsProxy.on('message', (message) => ws.send(message));
          ws.on('close', () => wsProxy.close());
          wsProxy.on('close', () => ws.close());
        });
        wsProxy.on('error', (err) => {
          console.error('WebSocket proxy error:', err);
          socket.destroy();
        });
      });
    } else {
      console.log(`WebSocket path ${pathname} not handled`);
      socket.destroy();
    }
  });

  const port = process.env.PORT || 3000;
  const host = '0.0.0.0';

  server.listen(port, host, (err) => {
    if (err) throw err;
    console.log(`> Ready on http://${host}:${port} (accessible on all network interfaces)`);
  });
});