/**
 * CSV エクスポート/インポート機能
 * @module utils/csv
 */

/**
 * CSVダウンロード処理の共通関数
 * @param {string} content - CSV内容
 * @param {string} filename - ファイル名
 * @private
 */
function downloadCSV(content, filename) {
  // BOM付きUTF-8でBlobを作成（Excelで正しく開けるようにする）
  const blob = new Blob(['\ufeff' + content], { type: 'text/csv;charset=utf-8' });

  // ダウンロードリンクを作成してクリック
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();

  // クリーンアップ
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * 日付を年月形式にフォーマット
 * @param {number} year - 年
 * @param {number} month - 月
 * @returns {string} YYYY/MM形式の文字列
 * @private
 */
function formatYearMonth(year, month) {
  const paddedMonth = String(month).padStart(2, '0');
  return `${year}/${paddedMonth}`;
}

/**
 * 数値を文字列に変換（nullやundefinedは0に）
 * @param {number|null|undefined} value - 数値
 * @returns {string} 文字列化された数値
 * @private
 */
function formatNumber(value) {
  return String(value ?? 0);
}

/**
 * P/L（損益計算書）をCSV形式でエクスポート
 * @param {Array<Object>} periods - 期間データの配列
 * @returns {void}
 */
export function exportPLToCSV(periods) {
  if (!periods || periods.length === 0) {
    throw new Error('期間データが存在しません');
  }

  // ヘッダー行
  const headers = [
    '年月',
    '売上高',
    '売上原価',
    '人件費',
    '賃料',
    '光熱費',
    '広告宣伝費',
    'その他販管費',
    '営業外収益',
    '営業外費用',
    '法人税等'
  ];

  // データ行を生成
  const rows = periods.map(period => {
    const pl = period.pl;
    return [
      formatYearMonth(period.year, period.month),
      formatNumber(pl.revenue),
      formatNumber(pl.cogs),
      formatNumber(pl.sgaExpenses.personnel),
      formatNumber(pl.sgaExpenses.rent),
      formatNumber(pl.sgaExpenses.utilities),
      formatNumber(pl.sgaExpenses.marketing),
      formatNumber(pl.sgaExpenses.other),
      formatNumber(pl.nonOperating.income),
      formatNumber(pl.nonOperating.expense),
      formatNumber(pl.tax)
    ];
  });

  // CSV生成
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.join(','))
  ].join('\n');

  // ダウンロード
  const timestamp = new Date().toISOString().slice(0, 10);
  downloadCSV(csvContent, `PL_${timestamp}.csv`);
}

/**
 * B/S（貸借対照表）をCSV形式でエクスポート
 * @param {Array<Object>} periods - 期間データの配列
 * @returns {void}
 */
export function exportBSToCSV(periods) {
  if (!periods || periods.length === 0) {
    throw new Error('期間データが存在しません');
  }

  // ヘッダー行
  const headers = [
    '年月',
    '現金預金',
    '売掛金',
    '棚卸資産',
    '有形固定資産',
    '無形固定資産',
    '買掛金',
    '短期借入金',
    '長期借入金',
    '資本金',
    '利益剰余金'
  ];

  // データ行を生成
  const rows = periods.map(period => {
    const bs = period.bs;
    return [
      formatYearMonth(period.year, period.month),
      formatNumber(bs.assets.current.cash),
      formatNumber(bs.assets.current.receivables),
      formatNumber(bs.assets.current.inventory),
      formatNumber(bs.assets.fixed.tangible),
      formatNumber(bs.assets.fixed.intangible),
      formatNumber(bs.liabilities.current.payables),
      formatNumber(bs.liabilities.current.shortTermDebt),
      formatNumber(bs.liabilities.fixed.longTermDebt),
      formatNumber(bs.equity.capital),
      formatNumber(bs.equity.retainedEarnings)
    ];
  });

  // CSV生成
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.join(','))
  ].join('\n');

  // ダウンロード
  const timestamp = new Date().toISOString().slice(0, 10);
  downloadCSV(csvContent, `BS_${timestamp}.csv`);
}

