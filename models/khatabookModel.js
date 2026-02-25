const mongoose = require('mongoose');

/* ── Contact (person you track money with) ── */
const khataContactSchema = new mongoose.Schema(
    {
        userid: { type: String, required: [true, 'User ID is required'] },
        name: { type: String, required: [true, 'Contact name is required'] },
        phone: { type: String, default: '' },
        notes: { type: String, default: '' },
    },
    { timestamps: true }
);

/* ── Ledger entry (gave / got) ── */
const khataEntrySchema = new mongoose.Schema(
    {
        userid: { type: String, required: true },
        contactId: { type: mongoose.Schema.Types.ObjectId, ref: 'KhataContact', required: true },
        amount: { type: Number, required: [true, 'Amount is required'] },
        type: { type: String, enum: ['gave', 'got'], required: true },
        description: { type: String, default: '' },
        date: { type: Date, required: [true, 'Date is required'] },
    },
    { timestamps: true }
);

const KhataContact = mongoose.model('KhataContact', khataContactSchema);
const KhataEntry = mongoose.model('KhataEntry', khataEntrySchema);

module.exports = { KhataContact, KhataEntry };
