let currentTest = null;
let currentQuestionIndex = 0;
let responses = {};
let markedQuestions = new Set();
let timeRemaining = 0;
let timerInterval = null;
let attemptId = null;

// Load test list on page load
window.addEventListener('DOMContentLoaded', () => {
    loadTestList();
});

function loadTestList() {
    const tests = JSON.parse(localStorage.getItem('jeeTests') || '[]');
    const testList = document.getElementById('testList');
    const noTests = document.getElementById('noTests');

    if (tests.length === 0) {
        noTests.style.display = 'block';
        return;
    }

    let html = '<div style="display: grid; gap: 20px;">';
    tests.forEach((test, index) => {
        const createdDate = new Date(test.createdAt).toLocaleDateString();
        html += `
            <div class="result-card" style="cursor: pointer; transition: all 0.3s;" 
                 onmouseover="this.style.transform='translateY(-3px)'; this.style.boxShadow='0 5px 15px rgba(0,0,0,0.1)'"
                 onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='none'">
                <h3 style="color: #333; margin-bottom: 10px;">${test.name}</h3>
                <div style="color: #666; font-size: 0.9rem; margin-bottom: 15px;">
                    <div>📝 ${test.totalQuestions} Questions | ⏱️ ${test.duration} minutes</div>
                    <div style="margin-top: 5px;">Created: ${createdDate}</div>
                    <div style="margin-top: 5px;">
                        Physics: ${test.sections.Physics} | 
                        Chemistry: ${test.sections.Chemistry} | 
                        Maths: ${test.sections.Mathematics}
                    </div>
                </div>
                <button class="btn btn-primary" onclick="startTest('${test.id}')">
                    Start Test
                </button>
            </div>
        `;
    });
    html += '</div>';
    testList.innerHTML = html;
}

function startTest(testId) {
    const tests = JSON.parse(localStorage.getItem('jeeTests') || '[]');
    currentTest = tests.find(t => t.id === testId);
    
    if (!currentTest) {
        alert('Test not found');
        return;
    }

    attemptId = 'attempt_' + Date.now();
    responses = {};
    markedQuestions = new Set();
    currentQuestionIndex = 0;
    timeRemaining = currentTest.duration * 60; // Convert to seconds

    // Hide selection, show test interface
    document.getElementById('testSelection').style.display = 'none';
    document.getElementById('testInterface').style.display = 'block';

    // Initialize test
    document.getElementById('testTitle').textContent = currentTest.name;
    document.getElementById('testInfo').textContent = 
        `${currentTest.totalQuestions} Questions | ${currentTest.duration} minutes | +${currentTest.markingScheme.correct} for correct, ${currentTest.markingScheme.incorrect} for incorrect`;

    createQuestionPalette();
    loadQuestion(0);
    startTimer();

    // Prevent accidental page close
    window.onbeforeunload = () => "Test in progress. Are you sure you want to leave?";
}

function createQuestionPalette() {
    const palette = document.getElementById('questionPalette');
    let html = '';
    
    currentTest.questions.forEach((q, index) => {
        html += `
            <button class="palette-btn" id="palette-${index}" onclick="loadQuestion(${index})">
                ${index + 1}
            </button>
        `;
    });
    
    palette.innerHTML = html;
}

function loadQuestion(index) {
    if (index < 0 || index >= currentTest.questions.length) return;
    
    currentQuestionIndex = index;
    const question = currentTest.questions[index];
    
    // Update UI
    document.getElementById('currentQuestionNum').textContent = index + 1;
    document.getElementById('currentSection').textContent = question.section;
    document.getElementById('questionImage').src = question.imageData;
    
    // Show appropriate answer input
    if (question.type === 'mcq') {
        document.getElementById('mcqAnswers').style.display = 'grid';
        document.getElementById('numericalAnswer').style.display = 'none';
        
        // Clear previous selection
        document.querySelectorAll('.option-btn').forEach(btn => {
            btn.classList.remove('selected');
        });
        
        // Restore saved answer
        if (responses[index]) {
            const selectedBtn = document.querySelector(`[data-option="${responses[index]}"]`);
            if (selectedBtn) selectedBtn.classList.add('selected');
        }
    } else {
        document.getElementById('mcqAnswers').style.display = 'none';
        document.getElementById('numericalAnswer').style.display = 'block';
        document.getElementById('numericalInput').value = responses[index] || '';
    }
    
    updatePaletteStatus();
}

function selectOption(option) {
    responses[currentQuestionIndex] = option;
    
    document.querySelectorAll('.option-btn').forEach(btn => {
        btn.classList.remove('selected');
    });
    
    const selectedBtn = document.querySelector(`[data-option="${option}"]`);
    if (selectedBtn) selectedBtn.classList.add('selected');
    
    updatePaletteStatus();
}

document.getElementById('numericalInput').addEventListener('input', function() {
    if (this.value) {
        responses[currentQuestionIndex] = this.value;
        updatePaletteStatus();
    }
});

