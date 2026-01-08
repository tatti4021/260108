/**
 * 財務三表の連携処理
 * @module utils/integration
 */

import { getState, updatePeriod, subscribe } from './state.js';
import { calculatePLResults } from './pl-calc.js';
import { calculateCFResults } from './cf-calc.js';

/**
 * P/L → B/Sの連携: 当期純利益を利益剰余金に反映
 * @param {number} periodIndex - 期間インデックス
 */
export function syncPLtoBS(periodIndex) {
  const state = getState();
  if (!state.periods || !state.periods[periodIndex]) {
    return;
  }

  const period = state.periods[periodIndex];
  const pl = period.pl;
  const bs = period.bs;

  // 当期純利益を計算
  const plResults = calculatePLResults(pl);
  const netProfit = plResults.netProfit;

  // 前期の利益剰余金を取得（初期値は現在の値）
  let previousRetainedEarnings = 0;
  if (periodIndex > 0 && state.periods[periodIndex - 1]) {
    previousRetainedEarnings = state.periods[periodIndex - 1].bs.equity.retainedEarnings || 0;
  }

  // 新しい利益剰余金 = 前期利益剰余金 + 当期純利益
  const newRetainedEarnings = previousRetainedEarnings + netProfit;

  // B/Sの利益剰余金を更新
  const updatedBS = {
    ...bs,
    equity: {
      ...bs.equity,
      retainedEarnings: newRetainedEarnings
    }
  };

  // 状態を更新（autoSave=falseで無限ループを防ぐ）
  updatePeriod(periodIndex, {
    ...period,
    bs: updatedBS
  });
}

/**
 * B/S → C/Fの連携: 現金残高の同期と各科目増減の自動計算
 * @param {number} periodIndex - 期間インデックス
 */
export function syncBStoCF(periodIndex) {
  const state = getState();
  if (!state.periods || !state.periods[periodIndex]) {
    return;
  }

  const period = state.periods[periodIndex];
  const bs = period.bs;
  const cf = period.cf;
  const pl = period.pl;

  // 前期データを取得
  const previousPeriod = periodIndex > 0 ? state.periods[periodIndex - 1] : null;
  const previousBS = previousPeriod?.bs;

  // 期首現金（前期の現金残高）
  const beginningCash = previousBS?.assets.current.cash || 0;

  // 各科目の増減を計算
  const receivablesChange = previousBS
    ? (bs.assets.current.receivables - previousBS.assets.current.receivables)
    : 0;

  const inventoryChange = previousBS
    ? (bs.assets.current.inventory - previousBS.assets.current.inventory)
    : 0;

  const payablesChange = previousBS
    ? (bs.liabilities.current.payables - previousBS.liabilities.current.payables)
    : 0;

  const shortTermDebtChange = previousBS
    ? (bs.liabilities.current.shortTermDebt - previousBS.liabilities.current.shortTermDebt)
    : 0;

  // P/Lから税引前当期純利益を取得
  const plResults = calculatePLResults(pl);
  const profitBeforeTax = plResults.ordinaryProfit; // 経常利益を税引前利益として使用

  // C/Fデータを更新
  const updatedCF = {
    ...cf,
    operating: {
      ...cf.operating,
      profitBeforeTax: profitBeforeTax,
      receivablesChange: -receivablesChange, // 売掛金増加はマイナス
      inventoryChange: -inventoryChange,     // 棚卸資産増加はマイナス
      payablesChange: payablesChange         // 買掛金増加はプラス
    },
    financing: {
      ...cf.financing,
      shortTermDebtChange: shortTermDebtChange
    },
    beginningCash: beginningCash
  };

  // C/F計算結果から期末現金を取得
  const cfResults = calculateCFResults(updatedCF);
  const endingCash = cfResults.endingCash;

  // B/Sの現金残高をC/Fの期末残高と同期
  const updatedBS = {
    ...bs,
    assets: {
      ...bs.assets,
      current: {
        ...bs.assets.current,
        cash: endingCash
      }
    }
  };

  // 状態を更新
  updatePeriod(periodIndex, {
    ...period,
    bs: updatedBS,
    cf: updatedCF
  });
}

/**
 * 全期間の連携処理を実行
 */
export function syncAllPeriods() {
  const state = getState();
  if (!state.periods) {
    return;
  }

  // 各期間について順番に連携処理を実行
  for (let i = 0; i < state.periods.length; i++) {
    syncPLtoBS(i);
    syncBStoCF(i);
  }
}

/**
 * 状態変更時の自動連携を初期化
 */
let unsubscribe = null;

export function initializeIntegration() {
  // 既存の購読を解除
  if (unsubscribe) {
    unsubscribe();
  }

  // 状態変更を購読して自動連携
  unsubscribe = subscribe((state) => {
    if (!state.periods || state.periods.length === 0) {
      return;
    }

    // 現在の期間インデックスに対して連携処理を実行
    const currentIndex = state.currentPeriodIndex || 0;

    // P/L → B/S連携
    syncPLtoBS(currentIndex);

    // B/S → C/F連携は、P/L→B/Sの後に実行
    // （利益剰余金更新後にC/F計算するため）
    setTimeout(() => {
      syncBStoCF(currentIndex);
    }, 0);
  });
}

/**
 * 連携機能をクリーンアップ
 */
export function cleanupIntegration() {
  if (unsubscribe) {
    unsubscribe();
    unsubscribe = null;
  }
}