/**
 * C/F（キャッシュフロー計算書）をCSV形式でエクスポート
 * @param {Array<Object>} periods - 期間データの配列
 * @returns {void}
 */
export function exportCFToCSV(periods) {
  if (!periods || periods.length === 0) {
    throw new Error('期間データが存在しません');
  }

  // ヘッダー行
  const headers = [
    '年月',
    '税引前利益',
    '減価償却費',
    '売掛金増減',
    '棚卸資産増減',
    '買掛金増減',
    '有形固定資産取得',
    '有形固定資産売却',
    '無形固定資産取得',
    '短期借入金増減',
    '長期借入',
    '長期返済',
    '配当金支払',
    '期首現金残高'
  ];

  // データ行を生成
  const rows = periods.map(period => {
    const cf = period.cf;
    return [
      formatYearMonth(period.year, period.month),
      formatNumber(cf.operating.profitBeforeTax),
      formatNumber(cf.operating.depreciation),
      formatNumber(cf.operating.receivablesChange),
      formatNumber(cf.operating.inventoryChange),
      formatNumber(cf.operating.payablesChange),
      formatNumber(cf.investing.tangibleAcquisition),
      formatNumber(cf.investing.tangibleDisposal),
      formatNumber(cf.investing.intangibleAcquisition),
      formatNumber(cf.financing.shortTermDebtChange),
      formatNumber(cf.financing.longTermBorrowing),
      formatNumber(cf.financing.longTermRepayment),
      formatNumber(cf.financing.dividendPaid),
      formatNumber(cf.beginningCash)
    ];
  });

  // CSV生成
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.join(','))
  ].join('\n');

  // ダウンロード
  const timestamp = new Date().toISOString().slice(0, 10);
  downloadCSV(csvContent, `CF_${timestamp}.csv`);
}

/**
 * 全データを一括エクスポート（P/L、B/S、C/Fを個別にダウンロード）
 * @param {Object} data - アプリケーション状態データ
 * @returns {void}
 */
export function exportAllToCSV(data) {
  if (!data || !data.periods || data.periods.length === 0) {
    throw new Error('エクスポートするデータが存在しません');
  }

  try {
    exportPLToCSV(data.periods);
    // 少し遅延を入れて複数ダウンロードを確実にする
    setTimeout(() => exportBSToCSV(data.periods), 100);
    setTimeout(() => exportCFToCSV(data.periods), 200);
  } catch (error) {
    console.error('CSV一括エクスポートエラー:', error);
    throw new Error(`CSV一括エクスポートに失敗しました: ${error.message}`);
  }
}

/**
 * P/L用CSVテンプレートをダウンロード
 * @returns {void}
 */
export function downloadPLTemplate() {
  const headers = [
    '年月',
    '売上高',
    '売上原価',
    '人件費',
    '賃料',
    '光熱費',
    '広告宣伝費',
    'その他販管費',
    '営業外収益',
    '営業外費用',
    '法人税等'
  ];

  // サンプルデータ行
  const sampleRows = [
    ['2024/01', '1000000', '400000', '200000', '50000', '10000', '30000', '20000', '5000', '3000', '50000'],
    ['2024/02', '1100000', '440000', '200000', '50000', '10000', '35000', '22000', '5000', '3000', '55000'],
    ['2024/03', '1200000', '480000', '200000', '50000', '10000', '40000', '24000', '5000', '3000', '60000']
  ];

  const csvContent = [
    headers.join(','),
    ...sampleRows.map(row => row.join(','))
  ].join('\n');

  downloadCSV(csvContent, 'PL_template.csv');
}

/**
 * B/S用CSVテンプレートをダウンロード
 * @returns {void}
 */
export function downloadBSTemplate() {
  const headers = [
    '年月',
    '現金預金',
    '売掛金',
    '棚卸資産',
    '有形固定資産',
    '無形固定資産',
    '買掛金',
    '短期借入金',
    '長期借入金',
    '資本金',
    '利益剰余金'
  ];

  // サンプルデータ行
  const sampleRows = [
    ['2024/01', '5000000', '1000000', '500000', '2000000', '100000', '400000', '1000000', '3000000', '10000000', '200000'],
    ['2024/02', '5500000', '1100000', '550000', '1950000', '100000', '440000', '1000000', '2900000', '10000000', '260000'],
    ['2024/03', '6000000', '1200000', '600000', '1900000', '100000', '480000', '1000000', '2800000', '10000000', '320000']
  ];

  const csvContent = [
    headers.join(','),
    ...sampleRows.map(row => row.join(','))
  ].join('\n');

  downloadCSV(csvContent, 'BS_template.csv');
}

