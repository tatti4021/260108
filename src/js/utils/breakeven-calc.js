/**
 * 損益分岐点分析計算ロジック
 * @module utils/breakeven-calc
 */

/**
 * 損益分岐点売上高を計算
 * BEP売上高 = 固定費 / (1 - 変動費率)
 * @param {number} fixedCosts - 固定費
 * @param {number} variableCostRatio - 変動費率（小数、例: 0.4 = 40%）
 * @returns {number|null} 損益分岐点売上高、計算不可の場合null
 */
export function calculateBreakevenRevenue(fixedCosts, variableCostRatio) {
  const contributionMarginRatio = 1 - variableCostRatio;
  if (contributionMarginRatio <= 0) return null;
  return fixedCosts / contributionMarginRatio;
}

/**
 * 限界利益率を計算
 * 限界利益率 = 1 - 変動費率
 * @param {number} variableCostRatio - 変動費率（小数）
 * @returns {number} 限界利益率（小数）
 */
export function calculateContributionMarginRatio(variableCostRatio) {
  return 1 - variableCostRatio;
}

/**
 * 限界利益を計算
 * 限界利益 = 売上高 × 限界利益率
 * @param {number} revenue - 売上高
 * @param {number} variableCostRatio - 変動費率（小数）
 * @returns {number} 限界利益
 */
export function calculateContributionMargin(revenue, variableCostRatio) {
  return revenue * (1 - variableCostRatio);
}

/**
 * 安全余裕率を計算
 * 安全余裕率 = (実際売上高 - BEP売上高) / 実際売上高 × 100
 * @param {number} actualRevenue - 実際売上高
 * @param {number} breakevenRevenue - 損益分岐点売上高
 * @returns {number|null} 安全余裕率（%）
 */
export function calculateMarginOfSafety(actualRevenue, breakevenRevenue) {
  if (!actualRevenue || actualRevenue === 0) return null;
  return ((actualRevenue - breakevenRevenue) / actualRevenue) * 100;
}

/**
 * 経営レバレッジ係数を計算
 * DOL = 限界利益 / 営業利益
 * @param {number} contributionMargin - 限界利益
 * @param {number} operatingProfit - 営業利益
 * @returns {number|null} 経営レバレッジ係数
 */
export function calculateDOL(contributionMargin, operatingProfit) {
  if (!operatingProfit || operatingProfit === 0) return null;
  return contributionMargin / operatingProfit;
}

/**
 * 目標利益達成売上高を計算
 * 目標売上高 = (固定費 + 目標利益) / 限界利益率
 * @param {number} fixedCosts - 固定費
 * @param {number} targetProfit - 目標利益
 * @param {number} variableCostRatio - 変動費率（小数）
 * @returns {number|null} 目標利益達成に必要な売上高
 */
export function calculateTargetRevenue(fixedCosts, targetProfit, variableCostRatio) {
  const contributionMarginRatio = 1 - variableCostRatio;
  if (contributionMarginRatio <= 0) return null;
  return (fixedCosts + targetProfit) / contributionMarginRatio;
}

/**
 * P/Lデータから固定費・変動費を推定
 * @param {Object} pl - P/Lデータ
 * @param {number} variableCostRatioOfCogs - 売上原価に占める変動費の割合（小数、デフォルト0.7）
 * @returns {Object} 固定費・変動費の推定結果
 */
export function estimateCostStructure(pl, variableCostRatioOfCogs = 0.7) {
  const revenue = pl.revenue || 0;
  const cogs = pl.cogs || 0;
  const sgaTotal = Object.values(pl.sgaExpenses || {}).reduce((sum, val) => sum + (val || 0), 0);

  // 売上原価を変動費と固定費に分解
  const variableCogs = cogs * variableCostRatioOfCogs;
  const fixedCogs = cogs * (1 - variableCostRatioOfCogs);

  // 販管費は固定費として扱う
  const totalVariableCosts = variableCogs;
  const totalFixedCosts = fixedCogs + sgaTotal;

  // 変動費率
  const variableCostRatio = revenue > 0 ? totalVariableCosts / revenue : 0;

  return {
    revenue,
    variableCosts: totalVariableCosts,
    fixedCosts: totalFixedCosts,
    variableCostRatio,
    contributionMarginRatio: 1 - variableCostRatio
  };
}

