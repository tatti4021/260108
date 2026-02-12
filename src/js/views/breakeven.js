/**
 * 損益分岐点分析ビューの実装
 * @module views/breakeven
 */

import { getState } from '../utils/state.js';
import { calculatePLResults } from '../utils/pl-calc.js';
import {
  estimateCostStructure,
  calculateBreakevenAnalysis,
  generateBreakevenChartData,
  formatCurrency,
  formatPercent
} from '../utils/breakeven-calc.js';

/**
 * 損益分岐点分析ビュークラス
 */
export class BreakevenView {
  /**
   * コンストラクタ
   * @param {HTMLElement} container - コンテナ要素
   */
  constructor(container) {
    this.container = container;
    this.result = null;
    this.chart = null;
    this.variableCostRatioOfCogs = 0.7;
    this.targetProfit = 0;
  }

  /**
   * ビューをレンダリング
   */
  render() {
    const html = `
      <div class="page-content">
        <h2 class="page-title">損益分岐点分析</h2>
        <p style="color: var(--color-text-secondary); margin-bottom: 1.5rem;">
          固定費と変動費の構造から損益分岐点を算出し、経営の安全性を評価します。
        </p>

        <!-- 設定 -->
        ${this.renderSettings()}

        <!-- 分析実行ボタン -->
        <div style="margin-bottom: 1.5rem; text-align: center;">
          <button id="breakevenCalcBtn" class="btn btn-primary" style="padding: 12px 40px; font-size: 1rem;">
            分析を実行
          </button>
        </div>

        <!-- 結果表示エリア -->
        <div id="breakevenResults">
          ${this.result ? this.renderResults() : this.renderEmptyState()}
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
    const plResults = calculatePLResults(pl);

    return `
      <div class="card mb-4">
        <div class="card-header">
          <h3 class="card-title">分析条件</h3>
        </div>
        <div class="card-body">
          <div class="grid grid-cols-3" style="gap: 1.5rem;">
            <div>
              <h4 style="margin-bottom: 1rem; font-size: 0.95rem;">現在のP/Lデータ</h4>
              <table class="data-table" style="width: 100%; font-size: 0.9rem;">
                <tbody>
                  <tr>
                    <td>売上高</td>
                    <td style="text-align: right;">¥${(pl.revenue || 0).toLocaleString('ja-JP')}</td>
                  </tr>
                  <tr>
                    <td>売上原価</td>
                    <td style="text-align: right;">¥${(pl.cogs || 0).toLocaleString('ja-JP')}</td>
                  </tr>
                  <tr>
                    <td>販管費</td>
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
              <h4 style="margin-bottom: 1rem; font-size: 0.95rem;">変動費の設定</h4>
              <div class="form-group">
                <label class="form-label">売上原価の変動費割合</label>
                <div style="display: flex; align-items: center; gap: 8px;">
                  <input type="number" id="beVarCostRatio" class="form-input"
                    value="${(this.variableCostRatioOfCogs * 100).toFixed(0)}" step="5" min="0" max="100"
                    style="width: 100px;">
                  <span>%</span>
                </div>
                <p style="font-size: 0.75rem; color: var(--color-text-secondary); margin-top: 0.5rem;">
                  残りは固定費として扱います。販管費は全額固定費とみなします。
                </p>
              </div>
            </div>
            <div>
              <h4 style="margin-bottom: 1rem; font-size: 0.95rem;">目標利益</h4>
              <div class="form-group">
                <label class="form-label">目標営業利益</label>
                <div style="display: flex; align-items: center; gap: 8px;">
                  <input type="number" id="beTargetProfit" class="form-input"
                    value="${this.targetProfit}" step="10000"
                    style="width: 160px;">
                  <span>円</span>
                </div>
                <p style="font-size: 0.75rem; color: var(--color-text-secondary); margin-top: 0.5rem;">
                  目標利益達成に必要な売上高を算出します
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
          <p style="font-size: 1.1rem;">「分析を実行」をクリックして損益分岐点を算出してください</p>
        </div>
      </div>
    `;
  }

  /**
   * 分析結果をレンダリング
   */
  renderResults() {
    if (!this.result) return '';

    return `
      <!-- KPIサマリ -->
      ${this.renderKPISummary()}

      <!-- 費用構造 -->
      ${this.renderCostStructure()}

      <!-- 損益分岐点チャート -->
      ${this.renderBreakevenChart()}

      <!-- 目標利益分析 -->
      ${this.result.targetRevenue ? this.renderTargetAnalysis() : ''}
    `;
  }

  /**
   * KPIサマリをレンダリング
   */
  renderKPISummary() {
    const r = this.result;

    // 安全余裕率の評価レベル
    let mosLevel = 'kpi-unknown';
    let mosLabel = 'データなし';
    if (r.marginOfSafety !== null) {
      if (r.marginOfSafety >= 20) { mosLevel = 'kpi-good'; mosLabel = '良好'; }
      else if (r.marginOfSafety >= 10) { mosLevel = 'kpi-warning'; mosLabel = '注意'; }
      else { mosLevel = 'kpi-danger'; mosLabel = '警告'; }
    }

    // 損益分岐点比率の評価レベル
    let berLevel = 'kpi-unknown';
    let berLabel = 'データなし';
    if (r.breakevenRatio !== null) {
      if (r.breakevenRatio <= 80) { berLevel = 'kpi-good'; berLabel = '良好'; }
      else if (r.breakevenRatio <= 95) { berLevel = 'kpi-warning'; berLabel = '注意'; }
      else { berLevel = 'kpi-danger'; berLabel = '警告'; }
    }

    return `
      <div class="card mb-4">
        <div class="card-header">
          <h3 class="card-title">分析結果サマリ</h3>
        </div>
        <div class="card-body">
          <div class="grid grid-cols-4" style="gap: 1rem;">
            <div class="kpi-card" style="background: var(--color-primary-lighter); border-left: 4px solid var(--color-primary);">
              <div class="kpi-label">損益分岐点売上高</div>
              <div class="kpi-value" style="font-size: 1.2rem;">${formatCurrency(r.breakevenRevenue)}</div>
            </div>
            <div class="kpi-card ${berLevel}">
              <div class="kpi-label">損益分岐点比率</div>
              <div class="kpi-value">${formatPercent(r.breakevenRatio)}</div>
              <div class="kpi-status">${berLabel}</div>
            </div>
            <div class="kpi-card ${mosLevel}">
              <div class="kpi-label">安全余裕率</div>
              <div class="kpi-value">${formatPercent(r.marginOfSafety)}</div>
              <div class="kpi-status">${mosLabel}</div>
            </div>
            <div class="kpi-card" style="background: var(--color-secondary-lighter); border-left: 4px solid var(--color-secondary);">
              <div class="kpi-label">経営レバレッジ係数</div>
              <div class="kpi-value">${r.dol !== null ? r.dol.toFixed(2) + '倍' : '-'}</div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * 費用構造をレンダリング
   */
  renderCostStructure() {
    const r = this.result;
    const totalCost = r.variableCosts + r.fixedCosts;

    const varPercent = totalCost > 0 ? (r.variableCosts / totalCost * 100).toFixed(1) : '0';
    const fixPercent = totalCost > 0 ? (r.fixedCosts / totalCost * 100).toFixed(1) : '0';

    return `
      <div class="card mb-4">
        <div class="card-header">
          <h3 class="card-title">費用構造</h3>
        </div>
        <div class="card-body">
          <div class="grid grid-cols-2" style="gap: 2rem;">
            <div>
              <table class="data-table" style="width: 100%;">
                <tbody>
                  <tr>
                    <td>売上高</td>
                    <td style="text-align: right; font-weight: bold;">${formatCurrency(r.revenue)}</td>
                  </tr>
                  <tr>
                    <td>変動費</td>
                    <td style="text-align: right;">${formatCurrency(r.variableCosts)}</td>
                  </tr>
                  <tr style="border-bottom: 2px solid var(--color-border);">
                    <td style="font-weight: 600;">限界利益</td>
                    <td style="text-align: right; font-weight: 600;">${formatCurrency(r.contributionMargin)}</td>
                  </tr>
                  <tr>
                    <td>固定費</td>
                    <td style="text-align: right;">${formatCurrency(r.fixedCosts)}</td>
                  </tr>
                  <tr style="background: var(--color-gray-50);">
                    <td style="font-weight: bold;">営業利益</td>
                    <td style="text-align: right; font-weight: bold; ${r.operatingProfit < 0 ? 'color: var(--color-danger);' : ''}">${formatCurrency(r.operatingProfit)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div>
              <p style="font-weight: 600; margin-bottom: 0.75rem; font-size: 0.9rem;">費用の内訳</p>
              <div style="display: flex; height: 32px; border-radius: var(--radius-md); overflow: hidden; margin-bottom: 0.5rem;">
                <div style="width: ${varPercent}%; background: var(--color-warning); display: flex; align-items: center; justify-content: center; color: white; font-size: 0.8rem; font-weight: 600;">
                  ${varPercent}%
                </div>
                <div style="width: ${fixPercent}%; background: var(--color-info); display: flex; align-items: center; justify-content: center; color: white; font-size: 0.8rem; font-weight: 600;">
                  ${fixPercent}%
                </div>
              </div>
              <div style="display: flex; gap: 1.5rem; font-size: 0.8rem;">
                <span style="display: flex; align-items: center; gap: 4px;">
                  <span style="width: 12px; height: 12px; background: var(--color-warning); border-radius: 2px; display: inline-block;"></span>
                  変動費
                </span>
                <span style="display: flex; align-items: center; gap: 4px;">
                  <span style="width: 12px; height: 12px; background: var(--color-info); border-radius: 2px; display: inline-block;"></span>
                  固定費
                </span>
              </div>

              <div style="margin-top: 1.5rem;">
                <table class="data-table" style="width: 100%; font-size: 0.85rem;">
                  <tbody>
                    <tr>
                      <td>変動費率</td>
                      <td style="text-align: right;">${formatPercent(r.variableCostRatio * 100)}</td>
                    </tr>
                    <tr>
                      <td>限界利益率</td>
                      <td style="text-align: right;">${formatPercent(r.contributionMarginRatio * 100)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * 損益分岐点チャートをレンダリング
   */
  renderBreakevenChart() {
    const r = this.result;
    if (r.breakevenRevenue === null) return '';

    const maxRevenue = Math.max(r.revenue * 1.5, r.breakevenRevenue * 1.5);
    const chartData = generateBreakevenChartData(r.fixedCosts, r.variableCostRatio, maxRevenue);

    return `
      <div class="card mb-4">
        <div class="card-header">
          <h3 class="card-title">損益分岐点チャート</h3>
        </div>
        <div class="card-body">
          <canvas id="breakevenChart" width="800" height="400"></canvas>
        </div>
      </div>
    `;
  }

  /**
   * Chart.jsでチャートを描画
   */
  drawChart() {
    const canvas = document.getElementById('breakevenChart');
    if (!canvas || !this.result || this.result.breakevenRevenue === null) return;
    if (typeof Chart === 'undefined') return;

    const r = this.result;
    const maxRevenue = Math.max(r.revenue * 1.5, r.breakevenRevenue * 1.5);
    const chartData = generateBreakevenChartData(r.fixedCosts, r.variableCostRatio, maxRevenue);

    const formatLabel = (val) => {
      if (val >= 100000000) return (val / 100000000).toFixed(1) + '億';
      if (val >= 10000) return (val / 10000).toFixed(0) + '万';
      return val.toLocaleString('ja-JP');
    };

    if (this.chart) {
      this.chart.destroy();
    }

    this.chart = new Chart(canvas.getContext('2d'), {
      type: 'line',
      data: {
        labels: chartData.labels.map(formatLabel),
        datasets: [
          {
            label: '売上高',
            data: chartData.revenueData,
            borderColor: '#2563eb',
            backgroundColor: 'rgba(37, 99, 235, 0.1)',
            borderWidth: 2,
            fill: false,
            pointRadius: 0
          },
          {
            label: '総費用',
            data: chartData.totalCostData,
            borderColor: '#ef4444',
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            borderWidth: 2,
            fill: false,
            pointRadius: 0
          },
          {
            label: '固定費',
            data: chartData.fixedCostData,
            borderColor: '#06b6d4',
            borderDash: [5, 5],
            borderWidth: 1,
            fill: false,
            pointRadius: 0
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'top'
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                return context.dataset.label + ': ¥' + Math.round(context.parsed.y).toLocaleString('ja-JP');
              }
            }
          }
        },
        scales: {
          x: {
            title: {
              display: true,
              text: '売上高'
            }
          },
          y: {
            title: {
              display: true,
              text: '金額'
            },
            ticks: {
              callback: function(value) {
                return formatLabel(value);
              }
            }
          }
        }
      }
    });
  }

  /**
   * 目標利益分析をレンダリング
   */
  renderTargetAnalysis() {
    const r = this.result;

    const additionalRevenue = r.targetRevenue - r.revenue;
    const additionalPercent = r.revenue > 0 ? (additionalRevenue / r.revenue * 100).toFixed(1) : '-';

    return `
      <div class="card">
        <div class="card-header">
          <h3 class="card-title">目標利益達成分析</h3>
        </div>
        <div class="card-body">
          <div class="grid grid-cols-3" style="gap: 1rem;">
            <div class="kpi-card" style="background: var(--color-success-light); border-left: 4px solid var(--color-success);">
              <div class="kpi-label">目標営業利益</div>
              <div class="kpi-value" style="font-size: 1.1rem;">${formatCurrency(r.targetProfit)}</div>
            </div>
            <div class="kpi-card" style="background: var(--color-warning-light); border-left: 4px solid var(--color-warning);">
              <div class="kpi-label">必要売上高</div>
              <div class="kpi-value" style="font-size: 1.1rem;">${formatCurrency(r.targetRevenue)}</div>
            </div>
            <div class="kpi-card" style="background: var(--color-info-light); border-left: 4px solid var(--color-info);">
              <div class="kpi-label">現在との差額</div>
              <div class="kpi-value" style="font-size: 1.1rem;">
                ${formatCurrency(additionalRevenue)}
                <span style="font-size: 0.8rem; color: var(--color-text-secondary);">
                  (${additionalPercent}%)
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * イベントリスナーをアタッチ
   */
  attachEventListeners() {
    const calcBtn = document.getElementById('breakevenCalcBtn');
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

    // パラメータを取得
    this.variableCostRatioOfCogs = (parseFloat(document.getElementById('beVarCostRatio')?.value) || 70) / 100;
    this.targetProfit = parseFloat(document.getElementById('beTargetProfit')?.value) || 0;

    // 費用構造を推定
    const costStructure = estimateCostStructure(pl, this.variableCostRatioOfCogs);

    // 損益分岐点分析を実行
    this.result = calculateBreakevenAnalysis({
      revenue: costStructure.revenue,
      variableCosts: costStructure.variableCosts,
      fixedCosts: costStructure.fixedCosts,
      targetProfit: this.targetProfit
    });

    // 結果エリアを更新
    const resultsDiv = document.getElementById('breakevenResults');
    if (resultsDiv) {
      resultsDiv.innerHTML = this.renderResults();
      // チャートを描画
      setTimeout(() => this.drawChart(), 100);
    }
  }
}
