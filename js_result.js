let currentResult = null;

window.addEventListener('DOMContentLoaded', () => {
    loadResult();
});

function loadResult() {
    const urlParams = new URLSearchParams(window.location.search);
    const attemptId = urlParams.get('attemptId');
    
    if (!attemptId) {
        alert('No result found');
        window.location.href = 'index.html';
        return;
    }
    
    const results = JSON.parse(localStorage.getItem('jeeResults') || '[]');
    currentResult = results.find(r => r.attemptId === attemptId);
    
    if (!currentResult) {
        alert('Result not found');
        window.location.href = 'index.html';
        return;
    }
    
    displayResult();
}

function displayResult() {
    // Basic info
    document.getElementById('testName').textContent = currentResult.testName;
    document.getElementById('scoreDisplay').textContent = currentResult.percentage + '%';
    document.getElementById('marksObtained').textContent = currentResult.marksObtained;
    document.getElementById('totalMarks').textContent = currentResult.totalMarks;
    
    // Time taken
    const hours = Math.floor(currentResult.timeTaken / 3600);
    const minutes = Math.floor((currentResult.timeTaken % 3600) / 60);
    const seconds = currentResult.timeTaken % 60;
    document.getElementById('timeTaken').textContent = 
        `${hours}h ${minutes}m ${seconds}s`;
    
    // Performance stats
    document.getElementById('correctCount').textContent = currentResult.correct;
    document.getElementById('incorrectCount').textContent = currentResult.incorrect;
    document.getElementById('unansweredCount').textContent = currentResult.unanswered;
    
    const attemptedQuestions = currentResult.correct + currentResult.incorrect;
    const accuracy = attemptedQuestions > 0 ? 
        ((currentResult.correct / attemptedQuestions) * 100).toFixed(1) : 0;
    document.getElementById('accuracy').textContent = accuracy + '%';
    
    // Section-wise performance
    displaySectionPerformance('Physics', 'physics');
    displaySectionPerformance('Chemistry', 'chemistry');
    displaySectionPerformance('Mathematics', 'maths');
    
    // Update analysis link
    document.getElementById('analysisLink').href = `analysis.html?attemptId=${currentResult.attemptId}`;
    
    // Load saved percentile if exists
    if (currentResult.percentile) {
        document.getElementById('percentileInput').value = currentResult.percentile;
    }
}

function displaySectionPerformance(sectionName, sectionId) {
    const sectionData = currentResult.sectionWise[sectionName];
    const totalInSection = sectionData.correct + sectionData.incorrect + sectionData.unanswered;
    
    // Calculate marks for this section (assuming same marking scheme)
    const tests = JSON.parse(localStorage.getItem('jeeTests') || '[]');
    const test = tests.find(t => t.id === currentResult.testId);
    
    if (!test) return;
    
    const marksPerQuestion = test.markingScheme.correct;
    const negativeMarks = test.markingScheme.incorrect;
    
    const sectionMarks = (sectionData.correct * marksPerQuestion) + 
                         (sectionData.incorrect * negativeMarks);
    const maxSectionMarks = totalInSection * marksPerQuestion;
    
    const percentage = maxSectionMarks > 0 ? 
        ((sectionMarks / maxSectionMarks) * 100) : 0;
    
    // Update UI
    document.getElementById(`${sectionId}Score`).textContent = 
        `${sectionData.correct}/${totalInSection}`;
    
    const bar = document.getElementById(`${sectionId}Bar`);
    setTimeout(() => {
        bar.style.width = Math.max(percentage, 0) + '%';
        bar.textContent = percentage.toFixed(0) + '%';
    }, 100);
}

function savePercentile() {
    const percentile = parseFloat(document.getElementById('percentileInput').value);
    
    if (isNaN(percentile) || percentile < 0 || percentile > 100) {
        alert('Please enter a valid percentile between 0 and 100');
        return;
    }
    
    // Update result with percentile
    const results = JSON.parse(localStorage.getItem('jeeResults') || '[]');
    const resultIndex = results.findIndex(r => r.attemptId === currentResult.attemptId);
    
    if (resultIndex !== -1) {
        results[resultIndex].percentile = percentile;
        localStorage.setItem('jeeResults', JSON.stringify(results));
        currentResult.percentile = percentile;
        
        document.getElementById('percentileSaved').style.display = 'block';
        setTimeout(() => {
            document.getElementById('percentileSaved').style.display = 'none';
        }, 3000);
    }
}
