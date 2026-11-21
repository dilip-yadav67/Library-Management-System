const router = require('express').Router();
const { Member, Loan, Reservation } = require('../models');
const { wrap, bad, log, getSettings, calcFine, shapeLoan, loansWithRefs } = require('../utils');

const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const TYPES = ['Student', 'Faculty', 'Public'];

router.get('/', wrap(async (req, res) => {
  const { q } = req.query;
  const filter = { owner: req.uid };
  if (q && q.trim()) {
    const rx = new RegExp(esc(q.trim()), 'i');
    filter.$or = [{ name: rx }, { email: rx }, { phone: rx }];
  }
  const [members, loans, s] = await Promise.all([
    Member.find(filter).sort({ createdAt: 1 }),
    Loan.find({ owner: req.uid }),
    getSettings(req.uid),
  ]);

  const stats = {};
  for (const l of loans) {
    const k = String(l.member);
    stats[k] = stats[k] || { active: 0, fine: 0 };
    if (!l.returnDate) stats[k].active += 1;
    const { fine } = calcFine(l, s.finePerDay);
    if (!l.returnDate || !l.finePaid) stats[k].fine += fine;
  }
  const now = new Date();
  res.json(
    members.map((m) => ({
      ...m.toObject(),
      status: m.expiry >= now ? 'Active' : 'Expired',
      activeLoans: stats[String(m._id)]?.active || 0,
      fineDue: stats[String(m._id)]?.fine || 0,
    }))
  );
}));

function clean(body) {
  const { name, email, phone, type, expiry } = body;
  return { name, email, phone, type, expiry };
}

router.post('/', wrap(async (req, res) => {
  const d = clean(req.body);
  if (!d.name) return bad(res, 'Name required');
  if (!TYPES.includes(d.type)) d.type = 'Student';
  if (!d.expiry) {
    const e = new Date();
    e.setFullYear(e.getFullYear() + 1);
    d.expiry = e;
  }
  const m = await Member.create({ owner: req.uid, ...d });
  log(req.uid, 'member', 'New member registered', m.name);
  res.status(201).json(m);
}));

router.put('/:id', wrap(async (req, res) => {
  const d = clean(req.body);
  if (!d.name) return bad(res, 'Name required');
  if (!TYPES.includes(d.type)) return bad(res, 'Invalid membership type');
  const m = await Member.findOneAndUpdate({ _id: req.params.id, owner: req.uid }, d, { new: true, runValidators: true });
  if (!m) return bad(res, 'Member not found', 404);
  res.json(m);
}));

router.get('/:id/history', wrap(async (req, res) => {
  const s = await getSettings(req.uid);
  const loans = await loansWithRefs(req.uid, { member: req.params.id });
  loans.sort((a, b) => b.issueDate - a.issueDate);
  res.json(loans.map((l) => shapeLoan(l, s.finePerDay)));
}));

router.delete('/:id', wrap(async (req, res) => {
  const m = await Member.findOne({ _id: req.params.id, owner: req.uid });
  if (!m) return bad(res, 'Member not found', 404);
  if (await Loan.exists({ owner: req.uid, member: m._id, returnDate: null })) {
    return bad(res, 'Is member ke paas abhi book issued hai');
  }
  await Reservation.deleteMany({ owner: req.uid, member: m._id });
  await m.deleteOne();
  res.json({ ok: true });
}));

module.exports = router;
