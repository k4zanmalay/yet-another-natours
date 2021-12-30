const express = require('express');
const userController = require('../controllers/userController');
const authController = require('../controllers/authController');

const router = express.Router();

router.post('/signup', authController.signup);
router.post('/login', authController.login);
router.get('/logout', authController.logout);

router.post('/forgotPassword', authController.forgotPassword);
router.patch('/resetPassword/:token', authController.resetPassword); //patch because we modify the password

router.use(authController.protected);//middleware runs in sequences, that means that everything below this function
                                     //is protected
//User must be logged in
router.patch('/updateMyPassword/', authController.updateMyPassword);

router.get('/me/', userController.getMe, userController.getUser);
router.patch(
  '/updateMe/',
  userController.uploadUserPhoto,
  userController.resizeUserPhoto,
  userController.updateMe
);
router.delete('/deleteMe/', userController.deleteMe);
//User must be admin
router.use(authController.restrictTo('admin'));

router.route('/')
  .get(userController.getAllUsers);
//  .post(userController.createUser);

router.route('/:id')
  .get(userController.getUser)
  .patch(userController.updateUser)
  .delete(userController.deleteUser);

module.exports = router;
