const express = require('express');
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;
const rootDir = __dirname;

app.use('/scripts', express.static(path.join(rootDir, 'scripts')));
app.use('/styles', express.static(path.join(rootDir, 'styles')));
app.use('/assets', express.static(path.join(rootDir, 'assets')));

app.get('/', (req, res) => {
  res.sendFile(path.join(rootDir, 'index.html'));
});

app.listen(port, () => {
  console.log(`Grimm Dominion server is running on port ${port}`);
});
