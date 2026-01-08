/**
 * B/Sビューの実装
 * @module views/bs
 */

import {
  calculateCurrentAssets,
  calculateFixedAssets,
  calculateTotalAssets,
  calculateCurrentLiabilities,
  calculateFixedLiabilities,
  calculateTotalLiabilities,
  calculateTotalEquity,
  checkBalance,
  formatCurrency,
  parseNumber
} from '../utils/bs-calc.js';

import { getState, updatePeriod, subscribe } from '../utils/state.js';
import { ChartsView } from './charts.js';

/**
 * B/Sビュークラス
 */
export class BSView {
  /**
   * コンストラクタ
   * @param {HTMLElement} container - コンテナ要素
   */
  constructor(container) {
    this.container = container;
    this.currentPeriodIndex = 0;
    this.unsubscribe = null;
    this.chartsView = new ChartsView(container);

    // 状態変更を購読
    this.unsubscribe = subscribe((state) => {
      this.currentPeriodIndex = state.currentPeriodIndex;
      this.render();
    });
  }

  /**
   * ビューを破棄
   */
  destroy() {
    if (this.unsubscribe) {
      this.unsubscribe();
    }
  }

  /**
   * 期間データを取得
   * @returns {Object} 期間データ
   */
  getPeriodData() {
    const state = getState();
    if (!state.periods || state.periods.length === 0) {
      return null;
    }
    return state.periods[this.currentPeriodIndex] || state.periods[0];
  }

  /**
   * B/Sデータを更新
   * @param {Object} bsData - 新しいB/Sデータ
   */
  updateBSData(bsData) {
    const periodData = this.getPeriodData();
    if (!periodData) return;

    const updatedPeriod = {
      ...periodData,
      bs: {
        ...periodData.bs,
        ...bsData
      }
    };

    updatePeriod(this.currentPeriodIndex, updatedPeriod);
  }

  /**
   * ビューをレンダリング
   */
  render() {
    const periodData = this.getPeriodData();

    if (!periodData) {
      this.container.innerHTML = `
        <div class="page-content">
          <h2 class="page-title">貸借対照表 (B/S)</h2>
          <div class="alert alert-warning">
            データが初期化されていません。設定画面から初期化してください。
          </div>
        </div>
      `;
      return;
    }

    const bs = periodData.bs;
    const balance = checkBalance(bs.assets, bs.liabilities, bs.equity);

    this.container.innerHTML = `
      <div class="page-content">
        <h2 class="page-title">貸借対照表 (B/S)</h2>

        <div class="card mb-4">
          <div class="card-header">
            <h3 class="card-title">期間: ${periodData.year}年 ${periodData.month}月</h3>
          </div>
        </div>

        ${this.renderBalanceAlert(balance)}

        <div class="grid grid-cols-2 mb-6">
          ${this.renderAssetsForm(bs.assets)}
          ${this.renderLiabilitiesEquityForm(bs.liabilities, bs.equity)}
        </div>

        ${this.renderBalanceSheet(bs)}

        <!-- B/S構成グラフ -->
        <div class="card" style="margin-top: 1.5rem;">
          <div class="card-header">
            <h3 class="card-title">B/S構成グラフ</h3>
          </div>
          <div class="card-body" style="height: 400px;">
            <canvas id="bsChart"></canvas>
          </div>
        </div>
      </div>
    `;

    // イベントリスナーを設定
    this.attachEventListeners();
    this.renderCharts();
  }

  /**
   * バランスチェックアラートをレンダリング
   * @param {Object} balance - バランスチェック結果
   * @returns {string} HTML文字列
   */
  renderBalanceAlert(balance) {
    if (balance.balanced) {
      return `
        <div class="alert alert-success">
          バランスシート一致: 資産 = 負債 + 純資産 (${formatCurrency(balance.totalAssets)})
        </div>
      `;
    } else {
      const diff = formatCurrency(Math.abs(balance.difference));
      return `
        <div class="alert alert-danger">
          バランスシート不一致: 差額 ${diff}
          (資産 ${formatCurrency(balance.totalAssets)} ≠
          負債+純資産 ${formatCurrency(balance.totalLiabilities + balance.totalEquity)})
        </div>
      `;
    }
  }

