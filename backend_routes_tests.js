const express = require('express');
const router = express.Router();
const testController = require('../controllers/testController');
const { authMiddleware, isCreator, isStudent } = require('../middleware/auth');

// Creator routes
router.post('/', authMiddleware, isCreator, testController.createTest);
router.post('/upload-pdf', authMiddleware, isCreator, testController.uploadPDF.single('pdf'), testController.handlePDFUpload);
router.get('/my-tests', authMiddleware, isCreator, testController.getCreatorTests);
router.put('/:testId', authMiddleware, isCreator, testController.updateTestSettings);
router.post('/:testId/publish', authMiddleware, isCreator, testController.publishTest);
router.post('/:testId/percentile-mapping', authMiddleware, isCreator, testController.savePercentileMapping);

// Student routes
router.get('/published', authMiddleware, testController.getPublishedTests);
router.get('/:testId', authMiddleware, testController.getTestById);

module.exports = router;
