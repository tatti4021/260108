/**
 * B/S計算ロジック
 * @module utils/bs-calc
 */

/**
 * 流動資産合計を計算
 * @param {Object} assets - 資産オブジェクト
 * @returns {number} 流動資産合計
 */
export function calculateCurrentAssets(assets) {
  if (!assets || !assets.current) return 0;

  const { cash = 0, receivables = 0, inventory = 0 } = assets.current;
  return cash + receivables + inventory;
}

/**
 * 固定資産合計を計算
 * @param {Object} assets - 資産オブジェクト
 * @returns {number} 固定資産合計
 */
export function calculateFixedAssets(assets) {
  if (!assets || !assets.fixed) return 0;

  const { tangible = 0, intangible = 0 } = assets.fixed;
  return tangible + intangible;
}

/**
 * 資産合計を計算
 * @param {Object} assets - 資産オブジェクト
 * @returns {number} 資産合計
 */
export function calculateTotalAssets(assets) {
  return calculateCurrentAssets(assets) + calculateFixedAssets(assets);
}

/**
 * 流動負債合計を計算
 * @param {Object} liabilities - 負債オブジェクト
 * @returns {number} 流動負債合計
 */
export function calculateCurrentLiabilities(liabilities) {
  if (!liabilities || !liabilities.current) return 0;

  const { payables = 0, shortTermDebt = 0 } = liabilities.current;
  return payables + shortTermDebt;
}

/**
 * 固定負債合計を計算
 * @param {Object} liabilities - 負債オブジェクト
 * @returns {number} 固定負債合計
 */
export function calculateFixedLiabilities(liabilities) {
  if (!liabilities || !liabilities.fixed) return 0;

  const { longTermDebt = 0 } = liabilities.fixed;
  return longTermDebt;
}

/**
 * 負債合計を計算
 * @param {Object} liabilities - 負債オブジェクト
 * @returns {number} 負債合計
 */
export function calculateTotalLiabilities(liabilities) {
  return calculateCurrentLiabilities(liabilities) + calculateFixedLiabilities(liabilities);
}

/**
 * 純資産合計を計算
 * @param {Object} equity - 純資産オブジェクト
 * @returns {number} 純資産合計
 */
export function calculateTotalEquity(equity) {
  if (!equity) return 0;

  const { capital = 0, retainedEarnings = 0 } = equity;
  return capital + retainedEarnings;
}

/**
 * バランスチェック: 資産 = 負債 + 純資産
 * @param {Object} assets - 資産オブジェクト
 * @param {Object} liabilities - 負債オブジェクト
 * @param {Object} equity - 純資産オブジェクト
 * @returns {Object} { balanced: boolean, difference: number }
 */
export function checkBalance(assets, liabilities, equity) {
  const totalAssets = calculateTotalAssets(assets);
  const totalLiabilities = calculateTotalLiabilities(liabilities);
  const totalEquity = calculateTotalEquity(equity);

  const difference = totalAssets - (totalLiabilities + totalEquity);
  const balanced = Math.abs(difference) < 0.01; // 誤差許容

  return {
    balanced,
    difference,
    totalAssets,
    totalLiabilities,
    totalEquity
  };
}

/**
 * 数値を通貨フォーマットに変換（カンマ区切り）
 * @param {number} value - 数値
 * @param {boolean} showCurrency - 通貨記号を表示するか（デフォルト: true）
 * @returns {string} フォーマットされた文字列
 */
export function formatCurrency(value, showCurrency = true) {
  if (value === null || value === undefined || isNaN(value)) {
    return showCurrency ? '¥0' : '0';
  }

  const formatted = Math.round(value).toLocaleString('ja-JP');
  return showCurrency ? `¥${formatted}` : formatted;
}

/**
 * 入力値を数値に変換（無効な場合は0）
 * @param {string|number} value - 入力値
 * @returns {number} 数値
 */
export function parseNumber(value) {
  if (value === null || value === undefined || value === '') {
    return 0;
  }

  const parsed = typeof value === 'string' ? parseFloat(value) : value;
  return isNaN(parsed) ? 0 : parsed;
}