function clearResponse() {
    delete responses[currentQuestionIndex];
    markedQuestions.delete(currentQuestionIndex);
    
    const question = currentTest.questions[currentQuestionIndex];
    if (question.type === 'mcq') {
        document.querySelectorAll('.option-btn').forEach(btn => {
            btn.classList.remove('selected');
        });
    } else {
        document.getElementById('numericalInput').value = '';
    }
    
    updatePaletteStatus();
}

function markForReview() {
    if (markedQuestions.has(currentQuestionIndex)) {
        markedQuestions.delete(currentQuestionIndex);
    } else {
        markedQuestions.add(currentQuestionIndex);
    }
    updatePaletteStatus();
}

function updatePaletteStatus() {
    currentTest.questions.forEach((q, index) => {
        const btn = document.getElementById(`palette-${index}`);
        btn.classList.remove('answered', 'marked', 'active');
        
        if (index === currentQuestionIndex) {
            btn.classList.add('active');
        }
        
        if (responses[index]) {
            btn.classList.add('answered');
        }
        
        if (markedQuestions.has(index)) {
            btn.classList.add('marked');
        }
    });
}

function previousQuestion() {
    if (currentQuestionIndex > 0) {
        loadQuestion(currentQuestionIndex - 1);
    }
}

function nextQuestion() {
    if (currentQuestionIndex < currentTest.questions.length - 1) {
        loadQuestion(currentQuestionIndex + 1);
    }
}

function filterBySection() {
    const section = document.getElementById('sectionFilter').value;
    
    currentTest.questions.forEach((q, index) => {
        const btn = document.getElementById(`palette-${index}`);
        if (section === 'all' || q.section === section) {
            btn.style.display = 'block';
        } else {
            btn.style.display = 'none';
        }
    });
}

function startTimer() {
    updateTimerDisplay();
    
    timerInterval = setInterval(() => {
        timeRemaining--;
        updateTimerDisplay();
        
        if (timeRemaining <= 0) {
            clearInterval(timerInterval);
            alert('Time is up! Test will be submitted automatically.');
            submitTest();
        }
    }, 1000);
}

function updateTimerDisplay() {
    const hours = Math.floor(timeRemaining / 3600);
    const minutes = Math.floor((timeRemaining % 3600) / 60);
    const seconds = timeRemaining % 60;
    
    document.getElementById('timerDisplay').textContent = 
        `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    
    // Change color when time is running low
    const timer = document.querySelector('.timer');
    if (timeRemaining < 300) { // Last 5 minutes
        timer.style.background = '#fee2e2';
        timer.style.borderColor = '#ef4444';
    }
}

function submitTest() {
    if (!confirm(`You have answered ${Object.keys(responses).length} out of ${currentTest.totalQuestions} questions.\n\nAre you sure you want to submit?`)) {
        return;
    }
    
    clearInterval(timerInterval);
    window.onbeforeunload = null;
    
    // Calculate results
    let correct = 0;
    let incorrect = 0;
    let unanswered = 0;
    let sectionWise = {
        Physics: { correct: 0, incorrect: 0, unanswered: 0 },
        Chemistry: { correct: 0, incorrect: 0, unanswered: 0 },
        Mathematics: { correct: 0, incorrect: 0, unanswered: 0 }
    };
    
    const detailedResponses = [];
    
    currentTest.questions.forEach((q, index) => {
        const userAnswer = responses[index];
        const isCorrect = userAnswer && String(userAnswer).trim() === String(q.correctAnswer).trim();
        
        if (!userAnswer) {
            unanswered++;
            sectionWise[q.section].unanswered++;
        } else if (isCorrect) {
            correct++;
            sectionWise[q.section].correct++;
        } else {
            incorrect++;
            sectionWise[q.section].incorrect++;
        }
        
        detailedResponses.push({
            questionId: index + 1,
            section: q.section,
            userAnswer: userAnswer || 'Not Attempted',
            correctAnswer: q.correctAnswer,
            isCorrect: isCorrect,
            questionImage: q.imageData
        });
    });
    
    const totalMarks = currentTest.totalQuestions * currentTest.markingScheme.correct;
    const marksObtained = (correct * currentTest.markingScheme.correct) + 
                          (incorrect * currentTest.markingScheme.incorrect);
    const percentage = (marksObtained / totalMarks) * 100;
    
    const timeTaken = (currentTest.duration * 60) - timeRemaining;
    
    const result = {
        attemptId: attemptId,
        testId: currentTest.id,
        testName: currentTest.name,
        timestamp: new Date().toISOString(),
        correct: correct,
        incorrect: incorrect,
        unanswered: unanswered,
        totalQuestions: currentTest.totalQuestions,
        marksObtained: marksObtained.toFixed(2),
        totalMarks: totalMarks,
        percentage: percentage.toFixed(2),
        timeTaken: timeTaken,
        sectionWise: sectionWise,
        detailedResponses: detailedResponses
    };
    
    // Save result
    const results = JSON.parse(localStorage.getItem('jeeResults') || '[]');
    results.push(result);
    localStorage.setItem('jeeResults', JSON.stringify(results));
    
    // Redirect to result page
    window.location.href = `result.html?attemptId=${attemptId}`;
}
