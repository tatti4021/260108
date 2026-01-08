/**
 * 財務比率計算のユニットテスト
 * @module tests/unit/ratios.test
 */

import * as ratios from '../../src/js/utils/ratios.js';

// シンプルなテストフレームワーク
const tests = [];
const results = { passed: 0, failed: 0, total: 0 };

function test(name, fn) {
  tests.push({ name, fn });
}

function assertEquals(actual, expected, message = '') {
  if (actual !== expected) {
    throw new Error(`${message ? message + ': ' : ''}Expected ${expected}, got ${actual}`);
  }
}

function assertNull(value, message = '') {
  if (value !== null) {
    throw new Error(`${message ? message + ': ' : ''}Expected null, got ${value}`);
  }
}

function assertApproxEquals(actual, expected, tolerance = 0.01, message = '') {
  if (Math.abs(actual - expected) > tolerance) {
    throw new Error(`${message ? message + ': ' : ''}Expected ${expected}, got ${actual}`);
  }
}

// =====================
// 収益性指標のテスト
// =====================

test('calculateGrossProfitMargin - 正常計算', () => {
  assertApproxEquals(ratios.calculateGrossProfitMargin(1000000, 400000), 60);
  assertApproxEquals(ratios.calculateGrossProfitMargin(5000000, 2000000), 60);
});

test('calculateGrossProfitMargin - 0除算（売上高ゼロ）', () => {
  assertNull(ratios.calculateGrossProfitMargin(0, 0));
  assertNull(ratios.calculateGrossProfitMargin(null, 400000));
});

test('calculateOperatingProfitMargin - 正常計算', () => {
  assertApproxEquals(ratios.calculateOperatingProfitMargin(100000, 1000000), 10);
  assertApproxEquals(ratios.calculateOperatingProfitMargin(50000, 500000), 10);
});

test('calculateOperatingProfitMargin - 0除算（売上高ゼロ）', () => {
  assertNull(ratios.calculateOperatingProfitMargin(100000, 0));
  assertNull(ratios.calculateOperatingProfitMargin(100000, null));
});

test('calculateOrdinaryProfitMargin - 正常計算', () => {
  assertApproxEquals(ratios.calculateOrdinaryProfitMargin(150000, 1000000), 15);
});

test('calculateOrdinaryProfitMargin - 0除算（売上高ゼロ）', () => {
  assertNull(ratios.calculateOrdinaryProfitMargin(150000, 0));
});

test('calculateNetProfitMargin - 正常計算', () => {
  assertApproxEquals(ratios.calculateNetProfitMargin(100000, 1000000), 10);
  assertApproxEquals(ratios.calculateNetProfitMargin(-50000, 1000000), -5);
});

test('calculateNetProfitMargin - 0除算（売上高ゼロ）', () => {
  assertNull(ratios.calculateNetProfitMargin(100000, 0));
});

// =====================
// 効率性指標のテスト
// =====================

test('calculateROE - 正常計算', () => {
  assertApproxEquals(ratios.calculateROE(100000, 1000000), 10);
  assertApproxEquals(ratios.calculateROE(200000, 1000000), 20);
});

test('calculateROE - 0除算（自己資本ゼロ）', () => {
  assertNull(ratios.calculateROE(100000, 0));
  assertNull(ratios.calculateROE(100000, null));
});

test('calculateROE - 負の純利益', () => {
  assertApproxEquals(ratios.calculateROE(-100000, 1000000), -10);
});

test('calculateROA - 正常計算', () => {
  assertApproxEquals(ratios.calculateROA(50000, 1000000), 5);
  assertApproxEquals(ratios.calculateROA(100000, 2000000), 5);
});

test('calculateROA - 0除算（総資産ゼロ）', () => {
  assertNull(ratios.calculateROA(50000, 0));
  assertNull(ratios.calculateROA(50000, null));
});

test('calculateAssetTurnover - 正常計算', () => {
  assertApproxEquals(ratios.calculateAssetTurnover(2000000, 1000000), 2);
  assertApproxEquals(ratios.calculateAssetTurnover(1000000, 2000000), 0.5);
});

