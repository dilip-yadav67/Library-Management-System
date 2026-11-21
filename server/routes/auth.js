const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User } = require('../models');
const { seedDemo } = require('../seed');
const auth = require('../middleware/auth');
const { wrap, bad } = require('../utils');

const sign = (user) => jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
const pub = (u) => ({ id: u._id, name: u.name, email: u.email });
const emailOk = (e) => /^\S+@\S+\.\S+$/.test(e || '');

router.post('/signup', wrap(async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !name.trim()) return bad(res, 'Name required');
  if (!emailOk(email)) return bad(res, 'Valid email required');
  if (!password || password.length < 6) return bad(res, 'Password kam se kam 6 characters ka ho');
  if (await User.findOne({ email: email.toLowerCase() })) return bad(res, 'Is email se account pehle se hai', 409);

  const user = await User.create({ name: name.trim(), email, password: await bcrypt.hash(password, 10) });
  await seedDemo(user._id);
  res.status(201).json({ token: sign(user), user: pub(user) });
}));

router.post('/login', wrap(async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email: (email || '').toLowerCase() });
  if (!user || !(await bcrypt.compare(password || '', user.password))) return bad(res, 'Email ya password galat hai', 401);
  res.json({ token: sign(user), user: pub(user) });
}));

router.get('/me', auth, wrap(async (req, res) => {
  const user = await User.findById(req.uid);
  if (!user) return bad(res, 'User not found', 401);
  res.json({ user: pub(user) });
}));

router.put('/profile', auth, wrap(async (req, res) => {
  const name = (req.body.name || '').trim();
  if (!name) return bad(res, 'Name required');
  const user = await User.findByIdAndUpdate(req.uid, { name }, { new: true });
  res.json({ user: pub(user) });
}));

router.put('/password', auth, wrap(async (req, res) => {
  const { current, next } = req.body;
  if (!next || next.length < 6) return bad(res, 'Naya password kam se kam 6 characters ka ho');
  const user = await User.findById(req.uid);
  if (!(await bcrypt.compare(current || '', user.password))) return bad(res, 'Purana password galat hai', 401);
  user.password = await bcrypt.hash(next, 10);
  await user.save();
  res.json({ ok: true });
}));

module.exports = router;
