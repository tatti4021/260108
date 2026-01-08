/**
 * P/L計算ロジックのユニットテスト
 * @module tests/unit/pl-calc.test
 */

import * as plCalc from '../../src/js/utils/pl-calc.js';

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

function assertDeepEquals(actual, expected, message = '') {
  const actualStr = JSON.stringify(actual);
  const expectedStr = JSON.stringify(expected);
  if (actualStr !== expectedStr) {
    throw new Error(`${message ? message + ': ' : ''}Expected ${expectedStr}, got ${actualStr}`);
  }
}

function assertNull(value, message = '') {
  if (value !== null) {
    throw new Error(`${message ? message + ': ' : ''}Expected null, got ${value}`);
  }
}

// =====================
// 売上総利益の計算テスト
// =====================

test('calculateGrossProfit - 正常計算', () => {
  assertEquals(plCalc.calculateGrossProfit(1000000, 400000), 600000);
  assertEquals(plCalc.calculateGrossProfit(5000000, 2000000), 3000000);
});

test('calculateGrossProfit - ゼロ値', () => {
  assertEquals(plCalc.calculateGrossProfit(0, 0), 0);
  assertEquals(plCalc.calculateGrossProfit(1000000, 0), 1000000);
});

test('calculateGrossProfit - 負の値', () => {
  assertEquals(plCalc.calculateGrossProfit(1000000, 1200000), -200000);
});

// =====================
// 販管費合計の計算テスト
// =====================

test('calculateSGATotal - 全項目あり', () => {
  const sgaExpenses = {
    personnel: 100000,
    rent: 50000,
    utilities: 10000,
    marketing: 30000,
    other: 20000
  };
  assertEquals(plCalc.calculateSGATotal(sgaExpenses), 210000);
});

test('calculateSGATotal - 一部項目なし', () => {
  const sgaExpenses = {
    personnel: 100000,
    rent: 50000
  };
  assertEquals(plCalc.calculateSGATotal(sgaExpenses), 150000);
});

test('calculateSGATotal - 空オブジェクト', () => {
  assertEquals(plCalc.calculateSGATotal({}), 0);
});

// =====================
// 営業利益の計算テスト
// =====================

test('calculateOperatingProfit - 正常計算', () => {
  const sgaExpenses = {
    personnel: 100000,
    rent: 50000,
    utilities: 10000,
    marketing: 30000,
    other: 20000
  };
  assertEquals(plCalc.calculateOperatingProfit(1000000, 400000, sgaExpenses), 390000);
});

test('calculateOperatingProfit - 営業赤字', () => {
  const sgaExpenses = {
    personnel: 500000,
    rent: 200000
  };
  assertEquals(plCalc.calculateOperatingProfit(1000000, 400000, sgaExpenses), -100000);
});

// =====================
// 経常利益の計算テスト
// =====================

test('calculateOrdinaryProfit - 営業外収益あり', () => {
  assertEquals(plCalc.calculateOrdinaryProfit(100000, 20000, 5000), 115000);
});

test('calculateOrdinaryProfit - 営業外費用あり', () => {
  assertEquals(plCalc.calculateOrdinaryProfit(100000, 0, 10000), 90000);
});

test('calculateOrdinaryProfit - 営業外収支なし', () => {
  assertEquals(plCalc.calculateOrdinaryProfit(100000, 0, 0), 100000);
});

// =====================
// 当期純利益の計算テスト
// =====================

test('calculateNetProfit - 正常計算', () => {
  assertEquals(plCalc.calculateNetProfit(100000, 30000), 70000);
});

test('calculateNetProfit - 税金ゼロ', () => {
  assertEquals(plCalc.calculateNetProfit(100000, 0), 100000);
});

test('calculateNetProfit - 赤字', () => {
  assertEquals(plCalc.calculateNetProfit(-50000, 0), -50000);
});

// =====================
// 利益率の計算テスト
// =====================

test('calculateProfitMargins - 正常計算', () => {
  const pl = {
    revenue: 1000000,
    cogs: 400000,
    sgaExpenses: {
      personnel: 100000,
      rent: 50000,
      utilities: 10000,
      marketing: 30000,
      other: 20000
    },
    nonOperating: {
      income: 20000,
      expense: 5000
    },
    tax: 50000
  };

  const margins = plCalc.calculateProfitMargins(pl);

  assertEquals(margins.grossProfitMargin, 60); // (1000000-400000)/1000000*100
  assertEquals(margins.operatingProfitMargin, 39); // (600000-210000)/1000000*100
  assertEquals(margins.ordinaryProfitMargin, 40.5); // (390000+20000-5000)/1000000*100
  assertEquals(margins.netProfitMargin, 35.5); // (405000-50000)/1000000*100
});

test('calculateProfitMargins - 売上高ゼロ', () => {
  const pl = {
    revenue: 0,
    cogs: 0,
    sgaExpenses: {},
    nonOperating: { income: 0, expense: 0 },
    tax: 0
  };

  const margins = plCalc.calculateProfitMargins(pl);

  assertEquals(margins.grossProfitMargin, 0);
  assertEquals(margins.operatingProfitMargin, 0);
  assertEquals(margins.ordinaryProfitMargin, 0);
  assertEquals(margins.netProfitMargin, 0);
});

// =====================
// P/L全計算結果のテスト
// =====================

test('calculatePLResults - 完全なP/Lデータ', () => {
  const pl = {
    revenue: 1000000,
    cogs: 400000,
    sgaExpenses: {
      personnel: 100000,
      rent: 50000,
      utilities: 10000,
      marketing: 30000,
      other: 20000
    },
    nonOperating: {
      income: 20000,
      expense: 5000
    },
    tax: 50000
  };

  const results = plCalc.calculatePLResults(pl);

  assertEquals(results.grossProfit, 600000);
  assertEquals(results.sgaTotal, 210000);
  assertEquals(results.operatingProfit, 390000);
  assertEquals(results.ordinaryProfit, 405000);
  assertEquals(results.netProfit, 355000);
});

// =====================
// フォーマット関数のテスト
// =====================

test('formatCurrency - 正の値', () => {
  assertEquals(plCalc.formatCurrency(1000000), '¥1,000,000');
  assertEquals(plCalc.formatCurrency(123456), '¥123,456');
});

test('formatCurrency - ゼロ・null・undefined', () => {
  assertEquals(plCalc.formatCurrency(0), '¥0');
  assertEquals(plCalc.formatCurrency(null), '¥0');
  assertEquals(plCalc.formatCurrency(undefined), '¥0');
  assertEquals(plCalc.formatCurrency(NaN), '¥0');
});

test('formatCurrency - 負の値', () => {
  assertEquals(plCalc.formatCurrency(-50000), '¥-50,000');
});

test('formatPercent - 正常値', () => {
  assertEquals(plCalc.formatPercent(35.5), '35.5%');
  assertEquals(plCalc.formatPercent(100), '100.0%');
  assertEquals(plCalc.formatPercent(0.123, 2), '0.12%');
});

test('formatPercent - null・undefined', () => {
  assertEquals(plCalc.formatPercent(null), '0.0%');
  assertEquals(plCalc.formatPercent(undefined), '0.0%');
  assertEquals(plCalc.formatPercent(NaN), '0.0%');
});

// =====================
// テスト実行
// =====================

export function runTests() {
  console.log('='.repeat(50));
  console.log('P/L計算ロジック ユニットテスト');
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
  window.plCalcTests = { runTests };
}
