const router = require('express').Router();
const { Book, Member, Loan, Category, Activity, Reservation } = require('../models');
const { DAY, wrap, getSettings, shapeLoan, loansWithRefs } = require('../utils');

router.get('/', wrap(async (req, res) => {
  const owner = req.uid;
  const [books, memberCount, loans, cats, activity, s] = await Promise.all([
    Book.find({ owner }, 'copies category'),
    Member.countDocuments({ owner }),
    loansWithRefs(owner),
    Category.find({ owner }),
    Activity.find({ owner }).sort({ createdAt: -1 }).limit(6),
    getSettings(owner),
  ]);
  const now = Date.now();
  const active = loans.filter((l) => !l.returnDate);

  // category-wise copies (donut chart)
  const catCopies = {};
  books.forEach((b) => { const k = String(b.category); catCopies[k] = (catCopies[k] || 0) + b.copies; });
  const distribution = cats
    .map((c) => ({ name: c.name, value: catCopies[String(c._id)] || 0 }))
    .filter((c) => c.value > 0);

  // pichhle 4 hafton ki activity
  const weekly = [0, 1, 2, 3].map((i) => {
    const from = now - (4 - i) * 7 * DAY;
    const to = now - (3 - i) * 7 * DAY;
    return { label: `Week ${i + 1}`, count: loans.filter((l) => l.issueDate >= from && l.issueDate < to).length };
  });

  const shape = (l) => shapeLoan(l, s.finePerDay);
  const recentlyIssued = [...loans].sort((a, b) => b.issueDate - a.issueDate).slice(0, 5).map(shape);
  const upcomingDue = [...active].sort((a, b) => a.dueDate - b.dueDate).slice(0, 5).map(shape);

  res.json({
    totals: {
      books: books.reduce((a, b) => a + b.copies, 0),
      titles: books.length,
      members: memberCount,
      issued: active.length,
      dueReturns: active.filter((l) => l.dueDate.getTime() <= now + 3 * DAY).length,
    },
    distribution,
    weekly,
    recentActivity: activity.map((a) => ({ _id: a._id, type: a.type, text: a.text, sub: a.sub, at: a.createdAt })),
    recentlyIssued,
    upcomingDue,
    dueDates: active.map((l) => l.dueDate),
  });
}));

// Bell icon ke liye
router.get('/notifications', wrap(async (req, res) => {
  const owner = req.uid;
  const [loans, ready] = await Promise.all([
    loansWithRefs(owner, { returnDate: null }),
    Reservation.find({ owner, status: 'ready' }).populate('book', 'title').populate('member', 'name'),
  ]);
  const now = Date.now();
  const items = [];
  for (const l of loans) {
    const days = Math.ceil((l.dueDate - now) / DAY);
    if (days < 0) items.push({ type: 'overdue', text: `${l.book?.title} overdue (${l.member?.name})`, sub: `${-days} din late` });
    else if (days <= 2) items.push({ type: 'due', text: `${l.book?.title} jaldi due hai (${l.member?.name})`, sub: days === 0 ? 'Aaj' : `${days} din mein` });
  }
  for (const r of ready) items.push({ type: 'reservation', text: `${r.book?.title} ab available hai`, sub: `${r.member?.name} ki reservation ready` });
  res.json(items);
}));

module.exports = router;
