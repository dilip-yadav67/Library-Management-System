const router = require('express').Router();
const { Category, Book } = require('../models');
const { wrap, bad } = require('../utils');

router.get('/', wrap(async (req, res) => {
  const [cats, books] = await Promise.all([
    Category.find({ owner: req.uid }).sort({ createdAt: 1, _id: 1 }),
    Book.find({ owner: req.uid }, 'category'),
  ]);
  const count = {};
  books.forEach((b) => { if (b.category) count[String(b.category)] = (count[String(b.category)] || 0) + 1; });
  res.json(cats.map((c) => ({ _id: c._id, name: c.name, books: count[String(c._id)] || 0 })));
}));

router.post('/', wrap(async (req, res) => {
  const name = (req.body.name || '').trim();
  if (!name) return bad(res, 'Category name required');
  try {
    const c = await Category.create({ owner: req.uid, name });
    res.status(201).json({ _id: c._id, name: c.name, books: 0 });
  } catch (e) {
    if (e.code === 11000) return bad(res, 'Ye category pehle se hai', 409);
    throw e;
  }
}));

router.put('/:id', wrap(async (req, res) => {
  const name = (req.body.name || '').trim();
  if (!name) return bad(res, 'Category name required');
  try {
    const c = await Category.findOneAndUpdate({ _id: req.params.id, owner: req.uid }, { name }, { new: true });
    if (!c) return bad(res, 'Category not found', 404);
    res.json({ _id: c._id, name: c.name });
  } catch (e) {
    if (e.code === 11000) return bad(res, 'Ye category pehle se hai', 409);
    throw e;
  }
}));

router.delete('/:id', wrap(async (req, res) => {
  if (await Book.exists({ owner: req.uid, category: req.params.id })) {
    return bad(res, 'Is category mein books hain, pehle unhe doosri category mein daalein');
  }
  const c = await Category.findOneAndDelete({ _id: req.params.id, owner: req.uid });
  if (!c) return bad(res, 'Category not found', 404);
  res.json({ ok: true });
}));

module.exports = router;
