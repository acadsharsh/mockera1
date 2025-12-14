let testData = {
    name: '',
    duration: 180,
    totalQuestions: 75,
    sections: {
        Physics: 25,
        Chemistry: 25,
        Mathematics: 25
    },
    markingScheme: {
        correct: 4,
        incorrect: -1
    },
    questions: []
};

let currentQuestionIndex = 0;

function startAddingQuestions() {
    const testName = document.getElementById('testName').value.trim();
    const duration = parseInt(document.getElementById('testDuration').value);
    const totalQuestions = parseInt(document.getElementById('totalQuestions').value);
    const physicsCount = parseInt(document.getElementById('physicsCount').value);
    const chemistryCount = parseInt(document.getElementById('chemistryCount').value);
    const mathsCount = parseInt(document.getElementById('mathsCount').value);
    const correctMarks = parseFloat(document.getElementById('correctMarks').value);
    const negativeMarks = parseFloat(document.getElementById('negativeMarks').value);

    if (!testName) {
        alert('Please enter test name');
        return;
    }

    if (physicsCount + chemistryCount + mathsCount !== totalQuestions) {
        alert('Sum of section questions must equal total questions');
        return;
    }

    testData.name = testName;
    testData.duration = duration;
    testData.totalQuestions = totalQuestions;
    testData.sections = {
        Physics: physicsCount,
        Chemistry: chemistryCount,
        Mathematics: mathsCount
    };
    testData.markingScheme = {
        correct: correctMarks,
        incorrect: negativeMarks
    };

    document.getElementById('testSetup').style.display = 'none';
    document.getElementById('questionAdder').style.display = 'block';
    document.getElementById('totalQuestionCount').textContent = totalQuestions;
    
    updateQuestionDisplay();
}

function backToSetup() {
    document.getElementById('testSetup').style.display = 'block';
    document.getElementById('questionAdder').style.display = 'none';
}

function updateAnswerInputs() {
    const questionType = document.getElementById('questionType').value;
    if (questionType === 'mcq') {
        document.getElementById('mcqOptions').style.display = 'block';
        document.getElementById('numericalOptions').style.display = 'none';
    } else {
        document.getElementById('mcqOptions').style.display = 'none';
        document.getElementById('numericalOptions').style.display = 'block';
    }
}

document.getElementById('questionImage').addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            document.getElementById('imagePreview').innerHTML = 
                `<img src="${e.target.result}" class="question-image" alt="Question preview">`;
        };
        reader.readAsDataURL(file);
    }
});

function saveQuestion() {
    const section = document.getElementById('questionSection').value;
    const questionType = document.getElementById('questionType').value;
    const imageFile = document.getElementById('questionImage').files[0];

    if (!imageFile) {
        alert('Please upload a question image');
        return;
    }

    let correctAnswer;
    if (questionType === 'mcq') {
        correctAnswer = document.getElementById('correctAnswer').value;
    } else {
        correctAnswer = document.getElementById('numericalAnswer').value;
        if (!correctAnswer) {
            alert('Please enter the numerical answer');
            return;
        }
    }

    const reader = new FileReader();
    reader.onload = function(e) {
        const question = {
            id: testData.questions.length + 1,
            section: section,
            type: questionType,
            imageData: e.target.result,
            correctAnswer: correctAnswer
        };

        testData.questions.push(question);
        currentQuestionIndex++;
        
        updateQuestionsList();
        
        if (currentQuestionIndex < testData.totalQuestions) {
            // Clear form for next question
            document.getElementById('questionImage').value = '';
            document.getElementById('imagePreview').innerHTML = '';
            document.getElementById('numericalAnswer').value = '';
            document.getElementById('currentQuestionNumber').textContent = currentQuestionIndex + 1;
        } else {
            alert('All questions added! Click "Finish & Save Test" to complete.');
        }
    };
    reader.readAsDataURL(imageFile);
}

function updateQuestionsList() {
    const questionsList = document.getElementById('questionsList');
    let html = '<div style="display: grid; gap: 10px;">';
    
    testData.questions.forEach((q, index) => {
        html += `
            <div style="padding: 10px; background: #f8f9fa; border-radius: 6px; display: flex; justify-content: space-between; align-items: center;">
                <span><strong>Q${index + 1}</strong> - ${q.section} (${q.type === 'mcq' ? 'MCQ' : 'Numerical'})</span>
                <span style="color: #10b981; font-weight: 600;">Answer: ${q.correctAnswer}</span>
            </div>
        `;
    });
    
    html += '</div>';
    questionsList.innerHTML = html;
}

function updateQuestionDisplay() {
    document.getElementById('currentQuestionNumber').textContent = currentQuestionIndex + 1;
}

function finishTest() {
    if (testData.questions.length === 0) {
        alert('Please add at least one question');
        return;
    }

    if (testData.questions.length < testData.totalQuestions) {
        if (!confirm(`You've added ${testData.questions.length} out of ${testData.totalQuestions} questions. Do you want to save anyway?`)) {
            return;
        }
        testData.totalQuestions = testData.questions.length;
    }

    // Save to localStorage
    const tests = JSON.parse(localStorage.getItem('jeeTests') || '[]');
    testData.id = 'test_' + Date.now();
    testData.createdAt = new Date().toISOString();
    tests.push(testData);
    localStorage.setItem('jeeTests', JSON.stringify(tests));

    // Show success message
    document.getElementById('questionAdder').style.display = 'none';
    document.getElementById('testSaved').style.display = 'block';
}
