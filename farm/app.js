import { questionsData } from './src/data/questions.js';
import { storage } from './src/utils/storage.js';

// 全局狀態
let state = {
  currentView: 'home', // 'home' | 'quiz' | 'result' | 'wrong_review'
  
  // 測驗設定
  config: {
    questionCount: 25, // 25 | 40
    typeFilter: 'all',  // 'all' | 'single' | 'multiple'
    isWrongOnlyMode: false
  },
  
  // 當前測驗狀態
  quiz: {
    questions: [],
    currentIndex: 0,
    userAnswers: {}, // { [questionId]: ['A'] or ['A', 'C'] }
    flagged: {},     // { [questionId]: true/false }
    startTime: null,
    durationSec: 0,
    timerInterval: null
  },
  
  // 上次完成的測驗結果
  lastResult: null,

  // 錯題庫過濾關鍵字
  wrongSearchQuery: '',
  wrongTypeFilter: 'all',

  // 雲端同步狀態
  isSyncing: false
};

// 初始化應用程式
function initApp() {
  renderNavbar();
  renderView();
}

// 導覽列與總錯題計數器更新
function renderNavbar() {
  const wrongMap = storage.getWrongQuestions();
  const count = Object.keys(wrongMap).length;
  const badge = document.getElementById('navWrongCount');
  if (badge) {
    badge.textContent = count;
    badge.style.display = count > 0 ? 'inline-block' : 'none';
  }

  const gasUrl = storage.getGasApiUrl();
  const gasStatus = document.getElementById('navGasStatus');
  if (gasStatus) {
    gasStatus.textContent = gasUrl ? '🟢 雲端連線' : '⚙️ 綁定雲端';
  }
}

