const pool = require('../config/db');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;

// Configure multer for PDF uploads
const pdfStorage = multer.diskStorage({
    destination: async (req, file, cb) => {
        const uploadPath = path.join(__dirname, '../uploads/pdfs');
        await fs.mkdir(uploadPath, { recursive: true });
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        const uniqueName = `${Date.now()}-${Math.random().toString(36).substring(7)}.pdf`;
        cb(null, uniqueName);
    }
});

exports.uploadPDF = multer({
    storage: pdfStorage,
    fileFilter: (req, file, cb) => {
        if (file.mimetype === 'application/pdf') {
            cb(null, true);
        } else {
            cb(new Error('Only PDF files allowed'), false);
        }
    },
    limits: { fileSize: 50 * 1024 * 1024 } // 50MB limit
});

// Create new test
exports.createTest = async (req, res) => {
    const { title, description, durationMinutes, totalMarks } = req.body;
    const creatorId = req.user.userId;
    
    try {
        const result = await pool.query(
            `INSERT INTO tests (creator_id, title, description, duration_minutes, total_marks)
             VALUES ($1, $2, $3, $4, $5)
             RETURNING *`,
            [creatorId, title, description, durationMinutes, totalMarks]
        );
        
        res.status(201).json({
            message: 'Test created successfully',
            test: result.rows[0]
        });
    } catch (error) {
        console.error('Create test error:', error);
        res.status(500).json({ error: 'Failed to create test' });
    }
};

// Upload PDF for test
exports.handlePDFUpload = async (req, res) => {
    const { testId } = req.body;
    
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }
    
    try {
        const filePath = `/uploads/pdfs/${req.file.filename}`;
        
        const result = await pool.query(
            `INSERT INTO pdf_uploads (test_id, file_path, file_name, uploaded_by)
             VALUES ($1, $2, $3, $4)
             RETURNING *`,
            [testId, filePath, req.file.originalname, req.user.userId]
        );
        
        res.json({
            message: 'PDF uploaded successfully',
            upload: result.rows[0]
        });
    } catch (error) {
        console.error('PDF upload error:', error);
        res.status(500).json({ error: 'Failed to upload PDF' });
    }
};

// Get all tests (for creator)
exports.getCreatorTests = async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT t.*, COUNT(q.id) as question_count
             FROM tests t
             LEFT JOIN questions q ON t.id = q.test_id
             WHERE t.creator_id = $1
             GROUP BY t.id
             ORDER BY t.created_at DESC`,
            [req.user.userId]
        );
        
        res.json({ tests: result.rows });
    } catch (error) {
        console.error('Get tests error:', error);
        res.status(500).json({ error: 'Failed to get tests' });
    }
};

// Get published tests (for students)
exports.getPublishedTests = async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT t.*, u.full_name as creator_name, COUNT(q.id) as question_count
             FROM tests t
             LEFT JOIN users u ON t.creator_id = u.id
             LEFT JOIN questions q ON t.id = q.test_id
             WHERE t.is_published = true
             GROUP BY t.id, u.full_name
             ORDER BY t.published_at DESC`
        );
        
        res.json({ tests: result.rows });
    } catch (error) {
        console.error('Get published tests error:', error);
        res.status(500).json({ error: 'Failed to get tests' });
    }
};

// Get test by ID
exports.getTestById = async (req, res) => {
    const { testId } = req.params;
    
    try {
        const testResult = await pool.query(
            'SELECT * FROM tests WHERE id = $1',
            [testId]
        );
        
        if (testResult.rows.length === 0) {
            return res.status(404).json({ error: 'Test not found' });
        }
        
        const questionsResult = await pool.query(
            'SELECT * FROM questions WHERE test_id = $1 ORDER BY question_number',
            [testId]
        );
        
        res.json({
            test: testResult.rows[0],
            questions: questionsResult.rows
        });
    } catch (error) {
        console.error('Get test error:', error);
        res.status(500).json({ error: 'Failed to get test' });
    }
};

// Publish test
exports.publishTest = async (req, res) => {
    const { testId } = req.params;
    
    try {
        const result = await pool.query(
            `UPDATE tests 
             SET is_published = true, published_at = CURRENT_TIMESTAMP
             WHERE id = $1 AND creator_id = $2
             RETURNING *`,
            [testId, req.user.userId]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Test not found or unauthorized' });
        }
        
        res.json({
            message: 'Test published successfully',
            test: result.rows[0]
        });
    } catch (error) {
        console.error('Publish test error:', error);
        res.status(500).json({ error: 'Failed to publish test' });
    }
};

// Update test settings
exports.updateTestSettings = async (req, res) => {
    const { testId } = req.params;
    const { title, description, durationMinutes, totalMarks } = req.body;
    
    try {
        const result = await pool.query(
            `UPDATE tests 
             SET title = $1, description = $2, duration_minutes = $3, total_marks = $4
             WHERE id = $5 AND creator_id = $6
             RETURNING *`,
            [title, description, durationMinutes, totalMarks, testId, req.user.userId]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Test not found or unauthorized' });
        }
        
        res.json({
            message: 'Test updated successfully',
            test: result.rows[0]
        });
    } catch (error) {
        console.error('Update test error:', error);
        res.status(500).json({ error: 'Failed to update test' });
    }
};

// Save percentile mapping
exports.savePercentileMapping = async (req, res) => {
    const { testId } = req.params;
    const { mappings } = req.body; // Array of {minMarks, percentile}
    
    try {
        // Delete existing mappings
        await pool.query('DELETE FROM percentile_mappings WHERE test_id = $1', [testId]);
        
        // Insert new mappings
        const insertPromises = mappings.map(({ minMarks, percentile }) => {
            return pool.query(
                'INSERT INTO percentile_mappings (test_id, min_marks, percentile) VALUES ($1, $2, $3)',
                [testId, minMarks, percentile]
            );
        });
        
        await Promise.all(insertPromises);
        
        res.json({ message: 'Percentile mappings saved successfully' });
    } catch (error) {
        console.error('Save percentile mapping error:', error);
        res.status(500).json({ error: 'Failed to save percentile mappings' });
    }
};
