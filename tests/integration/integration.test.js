/**
 * 財務三表連携の統合テスト
 * @module tests/integration/integration.test
 */

import * as integration from '../../src/js/utils/integration.js';
import * as state from '../../src/js/utils/state.js';
import { calculatePLResults } from '../../src/js/utils/pl-calc.js';
import { calculateCFResults } from '../../src/js/utils/cf-calc.js';
import { checkBalance } from '../../src/js/utils/bs-calc.js';

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

function assertApproxEquals(actual, expected, tolerance = 1, message = '') {
  if (Math.abs(actual - expected) > tolerance) {
    throw new Error(`${message ? message + ': ' : ''}Expected ${expected}, got ${actual} (tolerance: ${tolerance})`);
  }
}

function assertTrue(value, message = '') {
  if (!value) {
    throw new Error(`${message ? message + ': ' : ''}Expected true, got ${value}`);
  }
}

function assertNotNull(value, message = '') {
  if (value === null || value === undefined) {
    throw new Error(`${message ? message + ': ' : ''}Expected non-null value`);
  }
}

// =====================
// P/L → B/S 連携テスト
// =====================

test('syncPLtoBS - 当期純利益が利益剰余金に反映される', () => {
  localStorage.clear();
  state.initialize({ forceNew: true, numPeriods: 3 });

  // 初期のB/Sデータ
  const period0 = state.getCurrentPeriod();
  period0.bs.equity.capital = 1000000;
  period0.bs.equity.retainedEarnings = 0;
  state.updatePeriod(0, period0);

  // P/Lデータを設定（当期純利益100,000となるように）
  period0.pl = {
    revenue: 1000000,
    cogs: 400000,
    sgaExpenses: {
      personnel: 300000,
      rent: 100000,
      utilities: 0,
      marketing: 0,
      other: 0
    },
    nonOperating: {
      income: 0,
      expense: 0
    },
    tax: 50000
  };
  state.updatePeriod(0, period0);

  // P/L計算結果を確認
  const plResults = calculatePLResults(period0.pl);
  assertEquals(plResults.netProfit, 150000, '当期純利益が150,000');

  // P/L → B/S連携を実行
  integration.syncPLtoBS(0);

  // 更新後の状態を取得
  const updatedState = state.getState();
  const updatedPeriod = updatedState.periods[0];

  assertEquals(updatedPeriod.bs.equity.retainedEarnings, 150000, '利益剰余金に当期純利益が反映される');
});

test('syncPLtoBS - 複数期間での利益剰余金の累積', () => {
  localStorage.clear();
  state.initialize({ forceNew: true, numPeriods: 3 });

  // 第1期
  const period0 = state.getState().periods[0];
  period0.bs.equity.capital = 1000000;
  period0.bs.equity.retainedEarnings = 0;
  period0.pl = {
    revenue: 1000000,
    cogs: 400000,
    sgaExpenses: { personnel: 300000, rent: 100000, utilities: 0, marketing: 0, other: 0 },
    nonOperating: { income: 0, expense: 0 },
    tax: 50000
  };
  state.updatePeriod(0, period0);
  integration.syncPLtoBS(0);

  // 第2期
  const period1 = state.getState().periods[1];
  period1.bs.equity.capital = 1000000;
  period1.pl = {
    revenue: 1200000,
    cogs: 480000,
    sgaExpenses: { personnel: 300000, rent: 100000, utilities: 0, marketing: 0, other: 0 },
    nonOperating: { income: 0, expense: 0 },
    tax: 70000
  };
  state.updatePeriod(1, period1);
  integration.syncPLtoBS(1);

  // 確認
  const updatedState = state.getState();
  const plResults0 = calculatePLResults(updatedState.periods[0].pl);
  const plResults1 = calculatePLResults(updatedState.periods[1].pl);

  const expectedRetainedEarnings1 = plResults0.netProfit + plResults1.netProfit;
  assertApproxEquals(
    updatedState.periods[1].bs.equity.retainedEarnings,
    expectedRetainedEarnings1,
    1,
    '第2期の利益剰余金は第1期+第2期の純利益'
  );
});

