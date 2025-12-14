const express = require('express');
const router = express.Router();
const submissionController = require('../controllers/submissionController');
const { authMiddleware, isStudent } = require('../middleware/auth');

router.post('/start', authMiddleware, submissionController.startSubmission);
router.post('/response', authMiddleware, submissionController.saveResponse);
router.post('/:submissionId/submit', authMiddleware, submissionController.submitTest);
router.get('/:submissionId', authMiddleware, submissionController.getSubmission);
router.get('/user/my-submissions', authMiddleware, submissionController.getUserSubmissions);

module.exports = router;
