// index.js
require('dotenv').config();
const express = require('express');
const line = require('@line/bot-sdk');
const { handleEvent } = require('./handlers');
const { initDb } = require('./db');

const config = {
  channelAccessToken: process.env.pyshkbRdJ/GuQQzIpR+yqPmVJlVy33tGXW6bjJ47DE3Ucu+OTgGKd1RnQMTFJog/9+Kn4hEurruiCesAI9owYd8aqu0pE3SgJ9RSTbB+T4SupO+kethi8AoLU084qxc56exbRo+/uoy8Ll/o5nthegdB04t89/1O/w1cDnyilFU=,
  channelSecret: process.env.c5ccaa8b8a606f6c6cf85d50ee7bee74
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
