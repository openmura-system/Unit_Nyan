// ==========================================
// 単位管理アプリ - JavaScriptファイル
// ==========================================

// グローバル変数
let subjects = JSON.parse(localStorage.getItem('subjects') || '[]');

// 学期設定
const SEMESTER_WEEKS = {
    first: 15,  // 前期
    second: 18  // 後期
};

// ==========================================
// 初期化処理
// ==========================================
document.addEventListener('DOMContentLoaded', function() {
    loadSubjects();
    updateDashboard();
    updateAttendanceList();
    
    // フォーム送信イベント
    document.getElementById('subjectForm').addEventListener('submit', addSubject);
});

// ==========================================
// タブ機能
// ==========================================
function showTab(tabName) {
    // すべてのタブを非アクティブに
    document.querySelectorAll('.tab-pane').forEach(pane => pane.classList.remove('active'));
    document.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
    
    // 選択されたタブをアクティブに
    document.getElementById(tabName).classList.add('active');
    event.target.classList.add('active');
    
    // データ更新
    if (tabName === 'dashboard') updateDashboard();
    if (tabName === 'attendance') updateAttendanceList();
}

// ==========================================
// 科目管理機能
// ==========================================

// 科目追加
function addSubject(event) {
    event.preventDefault();
    
    const name = document.getElementById('subjectName').value;
    const weeklyClasses = parseInt(document.getElementById('weeklyClasses').value);
    const required = document.getElementById('required').value === 'true';
    
    const subject = {
        id: Date.now().toString(),
        name,
        required,
        weeklyClasses,
        absentCount: 0,
        maxAbsent: weeklyClasses * 5,
        totalClasses: weeklyClasses * (SEMESTER_WEEKS.first + SEMESTER_WEEKS.second)
    };
    
    subjects.push(subject);
    saveSubjects();
    
    // フォームリセット
    document.getElementById('subjectForm').reset();
    
    // 表示更新
    loadSubjects();
    updateDashboard();
    updateAttendanceList();
    
    alert('科目を追加しました！');
}

// 科目削除
function deleteSubject(subjectId) {
    if (confirm('本当にこの科目を削除しますか？')) {
        subjects = subjects.filter(s => s.id !== subjectId);
        saveSubjects();
        loadSubjects();
        updateDashboard();
        updateAttendanceList();
    }
}

// ==========================================
// 出席管理機能
// ==========================================

// 欠席追加
function addAbsence(subjectId) {
    const subject = subjects.find(s => s.id === subjectId);
    if (subject) {
        subject.absentCount++;
        saveSubjects();
        updateDashboard();
        updateAttendanceList();
    }
}

// 欠席削除（間違えた場合）
function removeAbsence(subjectId) {
    const subject = subjects.find(s => s.id === subjectId);
    if (subject && subject.absentCount > 0) {
        subject.absentCount--;
        saveSubjects();
        updateDashboard();
        updateAttendanceList();
    }
}

// ==========================================
// 計算機能
// ==========================================

// 危険度計算
function calculateRiskLevel(subject) {
    const remaining = subject.maxAbsent - subject.absentCount;
    
    if (subject.absentCount >= subject.maxAbsent) {
        return { level: '🔴 留年確定', class: 'risk-critical', color: '#b71c1c' };
    } else if (remaining <= 1) {
        return { level: '🔴 超危険', class: 'risk-danger', color: '#c62828' };
    } else if (remaining <= 2) {
        return { level: '🟡 危険', class: 'risk-warning', color: '#f57c00' };
    } else {
        return { level: '🟢 安全', class: 'risk-safe', color: '#2e7d32' };
    }
}

// 出席率計算
function calculateAttendanceRate(subject) {
    if (subject.totalClasses === 0) return 100;
    const attendedClasses = subject.totalClasses - subject.absentCount;
    return Math.max(0, (attendedClasses / subject.totalClasses) * 100);
}

// ==========================================
// 表示更新機能
// ==========================================

// ダッシュボード更新
function updateDashboard() {
    updateOverview();
    updateSubjectsList();
}

