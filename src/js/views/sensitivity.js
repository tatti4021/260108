/**
 * 感度分析ビューの実装
 * @module views/sensitivity
 */

import { getState } from '../utils/state.js';
import { calculatePLResults } from '../utils/pl-calc.js';
import {
  analyzeSalesImpact,
  analyzeSingleVariable,
  generateTornadoData,
  formatValue,
  formatPercent
} from '../utils/sensitivity-calc.js';

/**
 * 感度分析ビュークラス
 */
export class SensitivityView {
  /**
   * コンストラクタ
   * @param {HTMLElement} container - コンテナ要素
   */
  constructor(container) {
    this.container = container;
    this.analysisResult = null;
    this.tornadoData = null;
    this.variableCostRatio = 0.3;
  }

  /**
   * ビューをレンダリング
   */
  render() {
    const state = getState();
    const period = state.periods?.[state.currentPeriodIndex || 0];

    const html = `
      <div class="page-content">
        <h2 class="page-title">感度分析</h2>
        <p style="color: var(--color-text-secondary); margin-bottom: 1.5rem;">
          主要な変数が変動した場合の営業利益への影響を分析します。
        </p>

        <!-- 変動費率設定 -->
        ${this.renderSettings()}

        <!-- 分析実行ボタン -->
        <div style="margin-bottom: 1.5rem; text-align: center;">
          <button id="sensitivityCalcBtn" class="btn btn-primary" style="padding: 12px 40px; font-size: 1rem;">
            感度分析を実行
          </button>
        </div>

        <!-- 結果表示エリア -->
        <div id="sensitivityResults">
          ${this.analysisResult ? this.renderResults() : this.renderEmptyState()}
        </div>
      </div>
    `;

    this.container.innerHTML = html;
    this.attachEventListeners();
  }

  /**
   * 設定セクションをレンダリング
   */
  renderSettings() {
    const state = getState();
    const period = state.periods?.[state.currentPeriodIndex || 0];
    const pl = period?.pl || {};
    const revenue = pl.revenue || 0;
    const cogs = pl.cogs || 0;
    const plResults = calculatePLResults(pl);

    return `
      <div class="card mb-4">
        <div class="card-header">
          <h3 class="card-title">分析設定</h3>
        </div>
        <div class="card-body">
          <div class="grid grid-cols-2" style="gap: 1.5rem;">
            <div>
              <h4 style="margin-bottom: 1rem; font-size: 0.95rem;">現在の財務データ</h4>
              <table class="data-table" style="width: 100%;">
                <tbody>
                  <tr>
                    <td>売上高</td>
                    <td style="text-align: right;">¥${revenue.toLocaleString('ja-JP')}</td>
                  </tr>
                  <tr>
                    <td>売上原価</td>
                    <td style="text-align: right;">¥${cogs.toLocaleString('ja-JP')}</td>
                  </tr>
                  <tr>
                    <td>販管費合計</td>
                    <td style="text-align: right;">¥${plResults.sgaTotal.toLocaleString('ja-JP')}</td>
                  </tr>
                  <tr style="font-weight: bold;">
                    <td>営業利益</td>
                    <td style="text-align: right;">¥${plResults.operatingProfit.toLocaleString('ja-JP')}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div>
              <h4 style="margin-bottom: 1rem; font-size: 0.95rem;">変動費率の設定</h4>
              <div class="form-group">
                <label class="form-label">売上原価に占める変動費の割合</label>
                <div style="display: flex; align-items: center; gap: 8px;">
                  <input type="number" id="sensitivityVarCostRatio" class="form-input"
                    value="${(this.variableCostRatio * 100).toFixed(0)}" step="5" min="0" max="100"
                    style="width: 100px;">
                  <span>%</span>
                </div>
                <p style="font-size: 0.8rem; color: var(--color-text-secondary); margin-top: 0.5rem;">
                  製造業: 60-80%、サービス業: 20-40% が目安です
                </p>
              </div>
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
          <p style="font-size: 1.1rem;">「感度分析を実行」をクリックして分析結果を表示してください</p>
        </div>
      </div>
    `;
  }

