/**
 * キャッシュフロー計算書ビュー
 * @module views/cf
 */

import { getState, updatePeriod } from '../utils/state.js';
import { calculateOrdinaryProfit } from '../models/period.js';
import {
  calculateAllCashFlows,
  formatCurrency,
  isNegative
} from '../utils/cf-calc.js';
import { ChartsView } from './charts.js';

/**
 * C/Fビュークラス
 */
export class CFView {
  /**
   * コンストラクタ
   * @param {HTMLElement} container - コンテナ要素
   */
  constructor(container) {
    this.container = container;
    this.periodIndex = 0;
    this.cfData = null;
    this.plData = null;
    this.calculations = null;
    this.chartsView = new ChartsView(container);
  }

  /**
   * C/Fビューをレンダリング
   * @param {number} periodIndex - 期間インデックス
   */
  render(periodIndex = 0) {
    this.periodIndex = periodIndex;

    // 状態から期間データを取得
    const state = getState();
    if (!state.periods || state.periods.length === 0) {
      this.renderError('期間データが見つかりません');
      return;
    }

    const period = state.periods[periodIndex];
    if (!period) {
      this.renderError('指定された期間が見つかりません');
      return;
    }

    this.cfData = period.cf;
    this.plData = period.pl;

    // P/Lから税引前利益を自動取得
    if (this.plData) {
      const ordinaryProfit = calculateOrdinaryProfit(this.plData);
      this.cfData.operating.profitBeforeTax = ordinaryProfit;
    }

    // C/F計算を実行
    this.calculations = calculateAllCashFlows(this.cfData);

    // HTMLを生成
    const html = `
      <div class="page-content">
        <h2 class="page-title">キャッシュフロー計算書 (C/F)</h2>

        <!-- 期間選択 -->
        ${this.renderPeriodSelector(state.periods, periodIndex)}

        <!-- サマリーカード -->
        ${this.renderSummaryCards()}

        <!-- 営業活動によるCF -->
        ${this.renderOperatingCF()}

        <!-- 投資活動によるCF -->
        ${this.renderInvestingCF()}

        <!-- 財務活動によるCF -->
        ${this.renderFinancingCF()}

        <!-- 期首・期末現金残高 -->
        ${this.renderCashPosition()}

        <!-- C/F集計表 -->
        ${this.renderCFSummaryTable()}

        <!-- C/Fウォーターフォールチャート -->
        <div class="card" style="margin-top: 1.5rem;">
          <div class="card-header">
            <h3 class="card-title">キャッシュフロー推移（ウォーターフォール）</h3>
          </div>
          <div class="card-body" style="height: 400px;">
            <canvas id="cfWaterfallChart"></canvas>
          </div>
        </div>
      </div>
    `;

    this.container.innerHTML = html;
    this.attachEventListeners();
    this.renderCharts();
  }

