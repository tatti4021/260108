/**
 * LocalStorageマネージャー
 * @module utils/storage
 */

/**
 * ストレージバージョン（データ構造の変更時にインクリメント）
 * @constant {string}
 */
export const STORAGE_VERSION = '1.0.0';

/**
 * ストレージキーのプレフィックス
 * @constant {string}
 */
const STORAGE_PREFIX = 'finmodel_';

/**
 * バージョンキー
 * @constant {string}
 */
const VERSION_KEY = `${STORAGE_PREFIX}version`;

/**
 * 完全なストレージキーを生成
 * @param {string} key - キー名
 * @returns {string} プレフィックス付きキー
 */
const getFullKey = (key) => `${STORAGE_PREFIX}${key}`;

/**
 * データをLocalStorageに保存
 * @param {string} key - キー名
 * @param {*} data - 保存するデータ
 * @returns {boolean} 保存成功かどうか
 * @throws {Error} LocalStorageが利用不可の場合
 */
export const save = (key, data) => {
  try {
    if (typeof localStorage === 'undefined') {
      throw new Error('LocalStorage is not available');
    }

    const fullKey = getFullKey(key);
    const serialized = JSON.stringify(data);
    localStorage.setItem(fullKey, serialized);

    // バージョン情報も保存
    localStorage.setItem(VERSION_KEY, STORAGE_VERSION);

    return true;
  } catch (error) {
    console.error(`Failed to save data for key "${key}":`, error);

    // QuotaExceededErrorの場合は特別な処理
    if (error.name === 'QuotaExceededError') {
      console.error('LocalStorage quota exceeded');
    }

    return false;
  }
};

/**
 * LocalStorageからデータを読み込み
 * @param {string} key - キー名
 * @returns {*|null} 読み込んだデータ、存在しない場合はnull
 */
export const load = (key) => {
  try {
    if (typeof localStorage === 'undefined') {
      throw new Error('LocalStorage is not available');
    }

    const fullKey = getFullKey(key);
    const serialized = localStorage.getItem(fullKey);

    if (serialized === null) {
      return null;
    }

    // バージョンチェック
    const storedVersion = localStorage.getItem(VERSION_KEY);
    if (storedVersion && storedVersion !== STORAGE_VERSION) {
      console.warn(`Storage version mismatch: stored=${storedVersion}, current=${STORAGE_VERSION}`);
    }

    return JSON.parse(serialized);
  } catch (error) {
    console.error(`Failed to load data for key "${key}":`, error);
    return null;
  }
};

/**
 * LocalStorageからデータを削除
 * @param {string} key - キー名
 * @returns {boolean} 削除成功かどうか
 */
export const remove = (key) => {
  try {
    if (typeof localStorage === 'undefined') {
      throw new Error('LocalStorage is not available');
    }

    const fullKey = getFullKey(key);
    localStorage.removeItem(fullKey);
    return true;
  } catch (error) {
    console.error(`Failed to remove data for key "${key}":`, error);
    return false;
  }
};

/**
 * LocalStorageの全データを削除（アプリケーション関連のみ）
 * @returns {boolean} 削除成功かどうか
 */
export const clear = () => {
  try {
    if (typeof localStorage === 'undefined') {
      throw new Error('LocalStorage is not available');
    }

    // プレフィックスが一致するキーのみ削除
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(STORAGE_PREFIX)) {
        keysToRemove.push(key);
      }
    }

    keysToRemove.forEach(key => localStorage.removeItem(key));
    return true;
  } catch (error) {
    console.error('Failed to clear storage:', error);
    return false;
  }
};

/**
 * キーが存在するか確認
 * @param {string} key - キー名
 * @returns {boolean} 存在するかどうか
 */
export const exists = (key) => {
  try {
    if (typeof localStorage === 'undefined') {
      return false;
    }

    const fullKey = getFullKey(key);
    return localStorage.getItem(fullKey) !== null;
  } catch (error) {
    console.error(`Failed to check existence for key "${key}":`, error);
    return false;
  }
};

/**
 * LocalStorageが利用可能か確認
 * @returns {boolean} 利用可能かどうか
 */
export const isAvailable = () => {
  try {
    if (typeof localStorage === 'undefined') {
      return false;
    }

    // テスト用データの書き込みと削除
    const testKey = '__storage_test__';
    localStorage.setItem(testKey, 'test');
    localStorage.removeItem(testKey);
    return true;
  } catch (error) {
    return false;
  }
};

/**
 * ストレージの使用状況を取得（概算）
 * @returns {Object} 使用状況オブジェクト
 * @property {number} used - 使用中のバイト数（概算）
 * @property {number} total - 総容量（概算、通常5MB）
 */
export const getStorageInfo = () => {
  try {
    if (typeof localStorage === 'undefined') {
      return { used: 0, total: 0 };
    }

    let used = 0;
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(STORAGE_PREFIX)) {
        const value = localStorage.getItem(key);
        used += key.length + (value ? value.length : 0);
      }
    }

    // LocalStorageの一般的な容量は5MB（5 * 1024 * 1024バイト）
    const total = 5 * 1024 * 1024;

    return {
      used,
      total,
      usedPercent: (used / total) * 100
    };
  } catch (error) {
    console.error('Failed to get storage info:', error);
    return { used: 0, total: 0, usedPercent: 0 };
  }
};