// 切換頁面視圖
function navigateTo(viewName, extraConfig = {}) {
  state.currentView = viewName;
  if (extraConfig.config) {
    state.config = { ...state.config, ...extraConfig.config };
  }
  renderNavbar();
  renderView();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// 渲染當前畫面的主入口
function renderView() {
  const app = document.getElementById('app-content');
  if (!app) return;

  switch (state.currentView) {
    case 'home':
      app.innerHTML = renderHomeScreen();
      bindHomeEvents();
      break;

    case 'quiz':
      app.innerHTML = renderQuizScreen();
      bindQuizEvents();
      break;

    case 'result':
      app.innerHTML = renderResultScreen();
      bindResultEvents();
      break;

    case 'wrong_review':
      app.innerHTML = renderWrongReviewScreen();
      bindWrongReviewEvents();
      break;

    default:
      app.innerHTML = renderHomeScreen();
      bindHomeEvents();
  }
}

/* ==========================================================================
   1. 主頁面 (Home Screen)
   ========================================================================== */
function renderHomeScreen() {
  const wrongMap = storage.getWrongQuestions();
  const wrongCount = Object.keys(wrongMap).length;
  const history = storage.getExamHistory();
  const totalExams = history.length;
  const avgScore = totalExams > 0 ? Math.round(history.reduce((a, b) => a + (b.score || 0), 0) / totalExams) : 0;

  const gasUrl = storage.getGasApiUrl();

  return `
    <div class="fade-in" style="max-width: 1000px; margin: 0 auto; padding: 2rem 1rem;">
      <!-- Hero 標題牆 -->
      <div class="glass-card" style="padding: 2.5rem 2rem; text-align: center; margin-bottom: 2rem; position: relative; overflow: hidden;">
        <div style="position: absolute; top: -50px; right: -50px; width: 200px; height: 200px; background: rgba(16, 185, 129, 0.15); filter: blur(60px); border-radius: 50%;"></div>
        <div style="display: inline-flex; align-items: center; gap: 0.5rem; background: rgba(16, 185, 129, 0.15); border: 1px solid rgba(16, 185, 129, 0.3); color: #34d399; font-weight: 600; font-size: 0.85rem; padding: 0.35rem 1rem; border-radius: 999px; margin-bottom: 1rem;">
          🌾 農會考選必備 ‧ 法規高頻大題庫 (收錄 205 全真試題)
        </div>
        <h1 style="font-size: 2.2rem; font-weight: 800; margin-bottom: 0.75rem; background: linear-gradient(135deg, #fff 0%, #cbd5e1 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">
          農會法與農會法施行細則 模擬測驗系統
        </h1>
        <p style="color: var(--text-muted); font-size: 1.05rem; max-width: 700px; margin: 0 auto 1.25rem auto;">
          擬真考選作答介面 ‧ 精確法條條文對照 ‧ 支援 Google Sheet 雲端跨裝置同步儲存
        </p>

        <!-- 雲端連線狀態指示按鈕 -->
        <div style="display: inline-flex; align-items: center; gap: 0.6rem; background: rgba(15, 23, 42, 0.6); border: 1px solid var(--card-border); padding: 0.4rem 1rem; border-radius: 12px; font-size: 0.85rem;">
          <span>${gasUrl ? '🟢 雲端 Google 試算表已連線同步' : '⚪ 本地模式 (未綁定 Google 試算表)'}</span>
          <button id="btnOpenGasModalHome" style="background: rgba(255, 255, 255, 0.1); border: 1px solid rgba(255, 255, 255, 0.2); color: var(--text-main); font-size: 0.8rem; padding: 0.2rem 0.6rem; border-radius: 6px; cursor: pointer;">
            ${gasUrl ? '變更設定' : '⚙️ 設定 Google 試算表'}
          </button>
        </div>
      </div>

      <!-- 統計數據卡片 -->
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1.25rem; margin-bottom: 2.5rem;">
        <div class="glass-card" style="padding: 1.5rem; text-align: center;">
          <div style="font-size: 0.9rem; color: var(--text-muted); margin-bottom: 0.5rem;">收錄全真題庫</div>
          <div style="font-size: 2rem; font-weight: 800; color: #60a5fa;">${questionsData.length} <span style="font-size: 1rem; font-weight: 500;">題</span></div>
        </div>
        <div class="glass-card" style="padding: 1.5rem; text-align: center;">
          <div style="font-size: 0.9rem; color: var(--text-muted); margin-bottom: 0.5rem;">累積錯題數量</div>
          <div style="font-size: 2rem; font-weight: 800; color: #f43f5e;">${wrongCount} <span style="font-size: 1rem; font-weight: 500;">題</span></div>
        </div>
        <div class="glass-card" style="padding: 1.5rem; text-align: center;">
          <div style="font-size: 0.9rem; color: var(--text-muted); margin-bottom: 0.5rem;">完成模擬測驗</div>
          <div style="font-size: 2rem; font-weight: 800; color: #34d399;">${totalExams} <span style="font-size: 1rem; font-weight: 500;">次</span></div>
        </div>
        <div class="glass-card" style="padding: 1.5rem; text-align: center;">
          <div style="font-size: 0.9rem; color: var(--text-muted); margin-bottom: 0.5rem;">平均測驗得分</div>
          <div style="font-size: 2rem; font-weight: 800; color: #fbbf24;">${avgScore} <span style="font-size: 1rem; font-weight: 500;">分</span></div>
        </div>
      </div>

      <!-- 測驗選項主要區塊 -->
      <div style="display: grid; grid-template-columns: 1.4fr 1fr; gap: 1.5rem;" class="grid-2col">
        <!-- 1. 開始新測驗 -->
        <div class="glass-card glass-card-hover" style="padding: 2rem; display: flex; flex-direction: column; justify-content: space-between;">
          <div>
            <div style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 1.25rem;">
              <div style="width: 42px; height: 42px; border-radius: 12px; background: rgba(16, 185, 129, 0.2); color: #34d399; display: flex; align-items: center; justify-content: center; font-size: 1.4rem;">🎯</div>
              <div>
                <h2 style="font-size: 1.4rem; font-weight: 700;">1. 開始新測驗</h2>
                <p style="font-size: 0.875rem; color: var(--text-muted);">選擇題數與題型進行全真模擬考試</p>
              </div>
            </div>

            <!-- 選擇題數 -->
            <div style="margin-bottom: 1.5rem;">
              <label style="display: block; font-size: 0.95rem; font-weight: 600; margin-bottom: 0.75rem; color: var(--text-main);">
                作答題數設定：
              </label>
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                <button type="button" class="count-opt-btn ${state.config.questionCount === 25 ? 'selected' : ''}" data-count="25"
                  style="padding: 0.9rem; border-radius: 12px; border: 2px solid ${state.config.questionCount === 25 ? 'var(--primary-emerald)' : 'var(--card-border)'}; background: ${state.config.questionCount === 25 ? 'rgba(16, 185, 129, 0.15)' : 'rgba(15, 23, 42, 0.5)'}; color: var(--text-main); font-weight: 600; cursor: pointer; text-align: center; transition: all 0.2s;">
                  <div style="font-size: 1.2rem; font-weight: 800; color: #34d399;">25 題</div>
                  <div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 2px;">標準練習測驗 (約15-20分鐘)</div>
                </button>
                <button type="button" class="count-opt-btn ${state.config.questionCount === 40 ? 'selected' : ''}" data-count="40"
                  style="padding: 0.9rem; border-radius: 12px; border: 2px solid ${state.config.questionCount === 40 ? 'var(--primary-emerald)' : 'var(--card-border)'}; background: ${state.config.questionCount === 40 ? 'rgba(16, 185, 129, 0.15)' : 'rgba(15, 23, 42, 0.5)'}; color: var(--text-main); font-weight: 600; cursor: pointer; text-align: center; transition: all 0.2s;">
                  <div style="font-size: 1.2rem; font-weight: 800; color: #60a5fa;">40 題</div>
                  <div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 2px;">全真模擬考 (約30-40分鐘)</div>
                </button>
              </div>
            </div>

            <!-- 題型選擇 -->
            <div style="margin-bottom: 2rem;">
              <label style="display: block; font-size: 0.95rem; font-weight: 600; margin-bottom: 0.75rem; color: var(--text-main);">
                題型範圍劃分：
              </label>
              <div style="display: flex; gap: 0.75rem; flex-wrap: wrap;">
                <button type="button" class="type-opt-btn ${state.config.typeFilter === 'all' ? 'active' : ''}" data-type="all"
                  style="padding: 0.5rem 1rem; border-radius: 10px; border: 1px solid ${state.config.typeFilter === 'all' ? 'var(--primary-emerald)' : 'var(--card-border)'}; background: ${state.config.typeFilter === 'all' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(15, 23, 42, 0.4)'}; color: var(--text-main); cursor: pointer; font-size: 0.9rem;">
                  🎯 混和題型 (單選+複選)
                </button>
                <button type="button" class="type-opt-btn ${state.config.typeFilter === 'single' ? 'active' : ''}" data-type="single"
                  style="padding: 0.5rem 1rem; border-radius: 10px; border: 1px solid ${state.config.typeFilter === 'single' ? '#3b82f6' : 'var(--card-border)'}; background: ${state.config.typeFilter === 'single' ? 'rgba(59, 130, 246, 0.2)' : 'rgba(15, 23, 42, 0.4)'}; color: var(--text-main); cursor: pointer; font-size: 0.9rem;">
                  🔘 僅單選題
                </button>
                <button type="button" class="type-opt-btn ${state.config.typeFilter === 'multiple' ? 'active' : ''}" data-type="multiple"
                  style="padding: 0.5rem 1rem; border-radius: 10px; border: 1px solid ${state.config.typeFilter === 'multiple' ? '#a855f7' : 'var(--card-border)'}; background: ${state.config.typeFilter === 'multiple' ? 'rgba(168, 85, 247, 0.2)' : 'rgba(15, 23, 42, 0.4)'}; color: var(--text-main); cursor: pointer; font-size: 0.9rem;">
                  ☑️ 僅複選題
                </button>
              </div>
            </div>
          </div>

          <button id="btnStartNewQuiz" class="btn-primary" style="width: 100%; padding: 1rem; font-size: 1.1rem;">
            🚀 開始新測驗
          </button>
        </div>

        <!-- 2. 歷史錯題專區 -->
        <div class="glass-card glass-card-hover" style="padding: 2rem; display: flex; flex-direction: column; justify-content: space-between;">
          <div>
            <div style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 1.25rem;">
              <div style="width: 42px; height: 42px; border-radius: 12px; background: rgba(244, 63, 94, 0.2); color: #fda4af; display: flex; align-items: center; justify-content: center; font-size: 1.4rem;">📖</div>
              <div>
                <h2 style="font-size: 1.4rem; font-weight: 700;">2. 歷史錯題</h2>
                <p style="font-size: 0.875rem; color: var(--text-muted);">針對作答錯誤題目進行強化與重測</p>
              </div>
            </div>

            <div style="background: rgba(15, 23, 42, 0.5); border: 1px solid var(--card-border); border-radius: 12px; padding: 1.25rem; margin-bottom: 1.5rem; text-align: center;">
              <div style="font-size: 0.9rem; color: var(--text-muted); margin-bottom: 0.25rem;">目前收錄錯題數量</div>
              <div style="font-size: 2.2rem; font-weight: 900; color: var(--accent-rose);">${wrongCount} <span style="font-size: 1rem; font-weight: 400;">題</span></div>
              <p style="font-size: 0.8rem; color: var(--text-dim); margin-top: 0.5rem;">
                ${wrongCount === 0 ? '目前無錯題紀錄，太棒了！' : '建立個人錯題庫，重複考驗直到融會貫通。'}
              </p>
            </div>
          </div>

          <div style="display: flex; flex-direction: column; gap: 0.75rem;">
            <button id="btnGoWrongReview" class="btn-secondary" style="width: 100%; justify-content: center;">
              📚 進入錯題庫複習解析
            </button>
            <button id="btnStartWrongQuiz" class="btn-primary" style="width: 100%; background: linear-gradient(135deg, #f43f5e 0%, #e11d48 100%); box-shadow: 0 4px 15px rgba(244, 63, 94, 0.3);" ${wrongCount === 0 ? 'disabled style="opacity:0.5; cursor:not-allowed;"' : ''}>
              ⚡ 歷史錯題隨機重測
            </button>
          </div>
        </div>
      </div>
    </div>
  `;
}

function bindHomeEvents() {
  document.querySelectorAll('.count-opt-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      state.config.questionCount = parseInt(e.currentTarget.getAttribute('data-count'));
      renderView();
    });
  });

  document.querySelectorAll('.type-opt-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      state.config.typeFilter = e.currentTarget.getAttribute('data-type');
      renderView();
    });
  });

  document.getElementById('btnStartNewQuiz')?.addEventListener('click', () => {
    startQuizSession(false);
  });

  document.getElementById('btnGoWrongReview')?.addEventListener('click', () => {
    navigateTo('wrong_review');
  });

  document.getElementById('btnStartWrongQuiz')?.addEventListener('click', () => {
    const wrongMap = storage.getWrongQuestions();
    if (Object.keys(wrongMap).length === 0) {
      alert('目前沒有歷史錯題可供重測！');
      return;
    }
    startQuizSession(true);
  });

  document.getElementById('btnOpenGasModalHome')?.addEventListener('click', openGasModal);
}