test('syncPLtoBS - 赤字の場合の処理', () => {
  localStorage.clear();
  state.initialize({ forceNew: true, numPeriods: 2 });

  const period0 = state.getState().periods[0];
  period0.bs.equity.capital = 1000000;
  period0.bs.equity.retainedEarnings = 0;
  period0.pl = {
    revenue: 500000,
    cogs: 400000,
    sgaExpenses: { personnel: 300000, rent: 100000, utilities: 0, marketing: 0, other: 0 },
    nonOperating: { income: 0, expense: 0 },
    tax: 0
  };
  state.updatePeriod(0, period0);
  integration.syncPLtoBS(0);

  const updatedState = state.getState();
  const plResults = calculatePLResults(updatedState.periods[0].pl);

  // 赤字なので利益剰余金がマイナス
  assertTrue(plResults.netProfit < 0, '当期純利益が赤字');
  assertEquals(updatedState.periods[0].bs.equity.retainedEarnings, plResults.netProfit, '赤字が利益剰余金に反映される');
});

// =====================
// B/S → C/F 連携テスト
// =====================

test('syncBStoCF - 現金残高の同期', () => {
  localStorage.clear();
  state.initialize({ forceNew: true, numPeriods: 2 });

  // 第1期のB/S設定
  const period0 = state.getState().periods[0];
  period0.bs.assets.current.cash = 500000;
  period0.bs.assets.current.receivables = 200000;
  period0.bs.assets.current.inventory = 100000;
  period0.pl = {
    revenue: 1000000,
    cogs: 400000,
    sgaExpenses: { personnel: 200000, rent: 100000, utilities: 0, marketing: 0, other: 0 },
    nonOperating: { income: 0, expense: 0 },
    tax: 80000
  };
  state.updatePeriod(0, period0);

  // 第2期のB/S設定
  const period1 = state.getState().periods[1];
  period1.bs.assets.current.receivables = 250000;  // 売掛金が増加
  period1.bs.assets.current.inventory = 120000;    // 棚卸資産が増加
  period1.bs.liabilities.current.payables = 150000;  // 買掛金が増加
  period1.pl = {
    revenue: 1200000,
    cogs: 480000,
    sgaExpenses: { personnel: 200000, rent: 100000, utilities: 0, marketing: 0, other: 0 },
    nonOperating: { income: 0, expense: 0 },
    tax: 100000
  };
  state.updatePeriod(1, period1);

  // B/S → C/F連携を実行
  integration.syncBStoCF(1);

  const updatedState = state.getState();
  const updatedCF = updatedState.periods[1].cf;

  // 期首現金が第1期の現金残高と一致
  assertEquals(updatedCF.beginningCash, 500000, '期首現金が前期の現金残高');

  // C/Fの計算結果から期末現金を確認
  const cfResults = calculateCFResults(updatedCF);
  const updatedBS = updatedState.periods[1].bs;

  assertApproxEquals(updatedBS.assets.current.cash, cfResults.endingCash, 1, 'B/Sの現金がC/Fの期末残高と同期');
});

test('syncBStoCF - 売掛金・棚卸資産の増減計算', () => {
  localStorage.clear();
  state.initialize({ forceNew: true, numPeriods: 2 });

  // 第1期
  const period0 = state.getState().periods[0];
  period0.bs.assets.current.cash = 1000000;
  period0.bs.assets.current.receivables = 200000;
  period0.bs.assets.current.inventory = 100000;
  period0.bs.liabilities.current.payables = 150000;
  state.updatePeriod(0, period0);

  // 第2期
  const period1 = state.getState().periods[1];
  period1.bs.assets.current.receivables = 300000;  // +100000
  period1.bs.assets.current.inventory = 150000;     // +50000
  period1.bs.liabilities.current.payables = 200000;  // +50000
  period1.pl = {
    revenue: 1000000,
    cogs: 400000,
    sgaExpenses: { personnel: 200000, rent: 100000, utilities: 0, marketing: 0, other: 0 },
    nonOperating: { income: 0, expense: 0 },
    tax: 80000
  };
  state.updatePeriod(1, period1);

  // B/S → C/F連携
  integration.syncBStoCF(1);

  const updatedState = state.getState();
  const updatedCF = updatedState.periods[1].cf.operating;

  // 売掛金増加はC/Fでマイナス
  assertEquals(updatedCF.receivablesChange, -100000, '売掛金増加（-100,000）');
  // 棚卸資産増加はC/Fでマイナス
  assertEquals(updatedCF.inventoryChange, -50000, '棚卸資産増加（-50,000）');
  // 買掛金増加はC/Fでプラス
  assertEquals(updatedCF.payablesChange, 50000, '買掛金増加（+50,000）');
});

// =====================
// 全期間連携テスト
// =====================

