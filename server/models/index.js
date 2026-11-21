const mongoose = require('mongoose');
const { Schema } = mongoose;
const ref = (name) => ({ type: Schema.Types.ObjectId, ref: name });

const User = mongoose.model(
  'User',
  new Schema(
    {
      name: { type: String, required: true, trim: true },
      email: { type: String, required: true, unique: true, lowercase: true, trim: true },
      password: { type: String, required: true },
    },
    { timestamps: true }
  )
);

const Settings = mongoose.model(
  'Settings',
  new Schema({
    owner: { ...ref('User'), required: true, unique: true },
    loanDays: { type: Number, default: 14, min: 1 },
    finePerDay: { type: Number, default: 5, min: 0 },
    maxBooks: { type: Number, default: 3, min: 1 },
  })
);

const catSchema = new Schema({ owner: { ...ref('User'), required: true, index: true }, name: { type: String, required: true, trim: true } });
catSchema.index({ owner: 1, name: 1 }, { unique: true });
const Category = mongoose.model('Category', catSchema);

const Book = mongoose.model(
  'Book',
  new Schema(
    {
      owner: { ...ref('User'), required: true, index: true },
      title: { type: String, required: true, trim: true },
      author: { type: String, required: true, trim: true },
      isbn: { type: String, trim: true, default: '' },
      category: ref('Category'),
      copies: { type: Number, required: true, min: 1, default: 1 },
      available: { type: Number, required: true, min: 0, default: 1 },
      shelf: { type: String, trim: true, default: '' },
      cover: { type: String, trim: true, default: '' },
    },
    { timestamps: true }
  )
);

const Member = mongoose.model(
  'Member',
  new Schema(
    {
      owner: { ...ref('User'), required: true, index: true },
      name: { type: String, required: true, trim: true },
      email: { type: String, trim: true, lowercase: true, default: '' },
      phone: { type: String, trim: true, default: '' },
      type: { type: String, enum: ['Student', 'Faculty', 'Public'], default: 'Student' },
      expiry: { type: Date, required: true },
    },
    { timestamps: true }
  )
);

const Loan = mongoose.model(
  'Loan',
  new Schema(
    {
      owner: { ...ref('User'), required: true, index: true },
      book: { ...ref('Book'), required: true },
      member: { ...ref('Member'), required: true },
      issueDate: { type: Date, default: Date.now },
      dueDate: { type: Date, required: true },
      returnDate: { type: Date, default: null },
      fine: { type: Number, default: 0 },
      finePaid: { type: Boolean, default: false },
      renewCount: { type: Number, default: 0 },
    },
    { timestamps: true }
  )
);

const Reservation = mongoose.model(
  'Reservation',
  new Schema(
    {
      owner: { ...ref('User'), required: true, index: true },
      book: { ...ref('Book'), required: true },
      member: { ...ref('Member'), required: true },
      status: { type: String, enum: ['waiting', 'ready', 'fulfilled', 'cancelled'], default: 'waiting' },
    },
    { timestamps: true }
  )
);

const Activity = mongoose.model(
  'Activity',
  new Schema(
    {
      owner: { ...ref('User'), required: true, index: true },
      type: { type: String, default: 'info' },
      text: String,
      sub: String,
    },
    { timestamps: true }
  )
);

module.exports = { User, Settings, Category, Book, Member, Loan, Reservation, Activity };