  /**
   * 分析結果をレンダリング
   */
  renderResults() {
    if (!this.analysisResult) return '';

    return `
      <!-- 売上高感度分析 -->
      ${this.renderSalesImpactTable()}

      <!-- トルネードチャート -->
      ${this.renderTornadoChart()}

      <!-- 個別変数の影響度 -->
      ${this.renderVariableDetails()}
    `;
  }

  /**
   * 売上高感度分析テーブルをレンダリング
   */
  renderSalesImpactTable() {
    const sales = this.analysisResult.salesImpact;
    if (!sales) return '';

    return `
      <div class="card mb-4">
        <div class="card-header">
          <h3 class="card-title">売上高変動の影響</h3>
        </div>
        <div class="card-body">
          <table class="data-table" style="width: 100%;">
            <thead>
              <tr>
                <th>売上高変動</th>
                <th style="text-align: right;">売上高</th>
                <th style="text-align: right;">営業利益</th>
                <th style="text-align: right;">利益変動率</th>
              </tr>
            </thead>
            <tbody>
              ${sales.results.map(r => {
                const isBase = Math.abs(r.revenueChange) < 0.01;
                const isNegative = r.operatingProfit < 0;
                const rowStyle = isBase ? 'background: var(--color-primary-lighter); font-weight: bold;' : '';
                const profitStyle = isNegative ? 'color: var(--color-danger);' : '';

                return `
                  <tr style="${rowStyle}">
                    <td>${r.revenueChange > 0 ? '+' : ''}${r.revenueChange.toFixed(0)}%${isBase ? '（基準）' : ''}</td>
                    <td style="text-align: right;">¥${Math.round(r.revenue).toLocaleString('ja-JP')}</td>
                    <td style="text-align: right; ${profitStyle}">¥${Math.round(r.operatingProfit).toLocaleString('ja-JP')}</td>
                    <td style="text-align: right;">${formatPercent(r.profitChange)}</td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  }

  /**
   * トルネードチャートをレンダリング
   */
  renderTornadoChart() {
    if (!this.tornadoData || this.tornadoData.length === 0) return '';

    const maxSpread = Math.max(...this.tornadoData.map(d => d.spread));

    return `
      <div class="card mb-4">
        <div class="card-header">
          <h3 class="card-title">影響度ランキング（トルネードチャート）</h3>
          <p style="font-size: 0.8rem; color: var(--color-text-secondary); margin-top: 0.25rem;">
            各変数を+10%/-10%変動させた場合の営業利益への影響幅
          </p>
        </div>
        <div class="card-body">
          ${this.tornadoData.map(d => {
            const barWidth = maxSpread > 0 ? (d.spread / maxSpread * 100) : 0;
            return `
              <div style="margin-bottom: 1rem;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 0.25rem;">
                  <span style="font-weight: 600; font-size: 0.9rem;">${d.variableName}</span>
                  <span style="font-size: 0.8rem; color: var(--color-text-secondary);">
                    変動幅: ¥${Math.round(d.spread).toLocaleString('ja-JP')}
                  </span>
                </div>
                <div style="display: flex; align-items: center; gap: 8px;">
                  <span style="font-size: 0.75rem; width: 80px; text-align: right; color: var(--color-danger);">
                    ¥${Math.round(d.downValue).toLocaleString('ja-JP')}
                  </span>
                  <div style="flex: 1; height: 24px; background: var(--color-gray-100); border-radius: var(--radius-sm); overflow: hidden; position: relative;">
                    <div style="width: ${barWidth}%; height: 100%; background: linear-gradient(90deg, var(--color-danger), var(--color-warning), var(--color-success)); border-radius: var(--radius-sm);"></div>
                  </div>
                  <span style="font-size: 0.75rem; width: 80px; color: var(--color-success);">
                    ¥${Math.round(d.upValue).toLocaleString('ja-JP')}
                  </span>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;
  }

