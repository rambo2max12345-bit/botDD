// handlers.js - ตีความคำสั่งข้อความและทำงาน CRUD (รวม Flex example)
const dayjs = require('dayjs');
const { run, all } = require('./db');

const KEYWORDS = {
  CREATE_LEAVE: ['แจ้งลา', 'ลา'],
  VIEW_TODAY: ['ดูวันนี้', 'ดูข้อมูลวันนี้'],
  VIEW_ALL: ['ดูทั้งหมด', 'ดูข้อมูลทั้งหมด'],
  RESET: ['รีเซ็ต'],
  CREATE_SUMMARY: ['สร้างสรุปเวร', 'สรุปเวร'],
  SCHEDULE_SHIFT: ['จัดเวร']
};

// parse รูปแบบ "แจ้งลา | ชื่อ | YYYY-MM-DD | YYYY-MM-DD | เหตุผล"
function parseLeaveText(text) {
  const parts = text.split('|').map(p => p.trim()).filter(Boolean);
  if (parts.length > 0 && parts[0].includes('แจ้งลา')) parts.shift();
  if (parts.length < 3) return null;
  return {
    name: parts[0],
    start_date: parts[1],
    end_date: parts[2],
    reason: parts[3] || ''
  };
}

// parse จัดเวร "จัดเวร | YYYY-MM-DD | 1 | 18:00 | 19:20 | ชื่อ"
function parseShiftText(text) {
  const parts = text.split('|').map(p => p.trim()).filter(Boolean);
  if (parts.length > 0 && parts[0].includes('จัดเวร')) parts.shift();
  if (parts.length < 5) return null;
  return {
    date: parts[0],
    shift_no: parseInt(parts[1], 10),
    start_time: parts[2],
    end_time: parts[3],
    person: parts[4]
  };
}

// Simple Flex template generator for shifts summary
function makeShiftsFlex(date, shifts) {
  const contents = [
    {
      type: "bubble",
      header: {
        type: "box",
        layout: "vertical",
        contents: [
          { type: "text", text: `สรุปเวร: ${date}`, weight: "bold", size: "lg" }
        ]
      },
      body: {
        type: "box",
        layout: "vertical",
        contents: []
      }
    }
  ];
  const bodyContents = contents[0].body.contents;
  shifts.forEach(s => {
    bodyContents.push({
      type: "box",
      layout: "horizontal",
      contents: [
        { type: "text", text: `เวร ${s.shift_no}`, size: "sm", flex: 1 },
        { type: "text", text: `${s.start_time}-${s.end_time}`, size: "sm", flex: 2 },
        { type: "text", text: s.person, size: "sm", align: "end", flex: 3 }
      ],
      spacing: "sm",
      margin: "md"
    });
  });
  return { type: "flex", altText: `สรุปเวร ${date}`, contents: contents[0] };
}

async function handleEvent(event, client) {
  if (event.type !== 'message' || event.message.type !== 'text') return;
  const text = event.message.text.trim();
  const lowered = text;
  const replyToken = event.replyToken;

  // แจ้งลา
  if (KEYWORDS.CREATE_LEAVE.some(k => lowered.startsWith(k))) {
    const parsed = parseLeaveText(text);
    if (!parsed) {
      await client.replyMessage(replyToken, { type: 'text', text: 'รูปแบบการแจ้งลาไม่ถูกต้อง\nตัวอย่าง: แจ้งลา | ชื่อ | YYYY-MM-DD | YYYY-MM-DD | เหตุผล' });
      return;
    }
    await run(`INSERT INTO leaves (name, start_date, end_date, reason, created_by, created_at) VALUES (?,?,?,?,?,?)`, [
      parsed.name, parsed.start_date, parsed.end_date, parsed.reason, event.source.userId || '', dayjs().toISOString()
    ]);
    await client.replyMessage(replyToken, { type: 'text', text: `รับทราบ: แจ้งลาเรียบร้อยสำหรับ ${parsed.name} (${parsed.start_date} - ${parsed.end_date})` });
    return;
  }

  // ดูวันนี้
  if (KEYWORDS.VIEW_TODAY.some(k => lowered === k || lowered.startsWith(k))) {
    const today = dayjs().format('YYYY-MM-DD');
    const rows = await all(`SELECT * FROM leaves WHERE ? BETWEEN start_date AND end_date`, [today]).catch(()=>[]);
    if (!rows || rows.length === 0) {
      await client.replyMessage(replyToken, { type: 'text', text: 'วันนี้ไม่มีผู้ลา' });
      return;
    }
    const lines = rows.map(r => `${r.name} : ${r.start_date} → ${r.end_date} - ${r.reason}`);
    await client.replyMessage(replyToken, { type: 'text', text: 'รายการลาวันนี้:\n' + lines.join('\n') });
    return;
  }

  // ดูทั้งหมด
  if (KEYWORDS.VIEW_ALL.some(k => lowered === k || lowered.startsWith(k))) {
    const rows = await all(`SELECT * FROM leaves ORDER BY start_date DESC LIMIT 200`);
    if (!rows || rows.length === 0) {
      await client.replyMessage(replyToken, { type: 'text', text: 'ยังไม่มีข้อมูลการลา' });
      return;
    }
    const lines = rows.map(r => `${r.name} : ${r.start_date} → ${r.end_date} - ${r.reason}`);
    await client.replyMessage(replyToken, { type: 'text', text: 'ข้อมูลลาทั้งหมด (ล่าสุด):\n' + lines.join('\n') });
    return;
  }