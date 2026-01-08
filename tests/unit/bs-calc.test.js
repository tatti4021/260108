/**
 * B/S計算ロジックのユニットテスト
 * @module tests/unit/bs-calc.test
 */

import * as bsCalc from '../../src/js/utils/bs-calc.js';

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

function assertApproxEquals(actual, expected, tolerance = 0.01, message = '') {
  if (Math.abs(actual - expected) > tolerance) {
    throw new Error(`${message ? message + ': ' : ''}Expected ${expected}, got ${actual}`);
  }
}

function assertTrue(value, message = '') {
  if (!value) {
    throw new Error(`${message ? message + ': ' : ''}Expected true, got ${value}`);
  }
}

function assertFalse(value, message = '') {
  if (value) {
    throw new Error(`${message ? message + ': ' : ''}Expected false, got ${value}`);
  }
}

// =====================
// 流動資産合計の計算テスト
// =====================

test('calculateCurrentAssets - 正常計算', () => {
  const assets = {
    current: {
      cash: 1000000,
      receivables: 500000,
      inventory: 300000
    }
  };
  assertEquals(bsCalc.calculateCurrentAssets(assets), 1800000);
});

test('calculateCurrentAssets - 一部項目なし', () => {
  const assets = {
    current: {
      cash: 1000000,
      receivables: 500000
    }
  };
  assertEquals(bsCalc.calculateCurrentAssets(assets), 1500000);
});

test('calculateCurrentAssets - null/undefined', () => {
  assertEquals(bsCalc.calculateCurrentAssets(null), 0);
  assertEquals(bsCalc.calculateCurrentAssets({}), 0);
});

// =====================
// 固定資産合計の計算テスト
// =====================

test('calculateFixedAssets - 正常計算', () => {
  const assets = {
    fixed: {
      tangible: 2000000,
      intangible: 500000
    }
  };
  assertEquals(bsCalc.calculateFixedAssets(assets), 2500000);
});

test('calculateFixedAssets - 一部項目なし', () => {
  const assets = {
    fixed: {
      tangible: 2000000
    }
  };
  assertEquals(bsCalc.calculateFixedAssets(assets), 2000000);
});

test('calculateFixedAssets - null/undefined', () => {
  assertEquals(bsCalc.calculateFixedAssets(null), 0);
  assertEquals(bsCalc.calculateFixedAssets({}), 0);
});

// =====================
// 資産合計の計算テスト
// =====================

test('calculateTotalAssets - 正常計算', () => {
  const assets = {
    current: {
      cash: 1000000,
      receivables: 500000,
      inventory: 300000
    },
    fixed: {
      tangible: 2000000,
      intangible: 500000
    }
  };
  assertEquals(bsCalc.calculateTotalAssets(assets), 4300000);
});

test('calculateTotalAssets - 流動資産のみ', () => {
  const assets = {
    current: {
      cash: 1000000,
      receivables: 500000,
      inventory: 300000
    },
    fixed: {}
  };
  assertEquals(bsCalc.calculateTotalAssets(assets), 1800000);
});

test('calculateTotalAssets - 固定資産のみ', () => {
  const assets = {
    current: {},
    fixed: {
      tangible: 2000000,
      intangible: 500000
    }
  };
  assertEquals(bsCalc.calculateTotalAssets(assets), 2500000);
});

// =====================
// 流動負債合計の計算テスト
// =====================

test('calculateCurrentLiabilities - 正常計算', () => {
  const liabilities = {
    current: {
      payables: 300000,
      shortTermDebt: 200000
    }
  };
  assertEquals(bsCalc.calculateCurrentLiabilities(liabilities), 500000);
});

test('calculateCurrentLiabilities - 一部項目なし', () => {
  const liabilities = {
    current: {
      payables: 300000
    }
  };
  assertEquals(bsCalc.calculateCurrentLiabilities(liabilities), 300000);
});

test('calculateCurrentLiabilities - null/undefined', () => {
  assertEquals(bsCalc.calculateCurrentLiabilities(null), 0);
  assertEquals(bsCalc.calculateCurrentLiabilities({}), 0);
});

// =====================
// 固定負債合計の計算テスト
// =====================

test('calculateFixedLiabilities - 正常計算', () => {
  const liabilities = {
    fixed: {
      longTermDebt: 1000000
    }
  };
  assertEquals(bsCalc.calculateFixedLiabilities(liabilities), 1000000);
});

test('calculateFixedLiabilities - null/undefined', () => {
  assertEquals(bsCalc.calculateFixedLiabilities(null), 0);
  assertEquals(bsCalc.calculateFixedLiabilities({}), 0);
});

// =====================
// 負債合計の計算テスト
// =====================

test('calculateTotalLiabilities - 正常計算', () => {
  const liabilities = {
    current: {
      payables: 300000,
      shortTermDebt: 200000
    },
    fixed: {
      longTermDebt: 1000000
    }
  };
  assertEquals(bsCalc.calculateTotalLiabilities(liabilities), 1500000);
});

// =====================
// 純資産合計の計算テスト
// =====================

