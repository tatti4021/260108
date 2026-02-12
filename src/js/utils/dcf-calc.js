/**
 * DCF（割引キャッシュフロー）計算ロジック
 * @module utils/dcf-calc
 */

/**
 * 割引率で現在価値を計算
 * @param {number} cashFlow - キャッシュフロー
 * @param {number} discountRate - 割引率（小数、例: 0.10 = 10%）
 * @param {number} year - 年数
 * @returns {number} 現在価値
 */
export function calculatePresentValue(cashFlow, discountRate, year) {
  if (year < 0) return 0;
  if (year === 0) return cashFlow;
  return cashFlow / Math.pow(1 + discountRate, year);
}

/**
 * 各年のFCFの現在価値を計算
 * @param {number[]} cashFlows - 各年のフリーキャッシュフロー配列
 * @param {number} discountRate - 割引率（小数）
 * @returns {number[]} 各年の現在価値配列
 */
export function calculatePresentValues(cashFlows, discountRate) {
  return cashFlows.map((cf, index) =>
    calculatePresentValue(cf, discountRate, index + 1)
  );
}

/**
 * ターミナルバリュー（永続価値）を計算（永久成長モデル）
 * TV = FCF_n × (1 + g) / (r - g)
 * @param {number} lastCashFlow - 最終年度のFCF
 * @param {number} discountRate - 割引率（小数）
 * @param {number} growthRate - 永久成長率（小数）
 * @returns {number|null} ターミナルバリュー、計算不可の場合null
 */
export function calculateTerminalValue(lastCashFlow, discountRate, growthRate) {
  if (discountRate <= growthRate) return null;
  return (lastCashFlow * (1 + growthRate)) / (discountRate - growthRate);
}

/**
 * ターミナルバリューの現在価値を計算
 * @param {number} terminalValue - ターミナルバリュー
 * @param {number} discountRate - 割引率（小数）
 * @param {number} years - 予測期間の年数
 * @returns {number} ターミナルバリューの現在価値
 */
export function calculateTerminalValuePV(terminalValue, discountRate, years) {
  return calculatePresentValue(terminalValue, discountRate, years);
}

/**
 * 企業価値（エンタープライズバリュー）を計算
 * EV = Σ PV(FCF) + PV(TV)
 * @param {number[]} presentValues - 各年FCFの現在価値配列
 * @param {number} terminalValuePV - ターミナルバリューの現在価値
 * @returns {number} 企業価値
 */
export function calculateEnterpriseValue(presentValues, terminalValuePV) {
  const sumPV = presentValues.reduce((sum, pv) => sum + pv, 0);
  return sumPV + terminalValuePV;
}

/**
 * 株式価値を計算
 * 株式価値 = 企業価値 - 有利子負債 + 現金
 * @param {number} enterpriseValue - 企業価値
 * @param {number} totalDebt - 有利子負債
 * @param {number} cash - 現金・現金同等物
 * @returns {number} 株式価値
 */
export function calculateEquityValue(enterpriseValue, totalDebt, cash) {
  return enterpriseValue - totalDebt + cash;
}

/**
 * WACC（加重平均資本コスト）を計算
 * WACC = E/(E+D) × Re + D/(E+D) × Rd × (1 - T)
 * @param {Object} params - WACCパラメータ
 * @param {number} params.equityValue - 株式時価総額
 * @param {number} params.debtValue - 有利子負債
 * @param {number} params.costOfEquity - 株主資本コスト（小数）
 * @param {number} params.costOfDebt - 負債コスト（小数）
 * @param {number} params.taxRate - 実効税率（小数）
 * @returns {number|null} WACC（小数）、計算不可の場合null
 */
export function calculateWACC(params) {
  const { equityValue, debtValue, costOfEquity, costOfDebt, taxRate } = params;
  const totalCapital = equityValue + debtValue;
  if (totalCapital === 0) return null;

  const equityWeight = equityValue / totalCapital;
  const debtWeight = debtValue / totalCapital;

  return equityWeight * costOfEquity + debtWeight * costOfDebt * (1 - taxRate);
}

/**
 * DCF分析の全計算を実行
 * @param {Object} params - DCFパラメータ
 * @param {number[]} params.projectedFCF - 予測FCF配列
 * @param {number} params.discountRate - 割引率（小数）
 * @param {number} params.terminalGrowthRate - 永久成長率（小数）
 * @param {number} params.totalDebt - 有利子負債
 * @param {number} params.cash - 現金
 * @returns {Object} DCF分析結果
 */
export function calculateDCF(params) {
  const {
    projectedFCF = [],
    discountRate = 0.10,
    terminalGrowthRate = 0.02,
    totalDebt = 0,
    cash = 0
  } = params;

  if (projectedFCF.length === 0) {
    return {
      presentValues: [],
      sumPV: 0,
      terminalValue: null,
      terminalValuePV: 0,
      enterpriseValue: 0,
      equityValue: 0,
      error: '予測FCFが入力されていません'
    };
  }

  // 各年FCFの現在価値
  const presentValues = calculatePresentValues(projectedFCF, discountRate);
  const sumPV = presentValues.reduce((sum, pv) => sum + pv, 0);

  // ターミナルバリュー
  const lastFCF = projectedFCF[projectedFCF.length - 1];
  const terminalValue = calculateTerminalValue(lastFCF, discountRate, terminalGrowthRate);

  if (terminalValue === null) {
    return {
      presentValues,
      sumPV,
      terminalValue: null,
      terminalValuePV: 0,
      enterpriseValue: sumPV,
      equityValue: sumPV - totalDebt + cash,
      error: '割引率は永久成長率より大きい必要があります'
    };
  }

  // ターミナルバリューの現在価値
  const terminalValuePV = calculateTerminalValuePV(terminalValue, discountRate, projectedFCF.length);

  // 企業価値
  const enterpriseValue = calculateEnterpriseValue(presentValues, terminalValuePV);

  // 株式価値
  const equityValue = calculateEquityValue(enterpriseValue, totalDebt, cash);

  return {
    presentValues,
    sumPV,
    terminalValue,
    terminalValuePV,
    enterpriseValue,
    equityValue,
    error: null
  };
}

/**
 * 数値を通貨フォーマットに変換
 * @param {number} value - 数値
 * @returns {string} フォーマット済み文字列
 */
export function formatCurrency(value) {
  if (value === null || value === undefined || isNaN(value)) return '-';
  const absValue = Math.abs(value);
  if (absValue >= 100000000) {
    return (value / 100000000).toFixed(1) + '億円';
  } else if (absValue >= 10000) {
    return (value / 10000).toFixed(0) + '万円';
  }
  return '¥' + Math.round(value).toLocaleString('ja-JP');
}

/**
 * パーセンテージをフォーマット
 * @param {number} value - 小数値（例: 0.10）
 * @param {number} decimals - 小数点以下の桁数
 * @returns {string} フォーマット済み文字列
 */
export function formatPercent(value, decimals = 1) {
  if (value === null || value === undefined || isNaN(value)) return '-';
  return (value * 100).toFixed(decimals) + '%';
}
