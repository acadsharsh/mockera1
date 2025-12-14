# JEE Mock Test Platform - Production System

A **production-grade** JEE Mock Test Platform with real backend, PostgreSQL database, PDF upload & cropping, CBT-style test interface, and comprehensive analysis.

## 🚀 Tech Stack

- **Backend**: Node.js + Express
- **Database**: PostgreSQL
- **Frontend**: Vanilla HTML/CSS/JavaScript
- **PDF Handling**: PDF.js + Canvas API
- **Authentication**: JWT tokens
- **File Upload**: Multer + Sharp

## 📁 Project Structure

```
project/
├── backend/
│   ├── server.js                 # Main server file
│   ├── config/
│   │   └── db.js                 # PostgreSQL connection
│   ├── controllers/
│   │   ├── authController.js     # Authentication logic
│   │   ├── testController.js     # Test management
│   │   ├── questionController.js # Question CRUD
│   │   └── submissionController.js # Test submissions
│   ├── routes/
│   │   ├── auth.js              # Auth routes
│   │   ├── tests.js             # Test routes
│   │   ├── questions.js         # Question routes
│   │   └── submissions.js       # Submission routes
│   ├── middleware/
│   │   └── auth.js              # JWT middleware
│   ├── scripts/
│   │   └── migrate.js           # Database migrations
│   └── uploads/
│       ├── pdfs/                # Uploaded PDFs
│       └── crops/               # Cropped question images
├── frontend/
│   ├── index.html               # Landing page
│   ├── auth/
│   │   ├── login.html           # Login page
│   │   └── register.html        # Registration page
│   ├── creator/
│   │   ├── dashboard.html       # Creator dashboard
│   │   ├── upload-pdf.html      # PDF upload
│   │   ├── pdf-cropper.html     # Manual question cropping
│   │   ├── question-editor.html # Question metadata editor
│   │   └── test-settings.html   # Test configuration
│   ├── student/
│   │   ├── dashboard.html       # Student dashboard
│   │   ├── test-list.html       # Available tests
│   │   ├── attempt-test.html    # CBT interface
│   │   └── analysis.html        # Performance analysis
│   ├── css/
│   │   ├── common.css           # Shared styles
│   │   └── auth.css             # Auth page styles
│   └── js/
│       └── api.js               # API helper functions
├── package.json
├── .env.example
└── README.md
```

## 🛠️ Installation & Setup

### 1. Prerequisites

- Node.js (v16 or higher)
- PostgreSQL (v13 or higher)
- npm or yarn

### 2. Database Setup

```bash
# Create PostgreSQL database
createdb jee_mock_test

# Or using psql
psql -U postgres
CREATE DATABASE jee_mock_test;
\q
```

### 3. Backend Setup

```bash
# Install dependencies
npm install

# Create .env file
cp .env.example .env

# Edit .env with your database credentials
# DB_HOST=localhost
# DB_PORT=5432
# DB_NAME=jee_mock_test
# DB_USER=postgres
# DB_PASSWORD=your_password
# JWT_SECRET=your-secret-key

# Run database migrations
npm run db:migrate

# Start server
npm start

# Or for development with auto-reload
npm run dev
```

Server will run on `http://localhost:3000`

### 4. Create Upload Directories

```bash
mkdir -p backend/uploads/pdfs
mkdir -p backend/uploads/crops
```

## 📋 Database Schema

### Users Table
- `id`, `email`, `password_hash`, `full_name`, `role` (creator/student)

### Tests Table
- `id`, `creator_id`, `title`, `description`, `duration_minutes`, `total_marks`, `is_published`

### Questions Table
- `id`, `test_id`, `question_number`, `subject`, `question_type`, `image_url`
- `option_a`, `option_b`, `option_c`, `option_d`, `correct_answer`
- `marks`, `negative_marks`, `solution_text`, `difficulty`

### Submissions Table
- `id`, `test_id`, `user_id`, `started_at`, `submitted_at`
- `total_marks`, `correct_count`, `incorrect_count`, `rank`, `percentile`

### Responses Table
- `id`, `submission_id`, `question_id`, `selected_answer`
- `is_correct`, `marks_obtained`, `time_spent_seconds`

### Percentile Mappings Table
- `id`, `test_id`, `min_marks`, `percentile`

## 🎯 Key Features

### For Test Creators

1. **PDF Upload & Processing**
   - Upload question paper PDFs (up to 50MB)
   - Server-side storage with unique filenames

2. **Manual Question Cropping**
   - PDF.js renders PDF pages in browser
   - Canvas-based crop tool with drag-to-select
   - Zoom in/out for precision
   - Navigate through pages
   - Each crop saved as JPG to server

3. **Question Editor**
   - Add metadata for each cropped question
   - Subject: Physics/Chemistry/Mathematics
   - Type: MCQ/MSQ/Numerical
   - Option labels (A, B, C, D)
   - Correct answer(s)
   - Marks & negative marking
   - Solution text
   - Difficulty level

4. **Test Configuration**
   - Set duration, total marks
   - Manual percentile mapping table
   - Publish/unpublish control

### For Students

1. **CBT-Style Test Interface**
   - NTA-like exam environment
   - Live countdown timer
   - Question palette with status colors
   - Mark for review functionality
   - Section-wise filtering
   - Save & Next navigation

2. **Real-time Response Saving**
   - All responses saved to database
   - Auto-calculation of marks
   - Time tracking per question

