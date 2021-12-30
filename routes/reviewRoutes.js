const express = require('express');
const reviewController = require('../controllers/reviewController');
const {protected, restrictTo} = require('../controllers/authController');

const router = express.Router({mergeParams: true}); //enable merge to use tourId param in middleware
                                                    //get access to parent router req.params
router.use(protected);
router.route('/')
  .get(reviewController.getAllReviews)
  .post(restrictTo('user'), reviewController.setTourUserIds, reviewController.createReview);

router.route('/:id')
  .get(reviewController.getReview)
  .patch(restrictTo('user', 'admin'), reviewController.updateReview)
  .delete(restrictTo('user', 'admin'), reviewController.deleteReview);

module.exports = router;