test('calculateAssetTurnover - 0除算（総資産ゼロ）', () => {
  assertNull(ratios.calculateAssetTurnover(2000000, 0));
  assertNull(ratios.calculateAssetTurnover(2000000, null));
});

// =====================
// 安全性指標のテスト
// =====================

test('calculateCurrentRatio - 正常計算', () => {
  assertApproxEquals(ratios.calculateCurrentRatio(2000000, 1000000), 200);
  assertApproxEquals(ratios.calculateCurrentRatio(1500000, 1000000), 150);
});

test('calculateCurrentRatio - 0除算（流動負債ゼロ）', () => {
  assertNull(ratios.calculateCurrentRatio(2000000, 0));
  assertNull(ratios.calculateCurrentRatio(2000000, null));
});

test('calculateCurrentRatio - 100%未満（支払能力不足）', () => {
  assertApproxEquals(ratios.calculateCurrentRatio(800000, 1000000), 80);
});

test('calculateQuickRatio - 正常計算', () => {
  assertApproxEquals(ratios.calculateQuickRatio(2000000, 500000, 1000000), 150);
  assertApproxEquals(ratios.calculateQuickRatio(1500000, 300000, 1000000), 120);
});

test('calculateQuickRatio - 0除算（流動負債ゼロ）', () => {
  assertNull(ratios.calculateQuickRatio(2000000, 500000, 0));
  assertNull(ratios.calculateQuickRatio(2000000, 500000, null));
});

test('calculateEquityRatio - 正常計算', () => {
  assertApproxEquals(ratios.calculateEquityRatio(1000000, 2000000), 50);
  assertApproxEquals(ratios.calculateEquityRatio(1500000, 3000000), 50);
});

test('calculateEquityRatio - 0除算（総資産ゼロ）', () => {
  assertNull(ratios.calculateEquityRatio(1000000, 0));
  assertNull(ratios.calculateEquityRatio(1000000, null));
});

test('calculateDebtRatio - 正常計算', () => {
  assertApproxEquals(ratios.calculateDebtRatio(1000000, 2000000), 50);
  assertApproxEquals(ratios.calculateDebtRatio(800000, 2000000), 40);
});

test('calculateDebtRatio - 0除算（総資産ゼロ）', () => {
  assertNull(ratios.calculateDebtRatio(1000000, 0));
  assertNull(ratios.calculateDebtRatio(1000000, null));
});

// =====================
// ユーティリティ関数のテスト
// =====================

test('getRatingLevel - 売上総利益率', () => {
  assertEquals(ratios.getRatingLevel('grossProfitMargin', 40), 'good');
  assertEquals(ratios.getRatingLevel('grossProfitMargin', 25), 'warning');
  assertEquals(ratios.getRatingLevel('grossProfitMargin', 15), 'danger');
  assertEquals(ratios.getRatingLevel('grossProfitMargin', null), 'unknown');
});

test('getRatingLevel - ROE', () => {
  assertEquals(ratios.getRatingLevel('roe', 15), 'good');
  assertEquals(ratios.getRatingLevel('roe', 7), 'warning');
  assertEquals(ratios.getRatingLevel('roe', 3), 'danger');
});

test('getRatingLevel - 流動比率', () => {
  assertEquals(ratios.getRatingLevel('currentRatio', 250), 'good');
  assertEquals(ratios.getRatingLevel('currentRatio', 150), 'warning');
  assertEquals(ratios.getRatingLevel('currentRatio', 80), 'danger');
});

test('getRatingLevel - 負債比率（逆評価）', () => {
  assertEquals(ratios.getRatingLevel('debtRatio', 0), 'good');
  assertEquals(ratios.getRatingLevel('debtRatio', 30), 'warning');
  assertEquals(ratios.getRatingLevel('debtRatio', 70), 'danger');
});

test('getRatingLevel - 不明な指標', () => {
  assertEquals(ratios.getRatingLevel('unknownRatio', 100), 'unknown');
});

