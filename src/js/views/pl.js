/**
 * P/Lビューの実装
 * @module views/pl
 */

import {
  calculatePLResults,
  formatCurrency,
  formatPercent
} from '../utils/pl-calc.js';
import { getState, updatePeriod, setCurrentPeriod } from '../utils/state.js';
import { ChartsView } from './charts.js';

/**
 * P/Lビュークラス
 */
export class PLView {
  /**
   * コンストラクタ
   * @param {HTMLElement} container - コンテナ要素
   */
  constructor(container) {
    this.container = container;
    this.periodData = null;
    this.periodIndex = 0;
    this.chartsView = new ChartsView(container);
  }

  /**
   * ビューをレンダリング
   * @param {Object} periodData - 期間データ
   * @param {number} periodIndex - 期間インデックス
   */
  render(periodData, periodIndex = 0) {
    this.periodData = periodData;
    this.periodIndex = periodIndex;

    const html = `
      <div class="page-content">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
          <h2 class="page-title">損益計算書 (P/L)</h2>
          <div>
            ${this.renderPeriodSelector()}
          </div>
        </div>

        <div class="grid grid-cols-2" style="gap: 1.5rem;">
          ${this.renderInputForm()}
          ${this.renderPLTable()}
        </div>

        <!-- グラフエリア -->
        <div class="grid grid-cols-2" style="gap: 1.5rem; margin-top: 1.5rem;">
          <div class="card">
            <div class="card-header">
              <h3 class="card-title">費用構成</h3>
            </div>
            <div class="card-body" style="height: 350px;">
              <canvas id="plExpenseChart"></canvas>
            </div>
          </div>
          <div class="card">
            <div class="card-header">
              <h3 class="card-title">費用推移</h3>
            </div>
            <div class="card-body" style="height: 350px;">
              <canvas id="plExpenseTrendChart"></canvas>
            </div>
          </div>
        </div>
      </div>
    `;

    this.container.innerHTML = html;
    this.attachEventListeners();
    this.renderCharts();
  }

  /**
   * 期間セレクタをレンダリング
   * @returns {string} HTML文字列
   */
  renderPeriodSelector() {
    const state = getState();
    const periods = state.periods || [];

    const options = periods.map((period, index) => {
      const selected = index === this.periodIndex ? 'selected' : '';
      return `<option value="${index}" ${selected}>${period.year}年${period.month}月</option>`;
    }).join('');

    return `
      <select id="periodSelector" class="form-select" style="width: 200px;">
        ${options}
      </select>
    `;
  }

  /**
   * 入力フォームをレンダリング
   * @returns {string} HTML文字列
   */
  renderInputForm() {
    const pl = this.periodData?.pl || {};

    return `
      <div class="card">
        <div class="card-header">
          <h3 class="card-title">データ入力</h3>
        </div>
        <div class="card-body">
          <form id="plInputForm">
            <!-- 売上高 -->
            <div class="form-group">
              <label class="form-label">売上高</label>
              <input
                type="number"
                class="form-control"
                id="revenue"
                name="revenue"
                value="${pl.revenue || 0}"
                min="0"
                step="1000"
              >
            </div>

            <!-- 売上原価 -->
            <div class="form-group">
              <label class="form-label">売上原価</label>
              <input
                type="number"
                class="form-control"
                id="cogs"
                name="cogs"
                value="${pl.cogs || 0}"
                min="0"
                step="1000"
              >
            </div>

            <!-- 販管費 -->
            <div class="form-group">
              <label class="form-label" style="font-weight: bold; margin-top: 1rem;">販売費及び一般管理費</label>
            </div>

            <div class="form-group" style="padding-left: 1rem;">
              <label class="form-label">人件費</label>
              <input
                type="number"
                class="form-control"
                id="personnel"
                name="personnel"
                value="${pl.sgaExpenses?.personnel || 0}"
                min="0"
                step="1000"
              >
            </div>

            <div class="form-group" style="padding-left: 1rem;">
              <label class="form-label">賃料</label>
              <input
                type="number"
                class="form-control"
                id="rent"
                name="rent"
                value="${pl.sgaExpenses?.rent || 0}"
                min="0"
                step="1000"
              >
            </div>

            <div class="form-group" style="padding-left: 1rem;">
              <label class="form-label">光熱費</label>
              <input
                type="number"
                class="form-control"
                id="utilities"
                name="utilities"
                value="${pl.sgaExpenses?.utilities || 0}"
                min="0"
                step="1000"
              >
            </div>

            <div class="form-group" style="padding-left: 1rem;">
              <label class="form-label">広告宣伝費</label>
              <input
                type="number"
                class="form-control"
                id="marketing"
                name="marketing"
                value="${pl.sgaExpenses?.marketing || 0}"
                min="0"
                step="1000"
              >
            </div>

            <div class="form-group" style="padding-left: 1rem;">
              <label class="form-label">その他</label>
              <input
                type="number"
                class="form-control"
                id="other"
                name="other"
                value="${pl.sgaExpenses?.other || 0}"
                min="0"
                step="1000"
              >
            </div>

            <!-- 営業外収益 -->
            <div class="form-group" style="margin-top: 1rem;">
              <label class="form-label">営業外収益</label>
              <input
                type="number"
                class="form-control"
                id="nonOperatingIncome"
                name="nonOperatingIncome"
                value="${pl.nonOperating?.income || 0}"
                min="0"
                step="1000"
              >
            </div>

            <!-- 営業外費用 -->
            <div class="form-group">
              <label class="form-label">営業外費用</label>
              <input
                type="number"
                class="form-control"
                id="nonOperatingExpense"
                name="nonOperatingExpense"
                value="${pl.nonOperating?.expense || 0}"
                min="0"
                step="1000"
              >
            </div>

            <!-- 法人税等 -->
            <div class="form-group">
              <label class="form-label">法人税等</label>
              <input
                type="number"
                class="form-control"
                id="tax"
                name="tax"
                value="${pl.tax || 0}"
                min="0"
                step="1000"
              >
            </div>

            <button type="submit" class="btn btn-primary" style="width: 100%; margin-top: 1rem;">
              保存
            </button>
          </form>
        </div>
      </div>
    `;
  }

