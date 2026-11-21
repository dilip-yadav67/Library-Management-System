const { Book, Loan, Category, Member } = require('./models');
const { DAY, getSettings, calcFine } = require('./utils');

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

async function buildReport(owner) {
  const [loans, books, cats, s] = await Promise.all([
    Loan.find({ owner }).populate('book', 'title category').populate('member', 'name'),
    Book.find({ owner }, 'title category'),
    Category.find({ owner }),
    getSettings(owner),
  ]);
  const catName = {};
  cats.forEach((c) => (catName[String(c._id)] = c.name));

  const now = Date.now();
  let finesTotal = 0;
  let finesCollected = 0;
  const overdueList = [];
  const byBook = {};
  const byCat = {};

  for (const l of loans) {
    const { fine, late } = calcFine(l, s.finePerDay);
    finesTotal += fine;
    if (l.returnDate && l.finePaid) finesCollected += fine;
    if (!l.returnDate && l.dueDate < now) {
      overdueList.push({ _id: l._id, book: l.book?.title, member: l.member?.name, dueDate: l.dueDate, late, fine });
    }
    const title = l.book?.title || 'Deleted book';
    byBook[title] = (byBook[title] || 0) + 1;
    const cn = (l.book?.category && catName[String(l.book.category)]) || 'Uncategorised';
    byCat[cn] = (byCat[cn] || 0) + 1;
  }

  const top = (obj, n = 5) =>
    Object.entries(obj).sort((a, b) => b[1] - a[1]).slice(0, n).map(([name, count]) => ({ name, count }));

  // pichhle 6 mahine
  const monthly = [];
  const d = new Date();
  for (let i = 5; i >= 0; i--) {
    const start = new Date(d.getFullYear(), d.getMonth() - i, 1);
    const end = new Date(d.getFullYear(), d.getMonth() - i + 1, 1);
    monthly.push({
      label: MONTHS[start.getMonth()],
      issued: loans.filter((l) => l.issueDate >= start && l.issueDate < end).length,
      returned: loans.filter((l) => l.returnDate && l.returnDate >= start && l.returnDate < end).length,
    });
  }

  return {
    totalIssues: loans.length,
    activeLoans: loans.filter((l) => !l.returnDate).length,
    overdue: overdueList.length,
    finesTotal,
    finesCollected,
    finesPending: finesTotal - finesCollected,
    mostIssued: top(byBook),
    byCategory: top(byCat, 10),
    overdueList,
    monthly,
    totalBooks: books.length,
  };
}

async function libraryContext(owner) {
  const [r, members, books, s] = await Promise.all([
    buildReport(owner),
    Member.countDocuments({ owner }),
    Book.find({ owner }, 'title copies available'),
    getSettings(owner),
  ]);
  const out = books.filter((b) => b.available === 0).map((b) => b.title);
  const copies = books.reduce((a, b) => a + b.copies, 0);
  return {
    r, members, copies, titles: books.length, outOfStock: out, settings: s,
    text: [
      `Book titles: ${books.length}, total copies: ${copies}, members: ${members}.`,
      `Total issues: ${r.totalIssues}, active loans: ${r.activeLoans}, overdue: ${r.overdue}.`,
      `Fines total ₹${r.finesTotal} (collected ₹${r.finesCollected}, pending ₹${r.finesPending}).`,
      `Rules: loan ${s.loanDays} days, fine ₹${s.finePerDay}/day, max ${s.maxBooks} books per member.`,
      `Most issued: ${r.mostIssued.map((x) => `${x.name} (${x.count})`).join(', ') || 'none yet'}.`,
      `Issues by category: ${r.byCategory.map((x) => `${x.name} (${x.count})`).join(', ') || 'none yet'}.`,
      `Overdue: ${r.overdueList.map((x) => `${x.book} - ${x.member} (${x.late} days, ₹${x.fine})`).join('; ') || 'none'}.`,
      `Out of stock (all copies issued): ${out.join(', ') || 'none'}.`,
    ].join('\n'),
  };
}

module.exports = { buildReport, libraryContext, DAY };
