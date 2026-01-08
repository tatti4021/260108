/**
 * JSON エクスポート/インポート機能（バックアップ/復元用）
 * @module utils/json-io
 */

import { STORAGE_VERSION } from './storage.js';

/**
 * アプリケーションバージョン
 * @constant {string}
 */
const APP_VERSION = '1.0.0';

/**
 * JSONファイルをダウンロード
 * @param {string} content - JSON文字列
 * @param {string} filename - ファイル名
 * @private
 */
function downloadJSON(content, filename) {
  const blob = new Blob([content], { type: 'application/json;charset=utf-8' });

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
 * 全データをJSONでエクスポート（バックアップ用）
 * @param {Object} data - アプリケーション状態データ
 * @param {Object} data.company - 会社情報
 * @param {Array<Object>} data.periods - 期間データ配列
 * @param {Object} data.forecast - 予測設定
 * @returns {void}
 */
export function exportToJSON(data) {
  if (!data) {
    throw new Error('エクスポートするデータが存在しません');
  }

  try {
    // メタデータを追加
    const exportData = {
      metadata: {
        appVersion: APP_VERSION,
        storageVersion: STORAGE_VERSION,
        exportDate: new Date().toISOString(),
        dataType: 'financial-model-backup'
      },
      data: {
        company: data.company || null,
        periods: data.periods || [],
        forecast: data.forecast || null,
        currentPeriodIndex: data.currentPeriodIndex || 0,
        initialized: data.initialized || false
      }
    };

    // JSON文字列に変換（インデント付き）
    const json = JSON.stringify(exportData, null, 2);

    // ダウンロード
    const timestamp = new Date().toISOString().slice(0, 10);
    downloadJSON(json, `financial_model_backup_${timestamp}.json`);
  } catch (error) {
    console.error('JSONエクスポートエラー:', error);
    throw new Error(`JSONエクスポートに失敗しました: ${error.message}`);
  }
}

/**
 * データ構造の検証
 * @param {Object} data - 検証するデータ
 * @returns {Object} 検証結果
 * @property {boolean} valid - 有効かどうか
 * @property {Array<string>} errors - エラーメッセージの配列
 * @private
 */
function validateData(data) {
  const errors = [];

  // データオブジェクトの存在確認
  if (!data.data) {
    errors.push('dataオブジェクトが存在しません');
    return { valid: false, errors };
  }

  const appData = data.data;

  // 期間データの検証
  if (!Array.isArray(appData.periods)) {
    errors.push('periodsが配列ではありません');
  } else if (appData.periods.length === 0) {
    errors.push('periodsが空です');
  } else {
    // 各期間データの構造確認
    appData.periods.forEach((period, index) => {
      if (!period.year || !period.month) {
        errors.push(`期間${index + 1}: yearまたはmonthが存在しません`);
      }
      if (!period.pl) {
        errors.push(`期間${index + 1}: plデータが存在しません`);
      }
      if (!period.bs) {
        errors.push(`期間${index + 1}: bsデータが存在しません`);
      }
      if (!period.cf) {
        errors.push(`期間${index + 1}: cfデータが存在しません`);
      }
    });
  }

  // 会社情報の確認（警告レベル）
  if (!appData.company) {
    console.warn('会社情報が存在しません（オプション）');
  }

  // 予測設定の確認（警告レベル）
  if (!appData.forecast) {
    console.warn('予測設定が存在しません（オプション）');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * バージョン互換性のチェック
 * @param {Object} metadata - メタデータ
 * @returns {Object} チェック結果
 * @property {boolean} compatible - 互換性があるかどうか
 * @property {Array<string>} warnings - 警告メッセージの配列
 * @private
 */
function checkVersionCompatibility(metadata) {
  const warnings = [];

  if (!metadata) {
    warnings.push('メタデータが存在しません');
    return { compatible: true, warnings }; // 旧形式の可能性があるため継続
  }

  // アプリバージョンのチェック
  if (metadata.appVersion !== APP_VERSION) {
    warnings.push(
      `アプリバージョンが異なります（ファイル: ${metadata.appVersion}, 現在: ${APP_VERSION}）`
    );
  }

  // ストレージバージョンのチェック
  if (metadata.storageVersion !== STORAGE_VERSION) {
    warnings.push(
      `ストレージバージョンが異なります（ファイル: ${metadata.storageVersion}, 現在: ${STORAGE_VERSION}）`
    );
  }

  // データ種別のチェック
  if (metadata.dataType !== 'financial-model-backup') {
    warnings.push(
      `データ種別が異なります: ${metadata.dataType}`
    );
  }

  return { compatible: true, warnings };
}

/**
 * JSONファイルからデータを復元
 * @param {File} file - JSONファイル
 * @returns {Promise<Object>} インポートされたデータ
 * @property {Object} data - アプリケーション状態データ
 * @property {Array<string>} warnings - 警告メッセージの配列
 */
export function importFromJSON(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        // JSONパース
        const jsonText = e.target.result;
        let importedData;

        try {
          importedData = JSON.parse(jsonText);
        } catch (parseError) {
          throw new Error(`JSONのパースに失敗しました: ${parseError.message}`);
        }

        // バージョン互換性チェック
        const versionCheck = checkVersionCompatibility(importedData.metadata);
        const warnings = [...versionCheck.warnings];

        if (!versionCheck.compatible) {
          throw new Error('バージョンに互換性がありません');
        }

        // データ検証
        const validation = validateData(importedData);

        if (!validation.valid) {
          throw new Error(
            `データ構造が不正です:\n${validation.errors.join('\n')}`
          );
        }

        // データを返す
        resolve({
          data: importedData.data,
          warnings,
          metadata: importedData.metadata || null
        });
      } catch (error) {
        reject(new Error(`JSONインポートに失敗しました: ${error.message}`));
      }
    };

    reader.onerror = () => {
      reject(new Error('ファイルの読み込みに失敗しました'));
    };

    reader.readAsText(file, 'UTF-8');
  });
}

