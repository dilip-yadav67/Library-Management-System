const router = require('express').Router();
const { Book, Member, Reservation } = require('../models');
const { wrap, bad, log } = require('../utils');

router.get('/', wrap(async (req, res) => {
  const list = await Reservation.find({ owner: req.uid, status: { $in: ['waiting', 'ready'] } })
    .sort({ createdAt: 1 })
    .populate('book', 'title available')
    .populate('member', 'name');
  const pos = {};
  res.json(
    list.map((r) => {
      const k = String(r.book?._id);
      pos[k] = (pos[k] || 0) + 1;
      return { _id: r._id, book: r.book, member: r.member, status: r.status, createdAt: r.createdAt, position: pos[k] };
    })
  );
}));

router.post('/', wrap(async (req, res) => {
  const { bookId, memberId } = req.body;
  const [book, member] = await Promise.all([
    Book.findOne({ _id: bookId, owner: req.uid }),
    Member.findOne({ _id: memberId, owner: req.uid }),
  ]);
  if (!book || !member) return bad(res, 'Member ya book nahi mili', 404);
  if (book.available > 0) return bad(res, 'Ye book abhi available hai, seedha Issue karein');
  if (await Reservation.exists({ owner: req.uid, book: book._id, member: member._id, status: { $in: ['waiting', 'ready'] } })) {
    return bad(res, 'Is member ne ye book pehle se reserve ki hui hai', 409);
  }
  const r = await Reservation.create({ owner: req.uid, book: book._id, member: member._id });
  log(req.uid, 'reservation', 'Book reserved', `${book.title} → ${member.name}`);
  res.status(201).json(r);
}));

router.put('/:id/cancel', wrap(async (req, res) => {
  const r = await Reservation.findOneAndUpdate(
    { _id: req.params.id, owner: req.uid, status: { $in: ['waiting', 'ready'] } },
    { status: 'cancelled' },
    { new: true }
  );
  if (!r) return bad(res, 'Reservation not found', 404);
  res.json({ ok: true });
}));

module.exports = router;
