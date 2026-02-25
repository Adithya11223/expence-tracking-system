const express = require('express');
const { loginController, registerController, updateProfileController } = require('../controllers/userController');

const router = express.Router();

router.post('/login', loginController);
router.post('/register', registerController);
// NEW ROUTE
router.post('/update-profile', updateProfileController);

module.exports = router;