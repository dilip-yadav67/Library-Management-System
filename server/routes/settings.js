const router = require('express').Router();
const { Settings } = require('../models');
const { seedDemo, clearLibrary } = require('../seed');
const { wrap, bad, getSettings } = require('../utils');

router.get('/', wrap(async (req, res) => {
  res.json(await getSettings(req.uid));
}));

router.put('/', wrap(async (req, res) => {
  const loanDays = Number(req.body.loanDays);
  const finePerDay = Number(req.body.finePerDay);
  const maxBooks = Number(req.body.maxBooks);
  if (!(loanDays >= 1) || !(finePerDay >= 0) || !(maxBooks >= 1)) return bad(res, 'Sahi values daalein');
  const s = await Settings.findOneAndUpdate(
    { owner: req.uid }, { loanDays, finePerDay, maxBooks }, { new: true, upsert: true, setDefaultsOnInsert: true }
  );
  res.json(s);
}));

router.post('/reset-demo', wrap(async (req, res) => {
  await clearLibrary(req.uid);
  await seedDemo(req.uid);
  res.json({ ok: true });
}));

module.exports = router;
