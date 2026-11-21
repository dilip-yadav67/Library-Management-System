const { Category, Book, Member, Settings, Loan, Reservation, Activity } = require('./models');

// Naye user ke liye demo data (screenshots jaisa) bana deta hai
async function seedDemo(owner) {
  const cats = {};
  for (const name of ['Fiction', 'Science', 'Technology', 'Others']) {
    cats[name] = await Category.create({ owner, name });
  }

  const books = [
    ['Clean Code', 'Robert C. Martin', '9780132350884', 'Technology', 3, 'R1-S1'],
    ['Python Basics', 'Eric Matthes', '9780000000011', 'Technology', 4, 'R2-S2'],
    ['Data Structures', 'Mark Weiss', '9780000000028', 'Technology', 2, 'R3-S3'],
    ['Algorithms', 'Robert Sedgewick', '9780000000035', 'Technology', 2, 'R1-S4'],
    ['Machine Learning', 'Tom Mitchell', '9780000000042', 'Technology', 2, 'R2-S1'],
    ['Web Development', 'Jon Duckett', '9780000000059', 'Technology', 2, 'R3-S2'],
    ['The Alchemist', 'Paulo Coelho', '9780000000066', 'Fiction', 3, 'R1-S3'],
    ['A Brief History of Time', 'Stephen Hawking', '9780000000073', 'Science', 2, 'R2-S4'],
    ['Wings of Fire', 'A. P. J. Abdul Kalam', '9780000000080', 'Others', 2, 'R3-S1'],
  ];
  await Book.insertMany(
    books.map(([title, author, isbn, cat, copies, shelf]) => ({
      owner, title, author, isbn, category: cats[cat]._id, copies, available: copies, shelf,
    }))
  );

  const expiry = new Date();
  expiry.setFullYear(expiry.getFullYear() + 1);
  const members = [
    ['Amit Verma', 'amit@mail.com', 'Student'],
    ['Sneha Patel', 'sneha@mail.com', 'Student'],
    ['Rohit Kumar', 'rohit@mail.com', 'Faculty'],
    ['Neha Singh', 'neha@mail.com', 'Public'],
    ['Arjun Mehta', 'arjun@mail.com', 'Student'],
  ];
  await Member.insertMany(members.map(([name, email, type]) => ({ owner, name, email, type, expiry })));

  await Settings.findOneAndUpdate({ owner }, { owner }, { upsert: true, new: true, setDefaultsOnInsert: true });
  await Activity.create({ owner, type: 'info', text: 'Welcome to LibraryPro', sub: 'Demo data ready' });
}

async function clearLibrary(owner) {
  await Promise.all([
    Category.deleteMany({ owner }), Book.deleteMany({ owner }), Member.deleteMany({ owner }),
    Loan.deleteMany({ owner }), Reservation.deleteMany({ owner }), Activity.deleteMany({ owner }),
  ]);
}

module.exports = { seedDemo, clearLibrary };
