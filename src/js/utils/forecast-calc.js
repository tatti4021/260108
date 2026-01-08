/**
 * 予測計算ユーティリティ
 * @module utils/forecast-calc
 */

/**
 * 売上予測（TASK-028）
 * @param {number} baseRevenue - 基準となる売上高
 * @param {number} growthRate - 成長率（%）
 * @param {number} periods - 予測期間数
 * @returns {Array<number>} 各期の予測売上高の配列
 */
export function forecastRevenue(baseRevenue, growthRate, periods) {
  const forecasts = [];
  const rate = 1 + growthRate / 100;

  for (let n = 1; n <= periods; n++) {
    const revenue = baseRevenue * Math.pow(rate, n);
    forecasts.push(revenue);
  }

  return forecasts;
}

/**
 * 費用予測（売上比率ベース）（TASK-028）
 * @param {Array<number>} forecastedRevenue - 予測売上高の配列
 * @param {Object} expenseRatios - 費用比率オブジェクト
 * @param {number} expenseRatios.cogsRate - 売上原価率（%）
 * @param {number} expenseRatios.sgaRate - 販管費率（%）
 * @returns {Array<Object>} 各期の予測費用の配列
 */
export function forecastExpenses(forecastedRevenue, expenseRatios) {
  return forecastedRevenue.map(revenue => ({
    cogs: revenue * (expenseRatios.cogsRate / 100),
    sga: revenue * (expenseRatios.sgaRate / 100)
  }));
}

/**
 * 予測設定の計算（過去データから自動計算）（TASK-028）
 * @param {Array<Object>} historicalData - 過去データの配列
 * @returns {Object} 予測パラメータ
 */
export function calculateForecastParams(historicalData) {
  if (!historicalData || historicalData.length < 2) {
    return {
      revenueGrowthRate: 0,
      cogsRate: 0,
      sgaRate: 0,
      taxRate: 30
    };
  }

  // 売上成長率の計算（最後の2期間から）
  const lastPeriod = historicalData[historicalData.length - 1];
  const prevPeriod = historicalData[historicalData.length - 2];

  let revenueGrowthRate = 0;
  if (prevPeriod.pl?.revenue > 0) {
    revenueGrowthRate = ((lastPeriod.pl?.revenue || 0) / prevPeriod.pl.revenue - 1) * 100;
  }

  // 平均原価率の計算
  let totalRevenue = 0;
  let totalCogs = 0;
  let totalSGA = 0;

  historicalData.forEach(period => {
    if (period.pl) {
      totalRevenue += period.pl.revenue || 0;
      totalCogs += period.pl.cogs || 0;

      // 販管費の合計を計算
      if (period.pl.sgaExpenses) {
        totalSGA += Object.values(period.pl.sgaExpenses).reduce((sum, val) => sum + val, 0);
      }
    }
  });

  const cogsRate = totalRevenue > 0 ? (totalCogs / totalRevenue) * 100 : 0;
  const sgaRate = totalRevenue > 0 ? (totalSGA / totalRevenue) * 100 : 0;

  return {
    revenueGrowthRate: Math.round(revenueGrowthRate * 100) / 100,
    cogsRate: Math.round(cogsRate * 100) / 100,
    sgaRate: Math.round(sgaRate * 100) / 100,
    taxRate: 30
  };
}

/**
 * 予測P/Lの生成（TASK-029）
 * @param {Object} basePL - 基準となるP/L
 * @param {Object} forecast - 予測設定
 * @param {number} forecast.revenueGrowthRate - 売上成長率（%）
 * @param {number} forecast.cogsRate - 売上原価率（%）
 * @param {number} forecast.sgaRate - 販管費率（%）
 * @param {number} forecast.taxRate - 法人税率（%）
 * @param {number} periods - 予測期間数
 * @param {number} startYear - 開始年
 * @param {number} startMonth - 開始月
 * @returns {Array<Object>} 予測P/Lの配列
 */
export function generateForecastPL(basePL, forecast, periods, startYear, startMonth) {
  const forecastPLs = [];
  const baseRevenue = basePL.revenue || 0;

  // 売上高を予測
  const revenueForecasts = forecastRevenue(baseRevenue, forecast.revenueGrowthRate, periods);

  let year = startYear;
  let month = startMonth;

  for (let i = 0; i < periods; i++) {
    const revenue = revenueForecasts[i];
    const cogs = revenue * (forecast.cogsRate / 100);
    const sgaTotal = revenue * (forecast.sgaRate / 100);

    // 販管費を項目別に按分（既存の比率を使用）
    const sgaExpenses = {
      personnel: sgaTotal * 0.5,
      rent: sgaTotal * 0.2,
      utilities: sgaTotal * 0.1,
      marketing: sgaTotal * 0.15,
      other: sgaTotal * 0.05
    };

    // 営業外収支は基準値をそのまま使用
    const nonOperating = {
      income: basePL.nonOperating?.income || 0,
      expense: basePL.nonOperating?.expense || 0
    };

    // 各利益の計算
    const operatingProfit = revenue - cogs - sgaTotal;
    const ordinaryProfit = operatingProfit + nonOperating.income - nonOperating.expense;
    const taxableProfit = ordinaryProfit > 0 ? ordinaryProfit : 0;
    const tax = taxableProfit * (forecast.taxRate / 100);
    const netIncome = ordinaryProfit - tax;

    forecastPLs.push({
      year,
      month,
      pl: {
        revenue,
        cogs,
        sgaExpenses,
        nonOperating,
        tax,
        operatingProfit,
        ordinaryProfit,
        netIncome
      }
    });

    // 次の月へ
    month++;
    if (month > 12) {
      month = 1;
      year++;
    }
  }

  return forecastPLs;
}