/**
 * JSONデータの基本的な構造チェック（インポート前の簡易チェック）
 * @param {File} file - JSONファイル
 * @returns {Promise<Object>} ファイル情報
 * @property {boolean} valid - 有効なJSONファイルかどうか
 * @property {string} filename - ファイル名
 * @property {number} size - ファイルサイズ（バイト）
 * @property {string} type - ファイルタイプ
 */
export function checkJSONFile(file) {
  return new Promise((resolve, reject) => {
    if (!file) {
      reject(new Error('ファイルが選択されていません'));
      return;
    }

    if (!file.name.endsWith('.json')) {
      reject(new Error('JSONファイルを選択してください'));
      return;
    }

    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        // JSONとしてパース可能かチェック
        JSON.parse(e.target.result);

        resolve({
          valid: true,
          filename: file.name,
          size: file.size,
          type: file.type
        });
      } catch (error) {
        reject(new Error(`有効なJSONファイルではありません: ${error.message}`));
      }
    };

    reader.onerror = () => {
      reject(new Error('ファイルの読み込みに失敗しました'));
    };

    reader.readAsText(file, 'UTF-8');
  });
}

/**
 * サンプルJSONデータを生成（テスト用）
 * @returns {Object} サンプルデータ
 */
export function generateSampleJSON() {
  return {
    metadata: {
      appVersion: APP_VERSION,
      storageVersion: STORAGE_VERSION,
      exportDate: new Date().toISOString(),
      dataType: 'financial-model-backup'
    },
    data: {
      company: {
        name: 'サンプル株式会社',
        fiscalYearEnd: 3,
        founded: '2020-04-01'
      },
      periods: [
        {
          year: 2024,
          month: 1,
          pl: {
            revenue: 1000000,
            cogs: 400000,
            sgaExpenses: {
              personnel: 200000,
              rent: 50000,
              utilities: 10000,
              marketing: 30000,
              other: 20000
            },
            nonOperating: {
              income: 5000,
              expense: 3000
            },
            tax: 50000
          },
          bs: {
            assets: {
              current: {
                cash: 5000000,
                receivables: 1000000,
                inventory: 500000
              },
              fixed: {
                tangible: 2000000,
                intangible: 100000
              }
            },
            liabilities: {
              current: {
                payables: 400000,
                shortTermDebt: 1000000
              },
              fixed: {
                longTermDebt: 3000000
              }
            },
            equity: {
              capital: 10000000,
              retainedEarnings: 200000
            }
          },
          cf: {
            operating: {
              profitBeforeTax: 237000,
              depreciation: 50000,
              receivablesChange: -100000,
              inventoryChange: -50000,
              payablesChange: 40000
            },
            investing: {
              tangibleAcquisition: -200000,
              tangibleDisposal: 0,
              intangibleAcquisition: -50000
            },
            financing: {
              shortTermDebtChange: 0,
              longTermBorrowing: 0,
              longTermRepayment: -100000,
              dividendPaid: -20000
            },
            beginningCash: 5000000
          }
        }
      ],
      forecast: {
        revenueGrowthRate: 0.1,
        cogsRate: 0.4,
        taxRate: 0.3
      },
      currentPeriodIndex: 0,
      initialized: true
    }
  };
}
