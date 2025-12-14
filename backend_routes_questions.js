const express = require('express');
const router = express.Router();
const questionController = require('../controllers/questionController');
const { authMiddleware, isCreator } = require('../middleware/auth');

// All routes require creator authentication
router.post('/save-crop', authMiddleware, isCreator, questionController.saveCroppedImage);
router.post('/', authMiddleware, isCreator, questionController.createQuestion);
router.get('/test/:testId', authMiddleware, questionController.getQuestions);
router.put('/:questionId', authMiddleware, isCreator, questionController.updateQuestion);
router.delete('/:questionId', authMiddleware, isCreator, questionController.deleteQuestion);

module.exports = router;
