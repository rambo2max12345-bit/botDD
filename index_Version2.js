require('dotenv').config(); // โหลดค่าจากไฟล์ .env
const express = require('express');
const line = require('@line/bot-sdk');
const { handleEvent } = require('./handlers_Version2');
const { initDb } = require('./db_Version2');

// ดึงค่าจาก .env มาใช้
const config = {
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN,
  channelSecret: process.env.LINE_CHANNEL_SECRET,
};

const app = express();
const port = process.env.PORT || 3000;
const client = new line.Client(config);

app.set('lineClient', client);

// webhook สำหรับ LINE
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

// ทดสอบหน้าเว็บหลัก
app.get('/', (req, res) => res.send('LINE Group CRUD Bot is running'));

// เริ่มเชื่อมต่อฐานข้อมูลและรันเซิร์ฟเวอร์
initDb()
  .then(() => {
    app.listen(port, () => console.log(`🚀 Server running on port ${port}`));
  })
  .catch(err => {
    console.error('❌ Failed to init DB:', err);
    process.exit(1);
  });