/**
 * 損益分岐点分析の全計算を実行
 * @param {Object} params - パラメータ
 * @param {number} params.revenue - 売上高
 * @param {number} params.variableCosts - 変動費
 * @param {number} params.fixedCosts - 固定費
 * @param {number} params.targetProfit - 目標利益（オプション）
 * @returns {Object} 損益分岐点分析結果
 */
export function calculateBreakevenAnalysis(params) {
  const {
    revenue = 0,
    variableCosts = 0,
    fixedCosts = 0,
    targetProfit = 0
  } = params;

  // 変動費率
  const variableCostRatio = revenue > 0 ? variableCosts / revenue : 0;

  // 限界利益率
  const contributionMarginRatio = calculateContributionMarginRatio(variableCostRatio);

  // 限界利益
  const contributionMargin = calculateContributionMargin(revenue, variableCostRatio);

  // 営業利益
  const operatingProfit = revenue - variableCosts - fixedCosts;

  // 損益分岐点売上高
  const breakevenRevenue = calculateBreakevenRevenue(fixedCosts, variableCostRatio);

  // 損益分岐点比率
  const breakevenRatio = revenue > 0 && breakevenRevenue !== null
    ? (breakevenRevenue / revenue) * 100
    : null;

  // 安全余裕率
  const marginOfSafety = breakevenRevenue !== null
    ? calculateMarginOfSafety(revenue, breakevenRevenue)
    : null;

  // 経営レバレッジ係数
  const dol = calculateDOL(contributionMargin, operatingProfit);

  // 目標利益達成売上高
  const targetRevenue = targetProfit > 0
    ? calculateTargetRevenue(fixedCosts, targetProfit, variableCostRatio)
    : null;

  return {
    revenue,
    variableCosts,
    fixedCosts,
    variableCostRatio,
    contributionMarginRatio,
    contributionMargin,
    operatingProfit,
    breakevenRevenue,
    breakevenRatio,
    marginOfSafety,
    dol,
    targetProfit,
    targetRevenue
  };
}

/**
 * 損益分岐点チャート用のデータポイントを生成
 * @param {number} fixedCosts - 固定費
 * @param {number} variableCostRatio - 変動費率（小数）
 * @param {number} maxRevenue - チャートの最大売上高
 * @param {number} steps - データポイント数
 * @returns {Object} チャート用データ
 */
export function generateBreakevenChartData(fixedCosts, variableCostRatio, maxRevenue, steps = 20) {
  const data = {
    labels: [],
    revenueData: [],
    totalCostData: [],
    fixedCostData: [],
    profitData: []
  };

  for (let i = 0; i <= steps; i++) {
    const rev = (maxRevenue / steps) * i;
    const totalCost = fixedCosts + rev * variableCostRatio;
    const profit = rev - totalCost;

    data.labels.push(Math.round(rev));
    data.revenueData.push(rev);
    data.totalCostData.push(totalCost);
    data.fixedCostData.push(fixedCosts);
    data.profitData.push(profit);
  }

  return data;
}

/**
 * 数値を通貨フォーマットに変換
 * @param {number} value - 数値
 * @returns {string} フォーマット済み文字列
 */
export function formatCurrency(value) {
  if (value === null || value === undefined || isNaN(value)) return '-';
  return '¥' + Math.round(value).toLocaleString('ja-JP');
}

/**
 * パーセンテージをフォーマット
 * @param {number} value - パーセント値
 * @param {number} decimals - 小数点以下の桁数
 * @returns {string} フォーマット済み文字列
 */
export function formatPercent(value, decimals = 1) {
  if (value === null || value === undefined || isNaN(value)) return '-';
  return value.toFixed(decimals) + '%';
}
