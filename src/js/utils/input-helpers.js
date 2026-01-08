/**
 * 入力補助機能
 * @module utils/input-helpers
 */

/**
 * 数値をフォーマット（カンマ区切り）
 * @param {number|string} value - 数値
 * @returns {string} フォーマットされた文字列
 */
export function formatNumberWithCommas(value) {
  if (value === null || value === undefined || value === '') {
    return '';
  }

  const num = typeof value === 'string' ? parseFloat(value.replace(/,/g, '')) : value;

  if (isNaN(num)) {
    return '';
  }

  return num.toLocaleString('ja-JP');
}

/**
 * カンマ区切りの文字列を数値に変換
 * @param {string} value - カンマ区切りの文字列
 * @returns {number} 数値
 */
export function parseFormattedNumber(value) {
  if (value === null || value === undefined || value === '') {
    return 0;
  }

  const str = typeof value === 'string' ? value.replace(/,/g, '') : value.toString();
  const num = parseFloat(str);

  return isNaN(num) ? 0 : num;
}

/**
 * 計算式を評価（簡易計算機能）
 * 例: "1000+500" => 1500, "100*12" => 1200
 * @param {string} expression - 計算式
 * @returns {number|null} 計算結果、エラー時はnull
 */
export function evaluateExpression(expression) {
  if (!expression || typeof expression !== 'string') {
    return null;
  }

  try {
    // カンマを除去
    const cleaned = expression.replace(/,/g, '');

    // 安全な文字のみ許可（数字、演算子、括弧、空白）
    if (!/^[\d+\-*/().\s]+$/.test(cleaned)) {
      return null;
    }

    // evalの代わりにFunctionを使用（より安全）
    const result = Function(`'use strict'; return (${cleaned})`)();

    if (typeof result === 'number' && !isNaN(result) && isFinite(result)) {
      return result;
    }

    return null;
  } catch (error) {
    return null;
  }
}

/**
 * 入力フィールドに数値フォーマット機能を追加
 * @param {HTMLInputElement} input - input要素
 * @param {Object} options - オプション
 * @param {boolean} options.allowNegative - マイナス値を許可するか（デフォルト: true）
 * @param {boolean} options.allowCalculation - 計算式を許可するか（デフォルト: true）
 */
export function enableNumberFormatting(input, options = {}) {
  const { allowNegative = true, allowCalculation = true } = options;

  // フォーカス時: カンマを除去
  input.addEventListener('focus', () => {
    const value = input.value;
    if (value) {
      input.value = value.replace(/,/g, '');
    }
  });

  // ブラー時: フォーマット適用
  input.addEventListener('blur', () => {
    let value = input.value.trim();

    if (!value) {
      input.value = '';
      return;
    }

    // 計算式の場合
    if (allowCalculation && /[+\-*/]/.test(value)) {
      const result = evaluateExpression(value);
      if (result !== null) {
        input.value = formatNumberWithCommas(result);
        // 値が変更されたことをトリガー
        input.dispatchEvent(new Event('input', { bubbles: true }));
        return;
      }
    }

    // 通常の数値フォーマット
    const num = parseFormattedNumber(value);

    if (!allowNegative && num < 0) {
      input.value = formatNumberWithCommas(0);
    } else {
      input.value = formatNumberWithCommas(num);
    }

    // 値が変更されたことをトリガー
    input.dispatchEvent(new Event('input', { bubbles: true }));
  });
}

/**
 * 前期データをコピー
 * @param {Object} currentPeriod - 現在の期間データ
 * @param {Object} previousPeriod - 前期データ
 * @param {string} section - コピーするセクション ('pl', 'bs', 'cf', または 'all')
 * @returns {Object} 更新された期間データ
 */
export function copyFromPreviousPeriod(currentPeriod, previousPeriod, section = 'all') {
  if (!previousPeriod) {
    console.warn('Previous period data not available');
    return currentPeriod;
  }

  const updated = { ...currentPeriod };

  if (section === 'all' || section === 'pl') {
    updated.pl = JSON.parse(JSON.stringify(previousPeriod.pl));
  }

  if (section === 'all' || section === 'bs') {
    updated.bs = JSON.parse(JSON.stringify(previousPeriod.bs));
  }

  if (section === 'all' || section === 'cf') {
    updated.cf = JSON.parse(JSON.stringify(previousPeriod.cf));
  }

  return updated;
}

