const pool = require('../config/db');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const sharp = require('sharp');

// Configure multer for cropped images
const cropStorage = multer.diskStorage({
    destination: async (req, file, cb) => {
        const uploadPath = path.join(__dirname, '../uploads/crops');
        await fs.mkdir(uploadPath, { recursive: true });
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        const uniqueName = `crop-${Date.now()}-${Math.random().toString(36).substring(7)}.jpg`;
        cb(null, uniqueName);
    }
});

exports.uploadCrop = multer({
    storage: cropStorage,
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only image files allowed'), false);
        }
    },
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// Save cropped question image
exports.saveCroppedImage = async (req, res) => {
    const { imageData } = req.body; // Base64 image from canvas
    
    if (!imageData) {
        return res.status(400).json({ error: 'No image data provided' });
    }
    
    try {
        // Remove data URL prefix
        const base64Data = imageData.replace(/^data:image\/\w+;base64,/, '');
        const buffer = Buffer.from(base64Data, 'base64');
        
        // Generate filename
        const filename = `crop-${Date.now()}-${Math.random().toString(36).substring(7)}.jpg`;
        const uploadPath = path.join(__dirname, '../uploads/crops');
        await fs.mkdir(uploadPath, { recursive: true });
        
        const filepath = path.join(uploadPath, filename);
        
        // Optimize and save image
        await sharp(buffer)
            .jpeg({ quality: 90 })
            .toFile(filepath);
        
        const imageUrl = `/uploads/crops/${filename}`;
        
        res.json({
            message: 'Image saved successfully',
            imageUrl
        });
    } catch (error) {
        console.error('Save cropped image error:', error);
        res.status(500).json({ error: 'Failed to save image' });
    }
};

// Create question
exports.createQuestion = async (req, res) => {
    const {
        testId,
        questionNumber,
        subject,
        questionType,
        imageUrl,
        optionA,
        optionB,
        optionC,
        optionD,
        correctAnswer,
        marks,
        negativeMarks,
        solutionText,
        solutionImageUrl,
        difficulty
    } = req.body;
    
    try {
        const result = await pool.query(
            `INSERT INTO questions (
                test_id, question_number, subject, question_type, image_url,
                option_a, option_b, option_c, option_d, correct_answer,
                marks, negative_marks, solution_text, solution_image_url, difficulty
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
            RETURNING *`,
            [
                testId, questionNumber, subject, questionType, imageUrl,
                optionA, optionB, optionC, optionD, correctAnswer,
                marks, negativeMarks, solutionText, solutionImageUrl, difficulty
            ]
        );
        
        res.status(201).json({
            message: 'Question created successfully',
            question: result.rows[0]
        });
    } catch (error) {
        console.error('Create question error:', error);
        res.status(500).json({ error: 'Failed to create question' });
    }
};

// Get questions for a test
exports.getQuestions = async (req, res) => {
    const { testId } = req.params;
    
    try {
        const result = await pool.query(
            'SELECT * FROM questions WHERE test_id = $1 ORDER BY question_number',
            [testId]
        );
        
        res.json({ questions: result.rows });
    } catch (error) {
        console.error('Get questions error:', error);
        res.status(500).json({ error: 'Failed to get questions' });
    }
};

// Update question
exports.updateQuestion = async (req, res) => {
    const { questionId } = req.params;
    const {
        subject,
        questionType,
        optionA,
        optionB,
        optionC,
        optionD,
        correctAnswer,
        marks,
        negativeMarks,
        solutionText,
        solutionImageUrl,
        difficulty
    } = req.body;
    
    try {
        const result = await pool.query(
            `UPDATE questions 
             SET subject = $1, question_type = $2, option_a = $3, option_b = $4,
                 option_c = $5, option_d = $6, correct_answer = $7, marks = $8,
                 negative_marks = $9, solution_text = $10, solution_image_url = $11, difficulty = $12
             WHERE id = $13
             RETURNING *`,
            [
                subject, questionType, optionA, optionB, optionC, optionD,
                correctAnswer, marks, negativeMarks, solutionText, solutionImageUrl,
                difficulty, questionId
            ]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Question not found' });
        }
        
        res.json({
            message: 'Question updated successfully',
            question: result.rows[0]
        });
    } catch (error) {
        console.error('Update question error:', error);
        res.status(500).json({ error: 'Failed to update question' });
    }
};

// Delete question
exports.deleteQuestion = async (req, res) => {
    const { questionId } = req.params;
    
    try {
        const result = await pool.query(
            'DELETE FROM questions WHERE id = $1 RETURNING *',
            [questionId]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Question not found' });
        }
        
        res.json({ message: 'Question deleted successfully' });
    } catch (error) {
        console.error('Delete question error:', error);
        res.status(500).json({ error: 'Failed to delete question' });
    }
};
