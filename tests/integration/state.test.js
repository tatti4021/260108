/**
 * 状態管理の統合テスト
 * @module tests/integration/state.test
 */

import * as state from '../../src/js/utils/state.js';
import * as storage from '../../src/js/utils/storage.js';

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

function assertNotNull(value, message = '') {
  if (value === null || value === undefined) {
    throw new Error(`${message ? message + ': ' : ''}Expected non-null value`);
  }
}

// =====================
// 初期化テスト
// =====================

test('initialize - 新規作成', () => {
  // LocalStorageをクリア
  localStorage.clear();

  const initialState = state.initialize({ forceNew: true });

  assertTrue(initialState.initialized, '初期化済みフラグがtrue');
  assertNotNull(initialState.company, '会社情報が存在');
  assertEquals(initialState.periods.length, 12, '12期間が作成される');
  assertNotNull(initialState.forecast, '予測設定が存在');
  assertEquals(initialState.currentPeriodIndex, 0, '現在期間は0');
});

test('initialize - カスタム期間数', () => {
  localStorage.clear();

  const initialState = state.initialize({
    forceNew: true,
    numPeriods: 24
  });

  assertEquals(initialState.periods.length, 24, '24期間が作成される');
});

test('initialize - カスタム開始年月', () => {
  localStorage.clear();

  const initialState = state.initialize({
    forceNew: true,
    startYear: 2025,
    startMonth: 4,
    numPeriods: 3
  });

  assertEquals(initialState.periods[0].year, 2025, '開始年が2025');
  assertEquals(initialState.periods[0].month, 4, '開始月が4月');
  assertEquals(initialState.periods[1].month, 5, '次の月が5月');
  assertEquals(initialState.periods[2].month, 6, '次の月が6月');
});

test('initialize - 年をまたぐ期間', () => {
  localStorage.clear();

  const initialState = state.initialize({
    forceNew: true,
    startYear: 2025,
    startMonth: 11,
    numPeriods: 4
  });

  assertEquals(initialState.periods[0].year, 2025);
  assertEquals(initialState.periods[0].month, 11);
  assertEquals(initialState.periods[1].year, 2025);
  assertEquals(initialState.periods[1].month, 12);
  assertEquals(initialState.periods[2].year, 2026);
  assertEquals(initialState.periods[2].month, 1);
  assertEquals(initialState.periods[3].year, 2026);
  assertEquals(initialState.periods[3].month, 2);
});

// =====================
// 状態の取得・設定テスト
// =====================

test('getState - 状態のコピーを返す', () => {
  localStorage.clear();
  state.initialize({ forceNew: true });

  const currentState = state.getState();
  assertNotNull(currentState);
  assertTrue(currentState.initialized);

  // オリジナルの状態を変更しても影響しない（ディープコピーの確認）
  currentState.company.name = 'Modified';
  const newState = state.getState();
  assertTrue(newState.company.name !== 'Modified', '状態は独立している');
});

test('setState - 部分更新', () => {
  localStorage.clear();
  state.initialize({ forceNew: true });

  const updatedState = state.setState({
    currentPeriodIndex: 5
  });

  assertEquals(updatedState.currentPeriodIndex, 5);
  assertTrue(updatedState.initialized, '他のプロパティは保持される');
});

// =====================
// 保存・読込テスト
// =====================

test('saveState & loadState - データの永続化', () => {
  localStorage.clear();

  // 状態を初期化して保存
  state.initialize({ forceNew: true });
  const originalState = state.getState();

  // 保存確認
  const saved = state.saveState();
  assertTrue(saved, '保存が成功');

  // 新しい状態で上書き
  state.setState({
    currentPeriodIndex: 10,
    initialized: false
  }, false);

  // 読み込み
  const loaded = state.loadState();
  assertTrue(loaded, '読み込みが成功');

  const restoredState = state.getState();
  assertEquals(restoredState.currentPeriodIndex, originalState.currentPeriodIndex, '期間インデックスが復元される');
  assertTrue(restoredState.initialized, '初期化フラグが復元される');
});

test('loadState - データがない場合', () => {
  localStorage.clear();

  const loaded = state.loadState();
  assertFalse(loaded, 'データがない場合はfalseを返す');
});

test('setState - 自動保存', () => {
  localStorage.clear();
  state.initialize({ forceNew: true });

  // 自動保存ありで更新
  state.setState({
    currentPeriodIndex: 3
  }, true);

  // LocalStorageから直接確認
  const savedData = storage.load('app_state');
  assertNotNull(savedData);
  assertEquals(savedData.currentPeriodIndex, 3, 'LocalStorageに保存される');
});

test('setState - 自動保存なし', () => {
  localStorage.clear();
  state.initialize({ forceNew: true });

  // LocalStorageをクリア
  localStorage.clear();

  // 自動保存なしで更新
  state.setState({
    currentPeriodIndex: 7
  }, false);

  // LocalStorageから確認
  const savedData = storage.load('app_state');
  assertEquals(savedData, null, 'LocalStorageに保存されない');
});

// =====================
// リセットテスト
// =====================

test('resetState - 全データ削除', () => {
  localStorage.clear();
  state.initialize({ forceNew: true });

  const reset = state.resetState();
  assertTrue(reset, 'リセットが成功');

  const currentState = state.getState();
  assertFalse(currentState.initialized, '初期化フラグがfalse');
  assertEquals(currentState.periods.length, 0, '期間データが空');
  assertEquals(currentState.company, null, '会社情報がnull');
});

// =====================
// 購読機能のテスト
// =====================

