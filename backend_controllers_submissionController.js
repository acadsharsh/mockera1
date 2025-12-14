const pool = require('../config/db');

// Start test submission
exports.startSubmission = async (req, res) => {
    const { testId } = req.body;
    const userId = req.user.userId;
    
    try {
        const result = await pool.query(
            'INSERT INTO submissions (test_id, user_id) VALUES ($1, $2) RETURNING *',
            [testId, userId]
        );
        
        res.status(201).json({
            message: 'Test started',
            submission: result.rows[0]
        });
    } catch (error) {
        console.error('Start submission error:', error);
        res.status(500).json({ error: 'Failed to start test' });
    }
};

// Save response for a question
exports.saveResponse = async (req, res) => {
    const { submissionId, questionId, selectedAnswer, timeSpentSeconds, isMarkedForReview } = req.body;
    
    try {
        // Get question details to check correctness
        const questionResult = await pool.query(
            'SELECT correct_answer, marks, negative_marks FROM questions WHERE id = $1',
            [questionId]
        );
        
        if (questionResult.rows.length === 0) {
            return res.status(404).json({ error: 'Question not found' });
        }
        
        const question = questionResult.rows[0];
        const isCorrect = selectedAnswer && selectedAnswer.trim() === question.correct_answer.trim();
        const marksObtained = isCorrect ? question.marks : (selectedAnswer ? question.negative_marks : 0);
        
        // Check if response already exists
        const existingResponse = await pool.query(
            'SELECT id FROM responses WHERE submission_id = $1 AND question_id = $2',
            [submissionId, questionId]
        );
        
        let result;
        if (existingResponse.rows.length > 0) {
            // Update existing response
            result = await pool.query(
                `UPDATE responses 
                 SET selected_answer = $1, is_correct = $2, marks_obtained = $3, 
                     time_spent_seconds = $4, is_marked_for_review = $5
                 WHERE submission_id = $6 AND question_id = $7
                 RETURNING *`,
                [selectedAnswer, isCorrect, marksObtained, timeSpentSeconds, isMarkedForReview, submissionId, questionId]
            );
        } else {
            // Insert new response
            result = await pool.query(
                `INSERT INTO responses (submission_id, question_id, selected_answer, is_correct, marks_obtained, time_spent_seconds, is_marked_for_review)
                 VALUES ($1, $2, $3, $4, $5, $6, $7)
                 RETURNING *`,
                [submissionId, questionId, selectedAnswer, isCorrect, marksObtained, timeSpentSeconds, isMarkedForReview]
            );
        }
        
        res.json({
            message: 'Response saved',
            response: result.rows[0]
        });
    } catch (error) {
        console.error('Save response error:', error);
        res.status(500).json({ error: 'Failed to save response' });
    }
};

// Submit test
exports.submitTest = async (req, res) => {
    const { submissionId } = req.params;
    const { totalTimeSeconds } = req.body;
    
    try {
        // Calculate results
        const responsesResult = await pool.query(
            'SELECT * FROM responses WHERE submission_id = $1',
            [submissionId]
        );
        
        const responses = responsesResult.rows;
        const totalMarks = responses.reduce((sum, r) => sum + parseFloat(r.marks_obtained || 0), 0);
        const correctCount = responses.filter(r => r.is_correct).length;
        const incorrectCount = responses.filter(r => !r.is_correct && r.selected_answer).length;
        
        // Get total questions
        const submissionData = await pool.query(
            'SELECT test_id FROM submissions WHERE id = $1',
            [submissionId]
        );
        const testId = submissionData.rows[0].test_id;
        
        const questionsResult = await pool.query(
            'SELECT COUNT(*) FROM questions WHERE test_id = $1',
            [testId]
        );
        const totalQuestions = parseInt(questionsResult.rows[0].count);
        const unattemptedCount = totalQuestions - correctCount - incorrectCount;
        
        // Calculate rank
        const rankResult = await pool.query(
            `SELECT COUNT(*) + 1 as rank FROM submissions 
             WHERE test_id = $1 AND total_marks > $2 AND submitted_at IS NOT NULL`,
            [testId, totalMarks]
        );
        const rank = parseInt(rankResult.rows[0].rank);
        
        // Get percentile from mapping
        const percentileResult = await pool.query(
            `SELECT percentile FROM percentile_mappings 
             WHERE test_id = $1 AND min_marks <= $2
             ORDER BY min_marks DESC LIMIT 1`,
            [testId, totalMarks]
        );
        const percentile = percentileResult.rows.length > 0 ? percentileResult.rows[0].percentile : null;
        
        // Update submission
        const result = await pool.query(
            `UPDATE submissions 
             SET submitted_at = CURRENT_TIMESTAMP, total_time_seconds = $1, total_marks = $2,
                 correct_count = $3, incorrect_count = $4, unattempted_count = $5,
                 rank = $6, percentile = $7
             WHERE id = $8
             RETURNING *`,
            [totalTimeSeconds, totalMarks, correctCount, incorrectCount, unattemptedCount, rank, percentile, submissionId]
        );
        
        res.json({
            message: 'Test submitted successfully',
            submission: result.rows[0]
        });
    } catch (error) {
        console.error('Submit test error:', error);
        res.status(500).json({ error: 'Failed to submit test' });
    }
};

// Get submission details
exports.getSubmission = async (req, res) => {
    const { submissionId } = req.params;
    
    try {
        const submissionResult = await pool.query(
            `SELECT s.*, t.title as test_title, t.total_marks as max_marks
             FROM submissions s
             JOIN tests t ON s.test_id = t.id
             WHERE s.id = $1`,
            [submissionId]
        );
        
        if (submissionResult.rows.length === 0) {
            return res.status(404).json({ error: 'Submission not found' });
        }
        
        const responsesResult = await pool.query(
            `SELECT r.*, q.question_number, q.subject, q.question_type, q.image_url,
                    q.correct_answer, q.solution_text, q.solution_image_url
             FROM responses r
             JOIN questions q ON r.question_id = q.id
             WHERE r.submission_id = $1
             ORDER BY q.question_number`,
            [submissionId]
        );
        
        res.json({
            submission: submissionResult.rows[0],
            responses: responsesResult.rows
        });
    } catch (error) {
        console.error('Get submission error:', error);
        res.status(500).json({ error: 'Failed to get submission' });
    }
};

// Get user's submissions
exports.getUserSubmissions = async (req, res) => {
    const userId = req.user.userId;
    
    try {
        const result = await pool.query(
            `SELECT s.*, t.title as test_title
             FROM submissions s
             JOIN tests t ON s.test_id = t.id
             WHERE s.user_id = $1 AND s.submitted_at IS NOT NULL
             ORDER BY s.submitted_at DESC`,
            [userId]
        );
        
        res.json({ submissions: result.rows });
    } catch (error) {
        console.error('Get user submissions error:', error);
        res.status(500).json({ error: 'Failed to get submissions' });
    }
};