/* ==========================================================================
   2. 測驗會話發起與管理 (Quiz Session logic)
   ========================================================================== */
function startQuizSession(isWrongOnly = false) {
  let pool = [...questionsData];

  if (isWrongOnly) {
    const wrongMap = storage.getWrongQuestions();
    const wrongIds = Object.keys(wrongMap);
    pool = pool.filter(q => wrongIds.includes(q.id));
  } else {
    if (state.config.typeFilter === 'single') {
      pool = pool.filter(q => q.type === 'single');
    } else if (state.config.typeFilter === 'multiple') {
      pool = pool.filter(q => q.type === 'multiple');
    }
  }

  if (pool.length === 0) {
    alert('無符合條件之題目可供測驗！');
    return;
  }

  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }

  const targetCount = isWrongOnly ? pool.length : Math.min(state.config.questionCount, pool.length);
  const selectedQuestions = pool.slice(0, targetCount);

  state.config.isWrongOnlyMode = isWrongOnly;
  state.quiz = {
    questions: selectedQuestions,
    currentIndex: 0,
    userAnswers: {},
    flagged: {},
    startTime: Date.now(),
    durationSec: 0,
    timerInterval: setInterval(() => {
      state.quiz.durationSec = Math.floor((Date.now() - state.quiz.startTime) / 1000);
      updateQuizTimerDisplay();
    }, 1000)
  };

  navigateTo('quiz');
}

function updateQuizTimerDisplay() {
  const el = document.getElementById('quizTimer');
  if (el) {
    const min = String(Math.floor(state.quiz.durationSec / 60)).padStart(2, '0');
    const sec = String(state.quiz.durationSec % 60).padStart(2, '0');
    el.textContent = `${min}:${sec}`;
  }
}

/* ==========================================================================
   3. 作答頁面 (Quiz Screen)
   ========================================================================== */
