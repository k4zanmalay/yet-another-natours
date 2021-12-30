const express = require('express');
const viewController = require('../controllers/viewController')
const authController = require('../controllers/authController')

const router = express.Router();
//Set CSP headers
router.use((req, res, next) => {
  res.setHeader(
    'Content-Security-Policy',
    "script-src  'self' blob: api.mapbox.com cdnjs.cloudflare.com", 
    "script-src-elem 'self' blob: api.mapbox.com"
  );
  next();
});

//Check if user is logged in
router.use(authController.isLoggedIn);

router.get('/', authController.isLoggedIn, viewController.getOverview);
router.get('/tour/:slug', authController.isLoggedIn, viewController.getTour); 
router.get('/login', authController.isLoggedIn, viewController.getLoginForm);
router.get('/me', authController.protected, viewController.getAccount);
//rout for sending data via form input instead of using API
//router.post('/submit-user-data', authController.protected, viewController.updateUserData);

module.exports = router;
