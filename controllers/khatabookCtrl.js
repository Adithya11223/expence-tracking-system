const { KhataContact, KhataEntry } = require('../models/khatabookModel');

/* ────────────────── CONTACTS ────────────────── */

// Add a new contact
const addContact = async (req, res) => {
    try {
        const contact = new KhataContact(req.body);
        await contact.save();
        res.status(201).json({ success: true, contact });
    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: 'Failed to add contact' });
    }
};

// Get all contacts for this user, with aggregated balance
const getContacts = async (req, res) => {
    try {
        const { userid } = req.body;
        const contacts = await KhataContact.find({ userid }).sort({ createdAt: -1 });

        // Aggregate totals per contact in one query
        const totals = await KhataEntry.aggregate([
            { $match: { userid } },
            {
                $group: {
                    _id: '$contactId',
                    totalGave: {
                        $sum: { $cond: [{ $eq: ['$type', 'gave'] }, '$amount', 0] },
                    },
                    totalGot: {
                        $sum: { $cond: [{ $eq: ['$type', 'got'] }, '$amount', 0] },
                    },
                },
            },
        ]);

        const totalsMap = {};
        totals.forEach((t) => {
            totalsMap[t._id.toString()] = { gave: t.totalGave, got: t.totalGot };
        });

        const result = contacts.map((c) => {
            const t = totalsMap[c._id.toString()] || { gave: 0, got: 0 };
            return {
                ...c.toObject(),
                totalGave: t.gave,
                totalGot: t.got,
                balance: t.got - t.gave, // positive = they owe you, negative = you owe them
            };
        });

        res.status(200).json(result);
    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: 'Failed to get contacts' });
    }
};

// Delete a contact and all its entries
const deleteContact = async (req, res) => {
    try {
        const { contactId } = req.body;
        await KhataEntry.deleteMany({ contactId });
        await KhataContact.findByIdAndDelete(contactId);
        res.status(200).json({ success: true, message: 'Contact deleted' });
    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: 'Failed to delete contact' });
    }
};

/* ────────────────── ENTRIES ────────────────── */

// Add an entry (gave / got)
const addEntry = async (req, res) => {
    try {
        const entry = new KhataEntry(req.body);
        await entry.save();
        res.status(201).json({ success: true, entry });
    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: 'Failed to add entry' });
    }
};

// Get all entries for a contact
const getEntries = async (req, res) => {
    try {
        const { contactId } = req.body;
        const entries = await KhataEntry.find({ contactId }).sort({ date: -1, createdAt: -1 });
        res.status(200).json(entries);
    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: 'Failed to get entries' });
    }
};

// Delete a single entry
const deleteEntry = async (req, res) => {
    try {
        await KhataEntry.findByIdAndDelete(req.body.entryId);
        res.status(200).json({ success: true, message: 'Entry deleted' });
    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: 'Failed to delete entry' });
    }
};

module.exports = { addContact, getContacts, deleteContact, addEntry, getEntries, deleteEntry };
