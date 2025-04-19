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

    // Ignore Next.js HMR requests
    if (pathname.startsWith('/_next')) {
        console.log(`Ignoring WebSocket request for ${pathname}`);
        socket.destroy();
        return;
    }

    if (pathname === '/ws/sensor/data') {
        // Extract token from query or cookie
        const token = query.token || request.headers.cookie?.split('; ').find(row => row.startsWith('token='))?.split('=')[1];
        if (!token) {
            console.error('No token provided for WebSocket connection');
            socket.destroy();
            return;
        }

        console.log(token);

        // Proxy to backend with token as query parameter
        const wsProxy = new WebSocket(`ws://localhost:8000/sensor/ws/sensor/data?token=${encodeURIComponent(token)}`, {
            headers: { ...request.headers, 'Cookie': `token=${token}` },
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

  server.listen(3000, (err) => {
    if (err) throw err;
    console.log('> Ready on http://localhost:3000');
  });
});