test('subscribe - 状態変更の通知', (done) => {
  localStorage.clear();
  state.initialize({ forceNew: true });

  let callbackCalled = false;

  const unsubscribe = state.subscribe((newState) => {
    callbackCalled = true;
    assertEquals(newState.currentPeriodIndex, 2);
  });

  state.setState({ currentPeriodIndex: 2 });

  // コールバックが呼ばれたことを確認
  setTimeout(() => {
    assertTrue(callbackCalled, 'コールバックが呼ばれた');
    unsubscribe();
  }, 10);
});

test('subscribe - 購読解除', () => {
  localStorage.clear();
  state.initialize({ forceNew: true });

  let callbackCount = 0;

  const unsubscribe = state.subscribe((newState) => {
    callbackCount++;
  });

  state.setState({ currentPeriodIndex: 1 });
  assertEquals(callbackCount, 1, '1回目の通知');

  // 購読解除
  unsubscribe();

  state.setState({ currentPeriodIndex: 2 });
  assertEquals(callbackCount, 1, '購読解除後は通知されない');
});

test('getSubscriberCount - 購読者数の確認', () => {
  localStorage.clear();
  state.initialize({ forceNew: true });

  const initialCount = state.getSubscriberCount();

  const unsubscribe1 = state.subscribe(() => {});
  assertEquals(state.getSubscriberCount(), initialCount + 1);

  const unsubscribe2 = state.subscribe(() => {});
  assertEquals(state.getSubscriberCount(), initialCount + 2);

  unsubscribe1();
  assertEquals(state.getSubscriberCount(), initialCount + 1);

  unsubscribe2();
  assertEquals(state.getSubscriberCount(), initialCount);
});

// =====================
// 会社情報・予測設定の更新テスト
// =====================

test('updateCompany - 会社情報の更新', () => {
  localStorage.clear();
  state.initialize({ forceNew: true });

  const newCompany = {
    name: 'テスト株式会社',
    industry: 'IT',
    fiscalYearEnd: '12'
  };

  const updatedState = state.updateCompany(newCompany);

  assertEquals(updatedState.company.name, 'テスト株式会社');
  assertEquals(updatedState.company.industry, 'IT');
});

test('updateForecast - 予測設定の更新', () => {
  localStorage.clear();
  state.initialize({ forceNew: true });

  const newForecast = {
    revenueGrowthRate: 5.5,
    cogsRate: 40,
    sgaGrowthRate: 3.0
  };

  const updatedState = state.updateForecast(newForecast);

  assertEquals(updatedState.forecast.revenueGrowthRate, 5.5);
  assertEquals(updatedState.forecast.cogsRate, 40);
});

// =====================
// 期間データの操作テスト
// =====================

test('updatePeriod - 特定期間の更新', () => {
  localStorage.clear();
  state.initialize({ forceNew: true, numPeriods: 5 });

  const updatedPeriod = {
    pl: {
      revenue: 1000000,
      cogs: 400000
    }
  };

  const updatedState = state.updatePeriod(2, updatedPeriod);

  assertEquals(updatedState.periods[2].pl.revenue, 1000000);
  assertEquals(updatedState.periods[2].pl.cogs, 400000);
});

test('setCurrentPeriod - 現在期間の変更', () => {
  localStorage.clear();
  state.initialize({ forceNew: true, numPeriods: 5 });

  const updatedState = state.setCurrentPeriod(3);

  assertEquals(updatedState.currentPeriodIndex, 3);
});

test('getCurrentPeriod - 現在期間の取得', () => {
  localStorage.clear();
  state.initialize({ forceNew: true, numPeriods: 5 });

  state.setCurrentPeriod(2);
  const currentPeriod = state.getCurrentPeriod();

  assertNotNull(currentPeriod);
  assertEquals(currentPeriod.month, state.getState().periods[2].month);
});

test('addPeriod - 期間の追加', () => {
  localStorage.clear();
  state.initialize({ forceNew: true, numPeriods: 3 });

  const newPeriod = {
    year: 2026,
    month: 4,
    pl: {},
    bs: {},
    cf: {}
  };

  const updatedState = state.addPeriod(newPeriod);

  assertEquals(updatedState.periods.length, 4);
  assertEquals(updatedState.periods[3].month, 4);
});

test('removePeriod - 期間の削除', () => {
  localStorage.clear();
  state.initialize({ forceNew: true, numPeriods: 5 });

  const updatedState = state.removePeriod(2);

  assertEquals(updatedState.periods.length, 4);
});

test('removePeriod - 現在期間インデックスの調整', () => {
  localStorage.clear();
  state.initialize({ forceNew: true, numPeriods: 5 });

  state.setCurrentPeriod(4);
  const updatedState = state.removePeriod(4);

  assertEquals(updatedState.currentPeriodIndex, 3, '削除後のインデックスが調整される');
});

// =====================
// エラーハンドリングテスト
// =====================

test('updatePeriod - 不正なインデックス', () => {
  localStorage.clear();
  state.initialize({ forceNew: true, numPeriods: 5 });

  try {
    state.updatePeriod(10, {});
    throw new Error('エラーが発生すべき');
  } catch (e) {
    assertTrue(e.message.includes('Invalid period index'));
  }
});

test('setCurrentPeriod - 不正なインデックス', () => {
  localStorage.clear();
  state.initialize({ forceNew: true, numPeriods: 5 });

  try {
    state.setCurrentPeriod(-1);
    throw new Error('エラーが発生すべき');
  } catch (e) {
    assertTrue(e.message.includes('Invalid period index'));
  }
});

test('subscribe - 不正なコールバック', () => {
  try {
    state.subscribe('not a function');
    throw new Error('エラーが発生すべき');
  } catch (e) {
    assertTrue(e.message.includes('must be a function'));
  }
});

// =====================
// テスト実行
// =====================

export function runTests() {
  console.log('='.repeat(50));
  console.log('状態管理 統合テスト');
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
  window.stateTests = { runTests };
}