// 概要更新
function updateOverview() {
    const totalSubjects = subjects.length;
    const dangerousSubjects = subjects.filter(s => {
        const risk = calculateRiskLevel(s);
        return risk.class === 'risk-danger' || risk.class === 'risk-critical';
    }).length;
    const avgAttendance = totalSubjects > 0 
        ? subjects.reduce((sum, s) => sum + calculateAttendanceRate(s), 0) / totalSubjects 
        : 100;

    document.getElementById('overview').innerHTML = `
        <div class="overview-card">
            <div class="overview-value">${totalSubjects}</div>
            <div class="overview-label">履修科目数</div>
        </div>
        <div class="overview-card">
            <div class="overview-value">${dangerousSubjects}</div>
            <div class="overview-label">危険な科目</div>
        </div>
        <div class="overview-card">
            <div class="overview-value">${avgAttendance.toFixed(1)}%</div>
            <div class="overview-label">平均出席率</div>
        </div>
    `;
}

// 科目リスト更新
function updateSubjectsList() {
    const container = document.getElementById('subjectsList');
    
    if (subjects.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div style="font-size: 3em; margin-bottom: 20px;">📚</div>
                <h3>科目が登録されていません</h3>
                <p>「科目管理」タブから科目を追加してください</p>
            </div>
        `;
        return;
    }

    container.innerHTML = subjects.map(subject => {
        const risk = calculateRiskLevel(subject);
        const attendanceRate = calculateAttendanceRate(subject);
        const remaining = subject.maxAbsent - subject.absentCount;
        
        return `
            <div class="subject-card">
                <div class="subject-header">
                    <div class="subject-name">${subject.name}</div>
                    <div class="risk-badge ${risk.class}">${risk.level}</div>
                </div>
                <div class="subject-stats">
                    <div class="stat-item">
                        <div class="stat-value">${subject.absentCount}</div>
                        <div class="stat-label">欠席回数</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-value">${remaining}</div>
                        <div class="stat-label">残り休める回数</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-value">${attendanceRate.toFixed(1)}%</div>
                        <div class="stat-label">出席率</div>
                    </div>
                </div>
                <div class="progress-bar">
                    <div class="progress-fill ${risk.class === 'risk-safe' ? 'progress-safe' : risk.class === 'risk-warning' ? 'progress-warning' : 'progress-danger'}" 
                         style="width: ${attendanceRate}%"></div>
                </div>
                <p style="margin-top: 10px; color: #666;">
                    週${subject.weeklyClasses}回 • ${subject.required ? '必修' : '選択'}
                </p>
            </div>
        `;
    }).join('');
}

// 出席記録リスト更新
function updateAttendanceList() {
    const container = document.getElementById('attendanceList');
    
    if (subjects.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div style="font-size: 3em; margin-bottom: 20px;">📅</div>
                <h3>科目が登録されていません</h3>
                <p>まず「科目管理」から科目を追加してください</p>
            </div>
        `;
        return;
    }

    container.innerHTML = subjects.map(subject => {
        const risk = calculateRiskLevel(subject);
        const remaining = subject.maxAbsent - subject.absentCount;
        
        return `
            <div class="subject-card">
                <div class="subject-header">
                    <div class="subject-name">${subject.name}</div>
                    <div class="risk-badge ${risk.class}">${risk.level}</div>
                </div>
                <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 15px;">
                    <div>
                        <strong>欠席回数: ${subject.absentCount}/${subject.maxAbsent}</strong><br>
                        <small style="color: #666;">あと${remaining}回休めます</small>
                    </div>
                    <div>
                        <button class="btn btn-danger" onclick="addAbsence('${subject.id}')" 
                                ${subject.absentCount >= subject.maxAbsent ? 'disabled' : ''}>
                            欠席を記録 (+1)
                        </button>
                        <button class="btn btn-warning" onclick="removeAbsence('${subject.id}')" 
                                ${subject.absentCount === 0 ? 'disabled' : ''}>
                            取消 (-1)
                        </button>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// 科目管理リスト更新
function loadSubjects() {
    const container = document.getElementById('subjectsManageList');
    
    if (subjects.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #666;">まだ科目が登録されていません</p>';
        return;
    }

    container.innerHTML = `
        <h3>登録済み科目</h3>
        ${subjects.map(subject => `
            <div class="subject-card" style="display: flex; justify-content: space-between; align-items: center;">
                <div>
                    <strong>${subject.name}</strong><br>
                    <small>週${subject.weeklyClasses}回 • ${subject.required ? '必修' : '選択'}</small>
                </div>
                <button class="btn btn-danger" onclick="deleteSubject('${subject.id}')">削除</button>
            </div>
        `).join('')}
    `;
}

// ==========================================
// データ保存・読み込み
// ==========================================
function saveSubjects() {
    localStorage.setItem('subjects', JSON.stringify(subjects));
}