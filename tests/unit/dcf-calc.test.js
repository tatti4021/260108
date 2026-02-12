/**
 * DCF計算ロジックのユニットテスト
 * @module tests/unit/dcf-calc.test
 */

import * as dcfCalc from '../../src/js/utils/dcf-calc.js';

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

function assertNull(value, message = '') {
  if (value !== null) {
    throw new Error(`${message ? message + ': ' : ''}Expected null, got ${value}`);
  }
}

// =====================
// 現在価値の計算テスト
// =====================

test('calculatePresentValue - 1年後の現在価値', () => {
  // 100万円を10%で1年割引 = 909,091
  const pv = dcfCalc.calculatePresentValue(1000000, 0.10, 1);
  assertApprox(pv, 909090.91, 1);
});

test('calculatePresentValue - 3年後の現在価値', () => {
  // 100万円を10%で3年割引 = 751,315
  const pv = dcfCalc.calculatePresentValue(1000000, 0.10, 3);
  assertApprox(pv, 751314.80, 1);
});

test('calculatePresentValue - 0年目は割引なし', () => {
  const pv = dcfCalc.calculatePresentValue(1000000, 0.10, 0);
  assertEquals(pv, 1000000);
});

test('calculatePresentValue - 負の年数は0を返す', () => {
  assertEquals(dcfCalc.calculatePresentValue(1000000, 0.10, -1), 0);
});

// =====================
// 複数年の現在価値テスト
// =====================

test('calculatePresentValues - 3年分のFCF', () => {
  const pvs = dcfCalc.calculatePresentValues([100, 200, 300], 0.10);
  assertEquals(pvs.length, 3);
  assertApprox(pvs[0], 90.91, 0.01);
  assertApprox(pvs[1], 165.29, 0.01);
  assertApprox(pvs[2], 225.39, 0.01);
});

test('calculatePresentValues - 空配列', () => {
  const pvs = dcfCalc.calculatePresentValues([], 0.10);
  assertEquals(pvs.length, 0);
});

// =====================
// ターミナルバリューのテスト
// =====================

test('calculateTerminalValue - 正常計算', () => {
  // TV = 100 × (1 + 0.02) / (0.10 - 0.02) = 1275
  const tv = dcfCalc.calculateTerminalValue(100, 0.10, 0.02);
  assertApprox(tv, 1275, 0.01);
});

test('calculateTerminalValue - 割引率=成長率の場合null', () => {
  assertNull(dcfCalc.calculateTerminalValue(100, 0.05, 0.05));
});

test('calculateTerminalValue - 割引率<成長率の場合null', () => {
  assertNull(dcfCalc.calculateTerminalValue(100, 0.03, 0.05));
});

// =====================
// 企業価値の計算テスト
// =====================

test('calculateEnterpriseValue - 正常計算', () => {
  const ev = dcfCalc.calculateEnterpriseValue([100, 200, 300], 500);
  assertEquals(ev, 1100);
});

// =====================
// 株式価値の計算テスト
// =====================

test('calculateEquityValue - 正常計算', () => {
  // 株式価値 = 1000(EV) - 300(負債) + 200(現金) = 900
  assertEquals(dcfCalc.calculateEquityValue(1000, 300, 200), 900);
});

test('calculateEquityValue - 負債なし', () => {
  assertEquals(dcfCalc.calculateEquityValue(1000, 0, 100), 1100);
});

// =====================
// WACCの計算テスト
// =====================

test('calculateWACC - 正常計算', () => {
  // E=700, D=300, Re=0.12, Rd=0.04, T=0.30
  // WACC = 700/1000 × 0.12 + 300/1000 × 0.04 × (1-0.30)
  // = 0.084 + 0.0084 = 0.0924
  const wacc = dcfCalc.calculateWACC({
    equityValue: 700,
    debtValue: 300,
    costOfEquity: 0.12,
    costOfDebt: 0.04,
    taxRate: 0.30
  });
  assertApprox(wacc, 0.0924, 0.0001);
});

test('calculateWACC - 資本がゼロの場合null', () => {
  assertNull(dcfCalc.calculateWACC({
    equityValue: 0,
    debtValue: 0,
    costOfEquity: 0.12,
    costOfDebt: 0.04,
    taxRate: 0.30
  }));
});

// =====================
// DCF全体計算のテスト
// =====================

test('calculateDCF - 正常計算', () => {
  const result = dcfCalc.calculateDCF({
    projectedFCF: [1000000, 1050000, 1102500],
    discountRate: 0.10,
    terminalGrowthRate: 0.02,
    totalDebt: 500000,
    cash: 200000
  });

  assertEquals(result.error, null);
  assertEquals(result.presentValues.length, 3);
  // 企業価値 > 0
  if (result.enterpriseValue <= 0) {
    throw new Error(`企業価値が正の値であるべき: ${result.enterpriseValue}`);
  }
  // ターミナルバリュー > 0
  if (result.terminalValue <= 0) {
    throw new Error(`ターミナルバリューが正の値であるべき: ${result.terminalValue}`);
  }
});

test('calculateDCF - FCFが空の場合', () => {
  const result = dcfCalc.calculateDCF({
    projectedFCF: [],
    discountRate: 0.10
  });

  assertEquals(result.presentValues.length, 0);
  assertEquals(result.enterpriseValue, 0);
  if (!result.error) {
    throw new Error('エラーメッセージが設定されるべき');
  }
});

test('calculateDCF - 無効な割引率・成長率', () => {
  const result = dcfCalc.calculateDCF({
    projectedFCF: [1000000],
    discountRate: 0.02,
    terminalGrowthRate: 0.05
  });

  assertNull(result.terminalValue);
  if (!result.error) {
    throw new Error('エラーメッセージが設定されるべき');
  }
});

// =====================
// フォーマット関数のテスト
// =====================

test('formatCurrency - 億円表示', () => {
  const formatted = dcfCalc.formatCurrency(150000000);
  if (!formatted.includes('億円')) {
    throw new Error(`億円を含むべき: ${formatted}`);
  }
});

test('formatCurrency - 万円表示', () => {
  const formatted = dcfCalc.formatCurrency(500000);
  if (!formatted.includes('万円')) {
    throw new Error(`万円を含むべき: ${formatted}`);
  }
});

test('formatCurrency - null値', () => {
  assertEquals(dcfCalc.formatCurrency(null), '-');
});

test('formatPercent - 正常値', () => {
  assertEquals(dcfCalc.formatPercent(0.10), '10.0%');
  assertEquals(dcfCalc.formatPercent(0.025, 2), '2.50%');
});

test('formatPercent - null値', () => {
  assertEquals(dcfCalc.formatPercent(null), '-');
});

// =====================
// テスト実行
// =====================

export function runTests() {
  console.log('='.repeat(50));
  console.log('DCF計算ロジック ユニットテスト');
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
  window.dcfCalcTests = { runTests };
}
