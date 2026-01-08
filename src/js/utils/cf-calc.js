/**
 * キャッシュフロー計算ロジック
 * @module utils/cf-calc
 */

/**
 * 営業活動によるキャッシュフローを計算
 * @param {Object} operating - 営業CFデータ
 * @param {number} operating.profitBeforeTax - 税引前当期純利益
 * @param {number} operating.depreciation - 減価償却費
 * @param {number} operating.receivablesChange - 売上債権の増減
 * @param {number} operating.inventoryChange - 棚卸資産の増減
 * @param {number} operating.payablesChange - 仕入債務の増減
 * @returns {number} 営業活動によるキャッシュフロー
 */
export function calculateOperatingCF(operating) {
  const {
    profitBeforeTax = 0,
    depreciation = 0,
    receivablesChange = 0,
    inventoryChange = 0,
    payablesChange = 0
  } = operating;

  // 営業CF = 税引前利益 + 減価償却費 - 売上債権増加 - 棚卸資産増加 + 仕入債務増加
  // 注: 増加はマイナス、減少はプラスとして扱う
  return profitBeforeTax + depreciation - receivablesChange - inventoryChange + payablesChange;
}

/**
 * 投資活動によるキャッシュフローを計算
 * @param {Object} investing - 投資CFデータ
 * @param {number} investing.tangibleAcquisition - 有形固定資産の取得
 * @param {number} investing.tangibleDisposal - 有形固定資産の売却
 * @param {number} investing.intangibleAcquisition - 無形固定資産の取得
 * @returns {number} 投資活動によるキャッシュフロー
 */
export function calculateInvestingCF(investing) {
  const {
    tangibleAcquisition = 0,
    tangibleDisposal = 0,
    intangibleAcquisition = 0
  } = investing;

  // 投資CF = -固定資産取得 + 固定資産売却
  return -tangibleAcquisition + tangibleDisposal - intangibleAcquisition;
}

/**
 * 財務活動によるキャッシュフローを計算
 * @param {Object} financing - 財務CFデータ
 * @param {number} financing.shortTermDebtChange - 短期借入金の増減
 * @param {number} financing.longTermBorrowing - 長期借入金の借入
 * @param {number} financing.longTermRepayment - 長期借入金の返済
 * @param {number} financing.dividendPaid - 配当金の支払
 * @returns {number} 財務活動によるキャッシュフロー
 */
export function calculateFinancingCF(financing) {
  const {
    shortTermDebtChange = 0,
    longTermBorrowing = 0,
    longTermRepayment = 0,
    dividendPaid = 0
  } = financing;

  // 財務CF = 短期借入増減 + 長期借入 - 長期返済 - 配当金
  return shortTermDebtChange + longTermBorrowing - longTermRepayment - dividendPaid;
}

/**
 * 現金の増減額を計算
 * @param {number} operatingCF - 営業活動によるCF
 * @param {number} investingCF - 投資活動によるCF
 * @param {number} financingCF - 財務活動によるCF
 * @returns {number} 現金の増減額
 */
export function calculateNetCashFlow(operatingCF, investingCF, financingCF) {
  return operatingCF + investingCF + financingCF;
}

/**
 * 期末現金残高を計算
 * @param {number} beginningCash - 期首現金残高
 * @param {number} netCashFlow - 現金の増減額
 * @returns {number} 期末現金残高
 */
export function calculateEndingCash(beginningCash, netCashFlow) {
  return beginningCash + netCashFlow;
}

/**
 * フリーキャッシュフローを計算
 * @param {number} operatingCF - 営業活動によるCF
 * @param {number} investingCF - 投資活動によるCF
 * @returns {number} フリーキャッシュフロー
 */
export function calculateFreeCashFlow(operatingCF, investingCF) {
  return operatingCF + investingCF;
}

/**
 * キャッシュフロー全体を計算
 * @param {Object} cfData - C/Fデータオブジェクト
 * @returns {Object} 計算結果
 */
export function calculateAllCashFlows(cfData) {
  const operatingCF = calculateOperatingCF(cfData.operating);
  const investingCF = calculateInvestingCF(cfData.investing);
  const financingCF = calculateFinancingCF(cfData.financing);
  const netCashFlow = calculateNetCashFlow(operatingCF, investingCF, financingCF);
  const endingCash = calculateEndingCash(cfData.beginningCash || 0, netCashFlow);
  const freeCashFlow = calculateFreeCashFlow(operatingCF, investingCF);

  return {
    operatingCF,
    investingCF,
    financingCF,
    netCashFlow,
    endingCash,
    freeCashFlow
  };
}

/**
 * 数値を通貨形式にフォーマット
 * @param {number} value - 数値
 * @param {boolean} showSign - 符号を表示するか
 * @returns {string} フォーマット済み文字列
 */
export function formatCurrency(value, showSign = false) {
  const absValue = Math.abs(value);
  const formatted = absValue.toLocaleString('ja-JP');

  if (value < 0) {
    return `(${formatted})`;
  } else if (showSign && value > 0) {
    return `+${formatted}`;
  } else {
    return formatted;
  }
}

/**
 * 数値がマイナスかどうか判定
 * @param {number} value - 数値
 * @returns {boolean} マイナスの場合true
 */
export function isNegative(value) {
  return value < 0;
}