function renderQuizScreen() {
  const { questions, currentIndex, userAnswers, flagged } = state.quiz;
  const currentQ = questions[currentIndex];
  const total = questions.length;
  const answeredCount = Object.keys(userAnswers).length;
  const isFlagged = !!flagged[currentQ.id];
  const selectedKeys = userAnswers[currentQ.id] || [];

  return `
    <div class="fade-in" style="max-width: 900px; margin: 0 auto; padding: 1.5rem 1rem;">
      <div class="glass-card" style="padding: 1rem 1.5rem; margin-bottom: 1.25rem; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem;">
        <div style="display: flex; align-items: center; gap: 0.75rem;">
          <span style="font-weight: 700; font-size: 1.1rem; color: #34d399;">
            第 ${currentIndex + 1} / ${total} 題
          </span>
          <span class="${currentQ.type === 'single' ? 'type-badge-single' : 'type-badge-multiple'}">
            ${currentQ.type === 'single' ? '🔘 單選題' : '☑️ 複選題'}
          </span>
          <span class="chapter-tag">${currentQ.chapter} ‧ ${currentQ.article}</span>
        </div>

        <div style="display: flex; align-items: center; gap: 1rem;">
          <div style="display: flex; align-items: center; gap: 0.4rem; color: var(--text-muted); font-size: 0.9rem; font-weight: 600; background: rgba(15, 23, 42, 0.6); padding: 0.35rem 0.75rem; border-radius: 8px; border: 1px solid var(--card-border);">
            ⏱️ <span id="quizTimer">00:00</span>
          </div>
          <button id="btnFlagQuestion" class="btn-secondary" style="padding: 0.4rem 0.8rem; font-size: 0.85rem; border-color: ${isFlagged ? 'var(--accent-amber)' : 'var(--card-border)'}; color: ${isFlagged ? '#fbbf24' : 'var(--text-muted)'}; background: ${isFlagged ? 'rgba(245, 158, 11, 0.2)' : 'transparent'};">
            ${isFlagged ? '🚩 已標記' : '🏳️ 標記此題'}
          </button>
        </div>
      </div>

      <div style="height: 6px; background: rgba(255, 255, 255, 0.1); border-radius: 999px; margin-bottom: 1.5rem; overflow: hidden;">
        <div style="height: 100%; width: ${((currentIndex + 1) / total) * 100}%; background: linear-gradient(90deg, #10b981, #14b8a6); transition: width 0.3s ease;"></div>
      </div>

      <div class="glass-card" style="padding: 2rem; margin-bottom: 1.5rem;">
        <h3 style="font-size: 1.25rem; font-weight: 700; line-height: 1.6; margin-bottom: 1.75rem; color: var(--text-main);">
          ${currentQ.question}
        </h3>

        ${currentQ.type === 'multiple' ? `
          <div style="background: rgba(168, 85, 247, 0.1); border: 1px dashed rgba(168, 85, 247, 0.3); border-radius: 10px; padding: 0.6rem 1rem; margin-bottom: 1.25rem; font-size: 0.85rem; color: #c084fc;">
            💡 提示：本題為【複選題】，可選一個或多個選項。
          </div>
        ` : ''}

        <div style="display: flex; flex-direction: column; gap: 0.9rem;">
          ${currentQ.options.map(opt => {
            const isSelected = selectedKeys.includes(opt.key);
            return `
              <div class="option-card ${isSelected ? 'selected' : ''}" data-key="${opt.key}">
                <div class="option-indicator">${opt.key}</div>
                <div style="font-size: 1rem; color: var(--text-main); font-weight: 500; margin-top: 2px;">${opt.text}</div>
              </div>
            `;
          }).join('')}
        </div>
      </div>

      <div style="display: flex; justify-content: space-between; align-items: center; gap: 1rem;">
        <button id="btnPrevQ" class="btn-secondary" ${currentIndex === 0 ? 'disabled style="opacity:0.4; cursor:not-allowed;"' : ''}>
          ⬅️ 上一題
        </button>

        <button id="btnToggleNavGrid" class="btn-secondary" style="font-size: 0.9rem;">
          📋 答題概況號碼盤 (${answeredCount}/${total})
        </button>

        ${currentIndex === total - 1 ? `
          <button id="btnSubmitQuiz" class="btn-primary" style="background: linear-gradient(135deg, #10b981 0%, #059669 100%);">
            ✅ 提交試卷
          </button>
        ` : `
          <button id="btnNextQ" class="btn-primary">
            下一題 ➡️
          </button>
        `}
      </div>

      <div id="gridModal" class="modal-backdrop">
        <div class="modal-content glass-card">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.25rem;">
            <h4 style="font-size: 1.2rem; font-weight: 700;">題目作答概況</h4>
            <button id="btnCloseGridModal" style="background: transparent; border: none; color: var(--text-muted); font-size: 1.5rem; cursor: pointer;">&times;</button>
          </div>
          <p style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 1rem;">
            已作答：<span style="color:#34d399; font-weight:700;">${answeredCount}</span> / 未作答：<span style="color:#f43f5e; font-weight:700;">${total - answeredCount}</span>
          </p>
          
          <div class="question-grid" style="margin-bottom: 1.5rem;">
            ${questions.map((q, idx) => {
              const isAns = !!userAnswers[q.id] && userAnswers[q.id].length > 0;
              const isCurr = idx === currentIndex;
              const isFlag = !!flagged[q.id];
              let cls = 'grid-btn';
              if (isAns) cls += ' answered';
              if (isFlag) cls += ' flagged';
              if (isCurr) cls += ' current';
              return `<button class="${cls}" data-idx="${idx}">${idx + 1}</button>`;
            }).join('')}
          </div>

          <div style="display: flex; justify-content: flex-end; gap: 0.75rem;">
            <button id="btnConfirmSubmit" class="btn-primary" style="width: 100%;">確認交卷並查看問題解析</button>
          </div>
        </div>
      </div>
    </div>
  `;
}