test('formatRatio - 正常値', () => {
  assertEquals(ratios.formatRatio(12.345), '12.3');
  assertEquals(ratios.formatRatio(100, 0), '100');
  assertEquals(ratios.formatRatio(12.345, 2), '12.35');
});

test('formatRatio - null・undefined・NaN', () => {
  assertEquals(ratios.formatRatio(null), '-');
  assertEquals(ratios.formatRatio(undefined), '-');
  assertEquals(ratios.formatRatio(NaN), '-');
});

test('formatRatioPercent - 正常値', () => {
  assertEquals(ratios.formatRatioPercent(12.345), '12.3%');
  assertEquals(ratios.formatRatioPercent(100, 0), '100%');
  assertEquals(ratios.formatRatioPercent(12.345, 2), '12.35%');
});

test('formatRatioPercent - null・undefined・NaN', () => {
  assertEquals(ratios.formatRatioPercent(null), '-');
  assertEquals(ratios.formatRatioPercent(undefined), '-');
  assertEquals(ratios.formatRatioPercent(NaN), '-');
});

// =====================
// 総合評価のテスト
// =====================

test('generateOverallAssessment - 非常に良好', () => {
  const testRatios = {
    profitability: {
      grossProfitMargin: 40,
      operatingProfitMargin: 15
    },
    efficiency: {
      roe: 15
    },
    safety: {
      currentRatio: 250,
      equityRatio: 60
    }
  };

  const assessment = ratios.generateOverallAssessment(testRatios);
  assertEquals(assessment.includes('非常に良好'), true);
});

test('generateOverallAssessment - 懸念あり', () => {
  const testRatios = {
    profitability: {
      grossProfitMargin: 10,
      operatingProfitMargin: 2
    },
    efficiency: {
      roe: 2
    },
    safety: {
      currentRatio: 70,
      equityRatio: 20
    }
  };

  const assessment = ratios.generateOverallAssessment(testRatios);
  assertEquals(assessment.includes('懸念') || assessment.includes('注意'), true);
});

test('generateOverallAssessment - データ不足', () => {
  const testRatios = {
    profitability: {
      grossProfitMargin: null,
      operatingProfitMargin: null
    },
    efficiency: {
      roe: null
    },
    safety: {
      currentRatio: null,
      equityRatio: null
    }
  };

  const assessment = ratios.generateOverallAssessment(testRatios);
  assertEquals(assessment.includes('データが不足'), true);
});

// =====================
// エッジケースのテスト
// =====================

test('ROE - 自己資本が負（債務超過）', () => {
  // 自己資本が負の場合でも計算可能（ただし意味のある値ではない）
  const result = ratios.calculateROE(100000, -500000);
  assertApproxEquals(result, -20);
});

test('流動比率 - 非常に高い値', () => {
  // 流動資産が流動負債の10倍
  assertApproxEquals(ratios.calculateCurrentRatio(10000000, 1000000), 1000);
});

test('負債比率 - 100%超（債務超過）', () => {
  // 負債が総資産を超える場合
  assertApproxEquals(ratios.calculateDebtRatio(2500000, 2000000), 125);
});

// =====================
// テスト実行
// =====================

export function runTests() {
  console.log('='.repeat(50));
  console.log('財務比率計算 ユニットテスト');
  console.log('='.repeat(50));

  tests.forEach(({ name, fn }) => {
    results.total++;
    try {
      fn();
      results.passed++;
      console.log(`✓ ${name}`);
    } catch (e) {
      results.failed++;
      console.error(`✗ ${name}`);
      console.error(`  Error: ${e.message}`);
    }
  });

  console.log('='.repeat(50));
  console.log(`合計: ${results.total}, 成功: ${results.passed}, 失敗: ${results.failed}`);
  console.log('='.repeat(50));

  return results;
}

// ブラウザ環境での自動実行用
if (typeof window !== 'undefined') {
  window.ratiosTests = { runTests };
}
