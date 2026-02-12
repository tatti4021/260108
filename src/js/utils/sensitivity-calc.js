/**
 * 感度分析計算ロジック
 * @module utils/sensitivity-calc
 */

/**
 * 感度分析テーブルを生成（2変数）
 * 2つの変数を変化させた場合の結果をマトリクスとして返す
 * @param {Object} params - パラメータ
 * @param {Function} params.calcFn - 計算関数 (varA, varB) => result
 * @param {number} params.baseA - 変数Aの基準値
 * @param {number} params.baseB - 変数Bの基準値
 * @param {number[]} params.rangeA - 変数Aの変動値配列
 * @param {number[]} params.rangeB - 変数Bの変動値配列
 * @returns {Object} 感度分析結果
 */
export function generateSensitivityTable(params) {
  const { calcFn, baseA, baseB, rangeA, rangeB } = params;

  const matrix = [];
  for (let i = 0; i < rangeA.length; i++) {
    const row = [];
    for (let j = 0; j < rangeB.length; j++) {
      row.push(calcFn(rangeA[i], rangeB[j]));
    }
    matrix.push(row);
  }

  return {
    matrix,
    rangeA,
    rangeB,
    baseA,
    baseB,
    baseResult: calcFn(baseA, baseB)
  };
}

/**
 * 基準値からの変動幅を生成
 * @param {number} base - 基準値
 * @param {number} step - 刻み幅
 * @param {number} count - 基準値の前後の個数
 * @returns {number[]} 変動値配列
 */
export function generateRange(base, step, count = 3) {
  const range = [];
  for (let i = -count; i <= count; i++) {
    range.push(base + step * i);
  }
  return range;
}

/**
 * パーセンテージベースの変動幅を生成
 * @param {number} base - 基準値
 * @param {number} stepPercent - 刻み幅（%ポイント、例: 1 = 1%）
 * @param {number} count - 基準値の前後の個数
 * @returns {number[]} 変動値配列（小数）
 */
export function generatePercentRange(base, stepPercent, count = 3) {
  const step = stepPercent / 100;
  return generateRange(base, step, count);
}

/**
 * 売上高感度分析
 * 売上高の変動が営業利益に与える影響を計算
 * @param {Object} params - パラメータ
 * @param {number} params.revenue - 基準売上高
 * @param {number} params.cogs - 売上原価
 * @param {number} params.sgaTotal - 販管費合計
 * @param {number} params.variableCostRatio - 変動費率（小数）
 * @param {number[]} params.revenueChanges - 売上高変動率配列（小数、例: [-0.10, -0.05, 0, 0.05, 0.10]）
 * @returns {Object} 感度分析結果
 */
export function analyzeSalesImpact(params) {
  const {
    revenue,
    cogs,
    sgaTotal,
    variableCostRatio = 0,
    revenueChanges = [-0.10, -0.05, 0, 0.05, 0.10]
  } = params;

  const fixedCosts = cogs * (1 - variableCostRatio) + sgaTotal;
  const baseVariableCosts = cogs * variableCostRatio;
  const baseOperatingProfit = revenue - cogs - sgaTotal;

  const results = revenueChanges.map(change => {
    const newRevenue = revenue * (1 + change);
    const newVariableCosts = baseVariableCosts * (1 + change);
    const newOperatingProfit = newRevenue - fixedCosts - newVariableCosts;
    const profitChange = baseOperatingProfit !== 0
      ? (newOperatingProfit - baseOperatingProfit) / Math.abs(baseOperatingProfit) * 100
      : 0;

    return {
      revenueChange: change * 100,
      revenue: newRevenue,
      operatingProfit: newOperatingProfit,
      profitChange
    };
  });

  return {
    baseRevenue: revenue,
    baseOperatingProfit,
    results
  };
}

/**
 * DCF感度分析（割引率 × 成長率のマトリクス）
 * @param {Object} params - パラメータ
 * @param {number} params.lastFCF - 最終年度FCF
 * @param {number} params.sumPV - FCF現在価値合計
 * @param {number} params.years - 予測期間年数
 * @param {number} params.baseDiscountRate - 基準割引率（小数）
 * @param {number} params.baseGrowthRate - 基準成長率（小数）
 * @param {number} params.totalDebt - 有利子負債
 * @param {number} params.cash - 現金
 * @returns {Object} 感度分析マトリクス
 */
