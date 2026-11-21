const router = require('express').Router();
const { Loan } = require('../models');
const { wrap, getSettings, calcFine } = require('../utils');
const { buildReport } = require('../report');

router.get('/', wrap(async (req, res) => {
  res.json(await buildReport(req.uid));
}));

const fmt = (d) => (d ? new Date(d).toISOString().slice(0, 10) : '');
const csv = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;

// Excel mein seedha khulne wali CSV
router.get('/export.csv', wrap(async (req, res) => {
  const [loans, s] = await Promise.all([
    Loan.find({ owner: req.uid }).populate('book', 'title isbn').populate('member', 'name').sort({ issueDate: -1 }),
    getSettings(req.uid),
  ]);
  const rows = [['Book', 'ISBN', 'Member', 'Issue date', 'Due date', 'Return date', 'Fine (INR)', 'Fine paid']];
  for (const l of loans) {
    const { fine } = calcFine(l, s.finePerDay);
    rows.push([l.book?.title, l.book?.isbn, l.member?.name, fmt(l.issueDate), fmt(l.dueDate), fmt(l.returnDate), fine, fine ? (l.finePaid ? 'Yes' : 'No') : '']);
  }
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="library-report.csv"');
  res.send('﻿' + rows.map((r) => r.map(csv).join(',')).join('\r\n'));
}));

module.exports = router;
