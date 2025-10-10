// index.js
require('dotenv').config();
const express = require('express');
const line = require('@line/bot-sdk');
const { handleEvent } = require('./handlers');
const { initDb } = require('./db');

const config = {
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN,
  channelSecret: process.env.LINE_CHANNEL_SECRET
};

const app = express();
const port = process.env.PORT || 3000;

const client = new line.Client(config);
app.set('lineClient', client);

// express.json must be before middleware verification for body parsing by line.middleware
app.post('/webhook', line.middleware(config), express.json(), async (req, res) => {
  try {
    const events = req.body.events || [];
    await Promise.all(events.map(ev => handleEvent(ev, client)));
    res.status(200).send('OK');
  } catch (err) {
    console.error('Webhook or handler error:', err);
    res.status(500).end();
  }
});

app.get('/', (req, res) => res.send('LINE Group CRUD Bot is running'));

initDb()
  .then(() => {
    app.listen(port, () => console.log(`Server running on port ${port}`));
  })
  .catch(err => {
    console.error('Failed to init DB:', err);
    process.exit(1);
  });