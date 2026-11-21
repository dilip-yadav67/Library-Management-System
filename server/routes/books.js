const router = require('express').Router();
const { Book, Category, Loan } = require('../models');
const { wrap, bad, log } = require('../utils');

const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

router.get('/', wrap(async (req, res) => {
  const { q, category } = req.query;
  const filter = { owner: req.uid };
  if (category) filter.category = category;
  if (q && q.trim()) {
    const rx = new RegExp(esc(q.trim()), 'i');
    filter.$or = [{ title: rx }, { author: rx }, { isbn: rx }];
  }
  const books = await Book.find(filter).populate('category', 'name').sort({ createdAt: 1 });
  res.json(books);
}));

async function checkCategory(owner, id) {
  if (!id) return true;
  return !!(await Category.findOne({ _id: id, owner }));
}

router.post('/', wrap(async (req, res) => {
  const { title, author, isbn, category, copies, shelf, cover } = req.body;
  if (!title || !author) return bad(res, 'Title aur author zaroori hain');
  const n = Number(copies) || 1;
  if (n < 1) return bad(res, 'Copies kam se kam 1 honi chahiye');
  if (!(await checkCategory(req.uid, category))) return bad(res, 'Category galat hai');
  const book = await Book.create({
    owner: req.uid, title, author, isbn, category: category || undefined, copies: n, available: n, shelf, cover,
  });
  log(req.uid, 'book', 'New book added', book.title);
  res.status(201).json(await book.populate('category', 'name'));
}));

router.put('/:id', wrap(async (req, res) => {
  const book = await Book.findOne({ _id: req.params.id, owner: req.uid });
  if (!book) return bad(res, 'Book not found', 404);
  const { title, author, isbn, category, copies, shelf, cover } = req.body;
  if (!title || !author) return bad(res, 'Title aur author zaroori hain');
  if (!(await checkCategory(req.uid, category))) return bad(res, 'Category galat hai');

  const n = Number(copies) || book.copies;
  const issued = book.copies - book.available; // abhi kitni copies bahar hain
  if (n < issued) return bad(res, `${issued} copies abhi issued hain, copies ${issued} se kam nahi kar sakte`);

  Object.assign(book, { title, author, isbn, shelf, cover, copies: n, available: n - issued });
  book.category = category || undefined;
  await book.save();
  res.json(await book.populate('category', 'name'));
}));

router.delete('/:id', wrap(async (req, res) => {
  const book = await Book.findOne({ _id: req.params.id, owner: req.uid });
  if (!book) return bad(res, 'Book not found', 404);
  if (await Loan.exists({ owner: req.uid, book: book._id, returnDate: null })) {
    return bad(res, 'Ye book abhi issued hai, pehle return karwayein');
  }
  await book.deleteOne();
  res.json({ ok: true });
}));

module.exports = router;
