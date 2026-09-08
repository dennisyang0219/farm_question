// LocalStorage 持久化管理工具 + Google Sheet 雲端同步模組

const WRONG_QS_KEY = 'farm_exam_wrong_questions_v1';
const HISTORY_KEY = 'farm_exam_history_v1';
const GAS_URL_KEY = 'farm_gas_api_url_v1';

export const storage = {
  // 取得與設定 Google Apps Script Web App URL
  getGasApiUrl() {
    return localStorage.getItem(GAS_URL_KEY) || '';
  },

  setGasApiUrl(url) {
    if (url) {
      localStorage.setItem(GAS_URL_KEY, url.trim());
    } else {
      localStorage.removeItem(GAS_URL_KEY);
    }
  },

  // 取得所有錯題紀錄 Map: { [qId]: { qId, wrongCount, lastWrongTime } }
  getWrongQuestions() {
    try {
      const data = localStorage.getItem(WRONG_QS_KEY);
      return data ? JSON.parse(data) : {};
    } catch (e) {
      console.error('Error reading wrong questions:', e);
      return {};
    }
  },

  // 新增或更新錯題
  addWrongQuestion(questionId) {
    const wrongMap = this.getWrongQuestions();
    if (!wrongMap[questionId]) {
      wrongMap[questionId] = {
        questionId,
        wrongCount: 1,
        lastWrongTime: Date.now()
      };
    } else {
      wrongMap[questionId].wrongCount += 1;
      wrongMap[questionId].lastWrongTime = Date.now();
    }
    localStorage.setItem(WRONG_QS_KEY, JSON.stringify(wrongMap));
  },

  // 批量儲存答錯題目
  saveWrongQuestions(questionIds) {
    questionIds.forEach(qId => this.addWrongQuestion(qId));
  },

  // 從錯題庫移除指定題目（精通消除）
  removeWrongQuestion(questionId) {
    const wrongMap = this.getWrongQuestions();
    if (wrongMap[questionId]) {
      delete wrongMap[questionId];
      localStorage.setItem(WRONG_QS_KEY, JSON.stringify(wrongMap));
    }
    this.cloudRemoveWrongQuestion(questionId);
  },

  // 清空所有錯題紀錄
  clearAllWrongQuestions() {
    localStorage.removeItem(WRONG_QS_KEY);
    this.cloudClearWrongQuestions();
  },

  // 取得測驗歷史紀錄
  getExamHistory() {
    try {
      const data = localStorage.getItem(HISTORY_KEY);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error('Error reading exam history:', e);
      return [];
    }
  },

  // 新增一次測驗結果
  saveExamRecord(record) {
    const history = this.getExamHistory();
    const newRecord = {
      id: 'exam_' + Date.now(),
      timestamp: Date.now(),
      total: record.total,
      correct: record.correct,
      score: record.score,
      durationSec: record.durationSec,
      questionCount: record.questionCount,
      typeFilter: record.typeFilter,
      wrongIds: record.wrongIds || []
    };
    history.unshift(newRecord);
    if (history.length > 50) history.pop();
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));

    // 背景同步至 Google Sheet
    this.cloudSaveExamRecord(newRecord);

    return newRecord;
  },

  // ==========================================================================
  // Google Sheets 雲端同步 API 處理
  // ==========================================================================

  // 1. 同步測驗紀錄與答錯題目至 Google Sheet
  async cloudSaveExamRecord(record) {
    const apiUrl = this.getGasApiUrl();
    if (!apiUrl) return;

    try {
      await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({
          action: 'save_exam',
          record: record,
          wrongIds: record.wrongIds || []
        })
      });
      console.log('Successfully synced exam record to Google Sheet.');
    } catch (e) {
      console.warn('Failed to sync with Google Sheet:', e);
    }
  },

  // 2. 移除雲端指定錯題
  async cloudRemoveWrongQuestion(questionId) {
    const apiUrl = this.getGasApiUrl();
    if (!apiUrl) return;

    try {
      await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({
          action: 'remove_wrong',
          questionId: questionId
        })
      });
    } catch (e) {
      console.warn('Failed to remove wrong question from Google Sheet:', e);
    }
  },

  // 3. 清空雲端錯題表
  async cloudClearWrongQuestions() {
    const apiUrl = this.getGasApiUrl();
    if (!apiUrl) return;

    try {
      await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({
          action: 'clear_wrong'
        })
      });
    } catch (e) {
      console.warn('Failed to clear wrong questions in Google Sheet:', e);
    }
  },

  // 4. 從雲端向 Google Sheet 撈取最新錯題紀錄並合併回本地 LocalStorage
  async fetchCloudData() {
    const apiUrl = this.getGasApiUrl();
    if (!apiUrl) return { success: false, message: '尚未設定 Google Sheet API URL' };

    try {
      const res = await fetch(apiUrl + '?action=get_all');
      const data = await res.json();
      
      if (data.wrongQuestions) {
        const localWrong = this.getWrongQuestions();
        const mergedWrong = { ...localWrong, ...data.wrongQuestions };
        localStorage.setItem(WRONG_QS_KEY, JSON.stringify(mergedWrong));
      }

      if (data.examHistory && Array.isArray(data.examHistory)) {
        const localHist = this.getExamHistory();
        // 簡單合併不重複 ID
        const histIds = new Set(localHist.map(h => h.id));
        data.examHistory.forEach(h => {
          if (!histIds.has(h.id)) {
            localHist.push(h);
          }
        });
        localHist.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
        localStorage.setItem(HISTORY_KEY, JSON.stringify(localHist));
      }

      return { success: true, count: Object.keys(this.getWrongQuestions()).length };
    } catch (e) {
      console.error('Fetch cloud data error:', e);
      return { success: false, message: e.toString() };
    }
  }
};
