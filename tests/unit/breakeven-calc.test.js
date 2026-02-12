/**
 * 損益分岐点分析計算ロジックのユニットテスト
 * @module tests/unit/breakeven-calc.test
 */

import * as beCalc from '../../src/js/utils/breakeven-calc.js';

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
// 損益分岐点売上高のテスト
// =====================

test('calculateBreakevenRevenue - 正常計算', () => {
  // 固定費500万、変動費率40% → BEP = 500万 / 0.6 = 833.3万
  const bep = beCalc.calculateBreakevenRevenue(5000000, 0.4);
  assertApprox(bep, 8333333.33, 1);
});

test('calculateBreakevenRevenue - 変動費率0%', () => {
  // BEP = 固定費そのもの
  assertEquals(beCalc.calculateBreakevenRevenue(1000000, 0), 1000000);
});

test('calculateBreakevenRevenue - 変動費率100%', () => {
  // 限界利益率0なので計算不可
  assertNull(beCalc.calculateBreakevenRevenue(1000000, 1.0));
});

test('calculateBreakevenRevenue - 変動費率100%超', () => {
  assertNull(beCalc.calculateBreakevenRevenue(1000000, 1.1));
});

// =====================
// 限界利益率のテスト
// =====================

test('calculateContributionMarginRatio - 正常計算', () => {
  assertApprox(beCalc.calculateContributionMarginRatio(0.4), 0.6, 0.001);
  assertApprox(beCalc.calculateContributionMarginRatio(0.7), 0.3, 0.001);
});

// =====================
// 限界利益のテスト
// =====================

test('calculateContributionMargin - 正常計算', () => {
  // 売上1000万、変動費率40% → 限界利益 = 600万
  assertEquals(beCalc.calculateContributionMargin(10000000, 0.4), 6000000);
});

// =====================
// 安全余裕率のテスト
// =====================

test('calculateMarginOfSafety - 正常計算', () => {
  // 実際1000万、BEP 800万 → (1000-800)/1000 × 100 = 20%
  assertApprox(beCalc.calculateMarginOfSafety(10000000, 8000000), 20, 0.01);
});

test('calculateMarginOfSafety - BEPが売上を超過', () => {
  // 実際1000万、BEP 1200万 → マイナスの安全余裕率
  assertApprox(beCalc.calculateMarginOfSafety(10000000, 12000000), -20, 0.01);
});

test('calculateMarginOfSafety - 売上ゼロ', () => {
  assertNull(beCalc.calculateMarginOfSafety(0, 5000000));
});

// =====================
// 経営レバレッジ係数のテスト
// =====================

test('calculateDOL - 正常計算', () => {
  // DOL = 限界利益600万 / 営業利益100万 = 6.0
  assertApprox(beCalc.calculateDOL(6000000, 1000000), 6.0, 0.01);
});

test('calculateDOL - 営業利益ゼロ', () => {
  assertNull(beCalc.calculateDOL(6000000, 0));
});

// =====================
// 目標利益達成売上高のテスト
// =====================

test('calculateTargetRevenue - 正常計算', () => {
  // 固定費500万、目標利益200万、変動費率40%
  // 目標売上 = (500万 + 200万) / 0.6 = 1166.67万
  const target = beCalc.calculateTargetRevenue(5000000, 2000000, 0.4);
  assertApprox(target, 11666666.67, 1);
});

test('calculateTargetRevenue - 変動費率100%', () => {
  assertNull(beCalc.calculateTargetRevenue(5000000, 2000000, 1.0));
});

// =====================
// 費用構造推定のテスト
// =====================

test('estimateCostStructure - 正常推定', () => {
  const pl = {
    revenue: 10000000,
    cogs: 4000000,
    sgaExpenses: {
      personnel: 1000000,
      rent: 500000,
      other: 500000
    }
  };

  const result = beCalc.estimateCostStructure(pl, 0.7);

  // 変動費 = 原価 × 0.7 = 280万
  assertApprox(result.variableCosts, 2800000, 1);
  // 固定費 = 原価 × 0.3 + 販管費 = 120万 + 200万 = 320万
  assertApprox(result.fixedCosts, 3200000, 1);
  assertEquals(result.revenue, 10000000);
});

test('estimateCostStructure - 売上ゼロ', () => {
  const pl = { revenue: 0, cogs: 0, sgaExpenses: {} };
  const result = beCalc.estimateCostStructure(pl);
  assertEquals(result.variableCostRatio, 0);
});

// =====================
// 損益分岐点分析全体のテスト
// =====================

test('calculateBreakevenAnalysis - 正常分析', () => {
  const result = beCalc.calculateBreakevenAnalysis({
    revenue: 10000000,
    variableCosts: 4000000,
    fixedCosts: 3000000,
    targetProfit: 2000000
  });

  // 変動費率 = 0.4
  assertApprox(result.variableCostRatio, 0.4, 0.001);
  // 限界利益率 = 0.6
  assertApprox(result.contributionMarginRatio, 0.6, 0.001);
  // 限界利益 = 600万
  assertApprox(result.contributionMargin, 6000000, 1);
  // 営業利益 = 1000万 - 400万 - 300万 = 300万
  assertApprox(result.operatingProfit, 3000000, 1);
  // BEP = 300万 / 0.6 = 500万
  assertApprox(result.breakevenRevenue, 5000000, 1);
  // 安全余裕率 = (1000万 - 500万) / 1000万 × 100 = 50%
  assertApprox(result.marginOfSafety, 50, 0.01);
  // 目標売上 = (300万 + 200万) / 0.6 = 833.33万
  assertApprox(result.targetRevenue, 8333333.33, 1);
});

test('calculateBreakevenAnalysis - 売上ゼロ', () => {
  const result = beCalc.calculateBreakevenAnalysis({
    revenue: 0,
    variableCosts: 0,
    fixedCosts: 1000000
  });
  assertEquals(result.variableCostRatio, 0);
  assertEquals(result.breakevenRevenue, 1000000);
});

// =====================
// チャートデータ生成のテスト
// =====================

test('generateBreakevenChartData - データポイント数', () => {
  const data = beCalc.generateBreakevenChartData(1000000, 0.4, 5000000, 10);
  assertEquals(data.labels.length, 11);
  assertEquals(data.revenueData.length, 11);
  assertEquals(data.totalCostData.length, 11);
});

test('generateBreakevenChartData - 固定費は一定', () => {
  const data = beCalc.generateBreakevenChartData(1000000, 0.4, 5000000, 5);
  data.fixedCostData.forEach(fc => {
    assertEquals(fc, 1000000);
  });
});

// =====================
// フォーマット関数のテスト
// =====================

test('formatCurrency - 正常値', () => {
  const formatted = beCalc.formatCurrency(1000000);
  if (!formatted.includes('1,000,000')) {
    throw new Error(`1,000,000を含むべき: ${formatted}`);
  }
});

test('formatCurrency - null値', () => {
  assertEquals(beCalc.formatCurrency(null), '-');
});

test('formatPercent - 正常値', () => {
  assertEquals(beCalc.formatPercent(25.5), '25.5%');
});

test('formatPercent - null値', () => {
  assertEquals(beCalc.formatPercent(null), '-');
});

// =====================
// テスト実行
// =====================

export function runTests() {
  console.log('='.repeat(50));
  console.log('損益分岐点分析計算ロジック ユニットテスト');
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
  window.breakevenCalcTests = { runTests };
}