function bindQuizEvents() {
  const { questions, currentIndex } = state.quiz;
  const currentQ = questions[currentIndex];

  document.querySelectorAll('.option-card').forEach(card => {
    card.addEventListener('click', (e) => {
      const key = e.currentTarget.getAttribute('data-key');
      let currentAns = state.quiz.userAnswers[currentQ.id] || [];

      if (currentQ.type === 'single') {
        state.quiz.userAnswers[currentQ.id] = [key];
      } else {
        if (currentAns.includes(key)) {
          currentAns = currentAns.filter(k => k !== key);
        } else {
          currentAns.push(key);
        }
        currentAns.sort();
        if (currentAns.length > 0) {
          state.quiz.userAnswers[currentQ.id] = currentAns;
        } else {
          delete state.quiz.userAnswers[currentQ.id];
        }
      }
      renderView();
    });
  });

  document.getElementById('btnFlagQuestion')?.addEventListener('click', () => {
    state.quiz.flagged[currentQ.id] = !state.quiz.flagged[currentQ.id];
    renderView();
  });

  document.getElementById('btnPrevQ')?.addEventListener('click', () => {
    if (state.quiz.currentIndex > 0) {
      state.quiz.currentIndex--;
      renderView();
    }
  });

  document.getElementById('btnNextQ')?.addEventListener('click', () => {
    if (state.quiz.currentIndex < state.quiz.questions.length - 1) {
      state.quiz.currentIndex++;
      renderView();
    }
  });

  const modal = document.getElementById('gridModal');
  document.getElementById('btnToggleNavGrid')?.addEventListener('click', () => {
    modal?.classList.add('active');
  });

  document.getElementById('btnCloseGridModal')?.addEventListener('click', () => {
    modal?.classList.remove('active');
  });

  document.getElementById('btnSubmitQuiz')?.addEventListener('click', () => {
    const answeredCount = Object.keys(state.quiz.userAnswers).length;
    const total = state.quiz.questions.length;
    if (answeredCount < total) {
      if (!confirm(`您還有 ${total - answeredCount} 題尚未作答，確定要現在交卷嗎？`)) {
        return;
      }
    }
    submitQuizSession();
  });

  document.getElementById('btnConfirmSubmit')?.addEventListener('click', () => {
    submitQuizSession();
  });

  document.querySelectorAll('.grid-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const idx = parseInt(e.currentTarget.getAttribute('data-idx'));
      state.quiz.currentIndex = idx;
      modal?.classList.remove('active');
      renderView();
    });
  });
}

// 結算試卷
function submitQuizSession() {
  clearInterval(state.quiz.timerInterval);

  const { questions, userAnswers, durationSec } = state.quiz;
  let correctCount = 0;
  const wrongIds = [];

  questions.forEach(q => {
    const uAns = userAnswers[q.id] || [];
    const cAns = q.correctAnswers || [];
    const isCorrect = uAns.length === cAns.length && uAns.every(val => cAns.includes(val));
    if (isCorrect) {
      correctCount++;
    } else {
      wrongIds.push(q.id);
    }
  });

  const total = questions.length;
  const score = Math.round((correctCount / total) * 100);

  if (wrongIds.length > 0) {
    storage.saveWrongQuestions(wrongIds);
  }

  const record = storage.saveExamRecord({
    total,
    correct: correctCount,
    score,
    durationSec,
    questionCount: total,
    typeFilter: state.config.typeFilter,
    wrongIds
  });

  state.lastResult = {
    record,
    questions,
    userAnswers,
    wrongIds,
    filter: 'all'
  };

  navigateTo('result');
}

/* ==========================================================================
   4. 測驗結果與問題解析頁面 (Result & Analysis Screen)
   ========================================================================== */
