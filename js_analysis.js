let currentAnalysis = null;
let allQuestions = [];

window.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const attemptId = urlParams.get('attemptId');
    
    if (attemptId) {
        loadAnalysis(attemptId);
    } else {
        loadAttemptsList();
    }
});

function loadAttemptsList() {
    const results = JSON.parse(localStorage.getItem('jeeResults') || '[]');
    const attemptsList = document.getElementById('attemptsList');
    const noAttempts = document.getElementById('noAttempts');
    
    if (results.length === 0) {
        noAttempts.style.display = 'block';
        return;
    }
    
    // Sort by timestamp (newest first)
    results.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    let html = '<div style="display: grid; gap: 15px;">';
    results.forEach((result, index) => {
        const date = new Date(result.timestamp).toLocaleString();
        const percentile = result.percentile ? `${result.percentile}%ile` : 'Not set';
        
        html += `
            <div class="result-card" style="cursor: pointer;" 
                 onclick="loadAnalysis('${result.attemptId}')">
                <div style="display: flex; justify-content: space-between; align-items: start;">
                    <div>
                        <h3 style="color: #333; margin-bottom: 8px;">${result.testName}</h3>
                        <div style="color: #666; font-size: 0.9rem;">
                            <div>📅 ${date}</div>
                            <div style="margin-top: 5px;">
                                Score: ${result.percentage}% | 
                                Percentile: ${percentile}
                            </div>
                        </div>
                    </div>
                    <div style="text-align: right;">
                        <div style="font-size: 2rem; font-weight: bold; color: #667eea;">
                            ${result.percentage}%
                        </div>
                    </div>
                </div>
            </div>
        `;
    });
    html += '</div>';
    attemptsList.innerHTML = html;
}

function loadAnalysis(attemptId) {
    const results = JSON.parse(localStorage.getItem('jeeResults') || '[]');
    currentAnalysis = results.find(r => r.attemptId === attemptId);
    
    if (!currentAnalysis) {
        alert('Analysis not found');
        window.location.href = 'analysis.html';
        return;
    }
    
    document.getElementById('testSelection').style.display = 'none';
    document.getElementById('analysisView').style.display = 'block';
    
    displayAnalysis();
}

function displayAnalysis() {
    // Header info
    document.getElementById('analysisTestName').textContent = currentAnalysis.testName;
    document.getElementById('analysisDate').textContent = 
        new Date(currentAnalysis.timestamp).toLocaleString();
    document.getElementById('analysisScore').textContent = 
        `${currentAnalysis.marksObtained}/${currentAnalysis.totalMarks} (${currentAnalysis.percentage}%)`;
    document.getElementById('analysisPercentile').textContent = 
        currentAnalysis.percentile ? `${currentAnalysis.percentile}%ile` : 'Not set';
    
    // Performance chart stats
    document.getElementById('chartCorrect').textContent = currentAnalysis.correct;
    document.getElementById('chartIncorrect').textContent = currentAnalysis.incorrect;
    document.getElementById('chartUnanswered').textContent = currentAnalysis.unanswered;
    
    // Draw performance chart
    drawPerformanceChart();
    
    // Section-wise analysis
    displaySectionWiseAnalysis();
    
    // Question review
    allQuestions = currentAnalysis.detailedResponses;
    displayQuestionReview();
}

function drawPerformanceChart() {
    const canvas = document.getElementById('performanceChart');
    const ctx = canvas.getContext('2d');
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    const data = [
        { label: 'Correct', value: currentAnalysis.correct, color: '#10b981' },
        { label: 'Incorrect', value: currentAnalysis.incorrect, color: '#ef4444' },
        { label: 'Unanswered', value: currentAnalysis.unanswered, color: '#f59e0b' }
    ];
    
    const total = data.reduce((sum, item) => sum + item.value, 0);
    
    // Draw bar chart
    const barWidth = 80;
    const maxHeight = 150;
    const spacing = 40;
    const startX = 50;
    const startY = 180;
    
    data.forEach((item, index) => {
        const barHeight = (item.value / total) * maxHeight;
        const x = startX + (index * (barWidth + spacing));
        const y = startY - barHeight;
        
        // Draw bar
        ctx.fillStyle = item.color;
        ctx.fillRect(x, y, barWidth, barHeight);
        
        // Draw value on top
        ctx.fillStyle = '#333';
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(item.value, x + barWidth/2, y - 10);
        
        // Draw label
        ctx.fillStyle = '#666';
        ctx.font = '14px Arial';
        ctx.fillText(item.label, x + barWidth/2, startY + 20);
    });
}