3. **Result Page**
   - Total score & percentage
   - Correct/Incorrect/Unattempted breakdown
   - Real rank based on all submissions
   - Estimated percentile from creator's mapping
   - Time taken

4. **Detailed Analysis Dashboard**
   - Overall performance overview
   - Subject-wise breakdown
   - Question-by-question review
   - Time analysis
   - Mistake analysis
   - Difficulty-wise performance

## 🔐 Authentication & Authorization

- JWT-based authentication
- Role-based access control (creator vs student)
- Protected routes with middleware
- Token stored in localStorage
- Auto-redirect based on role

## 🌐 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user

### Tests (Creator)
- `POST /api/tests` - Create new test
- `POST /api/tests/upload-pdf` - Upload PDF
- `GET /api/tests/my-tests` - Get creator's tests
- `PUT /api/tests/:testId` - Update test settings
- `POST /api/tests/:testId/publish` - Publish test
- `POST /api/tests/:testId/percentile-mapping` - Save percentile mappings

### Tests (Student)
- `GET /api/tests/published` - Get all published tests
- `GET /api/tests/:testId` - Get test details with questions

### Questions (Creator)
- `POST /api/questions/save-crop` - Save cropped image
- `POST /api/questions` - Create question
- `GET /api/questions/test/:testId` - Get all questions
- `PUT /api/questions/:questionId` - Update question
- `DELETE /api/questions/:questionId` - Delete question

### Submissions (Student)
- `POST /api/submissions/start` - Start test attempt
- `POST /api/submissions/response` - Save question response
- `POST /api/submissions/:submissionId/submit` - Submit test
- `GET /api/submissions/:submissionId` - Get submission details
- `GET /api/submissions/user/my-submissions` - Get user's submissions

## 🎨 Frontend Pages

### Public Pages
- `/index.html` - Landing page
- `/auth/login.html` - Login
- `/auth/register.html` - Register

### Creator Pages
- `/creator/dashboard.html` - Test management dashboard
- `/creator/upload-pdf.html` - Upload PDF & create test
- `/creator/pdf-cropper.html` - Crop questions from PDF
- `/creator/question-editor.html` - Add question metadata
- `/creator/test-settings.html` - Configure test & percentile mapping

### Student Pages
- `/student/dashboard.html` - Student dashboard
- `/student/test-list.html` - Browse available tests
- `/student/attempt-test.html` - Take test (CBT interface)
- `/student/analysis.html` - View performance analysis

## 🔧 Configuration

### Environment Variables (.env)
```env
PORT=3000
DB_HOST=localhost
DB_PORT=5432
DB_NAME=jee_mock_test
DB_USER=postgres
DB_PASSWORD=your_password
JWT_SECRET=your-super-secret-key
NODE_ENV=development
```

### File Upload Limits
- PDF: 50MB max
- Cropped images: 10MB max
- Images compressed to 90% quality JPG

## 🚦 Usage Flow

### Creator Workflow

1. Register as creator
2. Login → Redirected to creator dashboard
3. Click "Create New Test"
4. Enter test details (title, duration, marks)
5. Upload question paper PDF
6. Navigate PDF pages and crop questions
7. For each crop: Add subject, type, options, answer, marks
8. Configure test settings & percentile mapping
9. Publish test

### Student Workflow

1. Register as student
2. Login → Redirected to student dashboard
3. Browse published tests
4. Click "Attempt Test"
5. Test starts with timer
6. Answer questions, mark for review
7. Submit test
8. View result summary
9. Analyze performance in detail

## 📊 Analysis Features

- **Overview Cards**: Score, rank, percentile, accuracy
- **Subject-wise Analysis**: Performance breakdown by Physics/Chemistry/Math
- **Question Review**: See all questions with your answers vs correct answers
- **Time Analysis**: Time spent per question/section
- **Mistake Analysis**: Identify weak areas
- **Difficulty Analysis**: Easy/Medium/Hard performance

## 🔒 Security Features

- Password hashing with bcrypt
- JWT token expiration
- SQL injection prevention (parameterized queries)
- File type validation
- File size limits
- Role-based authorization
- CORS configuration

## 🐛 Development

```bash
# Run in development mode with auto-reload
npm run dev

# Run database migrations
npm run db:migrate

# Check logs
tail -f backend/logs/server.log
```

## 📦 Production Deployment

### Database
1. Create production PostgreSQL database
2. Run migrations: `npm run db:migrate`
3. Set up database backups

### Backend
1. Set `NODE_ENV=production` in .env
2. Use process manager (PM2): `pm2 start backend/server.js`
3. Set up reverse proxy (Nginx)
4. Enable HTTPS
5. Configure CORS for production domain

### File Storage
- Consider using cloud storage (AWS S3, Cloudinary) for PDFs and images
- Update file upload logic to use cloud URLs

### Monitoring
- Set up logging (Winston, Morgan)
- Monitor server health
- Track database performance

## 🤝 Contributing

This is a production-grade system. Follow best practices:
- Write clean, modular code
- Add comments for complex logic
- Test all features before committing
- Follow REST API conventions
- Maintain database integrity

## 📝 License

MIT License - See LICENSE file

## 🙏 Acknowledgments

- PDF.js for PDF rendering
- PostgreSQL for robust database
- Express.js for backend framework
- Sharp for image processing

---

**Note**: This is a REAL production system with backend and database. NOT a demo. NOT using localStorage. All data persists in PostgreSQL.

For questions or support, contact the development team.
