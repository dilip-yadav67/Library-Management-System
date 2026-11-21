const { Activity, Settings, Loan } = require('./models');

const DAY = 24 * 60 * 60 * 1000;

const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

const log = (owner, type, text, sub = '') => Activity.create({ owner, type, text, sub }).catch(() => {});

const getSettings = async (owner) => (await Settings.findOne({ owner })) || (await Settings.create({ owner }));

const bad = (res, message, code = 400) => res.status(code).json({ message });

// Ek loan ke liye late days aur fine nikalta hai
function calcFine(loan, finePerDay) {
  if (loan.returnDate) return { late: Math.max(0, Math.ceil((loan.returnDate - loan.dueDate) / DAY)), fine: loan.fine };
  const late = Math.max(0, Math.ceil((Date.now() - loan.dueDate) / DAY));
  return { late, fine: late * finePerDay };
}

function loanStatus(loan, late) {
  if (loan.returnDate) return 'returned';
  if (late > 0) return 'overdue';
  if (loan.dueDate - Date.now() <= 3 * DAY) return 'due-soon';
  return 'on-time';
}

function shapeLoan(l, finePerDay) {
  const { late, fine } = calcFine(l, finePerDay);
  return {
    _id: l._id,
    book: l.book ? { _id: l.book._id, title: l.book.title, author: l.book.author, isbn: l.book.isbn } : null,
    member: l.member ? { _id: l.member._id, name: l.member.name } : null,
    issueDate: l.issueDate,
    dueDate: l.dueDate,
    returnDate: l.returnDate,
    renewCount: l.renewCount,
    late,
    fine,
    finePaid: l.finePaid,
    status: loanStatus(l, late),
  };
}

async function loansWithRefs(owner, filter = {}) {
  return Loan.find({ owner, ...filter }).populate('book', 'title author isbn category').populate('member', 'name');
}

module.exports = { DAY, wrap, log, getSettings, bad, calcFine, loanStatus, shapeLoan, loansWithRefs };