/**
 * C/F用CSVテンプレートをダウンロード
 * @returns {void}
 */
export function downloadCFTemplate() {
  const headers = [
    '年月',
    '税引前利益',
    '減価償却費',
    '売掛金増減',
    '棚卸資産増減',
    '買掛金増減',
    '有形固定資産取得',
    '有形固定資産売却',
    '無形固定資産取得',
    '短期借入金増減',
    '長期借入',
    '長期返済',
    '配当金支払',
    '期首現金残高'
  ];

  // サンプルデータ行
  const sampleRows = [
    ['2024/01', '237000', '50000', '-100000', '-50000', '40000', '-200000', '0', '-50000', '0', '0', '-100000', '-20000', '5000000'],
    ['2024/02', '298000', '50000', '-100000', '-50000', '40000', '-100000', '0', '0', '0', '0', '-100000', '-20000', '5207000'],
    ['2024/03', '356000', '50000', '-100000', '-50000', '40000', '-100000', '0', '0', '0', '0', '-100000', '-20000', '5425000']
  ];

  const csvContent = [
    headers.join(','),
    ...sampleRows.map(row => row.join(','))
  ].join('\n');

  downloadCSV(csvContent, 'CF_template.csv');
}

/**
 * CSVを解析してオブジェクトの配列に変換
 * @param {string} csvText - CSV文字列
 * @returns {Array<Object>} パースされたデータ
 * @private
 */
function parseCSV(csvText) {
  const lines = csvText.trim().split('\n');
  if (lines.length < 2) {
    throw new Error('CSVファイルのフォーマットが不正です（データ行が存在しません）');
  }

  const headers = lines[0].split(',').map(h => h.trim());
  const data = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(v => v.trim());
    if (values.length !== headers.length) {
      throw new Error(`行${i + 1}のカラム数が不正です`);
    }

    const row = {};
    headers.forEach((header, index) => {
      row[header] = values[index];
    });
    data.push(row);
  }

  return data;
}

/**
 * 年月文字列をパース
 * @param {string} yearMonth - YYYY/MM形式の文字列
 * @returns {{year: number, month: number}} 年と月
 * @private
 */
function parseYearMonth(yearMonth) {
  const match = yearMonth.match(/^(\d{4})\/(\d{1,2})$/);
  if (!match) {
    throw new Error(`不正な年月フォーマット: ${yearMonth} (YYYY/MM形式で入力してください)`);
  }

  const year = parseInt(match[1], 10);
  const month = parseInt(match[2], 10);

  if (month < 1 || month > 12) {
    throw new Error(`不正な月: ${month} (1-12の範囲で入力してください)`);
  }

  return { year, month };
}

/**
 * CSVファイルからP/Lデータをインポート
 * @param {File} file - CSVファイル
 * @returns {Promise<Array<Object>>} インポートされた期間データ
 */
export function importPLFromCSV(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const csvText = e.target.result;
        const rows = parseCSV(csvText);

        const periods = rows.map((row, index) => {
          try {
            const { year, month } = parseYearMonth(row['年月']);

            return {
              year,
              month,
              pl: {
                revenue: parseFloat(row['売上高']) || 0,
                cogs: parseFloat(row['売上原価']) || 0,
                sgaExpenses: {
                  personnel: parseFloat(row['人件費']) || 0,
                  rent: parseFloat(row['賃料']) || 0,
                  utilities: parseFloat(row['光熱費']) || 0,
                  marketing: parseFloat(row['広告宣伝費']) || 0,
                  other: parseFloat(row['その他販管費']) || 0
                },
                nonOperating: {
                  income: parseFloat(row['営業外収益']) || 0,
                  expense: parseFloat(row['営業外費用']) || 0
                },
                tax: parseFloat(row['法人税等']) || 0
              }
            };
          } catch (error) {
            throw new Error(`行${index + 2}のデータが不正です: ${error.message}`);
          }
        });

        resolve(periods);
      } catch (error) {
        reject(new Error(`P/LのCSVインポートに失敗しました: ${error.message}`));
      }
    };

    reader.onerror = () => {
      reject(new Error('ファイルの読み込みに失敗しました'));
    };

    reader.readAsText(file, 'UTF-8');
  });
}