function displaySectionWiseAnalysis() {
    const sectionAnalysis = document.getElementById('sectionAnalysis');
    const sections = ['Physics', 'Chemistry', 'Mathematics'];
    
    let html = '<table><thead><tr><th>Section</th><th>Correct</th><th>Incorrect</th><th>Unanswered</th><th>Accuracy</th></tr></thead><tbody>';
    
    sections.forEach(section => {
        const data = currentAnalysis.sectionWise[section];
        const attempted = data.correct + data.incorrect;
        const accuracy = attempted > 0 ? ((data.correct / attempted) * 100).toFixed(1) : 0;
        
        html += `
            <tr>
                <td><strong>${section}</strong></td>
                <td><span class="status-badge correct">${data.correct}</span></td>
                <td><span class="status-badge incorrect">${data.incorrect}</span></td>
                <td><span class="status-badge skipped">${data.unanswered}</span></td>
                <td><strong>${accuracy}%</strong></td>
            </tr>
        `;
    });
    
    html += '</tbody></table>';
    sectionAnalysis.innerHTML = html;
}

function displayQuestionReview(filteredQuestions = null) {
    const questions = filteredQuestions || allQuestions;
    const reviewDiv = document.getElementById('questionReview');
    
    if (questions.length === 0) {
        reviewDiv.innerHTML = '<p style="text-align: center; padding: 40px; color: #666;">No questions match the filter.</p>';
        return;
    }
    
    let html = '<div style="display: grid; gap: 20px;">';
    
    questions.forEach((q, index) => {
        const statusClass = q.isCorrect ? 'correct' : 
                           (q.userAnswer === 'Not Attempted' ? 'skipped' : 'incorrect');
        const statusText = q.isCorrect ? 'Correct' : 
                          (q.userAnswer === 'Not Attempted' ? 'Not Attempted' : 'Incorrect');
        
        html += `
            <div style="border: 2px solid #e0e0e0; border-radius: 10px; padding: 20px;">
                <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 15px;">
                    <div>
                        <h4 style="color: #333;">Question ${q.questionId}</h4>
                        <span style="color: #666; font-size: 0.9rem;">${q.section}</span>
                    </div>
                    <span class="status-badge ${statusClass}">${statusText}</span>
                </div>
                
                <img src="${q.questionImage}" class="question-image" alt="Question ${q.questionId}">
                
                <div style="margin-top: 15px; display: grid; gap: 10px;">
                    <div style="padding: 10px; background: ${q.isCorrect ? '#d1fae5' : '#fee2e2'}; border-radius: 6px;">
                        <strong>Your Answer:</strong> ${q.userAnswer}
                    </div>
                    <div style="padding: 10px; background: #d1fae5; border-radius: 6px;">
                        <strong>Correct Answer:</strong> ${q.correctAnswer}
                    </div>
                </div>
            </div>
        `;
    });
    
    html += '</div>';
    reviewDiv.innerHTML = html;
}

function filterQuestions() {
    const statusFilter = document.getElementById('questionFilter').value;
    const sectionFilter = document.getElementById('sectionFilterAnalysis').value;
    
    let filtered = allQuestions;
    
    // Filter by status
    if (statusFilter === 'correct') {
        filtered = filtered.filter(q => q.isCorrect);
    } else if (statusFilter === 'incorrect') {
        filtered = filtered.filter(q => !q.isCorrect && q.userAnswer !== 'Not Attempted');
    } else if (statusFilter === 'unanswered') {
        filtered = filtered.filter(q => q.userAnswer === 'Not Attempted');
    }
    
    // Filter by section
    if (sectionFilter !== 'all') {
        filtered = filtered.filter(q => q.section === sectionFilter);
    }
    
    displayQuestionReview(filtered);
}