export function analyzeDCFSensitivity(params) {
  const {
    lastFCF,
    sumPV,
    years,
    baseDiscountRate = 0.10,
    baseGrowthRate = 0.02,
    totalDebt = 0,
    cash = 0
  } = params;

  const discountRates = generatePercentRange(baseDiscountRate, 1, 2);
  const growthRates = generatePercentRange(baseGrowthRate, 0.5, 2);

  const calcFn = (dr, gr) => {
    if (dr <= gr) return null;
    const tv = (lastFCF * (1 + gr)) / (dr - gr);
    const tvPV = tv / Math.pow(1 + dr, years);
    const ev = sumPV + tvPV;
    return ev - totalDebt + cash;
  };

  return generateSensitivityTable({
    calcFn,
    baseA: baseDiscountRate,
    baseB: baseGrowthRate,
    rangeA: discountRates,
    rangeB: growthRates
  });
}

/**
 * 単一変数の感度分析
 * @param {Object} params - パラメータ
 * @param {string} params.variableName - 変数名
 * @param {number} params.baseValue - 基準値
 * @param {number[]} params.changes - 変動率配列（小数）
 * @param {Function} params.calcFn - 計算関数 (value) => result
 * @returns {Object} 感度分析結果
 */
export function analyzeSingleVariable(params) {
  const {
    variableName,
    baseValue,
    changes = [-0.20, -0.10, -0.05, 0, 0.05, 0.10, 0.20],
    calcFn
  } = params;

  const baseResult = calcFn(baseValue);

  const results = changes.map(change => {
    const newValue = baseValue * (1 + change);
    const result = calcFn(newValue);
    const resultChange = baseResult !== 0
      ? (result - baseResult) / Math.abs(baseResult) * 100
      : 0;

    return {
      change: change * 100,
      value: newValue,
      result,
      resultChange
    };
  });

  return {
    variableName,
    baseValue,
    baseResult,
    results
  };
}

/**
 * トルネードチャート用のデータを生成
 * 複数変数の感度を比較して、影響度の大きい順に並べ替え
 * @param {Array<Object>} analyses - 単一変数感度分析結果の配列
 * @param {number} changePercent - 比較する変動率（%、例: 10）
 * @returns {Array<Object>} トルネードチャート用データ（影響度降順）
 */
export function generateTornadoData(analyses, changePercent = 10) {
  const changeFraction = changePercent / 100;

  const tornadoData = analyses.map(analysis => {
    const upResult = analysis.results.find(r => Math.abs(r.change - changePercent) < 0.01);
    const downResult = analysis.results.find(r => Math.abs(r.change + changePercent) < 0.01);

    const upValue = upResult ? upResult.result : analysis.baseResult;
    const downValue = downResult ? downResult.result : analysis.baseResult;
    const spread = Math.abs(upValue - downValue);

    return {
      variableName: analysis.variableName,
      baseResult: analysis.baseResult,
      upValue,
      downValue,
      spread
    };
  });

  return tornadoData.sort((a, b) => b.spread - a.spread);
}

/**
 * 数値をフォーマット
 * @param {number} value - 数値
 * @param {number} decimals - 小数点以下の桁数
 * @returns {string} フォーマット済み文字列
 */
export function formatValue(value, decimals = 0) {
  if (value === null || value === undefined || isNaN(value)) return '-';
  return Math.round(value).toLocaleString('ja-JP');
}

/**
 * パーセンテージをフォーマット
 * @param {number} value - パーセント値（例: 10.5 = 10.5%）
 * @param {number} decimals - 小数点以下の桁数
 * @returns {string} フォーマット済み文字列
 */
export function formatPercent(value, decimals = 1) {
  if (value === null || value === undefined || isNaN(value)) return '-';
  const sign = value > 0 ? '+' : '';
  return sign + value.toFixed(decimals) + '%';
}