  /**
   * 個別変数の詳細をレンダリング
   */
  renderVariableDetails() {
    if (!this.analysisResult.variables || this.analysisResult.variables.length === 0) return '';

    return `
      <div class="card">
        <div class="card-header">
          <h3 class="card-title">変数別の詳細影響</h3>
        </div>
        <div class="card-body">
          <div class="grid grid-cols-2" style="gap: 1.5rem;">
            ${this.analysisResult.variables.map(v => `
              <div>
                <h4 style="margin-bottom: 0.75rem; font-size: 0.9rem; font-weight: 600;">${v.variableName}</h4>
                <table class="data-table" style="width: 100%; font-size: 0.85rem;">
                  <thead>
                    <tr>
                      <th>変動率</th>
                      <th style="text-align: right;">値</th>
                      <th style="text-align: right;">営業利益</th>
                      <th style="text-align: right;">利益変動</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${v.results.map(r => {
                      const isBase = Math.abs(r.change) < 0.01;
                      const rowStyle = isBase ? 'background: var(--color-primary-lighter); font-weight: bold;' : '';
                      return `
                        <tr style="${rowStyle}">
                          <td>${formatPercent(r.change)}${isBase ? '（基準）' : ''}</td>
                          <td style="text-align: right;">¥${Math.round(r.value).toLocaleString('ja-JP')}</td>
                          <td style="text-align: right;">¥${Math.round(r.result).toLocaleString('ja-JP')}</td>
                          <td style="text-align: right;">${formatPercent(r.resultChange)}</td>
                        </tr>
                      `;
                    }).join('')}
                  </tbody>
                </table>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `;
  }

  /**
   * イベントリスナーをアタッチ
   */
  attachEventListeners() {
    const calcBtn = document.getElementById('sensitivityCalcBtn');
    if (calcBtn) {
      calcBtn.addEventListener('click', () => this.handleCalculate());
    }
  }

  /**
   * 計算実行ハンドラ
   */
  handleCalculate() {
    const state = getState();
    const period = state.periods?.[state.currentPeriodIndex || 0];
    if (!period) return;

    const pl = period.pl || {};
    const revenue = pl.revenue || 0;
    const cogs = pl.cogs || 0;
    const plResults = calculatePLResults(pl);
    const sgaTotal = plResults.sgaTotal;

    // 変動費率を取得
    this.variableCostRatio = (parseFloat(document.getElementById('sensitivityVarCostRatio')?.value) || 30) / 100;

    // 売上高感度分析
    const salesImpact = analyzeSalesImpact({
      revenue,
      cogs,
      sgaTotal,
      variableCostRatio: this.variableCostRatio,
      revenueChanges: [-0.20, -0.15, -0.10, -0.05, 0, 0.05, 0.10, 0.15, 0.20]
    });

    // 個別変数の感度分析
    const operatingProfit = plResults.operatingProfit;
    const variableCogs = cogs * this.variableCostRatio;
    const fixedCogs = cogs * (1 - this.variableCostRatio);

    const calcOp = (rev, vc, fc, sga) => rev - vc - fc - sga;

    const variables = [
      analyzeSingleVariable({
        variableName: '売上高',
        baseValue: revenue,
        calcFn: (val) => calcOp(val, variableCogs * (val / revenue), fixedCogs, sgaTotal)
      }),
      analyzeSingleVariable({
        variableName: '変動費',
        baseValue: variableCogs,
        calcFn: (val) => calcOp(revenue, val, fixedCogs, sgaTotal)
      }),
      analyzeSingleVariable({
        variableName: '固定費（製造）',
        baseValue: fixedCogs,
        calcFn: (val) => calcOp(revenue, variableCogs, val, sgaTotal)
      }),
      analyzeSingleVariable({
        variableName: '販管費',
        baseValue: sgaTotal,
        calcFn: (val) => calcOp(revenue, variableCogs, fixedCogs, val)
      })
    ];

    // トルネードチャート用データ
    this.tornadoData = generateTornadoData(variables, 10);

    this.analysisResult = {
      salesImpact,
      variables
    };

    // 結果エリアを更新
    const resultsDiv = document.getElementById('sensitivityResults');
    if (resultsDiv) {
      resultsDiv.innerHTML = this.renderResults();
    }
  }
}
