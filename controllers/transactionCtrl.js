const transactionModel = require('../models/transactionModel');
const moment = require('moment');

// Get all transactions with filters
const getAllTransaction = async (req, res) => {
  try {
    const { frequency, selectedDates, userid, type } = req.body;
    let filter = { userid };

    // FIX: Only apply date filters if frequency is NOT 'all'
    if (frequency !== 'all') {
      if (frequency !== 'custom') {
        filter.date = {
          $gt: moment().subtract(Number(frequency), 'd').toDate(),
        };
      } else if (selectedDates && selectedDates.length === 2) {
        filter.date = {
          $gte: moment(selectedDates[0]).toDate(),
          $lte: moment(selectedDates[1]).toDate(),
        };
      }
    }

    if (type !== 'all') {
      filter.type = type;
    }

    const transactions = await transactionModel.find(filter);
    res.status(200).json(transactions);
  } catch (error) {
    console.log(error);
    res.status(500).json(error);
  }
};

// Add new transaction
const addTransaction = async (req, res) => {
  try {
    const newTransaction = new transactionModel(req.body);
    await newTransaction.save();
    res.status(201).send('Transaction Created Successfully');
  } catch (error) {
    res.status(500).json(error);
  }
};

// Edit existing transaction
const editTransaction = async (req, res) => {
  try {
    await transactionModel.findOneAndUpdate(
      { _id: req.body.transactionId },
      req.body.payload
    );
    res.status(200).send("Edit Successfully");
  } catch (error) {
    res.status(500).json(error);
  }
};

// Delete transaction
const deleteTransaction = async (req, res) => {
  try {
    await transactionModel.findOneAndDelete({ _id: req.body.transactionId });
    res.status(200).send("Transaction Deleted!");
  } catch (error) {
    res.status(500).json(error);
  }
};

module.exports = { 
  addTransaction, 
  getAllTransaction, 
  editTransaction, 
  deleteTransaction 
};