function renderResultScreen() {
  if (!state.lastResult) return renderHomeScreen();

  const { record, questions, userAnswers, wrongIds, filter } = state.lastResult;
  const total = questions.length;
  const correctCount = record.correct;
  const score = record.score;
  const min = Math.floor(record.durationSec / 60);
  const sec = record.durationSec % 60;
  const isPass = score >= 60;

  let displayQuestions = questions;
  if (filter === 'wrong') {
    displayQuestions = questions.filter(q => wrongIds.includes(q.id));
  } else if (filter === 'correct') {
    displayQuestions = questions.filter(q => !wrongIds.includes(q.id));
  }

  return `
    <div class="fade-in" style="max-width: 950px; margin: 0 auto; padding: 2rem 1rem;">
      <div class="glass-card" style="padding: 2.5rem; text-align: center; margin-bottom: 2rem; position: relative;">
        <div style="display: inline-block; padding: 0.35rem 1rem; border-radius: 999px; font-weight: 700; font-size: 0.85rem; margin-bottom: 1.25rem; ${isPass ? 'background:rgba(16, 185, 129, 0.2); color:#34d399; border:1px solid rgba(16,185,129,0.4);' : 'background:rgba(244, 63, 94, 0.2); color:#fda4af; border:1px solid rgba(244,63,94,0.4);'}">
          ${isPass ? '🎉 測驗合格 (達到60分基準線)' : '🔴 尚須努力 (未達60分及格線)'}
        </div>

        <div class="score-circle" style="--score-pct: ${score}; margin-bottom: 1.5rem;">
          <div class="score-circle-inner">
            <div style="font-size: 2.5rem; font-weight: 900; color: ${isPass ? '#34d399' : '#f43f5e'}; line-height: 1;">${score}</div>
            <div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 4px;">得分 (滿分100)</div>
          </div>
        </div>

        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 1rem; max-width: 600px; margin: 0 auto 1.5rem auto;">
          <div style="background: rgba(15, 23, 42, 0.5); padding: 0.75rem; border-radius: 10px; border: 1px solid var(--card-border);">
            <div style="font-size: 0.8rem; color: var(--text-muted);">正確題數</div>
            <div style="font-size: 1.25rem; font-weight: 700; color: #34d399;">${correctCount} / ${total}</div>
          </div>
          <div style="background: rgba(15, 23, 42, 0.5); padding: 0.75rem; border-radius: 10px; border: 1px solid var(--card-border);">
            <div style="font-size: 0.8rem; color: var(--text-muted);">答錯題數</div>
            <div style="font-size: 1.25rem; font-weight: 700; color: #f43f5e;">${total - correctCount} 題</div>
          </div>
          <div style="background: rgba(15, 23, 42, 0.5); padding: 0.75rem; border-radius: 10px; border: 1px solid var(--card-border);">
            <div style="font-size: 0.8rem; color: var(--text-muted);">作答耗時</div>
            <div style="font-size: 1.25rem; font-weight: 700; color: #60a5fa;">${min}分${sec}秒</div>
          </div>
        </div>

        <div style="display: flex; justify-content: center; gap: 1rem; flex-wrap: wrap;">
          <button id="btnRetryQuiz" class="btn-primary">🔄 再次測驗一次</button>
          <button id="btnGoHomeFromRes" class="btn-secondary">🏠 返回系統首頁</button>
        </div>
      </div>

      <div style="margin-bottom: 1.5rem; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem;">
        <h3 style="font-size: 1.4rem; font-weight: 700; display: flex; align-items: center; gap: 0.5rem;">
          📖 題目詳細問題解析與法條對照
        </h3>

        <div style="display: flex; gap: 0.5rem; background: rgba(15, 23, 42, 0.6); padding: 0.3rem; border-radius: 12px; border: 1px solid var(--card-border);">
          <button class="res-filter-btn ${filter === 'all' ? 'active' : ''}" data-filter="all" style="padding: 0.4rem 0.9rem; border-radius: 8px; border: none; background: ${filter === 'all' ? 'var(--primary-emerald)' : 'transparent'}; color: ${filter === 'all' ? '#fff' : 'var(--text-muted)'}; font-size: 0.85rem; font-weight: 600; cursor: pointer;">
            全部題目 (${total})
          </button>
          <button class="res-filter-btn ${filter === 'wrong' ? 'active' : ''}" data-filter="wrong" style="padding: 0.4rem 0.9rem; border-radius: 8px; border: none; background: ${filter === 'wrong' ? 'var(--accent-rose)' : 'transparent'}; color: ${filter === 'wrong' ? '#fff' : 'var(--text-muted)'}; font-size: 0.85rem; font-weight: 600; cursor: pointer;">
            ❌ 錯題解析 (${wrongIds.length})
          </button>
          <button class="res-filter-btn ${filter === 'correct' ? 'active' : ''}" data-filter="correct" style="padding: 0.4rem 0.9rem; border-radius: 8px; border: none; background: ${filter === 'correct' ? '#3b82f6' : 'transparent'}; color: ${filter === 'correct' ? '#fff' : 'var(--text-muted)'}; font-size: 0.85rem; font-weight: 600; cursor: pointer;">
            ✅ 對題回顧 (${total - wrongIds.length})
          </button>
        </div>
      </div>

      <div style="display: flex; flex-direction: column; gap: 1.5rem;">
        ${displayQuestions.length === 0 ? `
          <div class="glass-card" style="padding: 3rem; text-align: center; color: var(--text-muted);">
            無符合條件之題目可供顯示。
          </div>
        ` : displayQuestions.map((q, idx) => {
          const uAns = userAnswers[q.id] || [];
          const cAns = q.correctAnswers || [];
          const isCorrect = uAns.length === cAns.length && uAns.every(v => cAns.includes(v));

          return `
            <div class="glass-card" style="padding: 1.75rem; border-left: 4px solid ${isCorrect ? '#10b981' : '#f43f5e'};">
              <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 1rem; margin-bottom: 1rem;">
                <div style="display: flex; align-items: center; gap: 0.6rem; flex-wrap: wrap;">
                  <span style="font-weight: 800; font-size: 1.1rem; color: ${isCorrect ? '#34d399' : '#f43f5e'};">
                    ${isCorrect ? '✅ 答對' : '❌ 答錯'}
                  </span>
                  <span class="${q.type === 'single' ? 'type-badge-single' : 'type-badge-multiple'}">
                    ${q.type === 'single' ? '單選' : '複選'}
                  </span>
                  <span class="chapter-tag">${q.chapter} ‧ ${q.article}</span>
                </div>

                <div style="font-size: 0.85rem; color: var(--text-muted);">
                  你的答案：<strong style="color: ${isCorrect ? '#34d399' : '#f43f5e'};">${uAns.length > 0 ? uAns.join(', ') : '未作答'}</strong> 
                  / 正確答案：<strong style="color: #34d399;">${cAns.join(', ')}</strong>
                </div>
              </div>

              <div style="font-size: 1.1rem; font-weight: 700; margin-bottom: 1.25rem; color: var(--text-main);">
                ${q.question}
              </div>

              <div style="display: flex; flex-direction: column; gap: 0.6rem; margin-bottom: 1.25rem;">
                ${q.options.map(opt => {
                  const isUserSel = uAns.includes(opt.key);
                  const isAnsCorrect = cAns.includes(opt.key);

                  let optStyle = 'background: rgba(15, 23, 42, 0.4); border: 1px solid var(--card-border);';
                  let badgeText = '';

                  if (isAnsCorrect) {
                    optStyle = 'background: rgba(16, 185, 129, 0.15); border: 1px solid #10b981; color: #34d399;';
                    badgeText = '✓ 正確解答';
                  } else if (isUserSel && !isAnsCorrect) {
                    optStyle = 'background: rgba(244, 63, 94, 0.15); border: 1px solid #f43f5e; color: #fda4af;';
                    badgeText = '✗ 你的錯誤選擇';
                  }

                  return `
                    <div style="padding: 0.75rem 1rem; border-radius: 10px; ${optStyle} display: flex; justify-content: space-between; align-items: center; font-size: 0.95rem;">
                      <div><strong style="margin-right: 0.5rem;">${opt.key}.</strong> ${opt.text}</div>
                      ${badgeText ? `<span style="font-size: 0.75rem; font-weight: 700;">${badgeText}</span>` : ''}
                    </div>
                  `;
                }).join('')}
              </div>

              <div style="background: rgba(16, 185, 129, 0.08); border: 1px solid rgba(16, 185, 129, 0.2); border-radius: 12px; padding: 1rem 1.25rem;">
                <div style="font-weight: 700; font-size: 0.9rem; color: #34d399; margin-bottom: 0.4rem; display: flex; align-items: center; gap: 0.4rem;">
                  📜 法條條文對照與解析依據：
                </div>
                <div style="font-size: 0.925rem; color: #cbd5e1; line-height: 1.6;">
                  ${q.explanation}
                </div>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    </div>
  `;
}

function bindResultEvents() {
  document.getElementById('btnRetryQuiz')?.addEventListener('click', () => {
    startQuizSession(state.config.isWrongOnlyMode);
  });

  document.getElementById('btnGoHomeFromRes')?.addEventListener('click', () => {
    navigateTo('home');
  });

  document.querySelectorAll('.res-filter-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      state.lastResult.filter = e.currentTarget.getAttribute('data-filter');
      renderView();
    });
  });
}

/* ==========================================================================
   5. 歷史錯題專區頁面 (Wrong Questions Review Screen)
   ========================================================================== */
function renderWrongReviewScreen() {
  const wrongMap = storage.getWrongQuestions();
  const wrongIds = Object.keys(wrongMap);
  const allWrongQuestions = questionsData.filter(q => wrongIds.includes(q.id));

  let displayList = allWrongQuestions;
  if (state.wrongTypeFilter === 'single') {
    displayList = displayList.filter(q => q.type === 'single');
  } else if (state.wrongTypeFilter === 'multiple') {
    displayList = displayList.filter(q => q.type === 'multiple');
  }

  if (state.wrongSearchQuery.trim()) {
    const qStr = state.wrongSearchQuery.toLowerCase();
    displayList = displayList.filter(q => 
      q.question.toLowerCase().includes(qStr) || 
      q.chapter.toLowerCase().includes(qStr) ||
      q.article.toLowerCase().includes(qStr)
    );
  }

  const gasUrl = storage.getGasApiUrl();

  return `
    <div class="fade-in" style="max-width: 1000px; margin: 0 auto; padding: 2rem 1rem;">
      <div class="glass-card" style="padding: 2rem; margin-bottom: 2rem; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem;">
        <div>
          <h2 style="font-size: 1.8rem; font-weight: 800; display: flex; align-items: center; gap: 0.6rem;">
            📚 歷史錯題庫複習與自主重測
          </h2>
          <p style="color: var(--text-muted); font-size: 0.95rem; margin-top: 4px;">
            共收錄 <strong style="color: var(--accent-rose);">${allWrongQuestions.length}</strong> 題答錯紀錄 ‧ 熟記條文突破盲點
          </p>
        </div>

        <div style="display: flex; gap: 0.75rem; flex-wrap: wrap;">
          ${gasUrl ? `
            <button id="btnSyncCloudWrong" class="btn-secondary" style="border-color: var(--primary-emerald); color: #34d399;">
              ☁️ ${state.isSyncing ? '同步中...' : '從雲端試算表拉取同步'}
            </button>
          ` : ''}
          <button id="btnStartWrongQuiz2" class="btn-primary" style="background: linear-gradient(135deg, #f43f5e 0%, #e11d48 100%);" ${allWrongQuestions.length === 0 ? 'disabled style="opacity:0.5; cursor:not-allowed;"' : ''}>
            ⚡ 歷史錯題隨機重測
          </button>
          <button id="btnClearAllWrong" class="btn-danger" ${allWrongQuestions.length === 0 ? 'disabled style="opacity:0.5; cursor:not-allowed;"' : ''}>
            🗑️ 清空所有錯題
          </button>
        </div>
      </div>

      <div class="glass-card" style="padding: 1.25rem 1.5rem; margin-bottom: 1.5rem; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem;">
        <div style="position: relative; flex: 1; min-width: 250px;">
          <input type="text" id="wrongSearchInput" value="${state.wrongSearchQuery}" placeholder="搜尋關鍵字或法條條文（如：主管機關、聘任）..." 
            style="width: 100%; padding: 0.7rem 1rem 0.7rem 2.5rem; border-radius: 10px; border: 1px solid var(--card-border); background: rgba(15, 23, 42, 0.6); color: var(--text-main); font-size: 0.95rem; outline: none;">
          <span style="position: absolute; left: 0.9rem; top: 50%; transform: translateY(-50%); color: var(--text-muted);">🔍</span>
        </div>

        <div style="display: flex; gap: 0.5rem;">
          <button class="wrong-type-btn ${state.wrongTypeFilter === 'all' ? 'active' : ''}" data-type="all" style="padding: 0.5rem 0.9rem; border-radius: 8px; border: 1px solid var(--card-border); background: ${state.wrongTypeFilter === 'all' ? 'rgba(16, 185, 129, 0.2)' : 'transparent'}; color: ${state.wrongTypeFilter === 'all' ? '#34d399' : 'var(--text-muted)'}; cursor: pointer; font-size: 0.85rem;">
            全部題型
          </button>
          <button class="wrong-type-btn ${state.wrongTypeFilter === 'single' ? 'active' : ''}" data-type="single" style="padding: 0.5rem 0.9rem; border-radius: 8px; border: 1px solid var(--card-border); background: ${state.wrongTypeFilter === 'single' ? 'rgba(59, 130, 246, 0.2)' : 'transparent'}; color: ${state.wrongTypeFilter === 'single' ? '#60a5fa' : 'var(--text-muted)'}; cursor: pointer; font-size: 0.85rem;">
            單選題
          </button>
          <button class="wrong-type-btn ${state.wrongTypeFilter === 'multiple' ? 'active' : ''}" data-type="multiple" style="padding: 0.5rem 0.9rem; border-radius: 8px; border: 1px solid var(--card-border); background: ${state.wrongTypeFilter === 'multiple' ? 'rgba(168, 85, 247, 0.2)' : 'transparent'}; color: ${state.wrongTypeFilter === 'multiple' ? '#c084fc' : 'var(--text-muted)'}; cursor: pointer; font-size: 0.85rem;">
            複選題
          </button>
        </div>
      </div>

      <div style="display: flex; flex-direction: column; gap: 1.25rem;">
        ${displayList.length === 0 ? `
          <div class="glass-card" style="padding: 4rem 2rem; text-align: center;">
            <div style="font-size: 3rem; margin-bottom: 1rem;">🎉</div>
            <h3 style="font-size: 1.3rem; font-weight: 700; margin-bottom: 0.5rem;">無錯題紀錄</h3>
            <p style="color: var(--text-muted);">太棒了！目前沒有任何錯誤題目，點擊「開始新測驗」繼續保持精進！</p>
          </div>
        ` : displayList.map((q, idx) => {
          const wInfo = wrongMap[q.id] || {};
          return `
            <div class="glass-card" style="padding: 1.75rem;">
              <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 1rem; margin-bottom: 0.9rem;">
                <div style="display: flex; align-items: center; gap: 0.6rem; flex-wrap: wrap;">
                  <span class="${q.type === 'single' ? 'type-badge-single' : 'type-badge-multiple'}">
                    ${q.type === 'single' ? '單選題' : '複選題'}
                  </span>
                  <span class="chapter-tag">${q.chapter} ‧ ${q.article}</span>
                  <span style="background: rgba(244, 63, 94, 0.15); border: 1px solid rgba(244, 63, 94, 0.3); color: #fda4af; font-size: 0.75rem; padding: 0.15rem 0.6rem; border-radius: 6px; font-weight: 600;">
                    累積錯題 ${wInfo.wrongCount || 1} 次
                  </span>
                </div>

                <button class="btn-remove-wrong btn-danger" data-qid="${q.id}" style="padding: 0.3rem 0.7rem; font-size: 0.8rem;">
                  🗑️ 標記為精通 (移除)
                </button>
              </div>

              <h4 style="font-size: 1.1rem; font-weight: 700; margin-bottom: 1rem; color: var(--text-main);">
                ${idx + 1}. ${q.question}
              </h4>

              <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 0.5rem; margin-bottom: 1.25rem;">
                ${q.options.map(opt => {
                  const isCorrect = q.correctAnswers.includes(opt.key);
                  return `
                    <div style="padding: 0.6rem 0.9rem; border-radius: 8px; font-size: 0.9rem; ${isCorrect ? 'background: rgba(16, 185, 129, 0.15); border: 1px solid #10b981; color: #34d399; font-weight: 600;' : 'background: rgba(15, 23, 42, 0.4); border: 1px solid var(--card-border); color: var(--text-muted);'}">
                      <span style="margin-right: 0.4rem;">${opt.key}.</span> ${opt.text} ${isCorrect ? ' (正確答案)' : ''}
                    </div>
                  `;
                }).join('')}
              </div>

              <div style="background: rgba(16, 185, 129, 0.08); border: 1px solid rgba(16, 185, 129, 0.2); border-radius: 10px; padding: 0.9rem 1.1rem; font-size: 0.9rem; color: #cbd5e1; line-height: 1.6;">
                <strong style="color: #34d399;">📜 問題解析：</strong> ${q.explanation}
              </div>
            </div>
          `;
        }).join('')}
      </div>
    </div>
  `;
}

function bindWrongReviewEvents() {
  document.getElementById('btnStartWrongQuiz2')?.addEventListener('click', () => {
    startQuizSession(true);
  });

  document.getElementById('btnClearAllWrong')?.addEventListener('click', () => {
    if (confirm('確定要清空所有歷史錯題紀錄嗎？此動作無法復原！')) {
      storage.clearAllWrongQuestions();
      renderNavbar();
      renderView();
    }
  });

  document.getElementById('btnSyncCloudWrong')?.addEventListener('click', async () => {
    state.isSyncing = true;
    renderView();
    const res = await storage.fetchCloudData();
    state.isSyncing = false;
    renderNavbar();
    renderView();
    if (res.success) {
      alert(`雲端同步成功！目前共有 ${res.count} 題錯題。`);
    } else {
      alert(`同步失敗：${res.message}`);
    }
  });

  const searchInput = document.getElementById('wrongSearchInput');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      state.wrongSearchQuery = e.target.value;
      renderView();
      const inputAfter = document.getElementById('wrongSearchInput');
      if (inputAfter) {
        inputAfter.focus();
        inputAfter.selectionStart = inputAfter.selectionEnd = inputAfter.value.length;
      }
    });
  }

  document.querySelectorAll('.wrong-type-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      state.wrongTypeFilter = e.currentTarget.getAttribute('data-type');
      renderView();
    });
  });

  document.querySelectorAll('.btn-remove-wrong').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const qid = e.currentTarget.getAttribute('data-qid');
      storage.removeWrongQuestion(qid);
      renderNavbar();
      renderView();
    });
  });
}

// Google Apps Script 設定彈出視窗
function openGasModal() {
  const currentUrl = storage.getGasApiUrl();
  const inputUrl = prompt(
    '請輸入您部署的 Google Apps Script 網頁應用程式 URL（Web App URL）：\n\n(留空將恢復為純本地儲存模式)',
    currentUrl
  );

  if (inputUrl !== null) {
    storage.setGasApiUrl(inputUrl);
    renderNavbar();
    renderView();
    if (inputUrl.trim()) {
      alert('已成功綁定 Google Apps Script 雲端網址！作答紀錄與錯題將自動同步至您的 Google 試算表。');
    } else {
      alert('已恢復為純本地儲存模式。');
    }
  }
}

// 導覽列與對話框事件
document.querySelectorAll('.nav-btn').forEach(btn => {
  btn.addEventListener('click', (e) => {
    const targetView = e.currentTarget.getAttribute('data-target');
    if (targetView) {
      document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
      e.currentTarget.classList.add('active');
      navigateTo(targetView);
    }
  });
});

document.getElementById('navGasStatus')?.addEventListener('click', openGasModal);
document.getElementById('brandLogo')?.addEventListener('click', () => {
  navigateTo('home');
});

// 初始化啟動
document.addEventListener('DOMContentLoaded', initApp);