  /**
   * P/L表示テーブルをレンダリング
   * @returns {string} HTML文字列
   */
  renderPLTable() {
    const pl = this.periodData?.pl || {};
    const results = calculatePLResults(pl);

    // ヘルパー関数：負の数の場合は赤色にする
    const formatValue = (value, isPercent = false) => {
      const formatted = isPercent ? formatPercent(value) : formatCurrency(value);
      const colorClass = value < 0 ? 'text-danger' : '';
      return `<span class="${colorClass}">${formatted}</span>`;
    };

    return `
      <div class="card">
        <div class="card-header">
          <h3 class="card-title">損益計算書</h3>
        </div>
        <div class="card-body">
          <div class="table-container">
            <table class="table">
              <thead>
                <tr>
                  <th>項目</th>
                  <th class="text-right">金額</th>
                  <th class="text-right">構成比率</th>
                </tr>
              </thead>
              <tbody>
                <!-- 売上高 -->
                <tr>
                  <td><strong>売上高</strong></td>
                  <td class="text-right"><strong>${formatCurrency(pl.revenue || 0)}</strong></td>
                  <td class="text-right"><strong>100.0%</strong></td>
                </tr>

                <!-- 売上原価 -->
                <tr>
                  <td style="padding-left: 1.5rem;">売上原価</td>
                  <td class="text-right">${formatCurrency(pl.cogs || 0)}</td>
                  <td class="text-right">${formatPercent(this.calculateRatio(pl.cogs, pl.revenue))}</td>
                </tr>

                <!-- 売上総利益 -->
                <tr style="background-color: var(--color-bg-tertiary);">
                  <td><strong>売上総利益</strong></td>
                  <td class="text-right"><strong>${formatValue(results.grossProfit)}</strong></td>
                  <td class="text-right"><strong>${formatValue(results.margins.grossProfitMargin, true)}</strong></td>
                </tr>

                <!-- 販管費 -->
                <tr>
                  <td style="padding-left: 1.5rem;">販売費及び一般管理費</td>
                  <td class="text-right">${formatCurrency(results.sgaTotal)}</td>
                  <td class="text-right">${formatPercent(this.calculateRatio(results.sgaTotal, pl.revenue))}</td>
                </tr>
                <tr>
                  <td style="padding-left: 2.5rem; font-size: 0.875rem; color: var(--color-text-secondary);">人件費</td>
                  <td class="text-right" style="font-size: 0.875rem; color: var(--color-text-secondary);">${formatCurrency(pl.sgaExpenses?.personnel || 0)}</td>
                  <td class="text-right" style="font-size: 0.875rem; color: var(--color-text-secondary);">${formatPercent(this.calculateRatio(pl.sgaExpenses?.personnel, pl.revenue))}</td>
                </tr>
                <tr>
                  <td style="padding-left: 2.5rem; font-size: 0.875rem; color: var(--color-text-secondary);">賃料</td>
                  <td class="text-right" style="font-size: 0.875rem; color: var(--color-text-secondary);">${formatCurrency(pl.sgaExpenses?.rent || 0)}</td>
                  <td class="text-right" style="font-size: 0.875rem; color: var(--color-text-secondary);">${formatPercent(this.calculateRatio(pl.sgaExpenses?.rent, pl.revenue))}</td>
                </tr>
                <tr>
                  <td style="padding-left: 2.5rem; font-size: 0.875rem; color: var(--color-text-secondary);">光熱費</td>
                  <td class="text-right" style="font-size: 0.875rem; color: var(--color-text-secondary);">${formatCurrency(pl.sgaExpenses?.utilities || 0)}</td>
                  <td class="text-right" style="font-size: 0.875rem; color: var(--color-text-secondary);">${formatPercent(this.calculateRatio(pl.sgaExpenses?.utilities, pl.revenue))}</td>
                </tr>
                <tr>
                  <td style="padding-left: 2.5rem; font-size: 0.875rem; color: var(--color-text-secondary);">広告宣伝費</td>
                  <td class="text-right" style="font-size: 0.875rem; color: var(--color-text-secondary);">${formatCurrency(pl.sgaExpenses?.marketing || 0)}</td>
                  <td class="text-right" style="font-size: 0.875rem; color: var(--color-text-secondary);">${formatPercent(this.calculateRatio(pl.sgaExpenses?.marketing, pl.revenue))}</td>
                </tr>
                <tr>
                  <td style="padding-left: 2.5rem; font-size: 0.875rem; color: var(--color-text-secondary);">その他</td>
                  <td class="text-right" style="font-size: 0.875rem; color: var(--color-text-secondary);">${formatCurrency(pl.sgaExpenses?.other || 0)}</td>
                  <td class="text-right" style="font-size: 0.875rem; color: var(--color-text-secondary);">${formatPercent(this.calculateRatio(pl.sgaExpenses?.other, pl.revenue))}</td>
                </tr>

                <!-- 営業利益 -->
                <tr style="background-color: var(--color-bg-tertiary);">
                  <td><strong>営業利益</strong></td>
                  <td class="text-right"><strong>${formatValue(results.operatingProfit)}</strong></td>
                  <td class="text-right"><strong>${formatValue(results.margins.operatingProfitMargin, true)}</strong></td>
                </tr>

                <!-- 営業外収益 -->
                <tr>
                  <td style="padding-left: 1.5rem;">営業外収益</td>
                  <td class="text-right">${formatCurrency(pl.nonOperating?.income || 0)}</td>
                  <td class="text-right">${formatPercent(this.calculateRatio(pl.nonOperating?.income, pl.revenue))}</td>
                </tr>

                <!-- 営業外費用 -->
                <tr>
                  <td style="padding-left: 1.5rem;">営業外費用</td>
                  <td class="text-right">${formatCurrency(pl.nonOperating?.expense || 0)}</td>
                  <td class="text-right">${formatPercent(this.calculateRatio(pl.nonOperating?.expense, pl.revenue))}</td>
                </tr>

                <!-- 経常利益 -->
                <tr style="background-color: var(--color-bg-tertiary);">
                  <td><strong>経常利益</strong></td>
                  <td class="text-right"><strong>${formatValue(results.ordinaryProfit)}</strong></td>
                  <td class="text-right"><strong>${formatValue(results.margins.ordinaryProfitMargin, true)}</strong></td>
                </tr>

                <!-- 法人税等 -->
                <tr>
                  <td style="padding-left: 1.5rem;">法人税等</td>
                  <td class="text-right">${formatCurrency(pl.tax || 0)}</td>
                  <td class="text-right">${formatPercent(this.calculateRatio(pl.tax, pl.revenue))}</td>
                </tr>

                <!-- 当期純利益 -->
                <tr style="background-color: var(--color-primary-lighter);">
                  <td><strong>当期純利益</strong></td>
                  <td class="text-right"><strong>${formatValue(results.netProfit)}</strong></td>
                  <td class="text-right"><strong>${formatValue(results.margins.netProfitMargin, true)}</strong></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * 構成比率を計算
   * @param {number} value - 値
   * @param {number} total - 全体（売上高）
   * @returns {number} 比率（パーセント）
   */
  calculateRatio(value, total) {
    if (!total || total === 0) return 0;
    return ((value || 0) / total) * 100;
  }

  /**
   * イベントリスナーをアタッチ
   */
  attachEventListeners() {
    // フォーム送信イベント
    const form = document.getElementById('plInputForm');
    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        this.handleSave();
      });
    }

    // 入力変更時の自動更新
    const inputs = form?.querySelectorAll('input[type="number"]');
    if (inputs) {
      inputs.forEach(input => {
        input.addEventListener('input', () => {
          this.handleInputChange();
        });
      });
    }

    // 期間セレクタ変更イベント
    const periodSelector = document.getElementById('periodSelector');
    if (periodSelector) {
      periodSelector.addEventListener('change', (e) => {
        this.handlePeriodChange(parseInt(e.target.value));
      });
    }
  }

  /**
   * 入力変更ハンドラ（リアルタイム表示更新）
   */
  handleInputChange() {
    const formData = this.getFormData();

    // 一時的にperiodDataを更新（保存はしない）
    this.periodData = {
      ...this.periodData,
      pl: formData
    };

    // テーブル部分のみ再レンダリング
    const tableContainer = this.container.querySelector('.grid > .card:nth-child(2)');
    if (tableContainer) {
      tableContainer.outerHTML = this.renderPLTable();
    }
  }

  /**
   * 保存ハンドラ
   */
  handleSave() {
    const formData = this.getFormData();

    // 状態を更新
    updatePeriod(this.periodIndex, {
      ...this.periodData,
      pl: formData
    });

    // 成功メッセージを表示
    this.showSuccessMessage();

    // データを再読み込みして表示
    const state = getState();
    this.periodData = state.periods[this.periodIndex];
  }

  /**
   * フォームデータを取得
   * @returns {Object} P/Lデータ
   */
  getFormData() {
    const getValue = (id) => {
      const input = document.getElementById(id);
      return input ? parseFloat(input.value) || 0 : 0;
    };

    return {
      revenue: getValue('revenue'),
      cogs: getValue('cogs'),
      sgaExpenses: {
        personnel: getValue('personnel'),
        rent: getValue('rent'),
        utilities: getValue('utilities'),
        marketing: getValue('marketing'),
        other: getValue('other')
      },
      nonOperating: {
        income: getValue('nonOperatingIncome'),
        expense: getValue('nonOperatingExpense')
      },
      tax: getValue('tax')
    };
  }

  /**
   * 期間変更ハンドラ
   * @param {number} index - 新しい期間インデックス
   */
  handlePeriodChange(index) {
    setCurrentPeriod(index);
    const state = getState();
    this.render(state.periods[index], index);
  }

  /**
   * 成功メッセージを表示
   */
  showSuccessMessage() {
    // 既存のメッセージがあれば削除
    const existingMessage = document.querySelector('.save-success-message');
    if (existingMessage) {
      existingMessage.remove();
    }

    // 成功メッセージを作成
    const message = document.createElement('div');
    message.className = 'alert alert-success save-success-message';
    message.style.position = 'fixed';
    message.style.top = '20px';
    message.style.right = '20px';
    message.style.zIndex = '9999';
    message.style.minWidth = '300px';
    message.textContent = 'データを保存しました';

    document.body.appendChild(message);

    // 3秒後に自動削除
    setTimeout(() => {
      message.remove();
    }, 3000);
  }

  /**
   * グラフをレンダリング
   */
  renderCharts() {
    const state = getState();
    const periods = state.periods || [];

    // P/Lデータを準備（ChartsViewが期待する形式に変換）
    const plData = {
      cogs: this.periodData.pl?.cogs || 0,
      laborCost: this.periodData.pl?.sgaExpenses?.personnel || 0,
      rent: this.periodData.pl?.sgaExpenses?.rent || 0,
      utilities: this.periodData.pl?.sgaExpenses?.utilities || 0,
      advertising: this.periodData.pl?.sgaExpenses?.marketing || 0,
      otherExpenses: this.periodData.pl?.sgaExpenses?.other || 0
    };

    // 費用構成グラフ
    this.chartsView.renderExpenseChart('plExpenseChart', plData);

    // 費用推移グラフ
    this.chartsView.renderExpenseTrendChart('plExpenseTrendChart', periods);
  }
}
