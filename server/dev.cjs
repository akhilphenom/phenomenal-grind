const path = require('node:path');
const { createApiServer } = require('./api-server.cjs');

const port = Number(process.env.PORT || 3131);
const server = createApiServer({
  dataDirectory: path.join(__dirname, '..', 'data'),
  logger: true,
});

server.listen(port, '127.0.0.1', () => {
  console.log(`Phenomenal Grind API listening on http://127.0.0.1:${port}`);
});
