/**
 * DCF分析ビューの実装
 * @module views/dcf
 */

import { getState } from '../utils/state.js';
import { calculatePLResults } from '../utils/pl-calc.js';
import { calculateFreeCashFlow, calculateOperatingCF, calculateInvestingCF } from '../utils/cf-calc.js';
import {
  calculateDCF,
  calculateWACC,
  formatCurrency,
  formatPercent
} from '../utils/dcf-calc.js';

/**
 * DCF分析ビュークラス
 */
export class DCFView {
  /**
   * コンストラクタ
   * @param {HTMLElement} container - コンテナ要素
   */
  constructor(container) {
    this.container = container;
    this.params = {
      projectedFCF: [],
      discountRate: 0.10,
      terminalGrowthRate: 0.02,
      totalDebt: 0,
      cash: 0,
      forecastYears: 5,
      fcfGrowthRate: 0.05
    };
    this.result = null;
  }

  /**
   * ビューをレンダリング
   */
  render() {
    // 現在のデータからFCFを推定
    this.estimateFromCurrentData();

    const html = `
      <div class="page-content">
        <h2 class="page-title">DCF分析（割引キャッシュフロー法）</h2>
        <p style="color: var(--color-text-secondary); margin-bottom: 1.5rem;">
          将来のフリーキャッシュフローを現在価値に割り引いて企業価値を算出します。
        </p>

        <!-- パラメータ入力 -->
        ${this.renderParameterSection()}

        <!-- 計算実行ボタン -->
        <div style="margin-bottom: 1.5rem; text-align: center;">
          <button id="dcfCalcBtn" class="btn btn-primary" style="padding: 12px 40px; font-size: 1rem;">
            企業価値を算出
          </button>
        </div>

        <!-- 計算結果 -->
        <div id="dcfResults">
          ${this.result ? this.renderResults() : this.renderEmptyState()}
        </div>
      </div>
    `;

    this.container.innerHTML = html;
    this.attachEventListeners();
  }

  /**
   * 現在のデータからFCFを推定
   */
  estimateFromCurrentData() {
    const state = getState();
    if (!state.periods || state.periods.length === 0) return;

    const period = state.periods[state.currentPeriodIndex || 0];
    if (!period) return;

    // B/Sから負債・現金を取得
    const bs = period.bs || {};
    this.params.cash = bs.assets?.current?.cash || 0;
    this.params.totalDebt = (bs.liabilities?.current?.shortTermDebt || 0) +
                            (bs.liabilities?.fixed?.longTermDebt || 0);

    // C/FからFCFを推定
    const cf = period.cf || {};
    const operatingCF = calculateOperatingCF(cf.operating || {});
    const investingCF = calculateInvestingCF(cf.investing || {});
    const baseFCF = calculateFreeCashFlow(operatingCF, investingCF);

    // 予測FCFを生成
    if (baseFCF !== 0) {
      this.params.projectedFCF = [];
      for (let i = 0; i < this.params.forecastYears; i++) {
        this.params.projectedFCF.push(
          Math.round(baseFCF * Math.pow(1 + this.params.fcfGrowthRate, i + 1))
        );
      }
    }
  }

