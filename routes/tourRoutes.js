const express = require('express');
const tourController = require('../controllers/tourController');
const reviewRouter = require('./reviewRoutes');
const {protected, restrictTo} = require('../controllers/authController');

const router = express.Router();

router.use('/:tourId/reviews', reviewRouter); //nested routes mounting

router.route('/top-5-cheap')
  .get(tourController.aliasTopTours, tourController.getAllTours);

router.route('/tour-stats').get(
  protected,
  restrictTo('guide', 'lead-guide', 'admin'),
  tourController.getTourStats
);
router.route('/monthly-plan/:year').get(
  protected,
  restrictTo('guide', 'lead-guide', 'admin'),
  tourController.getMonthlyPlan
);

router.route('/tours-within/:distance/center/:latlng/units/:unit')
  .get(tourController.getToursWithin);

router.route('/distance/:latlng/units/:unit')
  .get(tourController.getDistances);

router.route('/')
  .get(tourController.getAllTours)
  .post(protected, restrictTo('lead-guide', 'admin'), tourController.createTour);

router.route('/:id')
  .get(tourController.getTour)
  .patch(
    protected,
    restrictTo('lead-guide', 'admin'),
    tourController.uploadTourImages,
    tourController.resizeTourImages,
    tourController.updateTour
  )
  .delete(
    protected, 
    restrictTo('admin', 'lead-guide'), 
    tourController.deleteTour
  );
/*/nested route
router.route('/:tourId/reviews/')
  .post(
    protected,
    restrictTo('user'),
    reviewController.createReview
  );
*/
module.exports = router;




