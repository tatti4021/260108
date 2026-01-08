/**
 * 会社情報モデル
 * @module models/company
 */

/**
 * 会社情報オブジェクトを作成
 * @returns {Object} 会社情報オブジェクト
 * @property {string} name - 会社名
 * @property {string} fiscalYearStart - 会計年度開始月（01-12）
 * @property {string} currency - 通貨コード（ISO 4217）
 */
export const createCompany = () => ({
  name: '',
  fiscalYearStart: '04',
  currency: 'JPY'
});

/**
 * 会社情報のバリデーション
 * @param {Object} company - 会社情報オブジェクト
 * @returns {boolean} バリデーション結果
 */
export const validateCompany = (company) => {
  if (!company) return false;
  if (typeof company.name !== 'string') return false;
  if (!company.fiscalYearStart || !/^(0[1-9]|1[0-2])$/.test(company.fiscalYearStart)) return false;
  if (!company.currency || typeof company.currency !== 'string') return false;
  return true;
};