  /**
   * 資産入力フォームをレンダリング
   * @param {Object} assets - 資産データ
   * @returns {string} HTML文字列
   */
  renderAssetsForm(assets) {
    const currentAssets = calculateCurrentAssets(assets);
    const fixedAssets = calculateFixedAssets(assets);
    const totalAssets = calculateTotalAssets(assets);

    return `
      <div class="card">
        <div class="card-header">
          <h3 class="card-title">資産の部</h3>
        </div>
        <div class="card-body">
          <!-- 流動資産 -->
          <h4 style="font-size: 1rem; font-weight: 600; margin-bottom: 1rem; color: var(--color-primary);">
            流動資産
          </h4>

          <div class="form-group">
            <label class="form-label">現金預金</label>
            <input
              type="number"
              class="form-control"
              data-field="assets.current.cash"
              value="${assets.current.cash}"
              min="0"
              step="1"
            >
          </div>

          <div class="form-group">
            <label class="form-label">売掛金</label>
            <input
              type="number"
              class="form-control"
              data-field="assets.current.receivables"
              value="${assets.current.receivables}"
              min="0"
              step="1"
            >
          </div>

          <div class="form-group">
            <label class="form-label">棚卸資産</label>
            <input
              type="number"
              class="form-control"
              data-field="assets.current.inventory"
              value="${assets.current.inventory}"
              min="0"
              step="1"
            >
          </div>

          <div class="form-group" style="background-color: var(--color-bg-tertiary); padding: 0.75rem; border-radius: var(--radius-md); margin-top: 1rem;">
            <div style="display: flex; justify-content: space-between; font-weight: 600;">
              <span>流動資産合計</span>
              <span>${formatCurrency(currentAssets)}</span>
            </div>
          </div>

          <!-- 固定資産 -->
          <h4 style="font-size: 1rem; font-weight: 600; margin: 1.5rem 0 1rem; color: var(--color-primary);">
            固定資産
          </h4>

          <div class="form-group">
            <label class="form-label">有形固定資産</label>
            <input
              type="number"
              class="form-control"
              data-field="assets.fixed.tangible"
              value="${assets.fixed.tangible}"
              min="0"
              step="1"
            >
          </div>

          <div class="form-group">
            <label class="form-label">無形固定資産</label>
            <input
              type="number"
              class="form-control"
              data-field="assets.fixed.intangible"
              value="${assets.fixed.intangible}"
              min="0"
              step="1"
            >
          </div>

          <div class="form-group" style="background-color: var(--color-bg-tertiary); padding: 0.75rem; border-radius: var(--radius-md); margin-top: 1rem;">
            <div style="display: flex; justify-content: space-between; font-weight: 600;">
              <span>固定資産合計</span>
              <span>${formatCurrency(fixedAssets)}</span>
            </div>
          </div>

          <!-- 資産合計 -->
          <div class="form-group" style="background-color: var(--color-primary-lighter); padding: 1rem; border-radius: var(--radius-md); margin-top: 1.5rem;">
            <div style="display: flex; justify-content: space-between; font-weight: 700; font-size: 1.125rem; color: var(--color-primary-dark);">
              <span>資産合計</span>
              <span>${formatCurrency(totalAssets)}</span>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * 負債・純資産入力フォームをレンダリング
   * @param {Object} liabilities - 負債データ
   * @param {Object} equity - 純資産データ
   * @returns {string} HTML文字列
   */
  renderLiabilitiesEquityForm(liabilities, equity) {
    const currentLiabilities = calculateCurrentLiabilities(liabilities);
    const fixedLiabilities = calculateFixedLiabilities(liabilities);
    const totalLiabilities = calculateTotalLiabilities(liabilities);
    const totalEquity = calculateTotalEquity(equity);
    const total = totalLiabilities + totalEquity;

    return `
      <div class="card">
        <div class="card-header">
          <h3 class="card-title">負債・純資産の部</h3>
        </div>
        <div class="card-body">
          <!-- 流動負債 -->
          <h4 style="font-size: 1rem; font-weight: 600; margin-bottom: 1rem; color: var(--color-secondary);">
            流動負債
          </h4>

          <div class="form-group">
            <label class="form-label">買掛金</label>
            <input
              type="number"
              class="form-control"
              data-field="liabilities.current.payables"
              value="${liabilities.current.payables}"
              min="0"
              step="1"
            >
          </div>

          <div class="form-group">
            <label class="form-label">短期借入金</label>
            <input
              type="number"
              class="form-control"
              data-field="liabilities.current.shortTermDebt"
              value="${liabilities.current.shortTermDebt}"
              min="0"
              step="1"
            >
          </div>

          <div class="form-group" style="background-color: var(--color-bg-tertiary); padding: 0.75rem; border-radius: var(--radius-md); margin-top: 1rem;">
            <div style="display: flex; justify-content: space-between; font-weight: 600;">
              <span>流動負債合計</span>
              <span>${formatCurrency(currentLiabilities)}</span>
            </div>
          </div>

          <!-- 固定負債 -->
          <h4 style="font-size: 1rem; font-weight: 600; margin: 1.5rem 0 1rem; color: var(--color-secondary);">
            固定負債
          </h4>

          <div class="form-group">
            <label class="form-label">長期借入金</label>
            <input
              type="number"
              class="form-control"
              data-field="liabilities.fixed.longTermDebt"
              value="${liabilities.fixed.longTermDebt}"
              min="0"
              step="1"
            >
          </div>

          <div class="form-group" style="background-color: var(--color-bg-tertiary); padding: 0.75rem; border-radius: var(--radius-md); margin-top: 1rem;">
            <div style="display: flex; justify-content: space-between; font-weight: 600;">
              <span>固定負債合計</span>
              <span>${formatCurrency(fixedLiabilities)}</span>
            </div>
          </div>

          <div class="form-group" style="background-color: var(--color-bg-tertiary); padding: 0.75rem; border-radius: var(--radius-md); margin-top: 1rem;">
            <div style="display: flex; justify-content: space-between; font-weight: 700;">
              <span>負債合計</span>
              <span>${formatCurrency(totalLiabilities)}</span>
            </div>
          </div>

          <!-- 純資産 -->
          <h4 style="font-size: 1rem; font-weight: 600; margin: 1.5rem 0 1rem; color: var(--color-success);">
            純資産
          </h4>

          <div class="form-group">
            <label class="form-label">資本金</label>
            <input
              type="number"
              class="form-control"
              data-field="equity.capital"
              value="${equity.capital}"
              min="0"
              step="1"
            >
          </div>

          <div class="form-group">
            <label class="form-label">利益剰余金</label>
            <input
              type="number"
              class="form-control"
              data-field="equity.retainedEarnings"
              value="${equity.retainedEarnings}"
              step="1"
            >
          </div>

          <div class="form-group" style="background-color: var(--color-bg-tertiary); padding: 0.75rem; border-radius: var(--radius-md); margin-top: 1rem;">
            <div style="display: flex; justify-content: space-between; font-weight: 700;">
              <span>純資産合計</span>
              <span>${formatCurrency(totalEquity)}</span>
            </div>
          </div>

          <!-- 負債・純資産合計 -->
          <div class="form-group" style="background-color: var(--color-secondary-light); padding: 1rem; border-radius: var(--radius-md); margin-top: 1.5rem;">
            <div style="display: flex; justify-content: space-between; font-weight: 700; font-size: 1.125rem; color: var(--color-secondary-dark);">
              <span>負債・純資産合計</span>
              <span>${formatCurrency(total)}</span>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * 勘定式B/S表示テーブルをレンダリング
   * @param {Object} bs - B/Sデータ
   * @returns {string} HTML文字列
   */
  renderBalanceSheet(bs) {
    const currentAssets = calculateCurrentAssets(bs.assets);
    const fixedAssets = calculateFixedAssets(bs.assets);
    const totalAssets = calculateTotalAssets(bs.assets);

    const currentLiabilities = calculateCurrentLiabilities(bs.liabilities);
    const fixedLiabilities = calculateFixedLiabilities(bs.liabilities);
    const totalLiabilities = calculateTotalLiabilities(bs.liabilities);
    const totalEquity = calculateTotalEquity(bs.equity);
    const totalLiabilitiesEquity = totalLiabilities + totalEquity;

    return `
      <div class="card">
        <div class="card-header">
          <h3 class="card-title">貸借対照表（勘定式）</h3>
        </div>
        <div class="card-body">
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 2rem;">
            <!-- 左側：資産の部 -->
            <div>
              <table class="table">
                <thead>
                  <tr>
                    <th colspan="2" style="background-color: var(--color-primary-lighter); color: var(--color-primary-dark);">
                      資産の部
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td colspan="2" style="font-weight: 600; background-color: var(--color-bg-tertiary);">
                      流動資産
                    </td>
                  </tr>
                  <tr>
                    <td style="padding-left: 2rem;">現金預金</td>
                    <td class="text-right">${formatCurrency(bs.assets.current.cash, false)}</td>
                  </tr>
                  <tr>
                    <td style="padding-left: 2rem;">売掛金</td>
                    <td class="text-right">${formatCurrency(bs.assets.current.receivables, false)}</td>
                  </tr>
                  <tr>
                    <td style="padding-left: 2rem;">棚卸資産</td>
                    <td class="text-right">${formatCurrency(bs.assets.current.inventory, false)}</td>
                  </tr>
                  <tr style="background-color: var(--color-bg-tertiary);">
                    <td style="font-weight: 600;">流動資産合計</td>
                    <td class="text-right" style="font-weight: 600;">${formatCurrency(currentAssets, false)}</td>
                  </tr>
                  <tr>
                    <td colspan="2" style="font-weight: 600; background-color: var(--color-bg-tertiary);">
                      固定資産
                    </td>
                  </tr>
                  <tr>
                    <td style="padding-left: 2rem;">有形固定資産</td>
                    <td class="text-right">${formatCurrency(bs.assets.fixed.tangible, false)}</td>
                  </tr>
                  <tr>
                    <td style="padding-left: 2rem;">無形固定資産</td>
                    <td class="text-right">${formatCurrency(bs.assets.fixed.intangible, false)}</td>
                  </tr>
                  <tr style="background-color: var(--color-bg-tertiary);">
                    <td style="font-weight: 600;">固定資産合計</td>
                    <td class="text-right" style="font-weight: 600;">${formatCurrency(fixedAssets, false)}</td>
                  </tr>
                  <tr style="background-color: var(--color-primary-lighter);">
                    <td style="font-weight: 700; font-size: 1.125rem; color: var(--color-primary-dark);">
                      資産合計
                    </td>
                    <td class="text-right" style="font-weight: 700; font-size: 1.125rem; color: var(--color-primary-dark);">
                      ${formatCurrency(totalAssets, false)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <!-- 右側：負債・純資産の部 -->
            <div>
              <table class="table">
                <thead>
                  <tr>
                    <th colspan="2" style="background-color: var(--color-secondary-light); color: var(--color-secondary-dark);">
                      負債・純資産の部
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td colspan="2" style="font-weight: 600; background-color: var(--color-bg-tertiary);">
                      流動負債
                    </td>
                  </tr>
                  <tr>
                    <td style="padding-left: 2rem;">買掛金</td>
                    <td class="text-right">${formatCurrency(bs.liabilities.current.payables, false)}</td>
                  </tr>
                  <tr>
                    <td style="padding-left: 2rem;">短期借入金</td>
                    <td class="text-right">${formatCurrency(bs.liabilities.current.shortTermDebt, false)}</td>
                  </tr>
                  <tr style="background-color: var(--color-bg-tertiary);">
                    <td style="font-weight: 600;">流動負債合計</td>
                    <td class="text-right" style="font-weight: 600;">${formatCurrency(currentLiabilities, false)}</td>
                  </tr>
                  <tr>
                    <td colspan="2" style="font-weight: 600; background-color: var(--color-bg-tertiary);">
                      固定負債
                    </td>
                  </tr>
                  <tr>
                    <td style="padding-left: 2rem;">長期借入金</td>
                    <td class="text-right">${formatCurrency(bs.liabilities.fixed.longTermDebt, false)}</td>
                  </tr>
                  <tr style="background-color: var(--color-bg-tertiary);">
                    <td style="font-weight: 600;">固定負債合計</td>
                    <td class="text-right" style="font-weight: 600;">${formatCurrency(fixedLiabilities, false)}</td>
                  </tr>
                  <tr style="background-color: var(--color-bg-tertiary);">
                    <td style="font-weight: 700;">負債合計</td>
                    <td class="text-right" style="font-weight: 700;">${formatCurrency(totalLiabilities, false)}</td>
                  </tr>
                  <tr>
                    <td colspan="2" style="font-weight: 600; background-color: var(--color-bg-tertiary);">
                      純資産
                    </td>
                  </tr>
                  <tr>
                    <td style="padding-left: 2rem;">資本金</td>
                    <td class="text-right">${formatCurrency(bs.equity.capital, false)}</td>
                  </tr>
                  <tr>
                    <td style="padding-left: 2rem;">利益剰余金</td>
                    <td class="text-right">${formatCurrency(bs.equity.retainedEarnings, false)}</td>
                  </tr>
                  <tr style="background-color: var(--color-bg-tertiary);">
                    <td style="font-weight: 700;">純資産合計</td>
                    <td class="text-right" style="font-weight: 700;">${formatCurrency(totalEquity, false)}</td>
                  </tr>
                  <tr style="background-color: var(--color-secondary-light);">
                    <td style="font-weight: 700; font-size: 1.125rem; color: var(--color-secondary-dark);">
                      負債・純資産合計
                    </td>
                    <td class="text-right" style="font-weight: 700; font-size: 1.125rem; color: var(--color-secondary-dark);">
                      ${formatCurrency(totalLiabilitiesEquity, false)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * イベントリスナーを設定
   */
  attachEventListeners() {
    const inputs = this.container.querySelectorAll('input[data-field]');

    inputs.forEach(input => {
      input.addEventListener('input', (e) => {
        this.handleInputChange(e.target);
      });

      input.addEventListener('blur', (e) => {
        // フォーカスを失った時に値を整形
        const value = parseNumber(e.target.value);
        e.target.value = value;
      });
    });
  }

  /**
   * 入力変更を処理
   * @param {HTMLInputElement} input - 入力要素
   */
  handleInputChange(input) {
    const field = input.dataset.field;
    const value = parseNumber(input.value);

    if (!field) return;

    // フィールドパスを分割（例: "assets.current.cash" -> ["assets", "current", "cash"]）
    const parts = field.split('.');
    const periodData = this.getPeriodData();

    if (!periodData) return;

    // 新しいB/Sデータを作成
    const newBS = JSON.parse(JSON.stringify(periodData.bs));

    // ネストされたオブジェクトに値を設定
    let current = newBS;
    for (let i = 0; i < parts.length - 1; i++) {
      current = current[parts[i]];
    }
    current[parts[parts.length - 1]] = value;

    // 状態を更新（再レンダリングはsubscribeで自動的に行われる）
    this.updateBSData(newBS);
  }

  /**
   * グラフをレンダリング
   */
  renderCharts() {
    const periodData = this.getPeriodData();
    if (!periodData) return;

    const bs = periodData.bs;

    // B/Sデータを準備（ChartsViewが期待する形式に変換）
    const bsData = {
      currentAssets: calculateCurrentAssets(bs.assets),
      fixedAssets: calculateFixedAssets(bs.assets),
      currentLiabilities: calculateCurrentLiabilities(bs.liabilities),
      longTermLiabilities: calculateFixedLiabilities(bs.liabilities),
      equity: calculateTotalEquity(bs.equity)
    };

    // B/S構成グラフ
    this.chartsView.renderBSChart('bsChart', bsData);
  }
}