/**
 * すべての数値入力フィールドに入力補助機能を適用
 * @param {HTMLElement} container - コンテナ要素
 * @param {Object} options - オプション
 */
export function initializeInputHelpers(container, options = {}) {
  const numberInputs = container.querySelectorAll('input[type="number"]');

  numberInputs.forEach(input => {
    // type="number"をtypeを"text"に変更（カンマ区切り表示のため）
    // ただし、既存のバリデーション属性は保持
    const min = input.getAttribute('min');
    const max = input.getAttribute('max');
    const step = input.getAttribute('step');

    input.type = 'text';
    input.setAttribute('inputmode', 'decimal');

    // データ属性に元の制約を保存
    if (min !== null) input.dataset.min = min;
    if (max !== null) input.dataset.max = max;
    if (step !== null) input.dataset.step = step;

    // マイナス値の許可判定
    const allowNegative = min === null || parseFloat(min) < 0;

    enableNumberFormatting(input, {
      ...options,
      allowNegative
    });
  });
}

/**
 * 入力値のバリデーション
 * @param {HTMLInputElement} input - input要素
 * @returns {Object} バリデーション結果
 */
export function validateInput(input) {
  const value = parseFormattedNumber(input.value);
  const min = input.dataset.min !== undefined ? parseFloat(input.dataset.min) : null;
  const max = input.dataset.max !== undefined ? parseFloat(input.dataset.max) : null;

  const errors = [];

  if (min !== null && value < min) {
    errors.push(`最小値は ${formatNumberWithCommas(min)} です`);
  }

  if (max !== null && value > max) {
    errors.push(`最大値は ${formatNumberWithCommas(max)} です`);
  }

  return {
    valid: errors.length === 0,
    errors,
    value
  };
}

/**
 * パーセンテージ入力のヘルパー
 * @param {HTMLInputElement} input - input要素
 * @param {Function} onChange - 値変更時のコールバック（0-100の値を受け取る）
 */
export function enablePercentageInput(input, onChange) {
  input.type = 'text';
  input.setAttribute('inputmode', 'decimal');

  input.addEventListener('blur', () => {
    let value = input.value.trim().replace('%', '').replace(/,/g, '');

    if (!value) {
      input.value = '0%';
      if (onChange) onChange(0);
      return;
    }

    const num = parseFloat(value);

    if (isNaN(num)) {
      input.value = '0%';
      if (onChange) onChange(0);
      return;
    }

    // 0-100の範囲に制限
    const clamped = Math.max(0, Math.min(100, num));
    input.value = clamped.toFixed(1) + '%';

    if (onChange) onChange(clamped);
  });

  input.addEventListener('focus', () => {
    const value = input.value.replace('%', '').trim();
    input.value = value;
  });
}

/**
 * 日付入力のヘルパー（年月選択）
 * @param {HTMLInputElement} yearInput - 年の入力要素
 * @param {HTMLInputElement} monthInput - 月の入力要素
 * @returns {Object} 年月の値を取得する関数
 */
export function enableYearMonthInput(yearInput, monthInput) {
  // 年のバリデーション
  yearInput.addEventListener('blur', () => {
    const year = parseInt(yearInput.value);
    const currentYear = new Date().getFullYear();

    if (isNaN(year) || year < 1900 || year > currentYear + 10) {
      yearInput.value = currentYear;
    }
  });

  // 月のバリデーション
  monthInput.addEventListener('blur', () => {
    const month = parseInt(monthInput.value);

    if (isNaN(month) || month < 1 || month > 12) {
      monthInput.value = '1';
    } else {
      monthInput.value = month.toString().padStart(2, '0');
    }
  });

  return {
    getValue: () => ({
      year: parseInt(yearInput.value),
      month: parseInt(monthInput.value)
    }),
    setValue: (year, month) => {
      yearInput.value = year;
      monthInput.value = month.toString().padStart(2, '0');
    }
  };
}