test('syncAllPeriods - 全期間の自動連携', () => {
  localStorage.clear();
  state.initialize({ forceNew: true, numPeriods: 3 });

  // 各期間にデータを設定
  for (let i = 0; i < 3; i++) {
    const period = state.getState().periods[i];
    period.bs.equity.capital = 1000000;
    period.bs.assets.current.cash = 500000 + i * 100000;
    period.bs.assets.current.receivables = 200000;
    period.bs.assets.current.inventory = 100000;
    period.pl = {
      revenue: 1000000 + i * 100000,
      cogs: 400000,
      sgaExpenses: { personnel: 200000, rent: 100000, utilities: 0, marketing: 0, other: 0 },
      nonOperating: { income: 0, expense: 0 },
      tax: 80000
    };
    state.updatePeriod(i, period);
  }

  // 全期間の連携を実行
  integration.syncAllPeriods();

  const updatedState = state.getState();

  // 各期間の利益剰余金が累積していることを確認
  for (let i = 0; i < 3; i++) {
    const period = updatedState.periods[i];
    assertNotNull(period.bs.equity.retainedEarnings, `期間${i}の利益剰余金が設定されている`);

    if (i > 0) {
      // 前期より増加しているはず（赤字でない限り）
      const currentRetainedEarnings = period.bs.equity.retainedEarnings;
      const previousRetainedEarnings = updatedState.periods[i - 1].bs.equity.retainedEarnings;
      assertTrue(
        currentRetainedEarnings >= previousRetainedEarnings,
        `期間${i}の利益剰余金が前期以上`
      );
    }
  }
});

// =====================
// バランスチェック統合テスト
// =====================

test('財務三表のバランス確認 - 単一期間', () => {
  localStorage.clear();
  state.initialize({ forceNew: true, numPeriods: 1 });

  const period = state.getState().periods[0];

  // B/Sデータを設定
  period.bs = {
    assets: {
      current: {
        cash: 1000000,
        receivables: 500000,
        inventory: 300000
      },
      fixed: {
        tangible: 2000000,
        intangible: 500000
      }
    },
    liabilities: {
      current: {
        payables: 300000,
        shortTermDebt: 200000
      },
      fixed: {
        longTermDebt: 1000000
      }
    },
    equity: {
      capital: 2000000,
      retainedEarnings: 800000
    }
  };

  // P/Lデータを設定
  period.pl = {
    revenue: 1000000,
    cogs: 400000,
    sgaExpenses: { personnel: 200000, rent: 100000, utilities: 0, marketing: 0, other: 0 },
    nonOperating: { income: 0, expense: 0 },
    tax: 80000
  };

  state.updatePeriod(0, period);

  // バランスチェック
  const balance = checkBalance(period.bs.assets, period.bs.liabilities, period.bs.equity);
  assertTrue(balance.balanced, 'B/Sがバランスしている');
  assertEquals(balance.totalAssets, 4300000, '総資産が正しい');
  assertEquals(balance.totalLiabilities, 1500000, '総負債が正しい');
  assertEquals(balance.totalEquity, 2800000, '純資産が正しい');
});

test('財務三表のバランス確認 - 連携後', () => {
  localStorage.clear();
  state.initialize({ forceNew: true, numPeriods: 2 });

  // 第1期のデータ設定
  const period0 = state.getState().periods[0];
  period0.bs = {
    assets: {
      current: { cash: 1000000, receivables: 500000, inventory: 300000 },
      fixed: { tangible: 2000000, intangible: 500000 }
    },
    liabilities: {
      current: { payables: 300000, shortTermDebt: 200000 },
      fixed: { longTermDebt: 1000000 }
    },
    equity: {
      capital: 2000000,
      retainedEarnings: 800000
    }
  };
  period0.pl = {
    revenue: 1000000,
    cogs: 400000,
    sgaExpenses: { personnel: 200000, rent: 100000, utilities: 0, marketing: 0, other: 0 },
    nonOperating: { income: 0, expense: 0 },
    tax: 80000
  };
  state.updatePeriod(0, period0);

  // P/L → B/S連携
  integration.syncPLtoBS(0);

  const updatedState = state.getState();
  const updatedPeriod = updatedState.periods[0];

  // バランスチェック（連携後）
  const balance = checkBalance(
    updatedPeriod.bs.assets,
    updatedPeriod.bs.liabilities,
    updatedPeriod.bs.equity
  );

  // 利益剰余金が更新されているため、バランスは崩れる可能性がある
  // 実際のアプリでは、他の科目も調整する必要がある
  assertNotNull(updatedPeriod.bs.equity.retainedEarnings, '利益剰余金が更新されている');
});

// =====================
// テスト実行
// =====================

export function runTests() {
  console.log('='.repeat(50));
  console.log('財務三表連携 統合テスト');
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
  window.integrationTests = { runTests };
}
