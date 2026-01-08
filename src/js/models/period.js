/**
 * 期間データモデル
 * @module models/period
 */

/**
 * P/L（損益計算書）の初期構造を作成
 * @returns {Object} P/L構造
 */
const createPL = () => ({
  revenue: 0,
  cogs: 0,
  sgaExpenses: {
    personnel: 0,
    rent: 0,
    utilities: 0,
    marketing: 0,
    other: 0
  },
  nonOperating: {
    income: 0,
    expense: 0
  },
  tax: 0
});

/**
 * B/S（貸借対照表）の初期構造を作成
 * @returns {Object} B/S構造
 */
const createBS = () => ({
  assets: {
    current: {
      cash: 0,
      receivables: 0,
      inventory: 0
    },
    fixed: {
      tangible: 0,
      intangible: 0
    }
  },
  liabilities: {
    current: {
      payables: 0,
      shortTermDebt: 0
    },
    fixed: {
      longTermDebt: 0
    }
  },
  equity: {
    capital: 0,
    retainedEarnings: 0
  }
});

/**
 * C/F（キャッシュフロー計算書）の初期構造を作成
 * @returns {Object} C/F構造
 */
const createCF = () => ({
  operating: {
    profitBeforeTax: 0,
    depreciation: 0,
    receivablesChange: 0,
    inventoryChange: 0,
    payablesChange: 0
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
  beginningCash: 0
});

/**
 * 期間データオブジェクトを作成
 * @param {number} year - 年
 * @param {number} month - 月（1-12）
 * @returns {Object} 期間データオブジェクト
 */
export const createPeriod = (year, month) => ({
  year: year || new Date().getFullYear(),
  month: month || 1,
  pl: createPL(),
  bs: createBS(),
  cf: createCF()
});

/**
 * 期間データの配列を作成
 * @param {number} startYear - 開始年
 * @param {number} startMonth - 開始月（1-12）
 * @param {number} numMonths - 期間数
 * @returns {Array<Object>} 期間データの配列
 */
export const createPeriods = (startYear, startMonth, numMonths = 12) => {
  const periods = [];
  let year = startYear;
  let month = startMonth;

  for (let i = 0; i < numMonths; i++) {
    periods.push(createPeriod(year, month));

    month++;
    if (month > 12) {
      month = 1;
      year++;
    }
  }

  return periods;
};

/**
 * P/Lの営業利益を計算
 * @param {Object} pl - P/Lオブジェクト
 * @returns {number} 営業利益
 */
export const calculateOperatingProfit = (pl) => {
  const sgaTotal = Object.values(pl.sgaExpenses).reduce((sum, val) => sum + val, 0);
  return pl.revenue - pl.cogs - sgaTotal;
};

/**
 * P/Lの経常利益を計算
 * @param {Object} pl - P/Lオブジェクト
 * @returns {number} 経常利益
 */
export const calculateOrdinaryProfit = (pl) => {
  const operatingProfit = calculateOperatingProfit(pl);
  return operatingProfit + pl.nonOperating.income - pl.nonOperating.expense;
};

/**
 * P/Lの当期純利益を計算
 * @param {Object} pl - P/Lオブジェクト
 * @returns {number} 当期純利益
 */
export const calculateNetProfit = (pl) => {
  const ordinaryProfit = calculateOrdinaryProfit(pl);
  return ordinaryProfit - pl.tax;
};

/**
 * B/Sの総資産を計算
 * @param {Object} bs - B/Sオブジェクト
 * @returns {number} 総資産
 */
export const calculateTotalAssets = (bs) => {
  const currentAssets = Object.values(bs.assets.current).reduce((sum, val) => sum + val, 0);
  const fixedAssets = Object.values(bs.assets.fixed).reduce((sum, val) => sum + val, 0);
  return currentAssets + fixedAssets;
};

/**
 * B/Sの総負債を計算
 * @param {Object} bs - B/Sオブジェクト
 * @returns {number} 総負債
 */
export const calculateTotalLiabilities = (bs) => {
  const currentLiabilities = Object.values(bs.liabilities.current).reduce((sum, val) => sum + val, 0);
  const fixedLiabilities = Object.values(bs.liabilities.fixed).reduce((sum, val) => sum + val, 0);
  return currentLiabilities + fixedLiabilities;
};

/**
 * B/Sの純資産を計算
 * @param {Object} bs - B/Sオブジェクト
 * @returns {number} 純資産
 */
export const calculateTotalEquity = (bs) => {
  return Object.values(bs.equity).reduce((sum, val) => sum + val, 0);
};

/**
 * B/Sのバランスチェック（資産 = 負債 + 純資産）
 * @param {Object} bs - B/Sオブジェクト
 * @returns {boolean} バランスが取れているか
 */
export const checkBSBalance = (bs) => {
  const totalAssets = calculateTotalAssets(bs);
  const totalLiabilities = calculateTotalLiabilities(bs);
  const totalEquity = calculateTotalEquity(bs);
  const diff = Math.abs(totalAssets - (totalLiabilities + totalEquity));
  return diff < 0.01; // 誤差許容
};

/**
 * 期間データのバリデーション
 * @param {Object} period - 期間データオブジェクト
 * @returns {boolean} バリデーション結果
 */
export const validatePeriod = (period) => {
  if (!period) return false;
  if (!period.year || typeof period.year !== 'number') return false;
  if (!period.month || period.month < 1 || period.month > 12) return false;
  if (!period.pl || !period.bs || !period.cf) return false;
  return true;
};