/**
 * 予測B/Sの生成（TASK-030）
 * @param {Object} baseBS - 基準となるB/S
 * @param {Array<Object>} forecastPL - 予測P/Lの配列
 * @returns {Array<Object>} 予測B/Sの配列
 */
export function generateForecastBS(baseBS, forecastPL) {
  const forecastBSs = [];
  let cumulativeRetainedEarnings = baseBS.equity?.retainedEarnings || 0;

  forecastPL.forEach((period, index) => {
    const revenue = period.pl.revenue;
    const netIncome = period.pl.netIncome;

    // 利益剰余金を累積
    cumulativeRetainedEarnings += netIncome;

    // 売上高の増加に応じて運転資本が増加すると仮定
    const baseRevenue = forecastPL[0].pl.revenue;
    const growthFactor = baseRevenue > 0 ? revenue / baseRevenue : 1;

    // 流動資産：売上増に比例して増加
    const currentAssets = {
      cash: (baseBS.assets?.current?.cash || 0) * growthFactor,
      receivables: (baseBS.assets?.current?.receivables || 0) * growthFactor,
      inventory: (baseBS.assets?.current?.inventory || 0) * growthFactor
    };

    // 固定資産：基準値を維持（減価償却は考慮せず）
    const fixedAssets = {
      tangible: baseBS.assets?.fixed?.tangible || 0,
      intangible: baseBS.assets?.fixed?.intangible || 0
    };

    // 流動負債：売上増に比例して増加
    const currentLiabilities = {
      payables: (baseBS.liabilities?.current?.payables || 0) * growthFactor,
      shortTermDebt: baseBS.liabilities?.current?.shortTermDebt || 0
    };

    // 固定負債：基準値を維持
    const fixedLiabilities = {
      longTermDebt: baseBS.liabilities?.fixed?.longTermDebt || 0
    };

    // 純資産
    const equity = {
      capital: baseBS.equity?.capital || 0,
      retainedEarnings: cumulativeRetainedEarnings
    };

    forecastBSs.push({
      year: period.year,
      month: period.month,
      bs: {
        assets: {
          current: currentAssets,
          fixed: fixedAssets
        },
        liabilities: {
          current: currentLiabilities,
          fixed: fixedLiabilities
        },
        equity
      }
    });
  });

  return forecastBSs;
}

/**
 * 予測C/Fの生成（TASK-030）
 * @param {Object} baseBS - 基準となるB/S
 * @param {Array<Object>} forecastBS - 予測B/Sの配列
 * @param {Array<Object>} forecastPL - 予測P/Lの配列
 * @returns {Array<Object>} 予測C/Fの配列
 */
export function generateForecastCF(baseBS, forecastBS, forecastPL) {
  const forecastCFs = [];
  let previousBS = baseBS;
  let beginningCash = baseBS.assets?.current?.cash || 0;

  forecastBS.forEach((currentBSPeriod, index) => {
    const currentBS = currentBSPeriod.bs;
    const currentPL = forecastPL[index].pl;

    // 営業CF
    const ordinaryProfit = currentPL.ordinaryProfit;
    const depreciation = 0; // 簡略化のため0
    const receivablesChange = (currentBS.assets.current.receivables || 0) - (previousBS.assets?.current?.receivables || 0);
    const inventoryChange = (currentBS.assets.current.inventory || 0) - (previousBS.assets?.current?.inventory || 0);
    const payablesChange = (currentBS.liabilities.current.payables || 0) - (previousBS.liabilities?.current?.payables || 0);

    const operatingCF = ordinaryProfit + depreciation - receivablesChange - inventoryChange + payablesChange;

    // 投資CF（簡略化のため固定資産の変動なし）
    const investingCF = 0;

    // 財務CF（簡略化のため借入金の変動なし）
    const financingCF = 0;

    // 現金増減
    const netCashChange = operatingCF + investingCF + financingCF;
    const endingCash = beginningCash + netCashChange;

    forecastCFs.push({
      year: currentBSPeriod.year,
      month: currentBSPeriod.month,
      cf: {
        operating: {
          profitBeforeTax: ordinaryProfit,
          depreciation,
          receivablesChange,
          inventoryChange,
          payablesChange
        },
        investing: {
          tangibleAcquisition: 0,
          tangibleDisposal: 0,
          intangibleAcquisition: 0
        },
        financing: {
          shortTermDebtChange: 0,
          longTermBorrowing: 0,
          longTermRepayment: 0,
          dividendPaid: 0
        },
        beginningCash,
        operatingCF,
        investingCF,
        financingCF,
        netCashChange,
        endingCash
      }
    });

    // 次の期間の準備
    previousBS = currentBS;
    beginningCash = endingCash;
  });

  return forecastCFs;
}