test('calculateTotalEquity - 正常計算', () => {
  const equity = {
    capital: 1000000,
    retainedEarnings: 800000
  };
  assertEquals(bsCalc.calculateTotalEquity(equity), 1800000);
});

test('calculateTotalEquity - 資本金のみ', () => {
  const equity = {
    capital: 1000000
  };
  assertEquals(bsCalc.calculateTotalEquity(equity), 1000000);
});

test('calculateTotalEquity - 利益剰余金が負', () => {
  const equity = {
    capital: 1000000,
    retainedEarnings: -200000
  };
  assertEquals(bsCalc.calculateTotalEquity(equity), 800000);
});

test('calculateTotalEquity - null/undefined', () => {
  assertEquals(bsCalc.calculateTotalEquity(null), 0);
  assertEquals(bsCalc.calculateTotalEquity({}), 0);
});

// =====================
// バランスチェックのテスト
// =====================

test('checkBalance - バランスが取れている', () => {
  const assets = {
    current: {
      cash: 1000000,
      receivables: 500000,
      inventory: 300000
    },
    fixed: {
      tangible: 2000000,
      intangible: 500000
    }
  };

  const liabilities = {
    current: {
      payables: 300000,
      shortTermDebt: 200000
    },
    fixed: {
      longTermDebt: 1000000
    }
  };

  const equity = {
    capital: 1000000,
    retainedEarnings: 1800000
  };

  const result = bsCalc.checkBalance(assets, liabilities, equity);

  assertTrue(result.balanced);
  assertEquals(result.difference, 0);
  assertEquals(result.totalAssets, 4300000);
  assertEquals(result.totalLiabilities, 1500000);
  assertEquals(result.totalEquity, 2800000);
});

test('checkBalance - バランスが取れていない', () => {
  const assets = {
    current: { cash: 1000000, receivables: 500000, inventory: 300000 },
    fixed: { tangible: 2000000, intangible: 500000 }
  };

  const liabilities = {
    current: { payables: 300000, shortTermDebt: 200000 },
    fixed: { longTermDebt: 1000000 }
  };

  const equity = {
    capital: 1000000,
    retainedEarnings: 2000000  // 多すぎる
  };

  const result = bsCalc.checkBalance(assets, liabilities, equity);

  assertFalse(result.balanced);
  assertEquals(result.difference, -200000);  // 資産が200000不足
  assertEquals(result.totalAssets, 4300000);
  assertEquals(result.totalLiabilities, 1500000);
  assertEquals(result.totalEquity, 3000000);
});

test('checkBalance - 誤差許容範囲内', () => {
  const assets = {
    current: { cash: 1000000.005, receivables: 500000, inventory: 300000 },
    fixed: { tangible: 2000000, intangible: 500000 }
  };

  const liabilities = {
    current: { payables: 300000, shortTermDebt: 200000 },
    fixed: { longTermDebt: 1000000 }
  };

  const equity = {
    capital: 1000000,
    retainedEarnings: 1800000
  };

  const result = bsCalc.checkBalance(assets, liabilities, equity);

  assertTrue(result.balanced);  // 誤差0.005は許容範囲内
  assertApproxEquals(result.difference, 0.005, 0.01);
});

// =====================
// フォーマット関数のテスト
// =====================

test('formatCurrency - 通貨記号あり', () => {
  assertEquals(bsCalc.formatCurrency(1000000, true), '¥1,000,000');
  assertEquals(bsCalc.formatCurrency(0, true), '¥0');
});

test('formatCurrency - 通貨記号なし', () => {
  assertEquals(bsCalc.formatCurrency(1000000, false), '1,000,000');
  assertEquals(bsCalc.formatCurrency(0, false), '0');
});

test('formatCurrency - null・undefined', () => {
  assertEquals(bsCalc.formatCurrency(null, true), '¥0');
  assertEquals(bsCalc.formatCurrency(undefined, false), '0');
  assertEquals(bsCalc.formatCurrency(NaN, true), '¥0');
});

// =====================
// parseNumber関数のテスト
// =====================

test('parseNumber - 数値文字列', () => {
  assertEquals(bsCalc.parseNumber('1000000'), 1000000);
  assertEquals(bsCalc.parseNumber('123.45'), 123.45);
});

test('parseNumber - 数値', () => {
  assertEquals(bsCalc.parseNumber(1000000), 1000000);
  assertEquals(bsCalc.parseNumber(0), 0);
});

test('parseNumber - null・undefined・空文字', () => {
  assertEquals(bsCalc.parseNumber(null), 0);
  assertEquals(bsCalc.parseNumber(undefined), 0);
  assertEquals(bsCalc.parseNumber(''), 0);
});

test('parseNumber - 不正な値', () => {
  assertEquals(bsCalc.parseNumber('abc'), 0);
  assertEquals(bsCalc.parseNumber('12abc'), 0);
});

// =====================
// テスト実行
// =====================

export function runTests() {
  console.log('='.repeat(50));
  console.log('B/S計算ロジック ユニットテスト');
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
  window.bsCalcTests = { runTests };
}