  /**
   * パラメータ入力セクションをレンダリング
   */
  renderParameterSection() {
    return `
      <div class="card mb-4">
        <div class="card-header">
          <h3 class="card-title">前提条件</h3>
        </div>
        <div class="card-body">
          <div class="grid grid-cols-3" style="gap: 1.5rem;">
            <!-- 割引率 -->
            <div class="form-group">
              <label class="form-label">割引率（WACC）</label>
              <div style="display: flex; align-items: center; gap: 8px;">
                <input type="number" id="dcfDiscountRate" class="form-input"
                  value="${(this.params.discountRate * 100).toFixed(1)}" step="0.5" min="0" max="50">
                <span>%</span>
              </div>
            </div>

            <!-- 永久成長率 -->
            <div class="form-group">
              <label class="form-label">永久成長率</label>
              <div style="display: flex; align-items: center; gap: 8px;">
                <input type="number" id="dcfGrowthRate" class="form-input"
                  value="${(this.params.terminalGrowthRate * 100).toFixed(1)}" step="0.5" min="0" max="10">
                <span>%</span>
              </div>
            </div>

            <!-- 予測期間 -->
            <div class="form-group">
              <label class="form-label">予測期間</label>
              <div style="display: flex; align-items: center; gap: 8px;">
                <input type="number" id="dcfForecastYears" class="form-input"
                  value="${this.params.forecastYears}" step="1" min="1" max="20">
                <span>年</span>
              </div>
            </div>

            <!-- FCF成長率 -->
            <div class="form-group">
              <label class="form-label">FCF成長率</label>
              <div style="display: flex; align-items: center; gap: 8px;">
                <input type="number" id="dcfFCFGrowthRate" class="form-input"
                  value="${(this.params.fcfGrowthRate * 100).toFixed(1)}" step="0.5" min="-50" max="100">
                <span>%</span>
              </div>
            </div>

            <!-- 有利子負債 -->
            <div class="form-group">
              <label class="form-label">有利子負債</label>
              <input type="number" id="dcfTotalDebt" class="form-input"
                value="${this.params.totalDebt}" step="10000">
            </div>

            <!-- 現金 -->
            <div class="form-group">
              <label class="form-label">現金・現金同等物</label>
              <input type="number" id="dcfCash" class="form-input"
                value="${this.params.cash}" step="10000">
            </div>
          </div>

          <!-- 予測FCF入力 -->
          <div style="margin-top: 1.5rem;">
            <label class="form-label">予測フリーキャッシュフロー（各年度）</label>
            <div id="fcfInputs" class="grid grid-cols-5" style="gap: 0.75rem;">
              ${this.params.projectedFCF.map((fcf, i) => `
                <div class="form-group">
                  <label class="form-label" style="font-size: 0.75rem;">${i + 1}年目</label>
                  <input type="number" class="form-input fcf-input" data-index="${i}"
                    value="${fcf}" step="10000">
                </div>
              `).join('')}
            </div>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * 空の状態をレンダリング
   */
  renderEmptyState() {
    return `
      <div class="card">
        <div class="card-body" style="text-align: center; padding: 3rem; color: var(--color-text-secondary);">
          <p style="font-size: 1.1rem;">上のパラメータを設定して「企業価値を算出」をクリックしてください</p>
        </div>
      </div>
    `;
  }

  /**
   * 計算結果をレンダリング
   */
  renderResults() {
    if (!this.result) return '';

    if (this.result.error) {
      return `
        <div class="card">
          <div class="card-body">
            <div class="alert alert-warning">${this.result.error}</div>
          </div>
        </div>
      `;
    }

    return `
      <!-- 企業価値サマリ -->
      <div class="card mb-4">
        <div class="card-header">
          <h3 class="card-title">算出結果</h3>
        </div>
        <div class="card-body">
          <div class="grid grid-cols-3" style="gap: 1rem;">
            <div class="kpi-card kpi-good">
              <div class="kpi-label">企業価値（EV）</div>
              <div class="kpi-value">${formatCurrency(this.result.enterpriseValue)}</div>
            </div>
            <div class="kpi-card" style="background: var(--color-primary-lighter); border-left: 4px solid var(--color-primary);">
              <div class="kpi-label">株式価値</div>
              <div class="kpi-value">${formatCurrency(this.result.equityValue)}</div>
            </div>
            <div class="kpi-card" style="background: var(--color-secondary-lighter); border-left: 4px solid var(--color-secondary);">
              <div class="kpi-label">ターミナルバリュー</div>
              <div class="kpi-value">${formatCurrency(this.result.terminalValue)}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- 詳細テーブル -->
      <div class="card mb-4">
        <div class="card-header">
          <h3 class="card-title">キャッシュフローの現在価値 詳細</h3>
        </div>
        <div class="card-body">
          <table class="data-table" style="width: 100%;">
            <thead>
              <tr>
                <th>年度</th>
                <th style="text-align: right;">予測FCF</th>
                <th style="text-align: right;">現在価値</th>
              </tr>
            </thead>
            <tbody>
              ${this.params.projectedFCF.map((fcf, i) => `
                <tr>
                  <td>${i + 1}年目</td>
                  <td style="text-align: right;">${formatCurrency(fcf)}</td>
                  <td style="text-align: right;">${formatCurrency(this.result.presentValues[i])}</td>
                </tr>
              `).join('')}
              <tr style="font-weight: bold; border-top: 2px solid var(--color-border);">
                <td>FCF現在価値合計</td>
                <td></td>
                <td style="text-align: right;">${formatCurrency(this.result.sumPV)}</td>
              </tr>
              <tr>
                <td>ターミナルバリュー（現在価値）</td>
                <td></td>
                <td style="text-align: right;">${formatCurrency(this.result.terminalValuePV)}</td>
              </tr>
              <tr style="font-weight: bold; background: var(--color-gray-50);">
                <td>企業価値合計</td>
                <td></td>
                <td style="text-align: right;">${formatCurrency(this.result.enterpriseValue)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- 構成比 -->
      <div class="card">
        <div class="card-header">
          <h3 class="card-title">企業価値の構成</h3>
        </div>
        <div class="card-body">
          ${this.renderCompositionBar()}
        </div>
      </div>
    `;
  }

  /**
   * 構成比のバーチャートをレンダリング
   */
  renderCompositionBar() {
    if (!this.result || this.result.enterpriseValue === 0) return '';

    const fcfPercent = (this.result.sumPV / this.result.enterpriseValue * 100).toFixed(1);
    const tvPercent = (this.result.terminalValuePV / this.result.enterpriseValue * 100).toFixed(1);

    return `
      <div style="margin-bottom: 1rem;">
        <div style="display: flex; height: 40px; border-radius: var(--radius-md); overflow: hidden;">
          <div style="width: ${fcfPercent}%; background: var(--color-primary); display: flex; align-items: center; justify-content: center; color: white; font-size: 0.85rem; font-weight: 600;">
            FCF ${fcfPercent}%
          </div>
          <div style="width: ${tvPercent}%; background: var(--color-info); display: flex; align-items: center; justify-content: center; color: white; font-size: 0.85rem; font-weight: 600;">
            TV ${tvPercent}%
          </div>
        </div>
        <div style="display: flex; justify-content: space-between; margin-top: 0.5rem; font-size: 0.8rem; color: var(--color-text-secondary);">
          <span>FCF現在価値: ${formatCurrency(this.result.sumPV)}</span>
          <span>ターミナルバリュー現在価値: ${formatCurrency(this.result.terminalValuePV)}</span>
        </div>
      </div>
    `;
  }

  /**
   * イベントリスナーをアタッチ
   */
  attachEventListeners() {
    // 計算ボタン
    const calcBtn = document.getElementById('dcfCalcBtn');
    if (calcBtn) {
      calcBtn.addEventListener('click', () => this.handleCalculate());
    }

    // FCF入力の変更
    const fcfInputs = document.querySelectorAll('.fcf-input');
    fcfInputs.forEach(input => {
      input.addEventListener('change', (e) => {
        const index = parseInt(e.target.dataset.index);
        this.params.projectedFCF[index] = parseFloat(e.target.value) || 0;
      });
    });

    // パラメータ変更時にFCFを再生成
    const forecastYearsInput = document.getElementById('dcfForecastYears');
    const fcfGrowthInput = document.getElementById('dcfFCFGrowthRate');
    if (forecastYearsInput) {
      forecastYearsInput.addEventListener('change', () => this.handleParamChange());
    }
    if (fcfGrowthInput) {
      fcfGrowthInput.addEventListener('change', () => this.handleParamChange());
    }
  }

  /**
   * パラメータ変更ハンドラ
   */
  handleParamChange() {
    this.readParams();

    // FCFを再生成
    const state = getState();
    const period = state.periods?.[state.currentPeriodIndex || 0];
    if (period) {
      const cf = period.cf || {};
      const operatingCF = calculateOperatingCF(cf.operating || {});
      const investingCF = calculateInvestingCF(cf.investing || {});
      const baseFCF = calculateFreeCashFlow(operatingCF, investingCF);

      if (baseFCF !== 0) {
        this.params.projectedFCF = [];
        for (let i = 0; i < this.params.forecastYears; i++) {
          this.params.projectedFCF.push(
            Math.round(baseFCF * Math.pow(1 + this.params.fcfGrowthRate, i + 1))
          );
        }
      } else {
        // baseFCFが0の場合は年数分の0を用意
        this.params.projectedFCF = new Array(this.params.forecastYears).fill(0);
      }
    }

    this.render();
  }

  /**
   * 入力値を読み取り
   */
  readParams() {
    const getVal = (id) => parseFloat(document.getElementById(id)?.value) || 0;

    this.params.discountRate = getVal('dcfDiscountRate') / 100;
    this.params.terminalGrowthRate = getVal('dcfGrowthRate') / 100;
    this.params.forecastYears = Math.max(1, Math.round(getVal('dcfForecastYears')));
    this.params.fcfGrowthRate = getVal('dcfFCFGrowthRate') / 100;
    this.params.totalDebt = getVal('dcfTotalDebt');
    this.params.cash = getVal('dcfCash');

    // FCF値を読み取り
    const fcfInputs = document.querySelectorAll('.fcf-input');
    fcfInputs.forEach(input => {
      const index = parseInt(input.dataset.index);
      this.params.projectedFCF[index] = parseFloat(input.value) || 0;
    });
  }

  /**
   * 計算実行ハンドラ
   */
  handleCalculate() {
    this.readParams();

    this.result = calculateDCF({
      projectedFCF: this.params.projectedFCF,
      discountRate: this.params.discountRate,
      terminalGrowthRate: this.params.terminalGrowthRate,
      totalDebt: this.params.totalDebt,
      cash: this.params.cash
    });

    // 結果エリアだけ更新
    const resultsDiv = document.getElementById('dcfResults');
    if (resultsDiv) {
      resultsDiv.innerHTML = this.renderResults();
    }
  }
}