/**
 * CSVファイルからB/Sデータをインポート
 * @param {File} file - CSVファイル
 * @returns {Promise<Array<Object>>} インポートされた期間データ
 */
export function importBSFromCSV(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const csvText = e.target.result;
        const rows = parseCSV(csvText);

        const periods = rows.map((row, index) => {
          try {
            const { year, month } = parseYearMonth(row['年月']);

            return {
              year,
              month,
              bs: {
                assets: {
                  current: {
                    cash: parseFloat(row['現金預金']) || 0,
                    receivables: parseFloat(row['売掛金']) || 0,
                    inventory: parseFloat(row['棚卸資産']) || 0
                  },
                  fixed: {
                    tangible: parseFloat(row['有形固定資産']) || 0,
                    intangible: parseFloat(row['無形固定資産']) || 0
                  }
                },
                liabilities: {
                  current: {
                    payables: parseFloat(row['買掛金']) || 0,
                    shortTermDebt: parseFloat(row['短期借入金']) || 0
                  },
                  fixed: {
                    longTermDebt: parseFloat(row['長期借入金']) || 0
                  }
                },
                equity: {
                  capital: parseFloat(row['資本金']) || 0,
                  retainedEarnings: parseFloat(row['利益剰余金']) || 0
                }
              }
            };
          } catch (error) {
            throw new Error(`行${index + 2}のデータが不正です: ${error.message}`);
          }
        });

        resolve(periods);
      } catch (error) {
        reject(new Error(`B/SのCSVインポートに失敗しました: ${error.message}`));
      }
    };

    reader.onerror = () => {
      reject(new Error('ファイルの読み込みに失敗しました'));
    };

    reader.readAsText(file, 'UTF-8');
  });
}

/**
 * CSVファイルからC/Fデータをインポート
 * @param {File} file - CSVファイル
 * @returns {Promise<Array<Object>>} インポートされた期間データ
 */
export function importCFFromCSV(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const csvText = e.target.result;
        const rows = parseCSV(csvText);

        const periods = rows.map((row, index) => {
          try {
            const { year, month } = parseYearMonth(row['年月']);

            return {
              year,
              month,
              cf: {
                operating: {
                  profitBeforeTax: parseFloat(row['税引前利益']) || 0,
                  depreciation: parseFloat(row['減価償却費']) || 0,
                  receivablesChange: parseFloat(row['売掛金増減']) || 0,
                  inventoryChange: parseFloat(row['棚卸資産増減']) || 0,
                  payablesChange: parseFloat(row['買掛金増減']) || 0
                },
                investing: {
                  tangibleAcquisition: parseFloat(row['有形固定資産取得']) || 0,
                  tangibleDisposal: parseFloat(row['有形固定資産売却']) || 0,
                  intangibleAcquisition: parseFloat(row['無形固定資産取得']) || 0
                },
                financing: {
                  shortTermDebtChange: parseFloat(row['短期借入金増減']) || 0,
                  longTermBorrowing: parseFloat(row['長期借入']) || 0,
                  longTermRepayment: parseFloat(row['長期返済']) || 0,
                  dividendPaid: parseFloat(row['配当金支払']) || 0
                },
                beginningCash: parseFloat(row['期首現金残高']) || 0
              }
            };
          } catch (error) {
            throw new Error(`行${index + 2}のデータが不正です: ${error.message}`);
          }
        });

        resolve(periods);
      } catch (error) {
        reject(new Error(`C/FのCSVインポートに失敗しました: ${error.message}`));
      }
    };

    reader.onerror = () => {
      reject(new Error('ファイルの読み込みに失敗しました'));
    };

    reader.readAsText(file, 'UTF-8');
  });
}
