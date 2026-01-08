/**
 * 予測設定モデル
 * @module models/forecast
 */

/**
 * シナリオタイプの定数
 * @enum {string}
 */
export const SCENARIO_TYPES = {
  OPTIMISTIC: 'optimistic',
  STANDARD: 'standard',
  PESSIMISTIC: 'pessimistic'
};

/**
 * 予測設定オブジェクトを作成
 * @returns {Object} 予測設定オブジェクト
 * @property {number} revenueGrowthRate - 売上成長率（%）
 * @property {string} scenario - シナリオタイプ
 * @property {Object} assumptions - その他の仮定
 */
export const createForecast = () => ({
  revenueGrowthRate: 0,
  scenario: SCENARIO_TYPES.STANDARD,
  assumptions: {
    cogsRate: 0,          // 売上原価率（%）
    sgaRate: 0,           // 販管費率（%）
    taxRate: 30,          // 法人税率（%）
    cashCycle: 30,        // キャッシュサイクル（日）
    inventoryTurnover: 6  // 在庫回転率（回/年）
  }
});

/**
 * シナリオ別の成長率を取得
 * @param {number} baseRate - 基本成長率（%）
 * @param {string} scenario - シナリオタイプ
 * @returns {number} 調整後の成長率（%）
 */
export const getScenarioAdjustedRate = (baseRate, scenario) => {
  switch (scenario) {
    case SCENARIO_TYPES.OPTIMISTIC:
      return baseRate * 1.2; // 楽観: +20%
    case SCENARIO_TYPES.PESSIMISTIC:
      return baseRate * 0.8; // 悲観: -20%
    case SCENARIO_TYPES.STANDARD:
    default:
      return baseRate;       // 標準: そのまま
  }
};

/**
 * 予測設定のバリデーション
 * @param {Object} forecast - 予測設定オブジェクト
 * @returns {boolean} バリデーション結果
 */
export const validateForecast = (forecast) => {
  if (!forecast) return false;
  if (typeof forecast.revenueGrowthRate !== 'number') return false;
  if (!Object.values(SCENARIO_TYPES).includes(forecast.scenario)) return false;
  if (!forecast.assumptions || typeof forecast.assumptions !== 'object') return false;
  return true;
};

/**
 * 期間の売上を予測
 * @param {number} baseRevenue - 基準となる売上
 * @param {number} growthRate - 成長率（%）
 * @param {number} periods - 予測期間数
 * @returns {number} 予測売上
 */
export const forecastRevenue = (baseRevenue, growthRate, periods = 1) => {
  const rate = 1 + growthRate / 100;
  return baseRevenue * Math.pow(rate, periods);
};

/**
 * 売上原価を予測
 * @param {number} revenue - 売上高
 * @param {number} cogsRate - 売上原価率（%）
 * @returns {number} 予測売上原価
 */
export const forecastCOGS = (revenue, cogsRate) => {
  return revenue * (cogsRate / 100);
};

/**
 * 販管費を予測
 * @param {number} revenue - 売上高
 * @param {number} sgaRate - 販管費率（%）
 * @returns {number} 予測販管費
 */
export const forecastSGA = (revenue, sgaRate) => {
  return revenue * (sgaRate / 100);
};

/**
 * 法人税を予測
 * @param {number} profit - 税引前利益
 * @param {number} taxRate - 法人税率（%）
 * @returns {number} 予測法人税
 */
export const forecastTax = (profit, taxRate) => {
  if (profit <= 0) return 0;
  return profit * (taxRate / 100);
};
