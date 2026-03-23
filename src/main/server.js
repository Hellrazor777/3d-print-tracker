const http = require('http');
const fs = require('fs');
const path = require('path');

function startLocalServer(PORT, DATA_PATH, mainWin) {
  const mobileHtmlPath = path.join(__dirname, '..', 'mobile.html');
  const localServer = http.createServer((req, res) => {
    const url = new URL(req.url, 'http://localhost');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }

    if (req.method === 'GET' && url.pathname === '/data') {
      try {
        const data = fs.existsSync(DATA_PATH) ? JSON.parse(fs.readFileSync(DATA_PATH, 'utf8')) : {};
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(data));
      } catch(e) { res.writeHead(500); res.end(JSON.stringify({ error: e.message })); }
      return;
    }

    if (req.method === 'POST' && url.pathname === '/inventory') {
      let body = '';
      req.on('data', chunk => body += chunk);
      req.on('end', () => {
        try {
          const update = JSON.parse(body);
          const data = fs.existsSync(DATA_PATH) ? JSON.parse(fs.readFileSync(DATA_PATH, 'utf8')) : {};
          if (!data.inventory) data.inventory = [];
          const idx = data.inventory.findIndex(i => i.id === update.id);
          if (idx > -1) data.inventory[idx] = update;
          else data.inventory.push(update);
          fs.writeFileSync(DATA_PATH, JSON.stringify(data), 'utf8');
          if (mainWin) mainWin.webContents.send('inventory-updated');
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ ok: true }));
        } catch(e) { res.writeHead(500); res.end(JSON.stringify({ error: e.message })); }
      });
      return;
    }

    if (req.method === 'GET' && (url.pathname === '/' || url.pathname === '/mobile')) {
      try {
        const html = fs.readFileSync(mobileHtmlPath, 'utf8');
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(html);
      } catch(e) { res.writeHead(404); res.end('Mobile page not found'); }
      return;
    }

    res.writeHead(404); res.end('Not found');
  });
  localServer.listen(PORT, '0.0.0.0', () => console.log('Mobile server running on port', PORT));
  localServer.on('error', e => console.error('Server error:', e.message));
  return localServer;
}

module.exports = startLocalServer;
