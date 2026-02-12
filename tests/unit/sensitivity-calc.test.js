/**
 * 感度分析計算ロジックのユニットテスト
 * @module tests/unit/sensitivity-calc.test
 */

import * as sensCalc from '../../src/js/utils/sensitivity-calc.js';

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

function assertApprox(actual, expected, tolerance = 0.01, message = '') {
  if (Math.abs(actual - expected) > tolerance) {
    throw new Error(`${message ? message + ': ' : ''}Expected ~${expected}, got ${actual} (tolerance: ${tolerance})`);
  }
}

// =====================
// 変動幅生成のテスト
// =====================

test('generateRange - 基本的な範囲生成', () => {
  const range = sensCalc.generateRange(100, 10, 2);
  assertEquals(range.length, 5);
  assertEquals(range[0], 80);
  assertEquals(range[2], 100);
  assertEquals(range[4], 120);
});

test('generateRange - count=0の場合は基準値のみ', () => {
  const range = sensCalc.generateRange(100, 10, 0);
  assertEquals(range.length, 1);
  assertEquals(range[0], 100);
});

test('generatePercentRange - パーセンテージベースの範囲', () => {
  const range = sensCalc.generatePercentRange(0.10, 1, 2);
  assertEquals(range.length, 5);
  assertApprox(range[0], 0.08, 0.001);
  assertApprox(range[2], 0.10, 0.001);
  assertApprox(range[4], 0.12, 0.001);
});

// =====================
// 感度分析テーブル生成のテスト
// =====================

test('generateSensitivityTable - 2変数マトリクス', () => {
  const result = sensCalc.generateSensitivityTable({
    calcFn: (a, b) => a + b,
    baseA: 10,
    baseB: 20,
    rangeA: [8, 10, 12],
    rangeB: [18, 20, 22]
  });

  assertEquals(result.matrix.length, 3);
  assertEquals(result.matrix[0].length, 3);
  assertEquals(result.matrix[1][1], 30); // 10+20
  assertEquals(result.baseResult, 30);
});

test('generateSensitivityTable - 計算結果の正確性', () => {
  const result = sensCalc.generateSensitivityTable({
    calcFn: (a, b) => a * b,
    baseA: 5,
    baseB: 3,
    rangeA: [4, 5, 6],
    rangeB: [2, 3, 4]
  });

  assertEquals(result.matrix[0][0], 8);   // 4*2
  assertEquals(result.matrix[1][1], 15);  // 5*3
  assertEquals(result.matrix[2][2], 24);  // 6*4
});

// =====================
// 売上高感度分析のテスト
// =====================

test('analyzeSalesImpact - 基本的な分析', () => {
  const result = sensCalc.analyzeSalesImpact({
    revenue: 10000000,
    cogs: 4000000,
    sgaTotal: 3000000,
    variableCostRatio: 0.5,
    revenueChanges: [-0.10, 0, 0.10]
  });

  assertEquals(result.baseRevenue, 10000000);
  assertEquals(result.results.length, 3);
  // 基準時の変動率は0
  assertApprox(result.results[1].revenueChange, 0, 0.01);
});

test('analyzeSalesImpact - 売上増加で利益増加', () => {
  const result = sensCalc.analyzeSalesImpact({
    revenue: 10000000,
    cogs: 4000000,
    sgaTotal: 3000000,
    variableCostRatio: 0.5,
    revenueChanges: [0, 0.10]
  });

  const baseProfit = result.results[0].operatingProfit;
  const upProfit = result.results[1].operatingProfit;
  if (upProfit <= baseProfit) {
    throw new Error(`売上10%増で利益が増加するべき: 基準=${baseProfit}, +10%=${upProfit}`);
  }
});

// =====================
// 単一変数感度分析のテスト
// =====================

test('analyzeSingleVariable - 基本分析', () => {
  const result = sensCalc.analyzeSingleVariable({
    variableName: 'テスト変数',
    baseValue: 1000,
    changes: [-0.10, 0, 0.10],
    calcFn: (val) => val * 2
  });

  assertEquals(result.variableName, 'テスト変数');
  assertEquals(result.baseValue, 1000);
  assertEquals(result.baseResult, 2000);
  assertEquals(result.results.length, 3);
  // -10%時: 値=900, 結果=1800
  assertApprox(result.results[0].value, 900, 0.01);
  assertApprox(result.results[0].result, 1800, 0.01);
});

test('analyzeSingleVariable - 変動率の正確性', () => {
  const result = sensCalc.analyzeSingleVariable({
    variableName: '変数A',
    baseValue: 100,
    changes: [-0.20, 0, 0.20],
    calcFn: (val) => val
  });

  assertApprox(result.results[0].change, -20, 0.01);
  assertApprox(result.results[1].change, 0, 0.01);
  assertApprox(result.results[2].change, 20, 0.01);
});

// =====================
// トルネードチャートデータのテスト
// =====================

test('generateTornadoData - 影響度降順ソート', () => {
  const analyses = [
    sensCalc.analyzeSingleVariable({
      variableName: '影響小',
      baseValue: 100,
      changes: [-0.10, 0, 0.10],
      calcFn: (val) => val * 1
    }),
    sensCalc.analyzeSingleVariable({
      variableName: '影響大',
      baseValue: 100,
      changes: [-0.10, 0, 0.10],
      calcFn: (val) => val * 10
    })
  ];

  const tornado = sensCalc.generateTornadoData(analyses, 10);
  assertEquals(tornado.length, 2);
  assertEquals(tornado[0].variableName, '影響大');
  assertEquals(tornado[1].variableName, '影響小');
});

test('generateTornadoData - spreadの計算', () => {
  const analyses = [
    sensCalc.analyzeSingleVariable({
      variableName: 'テスト',
      baseValue: 100,
      changes: [-0.10, 0, 0.10],
      calcFn: (val) => val * 2
    })
  ];

  const tornado = sensCalc.generateTornadoData(analyses, 10);
  // +10%: 220, -10%: 180, spread: 40
  assertApprox(tornado[0].spread, 40, 0.01);
});

// =====================
// フォーマット関数のテスト
// =====================

test('formatValue - 正常値', () => {
  const formatted = sensCalc.formatValue(1234567);
  if (!formatted.includes('1,234,567')) {
    throw new Error(`1,234,567を含むべき: ${formatted}`);
  }
});

test('formatValue - null値', () => {
  assertEquals(sensCalc.formatValue(null), '-');
});

test('formatPercent - 正のパーセンテージ', () => {
  assertEquals(sensCalc.formatPercent(10.5), '+10.5%');
});

test('formatPercent - 負のパーセンテージ', () => {
  assertEquals(sensCalc.formatPercent(-5.0), '-5.0%');
});

test('formatPercent - null値', () => {
  assertEquals(sensCalc.formatPercent(null), '-');
});

// =====================
// テスト実行
// =====================

export function runTests() {
  console.log('='.repeat(50));
  console.log('感度分析計算ロジック ユニットテスト');
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

if (typeof window !== 'undefined') {
  window.sensitivityCalcTests = { runTests };
}
