const router = require('express').Router();
const { Book, Member, Loan, Reservation } = require('../models');
const { DAY, wrap, bad, log, getSettings, shapeLoan, loansWithRefs } = require('../utils');

// GET /api/loans?status=active|returned|all
router.get('/', wrap(async (req, res) => {
  const { status = 'active' } = req.query;
  const filter = {};
  if (status === 'active') filter.returnDate = null;
  if (status === 'returned') filter.returnDate = { $ne: null };
  const [loans, s] = await Promise.all([loansWithRefs(req.uid, filter), getSettings(req.uid)]);
  loans.sort((a, b) => b.issueDate - a.issueDate);
  res.json(loans.map((l) => shapeLoan(l, s.finePerDay)));
}));

// Member ko book issue karna
router.post('/issue', wrap(async (req, res) => {
  const { memberId, bookId } = req.body;
  const [member, book, s] = await Promise.all([
    Member.findOne({ _id: memberId, owner: req.uid }),
    Book.findOne({ _id: bookId, owner: req.uid }),
    getSettings(req.uid),
  ]);
  if (!member || !book) return bad(res, 'Member ya book nahi mili', 404);
  if (member.expiry < new Date()) return bad(res, 'Is member ki membership expire ho chuki hai');

  const active = await Loan.find({ owner: req.uid, member: member._id, returnDate: null });
  if (active.length >= s.maxBooks) return bad(res, `Is member ko max ${s.maxBooks} books hi mil sakti hain`);
  if (active.some((l) => String(l.book) === String(book._id))) return bad(res, 'Ye book is member ke paas pehle se issued hai');
  if (book.available <= 0) return bad(res, 'Is book ki koi copy available nahi, Reservation karein');

  const readyForOthers = await Reservation.countDocuments({
    owner: req.uid, book: book._id, status: 'ready', member: { $ne: member._id },
  });
  if (book.available <= readyForOthers) return bad(res, 'Ye copy kisi aur member ke liye reserved hai');

  // atomic: available kabhi negative na ho
  const updated = await Book.findOneAndUpdate({ _id: book._id, owner: req.uid, available: { $gt: 0 } }, { $inc: { available: -1 } });
  if (!updated) return bad(res, 'Is book ki koi copy available nahi');

  const issueDate = new Date();
  const loan = await Loan.create({
    owner: req.uid, book: book._id, member: member._id, issueDate, dueDate: new Date(issueDate.getTime() + s.loanDays * DAY),
  });
  await Reservation.updateMany(
    { owner: req.uid, book: book._id, member: member._id, status: { $in: ['waiting', 'ready'] } },
    { status: 'fulfilled' }
  );
  log(req.uid, 'issue', 'Book issued', `${book.title} → ${member.name}`);
  res.status(201).json({ _id: loan._id, dueDate: loan.dueDate });
}));

// Book wapas lena (late ho to fine)
router.post('/:id/return', wrap(async (req, res) => {
  const loan = await Loan.findOne({ _id: req.params.id, owner: req.uid, returnDate: null });
  if (!loan) return bad(res, 'Active loan nahi mila', 404);
  const s = await getSettings(req.uid);

  const now = new Date();
  const late = Math.max(0, Math.ceil((now - loan.dueDate) / DAY));
  loan.returnDate = now;
  loan.fine = late * s.finePerDay;
  loan.finePaid = loan.fine === 0 ? true : !!req.body.collected;
  await loan.save();

  const book = await Book.findOneAndUpdate({ _id: loan.book, owner: req.uid }, { $inc: { available: 1 } }, { new: true });
  const member = await Member.findById(loan.member);
  log(req.uid, 'return', 'Book returned', book ? book.title : '');

  // queue mein sabse pehle waiting member ko "ready" karo
  let notified = null;
  if (book) {
    const next = await Reservation.findOne({ owner: req.uid, book: book._id, status: 'waiting' }).sort({ createdAt: 1 }).populate('member', 'name');
    if (next) {
      next.status = 'ready';
      await next.save();
      notified = next.member?.name || null;
      log(req.uid, 'reservation', 'Reserved book is now available', `${book.title} → ${notified}`);
    }
  }
  res.json({ fine: loan.fine, late, member: member?.name, notified });
}));

// Renew
router.post('/:id/renew', wrap(async (req, res) => {
  const loan = await Loan.findOne({ _id: req.params.id, owner: req.uid, returnDate: null });
  if (!loan) return bad(res, 'Active loan nahi mila', 404);
  const s = await getSettings(req.uid);
  if (loan.dueDate < new Date()) return bad(res, 'Overdue book renew nahi ho sakti, pehle return karein');
  if (loan.renewCount >= 2) return bad(res, 'Ek book sirf 2 baar renew ho sakti hai');
  if (await Reservation.exists({ owner: req.uid, book: loan.book, status: { $in: ['waiting', 'ready'] } })) {
    return bad(res, 'Is book ke liye reservation queue hai, renew nahi ho sakta');
  }
  loan.dueDate = new Date(loan.dueDate.getTime() + s.loanDays * DAY);
  loan.renewCount += 1;
  await loan.save();
  log(req.uid, 'renew', 'Book renewed', `Due ${loan.dueDate.toDateString()}`);
  res.json({ dueDate: loan.dueDate });
}));

// Fine collect hua mark karna
router.post('/:id/pay-fine', wrap(async (req, res) => {
  const loan = await Loan.findOneAndUpdate(
    { _id: req.params.id, owner: req.uid, returnDate: { $ne: null }, fine: { $gt: 0 } },
    { finePaid: true },
    { new: true }
  );
  if (!loan) return bad(res, 'Fine record nahi mila', 404);
  log(req.uid, 'fine', 'Fine collected', `₹${loan.fine}`);
  res.json({ ok: true });
}));

module.exports = router;
