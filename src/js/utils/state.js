/**
 * 状態管理
 * @module utils/state
 */

import { save, load } from './storage.js';
import { createCompany } from '../models/company.js';
import { createPeriod } from '../models/period.js';
import { createForecast } from '../models/forecast.js';

/**
 * ストレージキー
 * @constant {string}
 */
const STATE_KEY = 'app_state';

/**
 * アプリケーション状態
 * @type {Object}
 */
let state = {
  company: null,
  periods: [],
  forecast: null,
  currentPeriodIndex: 0,
  initialized: false
};

/**
 * 状態変更の購読者リスト
 * @type {Array<Function>}
 */
let subscribers = [];

/**
 * 現在の状態を取得
 * @returns {Object} 現在の状態のコピー
 */
export const getState = () => {
  // 状態のディープコピーを返す
  return JSON.parse(JSON.stringify(state));
};

/**
 * 状態を更新
 * @param {Object} newState - 新しい状態（部分更新可）
 * @param {boolean} autoSave - 自動保存するかどうか（デフォルト: true）
 * @returns {Object} 更新後の状態
 */
export const setState = (newState, autoSave = true) => {
  try {
    // 状態をマージ
    state = {
      ...state,
      ...newState
    };

    // 自動保存
    if (autoSave) {
      const saved = save(STATE_KEY, state);
      if (!saved) {
        console.warn('Failed to auto-save state');
      }
    }

    // 購読者に通知
    notifySubscribers();

    return getState();
  } catch (error) {
    console.error('Failed to set state:', error);
    return getState();
  }
};

/**
 * 状態変更を監視
 * @param {Function} callback - 状態変更時に呼ばれるコールバック関数
 * @returns {Function} 購読解除用の関数
 */
export const subscribe = (callback) => {
  if (typeof callback !== 'function') {
    throw new Error('Callback must be a function');
  }

  subscribers.push(callback);

  // 購読解除用の関数を返す
  return () => {
    subscribers = subscribers.filter(cb => cb !== callback);
  };
};

/**
 * 購読者に通知
 * @private
 */
const notifySubscribers = () => {
  const currentState = getState();
  subscribers.forEach(callback => {
    try {
      callback(currentState);
    } catch (error) {
      console.error('Error in subscriber callback:', error);
    }
  });
};

/**
 * LocalStorageから状態を復元
 * @returns {boolean} 復元成功かどうか
 */
export const loadState = () => {
  try {
    const savedState = load(STATE_KEY);

    if (savedState && savedState.initialized) {
      state = savedState;
      notifySubscribers();
      return true;
    }

    return false;
  } catch (error) {
    console.error('Failed to load state:', error);
    return false;
  }
};

/**
 * 状態を手動で保存
 * @returns {boolean} 保存成功かどうか
 */
export const saveState = () => {
  try {
    return save(STATE_KEY, state);
  } catch (error) {
    console.error('Failed to save state:', error);
    return false;
  }
};

/**
 * アプリケーションの初期化
 * @param {Object} options - 初期化オプション
 * @param {number} options.startYear - 開始年（デフォルト: 現在の年）
 * @param {number} options.startMonth - 開始月（デフォルト: 1）
 * @param {number} options.numPeriods - 期間数（デフォルト: 12）
 * @param {boolean} options.forceNew - 既存データを無視して新規作成（デフォルト: false）
 * @returns {Object} 初期化後の状態
 */
export const initialize = (options = {}) => {
  const {
    startYear = new Date().getFullYear(),
    startMonth = 1,
    numPeriods = 12,
    forceNew = false
  } = options;

  try {
    // 既存データの復元を試みる
    if (!forceNew && loadState()) {
      console.log('State restored from LocalStorage');
      return getState();
    }

    // 新規状態の作成
    console.log('Creating new state');

    // 会社情報の初期化
    const company = createCompany();

    // 期間データの初期化
    const periods = [];
    let year = startYear;
    let month = startMonth;

    for (let i = 0; i < numPeriods; i++) {
      periods.push(createPeriod(year, month));

      month++;
      if (month > 12) {
        month = 1;
        year++;
      }
    }

    // 予測設定の初期化
    const forecast = createForecast();

    // 状態を設定
    state = {
      company,
      periods,
      forecast,
      currentPeriodIndex: 0,
      initialized: true
    };

    // 保存
    saveState();

    // 購読者に通知
    notifySubscribers();

    return getState();
  } catch (error) {
    console.error('Failed to initialize state:', error);
    throw error;
  }
};

/**
 * 状態をリセット（全データ削除）
 * @returns {boolean} リセット成功かどうか
 */
export const resetState = () => {
  try {
    state = {
      company: null,
      periods: [],
      forecast: null,
      currentPeriodIndex: 0,
      initialized: false
    };

    saveState();
    notifySubscribers();

    return true;
  } catch (error) {
    console.error('Failed to reset state:', error);
    return false;
  }
};

/**
 * 会社情報を更新
 * @param {Object} company - 新しい会社情報
 * @returns {Object} 更新後の状態
 */
export const updateCompany = (company) => {
  return setState({ company });
};

/**
 * 予測設定を更新
 * @param {Object} forecast - 新しい予測設定
 * @returns {Object} 更新後の状態
 */
export const updateForecast = (forecast) => {
  return setState({ forecast });
};

/**
 * 特定の期間データを更新
 * @param {number} index - 期間のインデックス
 * @param {Object} periodData - 新しい期間データ
 * @returns {Object} 更新後の状態
 */
export const updatePeriod = (index, periodData) => {
  if (index < 0 || index >= state.periods.length) {
    throw new Error(`Invalid period index: ${index}`);
  }

  const periods = [...state.periods];
  periods[index] = {
    ...periods[index],
    ...periodData
  };

  return setState({ periods });
};

/**
 * 現在の期間インデックスを設定
 * @param {number} index - 期間のインデックス
 * @returns {Object} 更新後の状態
 */
export const setCurrentPeriod = (index) => {
  if (index < 0 || index >= state.periods.length) {
    throw new Error(`Invalid period index: ${index}`);
  }

  return setState({ currentPeriodIndex: index });
};

/**
 * 現在の期間データを取得
 * @returns {Object|null} 現在の期間データ、存在しない場合はnull
 */
export const getCurrentPeriod = () => {
  if (!state.periods || state.periods.length === 0) {
    return null;
  }

  return state.periods[state.currentPeriodIndex] || null;
};

/**
 * 期間を追加
 * @param {Object} periodData - 追加する期間データ
 * @returns {Object} 更新後の状態
 */
export const addPeriod = (periodData) => {
  const periods = [...state.periods, periodData];
  return setState({ periods });
};

/**
 * 期間を削除
 * @param {number} index - 削除する期間のインデックス
 * @returns {Object} 更新後の状態
 */
export const removePeriod = (index) => {
  if (index < 0 || index >= state.periods.length) {
    throw new Error(`Invalid period index: ${index}`);
  }

  const periods = state.periods.filter((_, i) => i !== index);

  // 現在の期間インデックスを調整
  let currentPeriodIndex = state.currentPeriodIndex;
  if (currentPeriodIndex >= periods.length) {
    currentPeriodIndex = Math.max(0, periods.length - 1);
  }

  return setState({ periods, currentPeriodIndex });
};

/**
 * デバッグ用: 現在の購読者数を取得
 * @returns {number} 購読者数
 */
export const getSubscriberCount = () => {
  return subscribers.length;
};