  /**
   * 期間選択セレクタをレンダリング
   */
  renderPeriodSelector(periods, currentIndex) {
    const options = periods.map((p, i) =>
      `<option value="${i}" ${i === currentIndex ? 'selected' : ''}>
        ${p.year}年${p.month}月
      </option>`
    ).join('');

    return `
      <div class="card mb-4">
        <div class="card-body">
          <div class="form-group" style="margin-bottom: 0;">
            <label class="form-label">対象期間</label>
            <select id="periodSelector" class="form-select" style="max-width: 300px;">
              ${options}
            </select>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * サマリーカードをレンダリング
   */
  renderSummaryCards() {
    const { operatingCF, investingCF, financingCF, freeCashFlow } = this.calculations;

    return `
      <div class="grid grid-cols-4 mb-6">
        <div class="card">
          <div class="card-body">
            <h3 class="text-muted" style="font-size: 0.875rem; margin-bottom: 0.5rem;">営業CF</h3>
            <p style="font-size: 1.5rem; font-weight: bold; margin: 0; color: ${isNegative(operatingCF) ? 'var(--color-danger)' : 'var(--color-success)'};">
              ¥${formatCurrency(operatingCF)}
            </p>
          </div>
        </div>
        <div class="card">
          <div class="card-body">
            <h3 class="text-muted" style="font-size: 0.875rem; margin-bottom: 0.5rem;">投資CF</h3>
            <p style="font-size: 1.5rem; font-weight: bold; margin: 0; color: ${isNegative(investingCF) ? 'var(--color-danger)' : 'var(--color-success)'};">
              ¥${formatCurrency(investingCF)}
            </p>
          </div>
        </div>
        <div class="card">
          <div class="card-body">
            <h3 class="text-muted" style="font-size: 0.875rem; margin-bottom: 0.5rem;">財務CF</h3>
            <p style="font-size: 1.5rem; font-weight: bold; margin: 0; color: ${isNegative(financingCF) ? 'var(--color-danger)' : 'var(--color-success)'};">
              ¥${formatCurrency(financingCF)}
            </p>
          </div>
        </div>
        <div class="card">
          <div class="card-body">
            <h3 class="text-muted" style="font-size: 0.875rem; margin-bottom: 0.5rem;">フリーCF</h3>
            <p style="font-size: 1.5rem; font-weight: bold; margin: 0; color: ${isNegative(freeCashFlow) ? 'var(--color-danger)' : 'var(--color-success)'};">
              ¥${formatCurrency(freeCashFlow)}
            </p>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * 営業活動によるCFをレンダリング
   */
  renderOperatingCF() {
    const { operating } = this.cfData;

    return `
      <div class="card mb-4">
        <div class="card-header">
          <h3 class="card-title">営業活動によるキャッシュフロー</h3>
        </div>
        <div class="card-body">
          <div class="grid grid-cols-2">
            <div class="form-group">
              <label class="form-label">税引前当期純利益（P/Lから自動取得）</label>
              <input type="number"
                     class="form-control"
                     id="profitBeforeTax"
                     value="${operating.profitBeforeTax}"
                     readonly
                     style="background-color: var(--color-bg-tertiary);">
              <small class="form-help">P/Lの経常利益が自動的に反映されます</small>
            </div>

            <div class="form-group">
              <label class="form-label">減価償却費</label>
              <input type="number"
                     class="form-control cf-input"
                     id="depreciation"
                     value="${operating.depreciation}"
                     data-section="operating"
                     data-field="depreciation">
              <small class="form-help">非現金支出項目（加算）</small>
            </div>

            <div class="form-group">
              <label class="form-label">売上債権の増減</label>
              <input type="number"
                     class="form-control cf-input"
                     id="receivablesChange"
                     value="${operating.receivablesChange}"
                     data-section="operating"
                     data-field="receivablesChange">
              <small class="form-help">増加：正の値、減少：負の値</small>
            </div>

            <div class="form-group">
              <label class="form-label">棚卸資産の増減</label>
              <input type="number"
                     class="form-control cf-input"
                     id="inventoryChange"
                     value="${operating.inventoryChange}"
                     data-section="operating"
                     data-field="inventoryChange">
              <small class="form-help">増加：正の値、減少：負の値</small>
            </div>

            <div class="form-group">
              <label class="form-label">仕入債務の増減</label>
              <input type="number"
                     class="form-control cf-input"
                     id="payablesChange"
                     value="${operating.payablesChange}"
                     data-section="operating"
                     data-field="payablesChange">
              <small class="form-help">増加：正の値、減少：負の値</small>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * 投資活動によるCFをレンダリング
   */
  renderInvestingCF() {
    const { investing } = this.cfData;

    return `
      <div class="card mb-4">
        <div class="card-header">
          <h3 class="card-title">投資活動によるキャッシュフロー</h3>
        </div>
        <div class="card-body">
          <div class="grid grid-cols-2">
            <div class="form-group">
              <label class="form-label">有形固定資産の取得</label>
              <input type="number"
                     class="form-control cf-input"
                     id="tangibleAcquisition"
                     value="${investing.tangibleAcquisition}"
                     data-section="investing"
                     data-field="tangibleAcquisition">
              <small class="form-help">取得額を正の値で入力（CFはマイナス）</small>
            </div>

            <div class="form-group">
              <label class="form-label">有形固定資産の売却</label>
              <input type="number"
                     class="form-control cf-input"
                     id="tangibleDisposal"
                     value="${investing.tangibleDisposal}"
                     data-section="investing"
                     data-field="tangibleDisposal">
              <small class="form-help">売却額を正の値で入力（CFはプラス）</small>
            </div>

            <div class="form-group">
              <label class="form-label">無形固定資産の取得</label>
              <input type="number"
                     class="form-control cf-input"
                     id="intangibleAcquisition"
                     value="${investing.intangibleAcquisition}"
                     data-section="investing"
                     data-field="intangibleAcquisition">
              <small class="form-help">取得額を正の値で入力（CFはマイナス）</small>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * 財務活動によるCFをレンダリング
   */
  renderFinancingCF() {
    const { financing } = this.cfData;

    return `
      <div class="card mb-4">
        <div class="card-header">
          <h3 class="card-title">財務活動によるキャッシュフロー</h3>
        </div>
        <div class="card-body">
          <div class="grid grid-cols-2">
            <div class="form-group">
              <label class="form-label">短期借入金の増減</label>
              <input type="number"
                     class="form-control cf-input"
                     id="shortTermDebtChange"
                     value="${financing.shortTermDebtChange}"
                     data-section="financing"
                     data-field="shortTermDebtChange">
              <small class="form-help">増加：正の値、減少：負の値</small>
            </div>

            <div class="form-group">
              <label class="form-label">長期借入金の借入</label>
              <input type="number"
                     class="form-control cf-input"
                     id="longTermBorrowing"
                     value="${financing.longTermBorrowing}"
                     data-section="financing"
                     data-field="longTermBorrowing">
              <small class="form-help">借入額を正の値で入力</small>
            </div>

            <div class="form-group">
              <label class="form-label">長期借入金の返済</label>
              <input type="number"
                     class="form-control cf-input"
                     id="longTermRepayment"
                     value="${financing.longTermRepayment}"
                     data-section="financing"
                     data-field="longTermRepayment">
              <small class="form-help">返済額を正の値で入力（CFはマイナス）</small>
            </div>

            <div class="form-group">
              <label class="form-label">配当金の支払</label>
              <input type="number"
                     class="form-control cf-input"
                     id="dividendPaid"
                     value="${financing.dividendPaid}"
                     data-section="financing"
                     data-field="dividendPaid">
              <small class="form-help">配当額を正の値で入力（CFはマイナス）</small>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * 期首・期末現金残高をレンダリング
   */
  renderCashPosition() {
    const { beginningCash } = this.cfData;
    const { endingCash } = this.calculations;

    return `
      <div class="card mb-4">
        <div class="card-header">
          <h3 class="card-title">現金及び現金同等物</h3>
        </div>
        <div class="card-body">
          <div class="grid grid-cols-2">
            <div class="form-group">
              <label class="form-label">期首現金残高</label>
              <input type="number"
                     class="form-control cf-input"
                     id="beginningCash"
                     value="${beginningCash}"
                     data-section="root"
                     data-field="beginningCash">
            </div>

            <div class="form-group">
              <label class="form-label">期末現金残高（自動計算）</label>
              <input type="number"
                     class="form-control"
                     id="endingCash"
                     value="${endingCash}"
                     readonly
                     style="background-color: var(--color-bg-tertiary); font-weight: bold; color: ${isNegative(endingCash) ? 'var(--color-danger)' : 'var(--color-success)'};">
              <small class="form-help">期首残高 + 現金増減額</small>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * C/F集計表をレンダリング
   */
  renderCFSummaryTable() {
    const { operatingCF, investingCF, financingCF, netCashFlow, freeCashFlow } = this.calculations;
    const { beginningCash } = this.cfData;
    const endingCash = beginningCash + netCashFlow;

    const renderRow = (label, value, isSubtotal = false, isTotal = false) => {
      const style = isTotal
        ? 'font-weight: bold; font-size: 1.1rem; background-color: var(--color-bg-tertiary);'
        : isSubtotal
        ? 'font-weight: 600; background-color: var(--color-bg-secondary);'
        : '';

      const valueColor = isNegative(value) ? 'color: var(--color-danger);' : '';

      return `
        <tr style="${style}">
          <td>${label}</td>
          <td class="text-right" style="${valueColor}">¥${formatCurrency(value)}</td>
        </tr>
      `;
    };

    return `
      <div class="card">
        <div class="card-header">
          <h3 class="card-title">キャッシュフロー集計表</h3>
        </div>
        <div class="card-body">
          <div class="table-container">
            <table class="table">
              <thead>
                <tr>
                  <th>項目</th>
                  <th class="text-right">金額（円）</th>
                </tr>
              </thead>
              <tbody>
                ${renderRow('I. 営業活動によるキャッシュフロー', operatingCF, true)}
                ${renderRow('II. 投資活動によるキャッシュフロー', investingCF, true)}
                ${renderRow('III. 財務活動によるキャッシュフロー', financingCF, true)}
                <tr style="height: 10px;"><td colspan="2"></td></tr>
                ${renderRow('フリーキャッシュフロー (I + II)', freeCashFlow, false, true)}
                ${renderRow('現金の増減額 (I + II + III)', netCashFlow, false, true)}
                <tr style="height: 10px;"><td colspan="2"></td></tr>
                ${renderRow('現金及び現金同等物の期首残高', beginningCash)}
                ${renderRow('現金及び現金同等物の期末残高', endingCash, false, true)}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * エラー表示
   */
  renderError(message) {
    this.container.innerHTML = `
      <div class="page-content">
        <h2 class="page-title">キャッシュフロー計算書 (C/F)</h2>
        <div class="alert alert-danger">
          ${message}
        </div>
      </div>
    `;
  }

  /**
   * イベントリスナーを設定
   */
  attachEventListeners() {
    // 期間選択の変更イベント
    const periodSelector = document.getElementById('periodSelector');
    if (periodSelector) {
      periodSelector.addEventListener('change', (e) => {
        this.render(parseInt(e.target.value));
      });
    }

    // C/F入力フィールドの変更イベント
    const inputs = document.querySelectorAll('.cf-input');
    inputs.forEach(input => {
      input.addEventListener('input', (e) => {
        this.handleInputChange(e.target);
      });
    });
  }

  /**
   * 入力値変更時の処理
   */
  handleInputChange(input) {
    const section = input.dataset.section;
    const field = input.dataset.field;
    const value = parseFloat(input.value) || 0;

    // C/Fデータを更新
    if (section === 'root') {
      this.cfData[field] = value;
    } else {
      this.cfData[section][field] = value;
    }

    // 状態を更新
    const state = getState();
    const period = state.periods[this.periodIndex];
    period.cf = this.cfData;
    updatePeriod(this.periodIndex, period);

    // 再計算と再レンダリング
    this.calculations = calculateAllCashFlows(this.cfData);
    this.updateCalculatedValues();
  }

  /**
   * 計算値を更新（再レンダリングせずに値のみ更新）
   */
  updateCalculatedValues() {
    const { operatingCF, investingCF, financingCF, netCashFlow, endingCash, freeCashFlow } = this.calculations;

    // サマリーカードの更新
    this.updateSummaryCard(0, operatingCF);
    this.updateSummaryCard(1, investingCF);
    this.updateSummaryCard(2, financingCF);
    this.updateSummaryCard(3, freeCashFlow);

    // 期末現金残高の更新
    const endingCashInput = document.getElementById('endingCash');
    if (endingCashInput) {
      endingCashInput.value = endingCash;
      endingCashInput.style.color = isNegative(endingCash) ? 'var(--color-danger)' : 'var(--color-success)';
    }

    // 集計表の更新（完全に再レンダリング）
    this.render(this.periodIndex);
  }

  /**
   * サマリーカードの値を更新
   */
  updateSummaryCard(index, value) {
    const cards = document.querySelectorAll('.grid.grid-cols-4 .card p');
    if (cards[index]) {
      cards[index].textContent = `¥${formatCurrency(value)}`;
      cards[index].style.color = isNegative(value) ? 'var(--color-danger)' : 'var(--color-success)';
    }
  }

  /**
   * グラフをレンダリング
   */
  renderCharts() {
    const { operatingCF, investingCF, financingCF, endingCash } = this.calculations;

    // C/Fデータを準備（ChartsViewが期待する形式に変換）
    const cfData = {
      openingBalance: this.cfData.openingCash || 0,
      operatingCF: operatingCF,
      investingCF: investingCF,
      financingCF: financingCF,
      closingBalance: endingCash
    };

    // C/Fウォーターフォールチャート
    this.chartsView.renderCFWaterfallChart('cfWaterfallChart', cfData);
  }
}
