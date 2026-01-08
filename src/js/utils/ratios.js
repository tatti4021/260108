/**
 * 財務比率計算ロジック
 * @module utils/ratios
 */

// ======================
// 収益性指標 (TASK-019)
// ======================

/**
 * 売上総利益率を計算
 * 売上総利益率 = (売上高 - 売上原価) / 売上高 × 100
 * @param {number} revenue - 売上高
 * @param {number} cogs - 売上原価
 * @returns {number|null} 売上総利益率（%）、売上高が0の場合はnull
 */
export function calculateGrossProfitMargin(revenue, cogs) {
  if (!revenue || revenue === 0) return null;
  return ((revenue - cogs) / revenue) * 100;
}

/**
 * 営業利益率を計算
 * 営業利益率 = 営業利益 / 売上高 × 100
 * @param {number} operatingProfit - 営業利益
 * @param {number} revenue - 売上高
 * @returns {number|null} 営業利益率（%）、売上高が0の場合はnull
 */
export function calculateOperatingProfitMargin(operatingProfit, revenue) {
  if (!revenue || revenue === 0) return null;
  return (operatingProfit / revenue) * 100;
}

/**
 * 経常利益率を計算
 * 経常利益率 = 経常利益 / 売上高 × 100
 * @param {number} ordinaryProfit - 経常利益
 * @param {number} revenue - 売上高
 * @returns {number|null} 経常利益率（%）、売上高が0の場合はnull
 */
export function calculateOrdinaryProfitMargin(ordinaryProfit, revenue) {
  if (!revenue || revenue === 0) return null;
  return (ordinaryProfit / revenue) * 100;
}

/**
 * 当期純利益率を計算
 * 当期純利益率 = 当期純利益 / 売上高 × 100
 * @param {number} netProfit - 当期純利益
 * @param {number} revenue - 売上高
 * @returns {number|null} 当期純利益率（%）、売上高が0の場合はnull
 */
export function calculateNetProfitMargin(netProfit, revenue) {
  if (!revenue || revenue === 0) return null;
  return (netProfit / revenue) * 100;
}

// ======================
// 効率性指標 (TASK-020)
// ======================

/**
 * ROE（自己資本利益率）を計算
 * ROE = 当期純利益 / 自己資本 × 100
 * @param {number} netProfit - 当期純利益
 * @param {number} equity - 自己資本
 * @returns {number|null} ROE（%）、自己資本が0の場合はnull
 */
export function calculateROE(netProfit, equity) {
  if (!equity || equity === 0) return null;
  return (netProfit / equity) * 100;
}

/**
 * ROA（総資産利益率）を計算
 * ROA = 当期純利益 / 総資産 × 100
 * @param {number} netProfit - 当期純利益
 * @param {number} totalAssets - 総資産
 * @returns {number|null} ROA（%）、総資産が0の場合はnull
 */
export function calculateROA(netProfit, totalAssets) {
  if (!totalAssets || totalAssets === 0) return null;
  return (netProfit / totalAssets) * 100;
}

/**
 * 総資産回転率を計算
 * 総資産回転率 = 売上高 / 総資産
 * @param {number} revenue - 売上高
 * @param {number} totalAssets - 総資産
 * @returns {number|null} 総資産回転率（回）、総資産が0の場合はnull
 */
export function calculateAssetTurnover(revenue, totalAssets) {
  if (!totalAssets || totalAssets === 0) return null;
  return revenue / totalAssets;
}

// ======================
// 安全性指標 (TASK-021)
// ======================

/**
 * 流動比率を計算
 * 流動比率 = 流動資産 / 流動負債 × 100
 * @param {number} currentAssets - 流動資産
 * @param {number} currentLiabilities - 流動負債
 * @returns {number|null} 流動比率（%）、流動負債が0の場合はnull
 */
export function calculateCurrentRatio(currentAssets, currentLiabilities) {
  if (!currentLiabilities || currentLiabilities === 0) return null;
  return (currentAssets / currentLiabilities) * 100;
}

/**
 * 当座比率を計算
 * 当座比率 = (流動資産 - 棚卸資産) / 流動負債 × 100
 * @param {number} currentAssets - 流動資産
 * @param {number} inventory - 棚卸資産
 * @param {number} currentLiabilities - 流動負債
 * @returns {number|null} 当座比率（%）、流動負債が0の場合はnull
 */
export function calculateQuickRatio(currentAssets, inventory, currentLiabilities) {
  if (!currentLiabilities || currentLiabilities === 0) return null;
  return ((currentAssets - inventory) / currentLiabilities) * 100;
}

/**
 * 自己資本比率を計算
 * 自己資本比率 = 自己資本 / 総資産 × 100
 * @param {number} equity - 自己資本
 * @param {number} totalAssets - 総資産
 * @returns {number|null} 自己資本比率（%）、総資産が0の場合はnull
 */