/**
 * シナリオ別の予測を生成
 * @param {Object} basePeriod - 基準となる期間データ
 * @param {Object} baseParams - 基準予測パラメータ
 * @param {number} periods - 予測期間数（年）
 * @returns {Object} 3シナリオの予測データ
 */
export function generateScenarios(basePeriod, baseParams, periods = 5) {
  const currentYear = basePeriod.year;
  const currentMonth = basePeriod.month;
  const nextMonth = currentMonth + 1;
  const startYear = nextMonth > 12 ? currentYear + 1 : currentYear;
  const startMonth = nextMonth > 12 ? 1 : nextMonth;

  // 年次予測なので期間数を12倍（月次）
  const monthlyPeriods = periods * 12;

  // 楽観シナリオ（成長率 +5%ポイント）
  const optimisticForecast = {
    ...baseParams,
    revenueGrowthRate: baseParams.revenueGrowthRate + 5
  };

  // 標準シナリオ（基準値そのまま）
  const standardForecast = {
    ...baseParams
  };

  // 悲観シナリオ（成長率 -5%ポイント）
  const pessimisticForecast = {
    ...baseParams,
    revenueGrowthRate: baseParams.revenueGrowthRate - 5
  };

  // 各シナリオのP/L、B/S、C/Fを生成
  const scenarios = {
    optimistic: generateScenarioData(basePeriod, optimisticForecast, monthlyPeriods, startYear, startMonth),
    standard: generateScenarioData(basePeriod, standardForecast, monthlyPeriods, startYear, startMonth),
    pessimistic: generateScenarioData(basePeriod, pessimisticForecast, monthlyPeriods, startYear, startMonth)
  };

  return scenarios;
}

/**
 * 単一シナリオのデータを生成
 * @private
 */
function generateScenarioData(basePeriod, forecast, periods, startYear, startMonth) {
  const forecastPLs = generateForecastPL(basePeriod.pl, forecast, periods, startYear, startMonth);
  const forecastBSs = generateForecastBS(basePeriod.bs, forecastPLs);
  const forecastCFs = generateForecastCF(basePeriod.bs, forecastBSs, forecastPLs);

  return {
    forecast,
    periods: forecastPLs.map((pl, i) => ({
      year: pl.year,
      month: pl.month,
      pl: pl.pl,
      bs: forecastBSs[i].bs,
      cf: forecastCFs[i].cf
    }))
  };
}

/**
 * 年次集計（月次データを年次に集約）
 * @param {Array<Object>} monthlyData - 月次データの配列
 * @returns {Array<Object>} 年次集計データの配列
 */
export function aggregateToYearly(monthlyData) {
  const yearlyMap = new Map();

  monthlyData.forEach(period => {
    const year = period.year;

    if (!yearlyMap.has(year)) {
      yearlyMap.set(year, {
        year,
        revenue: 0,
        operatingProfit: 0,
        ordinaryProfit: 0,
        netIncome: 0,
        totalAssets: 0,
        totalLiabilities: 0,
        totalEquity: 0,
        operatingCF: 0,
        investingCF: 0,
        financingCF: 0,
        count: 0
      });
    }

    const yearData = yearlyMap.get(year);
    yearData.revenue += period.pl?.revenue || 0;
    yearData.operatingProfit += period.pl?.operatingProfit || 0;
    yearData.ordinaryProfit += period.pl?.ordinaryProfit || 0;
    yearData.netIncome += period.pl?.netIncome || 0;
    yearData.operatingCF += period.cf?.operatingCF || 0;
    yearData.investingCF += period.cf?.investingCF || 0;
    yearData.financingCF += period.cf?.financingCF || 0;
    yearData.count++;

    // B/Sは最終月の値を使用
    if (period.month === 12 || period.month === yearData.count) {
      const currentAssets = Object.values(period.bs?.assets?.current || {}).reduce((sum, val) => sum + val, 0);
      const fixedAssets = Object.values(period.bs?.assets?.fixed || {}).reduce((sum, val) => sum + val, 0);
      const currentLiabilities = Object.values(period.bs?.liabilities?.current || {}).reduce((sum, val) => sum + val, 0);
      const fixedLiabilities = Object.values(period.bs?.liabilities?.fixed || {}).reduce((sum, val) => sum + val, 0);
      const equity = Object.values(period.bs?.equity || {}).reduce((sum, val) => sum + val, 0);

      yearData.totalAssets = currentAssets + fixedAssets;
      yearData.totalLiabilities = currentLiabilities + fixedLiabilities;
      yearData.totalEquity = equity;
    }
  });

  return Array.from(yearlyMap.values());
}
