const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema(
  {
    userid: {
      type: String,
      required: [true, 'User ID is required'],
    },
    amount: {
      type: Number,
      required: [true, 'Amount is required'],
    },
    type: {
      type: String,
      required: [true, 'Type (income/expense) is required'],
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
    },
    reference: {
      type: String,
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
    },
    date: {
      type: Date,
      required: [true, 'Date is required'],
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('transaction', transactionSchema);