export function calculateEquityRatio(equity, totalAssets) {
  if (!totalAssets || totalAssets === 0) return null;
  return (equity / totalAssets) * 100;
}

/**
 * 負債比率を計算
 * 負債比率 = 負債 / 総資産 × 100
 * @param {number} totalLiabilities - 負債
 * @param {number} totalAssets - 総資産
 * @returns {number|null} 負債比率（%）、総資産が0の場合はnull
 */
export function calculateDebtRatio(totalLiabilities, totalAssets) {
  if (!totalAssets || totalAssets === 0) return null;
  return (totalLiabilities / totalAssets) * 100;
}

// ======================
// ユーティリティ関数
// ======================

/**
 * 指標の評価レベルを判定
 * @param {string} ratioType - 指標タイプ
 * @param {number|null} value - 指標値
 * @returns {string} 'good' | 'warning' | 'danger' | 'unknown'
 */
export function getRatingLevel(ratioType, value) {
  if (value === null || value === undefined) return 'unknown';

  const thresholds = {
    grossProfitMargin: { good: 30, warning: 20 },
    operatingProfitMargin: { good: 10, warning: 5 },
    ordinaryProfitMargin: { good: 10, warning: 5 },
    netProfitMargin: { good: 5, warning: 2 },
    roe: { good: 10, warning: 5 },
    roa: { good: 5, warning: 2 },
    assetTurnover: { good: 1.0, warning: 0.5 },
    currentRatio: { good: 200, warning: 100 },
    quickRatio: { good: 100, warning: 80 },
    equityRatio: { good: 50, warning: 30 },
    debtRatio: { good: 0, warning: 50, reverse: true } // 負債比率は低いほど良い
  };

  const threshold = thresholds[ratioType];
  if (!threshold) return 'unknown';

  // 負債比率は逆評価（低いほど良い）
  if (threshold.reverse) {
    if (value <= threshold.good) return 'good';
    if (value <= threshold.warning) return 'warning';
    return 'danger';
  }

  // 通常の評価（高いほど良い）
  if (value >= threshold.good) return 'good';
  if (value >= threshold.warning) return 'warning';
  return 'danger';
}

/**
 * 数値をフォーマット
 * @param {number|null} value - 数値
 * @param {number} decimals - 小数点以下の桁数
 * @returns {string} フォーマットされた文字列
 */
export function formatRatio(value, decimals = 1) {
  if (value === null || value === undefined || isNaN(value)) {
    return '-';
  }
  return value.toFixed(decimals);
}

/**
 * パーセンテージをフォーマット
 * @param {number|null} value - 数値
 * @param {number} decimals - 小数点以下の桁数
 * @returns {string} フォーマットされた文字列
 */
export function formatRatioPercent(value, decimals = 1) {
  if (value === null || value === undefined || isNaN(value)) {
    return '-';
  }
  return value.toFixed(decimals) + '%';
}

/**
 * 総合評価を生成
 * @param {Object} ratios - 計算された全指標
 * @returns {string} 総合評価コメント
 */
export function generateOverallAssessment(ratios) {
  const levels = {
    good: 0,
    warning: 0,
    danger: 0,
    unknown: 0
  };

  // 各指標の評価を集計
  const indicators = [
    { type: 'grossProfitMargin', value: ratios.profitability?.grossProfitMargin },
    { type: 'operatingProfitMargin', value: ratios.profitability?.operatingProfitMargin },
    { type: 'roe', value: ratios.efficiency?.roe },
    { type: 'currentRatio', value: ratios.safety?.currentRatio },
    { type: 'equityRatio', value: ratios.safety?.equityRatio }
  ];

  indicators.forEach(({ type, value }) => {
    const level = getRatingLevel(type, value);
    levels[level]++;
  });

  // 総合評価を決定
  if (levels.unknown >= 3) {
    return 'データが不足しているため、十分な評価ができません。財務データを入力してください。';
  }

  if (levels.good >= 4) {
    return '財務状況は非常に良好です。収益性、効率性、安全性のすべてにおいて健全な水準を維持しています。';
  }

  if (levels.good >= 2 && levels.danger === 0) {
    return '財務状況は概ね良好です。一部改善の余地がありますが、全体的に安定しています。';
  }

  if (levels.danger >= 2) {
    return '財務状況に懸念があります。収益性や安全性の改善が必要です。早急な対策を検討してください。';
  }

  if (levels.danger >= 1) {
    return '財務状況に注意が必要です。一部の指標が低水準となっています。改善策の検討をお勧めします。';
  }

  return '財務状況は標準的な水準です。継続的なモニタリングと改善を心がけましょう。';
}
