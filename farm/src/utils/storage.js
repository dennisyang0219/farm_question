// LocalStorage 持久化管理工具

const WRONG_QS_KEY = 'farm_exam_wrong_questions_v1';
const HISTORY_KEY = 'farm_exam_history_v1';

export const storage = {
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
  },

  // 清空所有錯題紀錄
  clearAllWrongQuestions() {
    localStorage.removeItem(WRONG_QS_KEY);
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
    // 最多保留最新 50 筆紀錄
    if (history.length > 50) history.pop();
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
    return newRecord;
  }
};
