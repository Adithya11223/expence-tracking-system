const express = require('express');
const {
    addContact,
    getContacts,
    deleteContact,
    addEntry,
    getEntries,
    deleteEntry,
} = require('../controllers/khatabookCtrl');

const router = express.Router();

// Contacts
router.post('/add-contact', addContact);
router.post('/get-contacts', getContacts);
router.post('/delete-contact', deleteContact);

// Entries
router.post('/add-entry', addEntry);
router.post('/get-entries', getEntries);
router.post('/delete-entry', deleteEntry);

module.exports = router;
