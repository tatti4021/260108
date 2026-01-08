/**
 * P/L計算ロジック
 * @module utils/pl-calc
 */

/**
 * 売上総利益を計算
 * @param {number} revenue - 売上高
 * @param {number} cogs - 売上原価
 * @returns {number} 売上総利益
 */
export function calculateGrossProfit(revenue, cogs) {
  return revenue - cogs;
}

/**
 * 販管費合計を計算
 * @param {Object} sgaExpenses - 販管費オブジェクト
 * @param {number} sgaExpenses.personnel - 人件費
 * @param {number} sgaExpenses.rent - 賃料
 * @param {number} sgaExpenses.utilities - 光熱費
 * @param {number} sgaExpenses.marketing - 広告宣伝費
 * @param {number} sgaExpenses.other - その他
 * @returns {number} 販管費合計
 */
export function calculateSGATotal(sgaExpenses) {
  return Object.values(sgaExpenses).reduce((sum, val) => sum + (val || 0), 0);
}

/**
 * 営業利益を計算
 * @param {number} revenue - 売上高
 * @param {number} cogs - 売上原価
 * @param {Object} sgaExpenses - 販管費オブジェクト
 * @returns {number} 営業利益
 */
export function calculateOperatingProfit(revenue, cogs, sgaExpenses) {
  const grossProfit = calculateGrossProfit(revenue, cogs);
  const sgaTotal = calculateSGATotal(sgaExpenses);
  return grossProfit - sgaTotal;
}

/**
 * 経常利益を計算
 * @param {number} operatingProfit - 営業利益
 * @param {number} nonOperatingIncome - 営業外収益
 * @param {number} nonOperatingExpense - 営業外費用
 * @returns {number} 経常利益
 */
export function calculateOrdinaryProfit(operatingProfit, nonOperatingIncome, nonOperatingExpense) {
  return operatingProfit + (nonOperatingIncome || 0) - (nonOperatingExpense || 0);
}

/**
 * 当期純利益を計算
 * @param {number} ordinaryProfit - 経常利益
 * @param {number} tax - 法人税等
 * @returns {number} 当期純利益
 */
export function calculateNetProfit(ordinaryProfit, tax) {
  return ordinaryProfit - (tax || 0);
}

/**
 * 利益率を計算
 * @param {Object} pl - P/Lオブジェクト
 * @returns {Object} 利益率オブジェクト
 */
export function calculateProfitMargins(pl) {
  const revenue = pl.revenue || 0;

  // 売上高が0の場合は全て0%を返す
  if (revenue === 0) {
    return {
      grossProfitMargin: 0,
      operatingProfitMargin: 0,
      ordinaryProfitMargin: 0,
      netProfitMargin: 0
    };
  }

  const grossProfit = calculateGrossProfit(pl.revenue, pl.cogs);
  const sgaTotal = calculateSGATotal(pl.sgaExpenses);
  const operatingProfit = grossProfit - sgaTotal;
  const ordinaryProfit = operatingProfit + (pl.nonOperating.income || 0) - (pl.nonOperating.expense || 0);
  const netProfit = ordinaryProfit - (pl.tax || 0);

  return {
    grossProfitMargin: (grossProfit / revenue) * 100,
    operatingProfitMargin: (operatingProfit / revenue) * 100,
    ordinaryProfitMargin: (ordinaryProfit / revenue) * 100,
    netProfitMargin: (netProfit / revenue) * 100
  };
}

/**
 * P/Lの全計算結果を取得
 * @param {Object} pl - P/Lオブジェクト
 * @returns {Object} 計算結果オブジェクト
 */
export function calculatePLResults(pl) {
  const grossProfit = calculateGrossProfit(pl.revenue || 0, pl.cogs || 0);
  const sgaTotal = calculateSGATotal(pl.sgaExpenses || {});
  const operatingProfit = grossProfit - sgaTotal;
  const ordinaryProfit = calculateOrdinaryProfit(
    operatingProfit,
    pl.nonOperating?.income || 0,
    pl.nonOperating?.expense || 0
  );
  const netProfit = calculateNetProfit(ordinaryProfit, pl.tax || 0);
  const margins = calculateProfitMargins(pl);

  return {
    grossProfit,
    sgaTotal,
    operatingProfit,
    ordinaryProfit,
    netProfit,
    margins
  };
}

/**
 * 数値を通貨フォーマットに変換
 * @param {number} value - 数値
 * @returns {string} フォーマットされた文字列
 */
export function formatCurrency(value) {
  if (value === null || value === undefined || isNaN(value)) {
    return '¥0';
  }
  return '¥' + Math.round(value).toLocaleString('ja-JP');
}

/**
 * パーセンテージをフォーマット
 * @param {number} value - パーセンテージ値
 * @param {number} decimals - 小数点以下の桁数
 * @returns {string} フォーマットされた文字列
 */
export function formatPercent(value, decimals = 1) {
  if (value === null || value === undefined || isNaN(value)) {
    return '0.0%';
  }
  return value.toFixed(decimals) + '%';
}
