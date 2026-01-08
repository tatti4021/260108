/**
 * 予測・シミュレーションビュー
 * @module views/forecast
 */

import { getState, updateForecast } from '../utils/state.js';
import {
  calculateForecastParams,
  generateScenarios,
  aggregateToYearly
} from '../utils/forecast-calc.js';
import { chartColors, createChart, destroyChart } from '../utils/chart-config.js';

/**
 * ForecastViewクラス（TASK-031, TASK-032）
 * 予測・シミュレーション機能のUIを管理
 */
export class ForecastView {
  constructor(container) {
    this.container = container;
    this.currentScenario = 'standard';
    this.scenarios = null;
    this.baseParams = null;
    this.charts = {};
  }

  /**
   * メインレンダリング
   */
  render() {
    const state = getState();

    if (!state.periods || state.periods.length === 0) {
      this.renderNoData();
      return;
    }

    // 現在の期間データを取得
    const currentPeriod = state.periods[state.currentPeriodIndex];

    // 過去データから予測パラメータを自動計算
    this.baseParams = calculateForecastParams(state.periods);

    // 初期表示
    this.renderContent(currentPeriod);
  }

  /**
   * データがない場合の表示
   */
  renderNoData() {
    this.container.innerHTML = `
      <div class="page-content">
        <h2 class="page-title">予測・シミュレーション</h2>
        <div class="alert alert-warning">
          データが初期化されていません。先に財務データを入力してください。
        </div>
      </div>
    `;
  }

  /**
   * メインコンテンツのレンダリング
   */
  renderContent(currentPeriod) {
    this.container.innerHTML = `
      <div class="page-content">
        <h2 class="page-title">予測・シミュレーション</h2>

        <!-- シナリオ設定カード -->
        <div class="card mb-4">
          <div class="card-header">
            <h3 class="card-title">予測設定</h3>
          </div>
          <div class="card-body">
            ${this.renderForecastForm()}
          </div>
        </div>

        <!-- シナリオタブ -->
        <div class="card mb-4">
          <div class="card-header">
            <h3 class="card-title">シナリオ分析</h3>
          </div>
          <div class="card-body">
            ${this.renderScenarioTabs()}
            <div id="scenarioContent" class="mt-3">
              <div class="alert alert-info">
                「予測を生成」ボタンをクリックして予測を開始してください
              </div>
            </div>
          </div>
        </div>

        <!-- シナリオ比較 -->
        <div id="comparisonSection" style="display: none;">
          <div class="card">
            <div class="card-header">
              <h3 class="card-title">シナリオ比較</h3>
            </div>
            <div class="card-body">
              <div id="comparisonContent"></div>
            </div>
          </div>
        </div>
      </div>
    `;

    this.attachEventListeners();
  }

  /**
   * 予測設定フォームのレンダリング（TASK-031）
   */
  renderForecastForm() {
    return `
      <form id="forecastForm">
        <div class="row">
          <div class="col-md-6">
            <div class="form-group">
              <label for="revenueGrowthRate">基準成長率（%）</label>
              <input
                type="number"
                class="form-control"
                id="revenueGrowthRate"
                value="${this.baseParams.revenueGrowthRate}"
                step="0.1"
              >
              <small class="form-text text-muted">過去データから自動計算された値です</small>
            </div>
          </div>
          <div class="col-md-6">
            <div class="form-group">
              <label for="forecastPeriods">予測期間（年）</label>
              <select class="form-control" id="forecastPeriods">
                <option value="1">1年</option>
                <option value="2">2年</option>
                <option value="3" selected>3年</option>
                <option value="4">4年</option>
                <option value="5">5年</option>
              </select>
            </div>
          </div>
        </div>

        <div class="row">
          <div class="col-md-4">
            <div class="form-group">
              <label for="cogsRate">売上原価率（%）</label>
              <input
                type="number"
                class="form-control"
                id="cogsRate"
                value="${this.baseParams.cogsRate}"
                step="0.1"
              >
            </div>
          </div>
          <div class="col-md-4">
            <div class="form-group">
              <label for="sgaRate">販管費率（%）</label>
              <input
                type="number"
                class="form-control"
                id="sgaRate"
                value="${this.baseParams.sgaRate}"
                step="0.1"
              >
            </div>
          </div>
          <div class="col-md-4">
            <div class="form-group">
              <label for="taxRate">法人税率（%）</label>
              <input
                type="number"
                class="form-control"
                id="taxRate"
                value="${this.baseParams.taxRate}"
                step="1"
              >
            </div>
          </div>
        </div>

        <div class="alert alert-light border">
          <h5 class="mb-3">シナリオ設定</h5>
          <div class="row">
            <div class="col-md-4">
              <div class="card bg-success text-white">
                <div class="card-body">
                  <h6 class="card-title">楽観シナリオ</h6>
                  <p class="card-text mb-0">成長率 <strong>+5%</strong>ポイント</p>
                </div>
              </div>
            </div>
            <div class="col-md-4">
              <div class="card bg-primary text-white">
                <div class="card-body">
                  <h6 class="card-title">標準シナリオ</h6>
                  <p class="card-text mb-0">成長率 <strong>±0%</strong>ポイント</p>
                </div>
              </div>
            </div>
            <div class="col-md-4">
              <div class="card bg-danger text-white">
                <div class="card-body">
                  <h6 class="card-title">悲観シナリオ</h6>
                  <p class="card-text mb-0">成長率 <strong>-5%</strong>ポイント</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <button type="submit" class="btn btn-primary btn-lg btn-block">
          予測を生成
        </button>
      </form>
    `;
  }

  /**
   * シナリオタブのレンダリング（TASK-031）
   */
  renderScenarioTabs() {
    return `
      <ul class="nav nav-tabs" id="scenarioTabs" role="tablist">
        <li class="nav-item">
          <a class="nav-link active" id="standard-tab" data-scenario="standard" href="#" role="tab">
            標準シナリオ
          </a>
        </li>
        <li class="nav-item">
          <a class="nav-link" id="optimistic-tab" data-scenario="optimistic" href="#" role="tab">
            楽観シナリオ
          </a>
        </li>
        <li class="nav-item">
          <a class="nav-link" id="pessimistic-tab" data-scenario="pessimistic" href="#" role="tab">
            悲観シナリオ
          </a>
        </li>
      </ul>
    `;
  }

  /**
   * イベントリスナーの設定
   */
  attachEventListeners() {
    // 予測フォームの送信
    const form = document.getElementById('forecastForm');
    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        this.generateForecast();
      });
    }

    // シナリオタブの切り替え
    const tabs = document.querySelectorAll('#scenarioTabs .nav-link');
    tabs.forEach(tab => {
      tab.addEventListener('click', (e) => {
        e.preventDefault();
        this.switchScenario(e.target.dataset.scenario);
      });
    });
  }

  /**
   * 予測の生成
   */
  generateForecast() {
    const state = getState();
    const currentPeriod = state.periods[state.currentPeriodIndex];

    // フォームから値を取得
    const revenueGrowthRate = parseFloat(document.getElementById('revenueGrowthRate').value);
    const cogsRate = parseFloat(document.getElementById('cogsRate').value);
    const sgaRate = parseFloat(document.getElementById('sgaRate').value);
    const taxRate = parseFloat(document.getElementById('taxRate').value);
    const periods = parseInt(document.getElementById('forecastPeriods').value);

    // 予測パラメータを更新
    this.baseParams = {
      revenueGrowthRate,
      cogsRate,
      sgaRate,
      taxRate
    };

    // シナリオを生成
    this.scenarios = generateScenarios(currentPeriod, this.baseParams, periods);

    // 標準シナリオを表示
    this.currentScenario = 'standard';
    this.renderScenarioResult(this.currentScenario);

    // 比較セクションを表示
    this.renderScenarioComparison();
  }

  /**
   * シナリオの切り替え
   */
  switchScenario(scenario) {
    if (!this.scenarios) return;

    this.currentScenario = scenario;

    // タブのアクティブ状態を更新
    document.querySelectorAll('#scenarioTabs .nav-link').forEach(tab => {
      tab.classList.remove('active');
    });
    document.getElementById(`${scenario}-tab`).classList.add('active');

    // シナリオ結果を表示
    this.renderScenarioResult(scenario);
  }

  /**
   * 単一シナリオの結果表示
   */
  renderScenarioResult(scenario) {
    const scenarioData = this.scenarios[scenario];
    const yearlyData = aggregateToYearly(scenarioData.periods);

    const content = document.getElementById('scenarioContent');
    content.innerHTML = `
      <h5 class="mb-3">
        ${this.getScenarioLabel(scenario)}
        <small class="text-muted">（成長率: ${scenarioData.forecast.revenueGrowthRate.toFixed(1)}%）</small>
      </h5>

      <!-- 年次サマリーテーブル -->
      <div class="table-responsive mb-4">
        <table class="table table-striped table-hover">
          <thead class="thead-dark">
            <tr>
              <th>年度</th>
              <th class="text-right">売上高</th>
              <th class="text-right">営業利益</th>
              <th class="text-right">経常利益</th>
              <th class="text-right">当期純利益</th>
              <th class="text-right">営業利益率</th>
            </tr>
          </thead>
          <tbody>
            ${yearlyData.map(year => `
              <tr>
                <td>${year.year}年</td>
                <td class="text-right">${this.formatCurrency(year.revenue)}</td>
                <td class="text-right">${this.formatCurrency(year.operatingProfit)}</td>
                <td class="text-right">${this.formatCurrency(year.ordinaryProfit)}</td>
                <td class="text-right ${year.netIncome < 0 ? 'text-danger' : 'text-success'}">
                  ${this.formatCurrency(year.netIncome)}
                </td>
                <td class="text-right">${this.formatPercent(year.operatingProfit / year.revenue * 100)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>

      <!-- グラフ -->
      <div class="row">
        <div class="col-md-6">
          <canvas id="scenarioRevenueChart" height="200"></canvas>
        </div>
        <div class="col-md-6">
          <canvas id="scenarioProfitChart" height="200"></canvas>
        </div>
      </div>
    `;

    // グラフを描画
    this.renderScenarioCharts(yearlyData, scenario);
  }

  /**
   * シナリオ別グラフの描画
   */
  renderScenarioCharts(yearlyData, scenario) {
    // 既存のチャートを破棄
    if (this.charts.revenue) {
      destroyChart(this.charts.revenue);
    }
    if (this.charts.profit) {
      destroyChart(this.charts.profit);
    }

    const labels = yearlyData.map(y => `${y.year}年`);
    const revenueData = yearlyData.map(y => y.revenue);
    const profitData = yearlyData.map(y => y.netIncome);

    // 売上高推移グラフ
    const revenueCanvas = document.getElementById('scenarioRevenueChart');
    if (revenueCanvas) {
      const ctx = revenueCanvas.getContext('2d');
      this.charts.revenue = createChart(ctx, 'line', {
        labels,
        datasets: [{
          label: '売上高',
          data: revenueData,
          borderColor: chartColors.primary,
          backgroundColor: chartColors.primary + '40',
          fill: true,
          tension: 0.4
        }]
      }, {
        plugins: {
          title: {
            display: true,
            text: '売上高推移'
          }
        }
      });
    }

    // 当期純利益推移グラフ
    const profitCanvas = document.getElementById('scenarioProfitChart');
    if (profitCanvas) {
      const ctx = profitCanvas.getContext('2d');
      this.charts.profit = createChart(ctx, 'line', {
        labels,
        datasets: [{
          label: '当期純利益',
          data: profitData,
          borderColor: chartColors.success,
          backgroundColor: chartColors.success + '40',
          fill: true,
          tension: 0.4
        }]
      }, {
        plugins: {
          title: {
            display: true,
            text: '当期純利益推移'
          }
        }
      });
    }
  }

  /**
   * シナリオ比較の表示（TASK-032）
   */
  renderScenarioComparison() {
    const comparisonSection = document.getElementById('comparisonSection');
    comparisonSection.style.display = 'block';

    // 各シナリオの年次データを取得
    const optimisticYearly = aggregateToYearly(this.scenarios.optimistic.periods);
    const standardYearly = aggregateToYearly(this.scenarios.standard.periods);
    const pessimisticYearly = aggregateToYearly(this.scenarios.pessimistic.periods);

    const content = document.getElementById('comparisonContent');
    content.innerHTML = `
      <!-- 比較テーブル -->
      <div class="table-responsive mb-4">
        <table class="table table-bordered">
          <thead class="thead-light">
            <tr>
              <th rowspan="2">年度</th>
              <th colspan="3" class="text-center bg-light">売上高</th>
              <th colspan="3" class="text-center bg-light">営業利益</th>
              <th colspan="3" class="text-center bg-light">当期純利益</th>
            </tr>
            <tr>
              <th class="text-center text-success">楽観</th>
              <th class="text-center text-primary">標準</th>
              <th class="text-center text-danger">悲観</th>
              <th class="text-center text-success">楽観</th>
              <th class="text-center text-primary">標準</th>
              <th class="text-center text-danger">悲観</th>
              <th class="text-center text-success">楽観</th>
              <th class="text-center text-primary">標準</th>
              <th class="text-center text-danger">悲観</th>
            </tr>
          </thead>
          <tbody>
            ${standardYearly.map((_, index) => {
              const opt = optimisticYearly[index];
              const std = standardYearly[index];
              const pess = pessimisticYearly[index];
              return `
                <tr>
                  <td>${std.year}年</td>
                  <td class="text-right">${this.formatCurrency(opt.revenue, true)}</td>
                  <td class="text-right">${this.formatCurrency(std.revenue, true)}</td>
                  <td class="text-right">${this.formatCurrency(pess.revenue, true)}</td>
                  <td class="text-right">${this.formatCurrency(opt.operatingProfit, true)}</td>
                  <td class="text-right">${this.formatCurrency(std.operatingProfit, true)}</td>
                  <td class="text-right">${this.formatCurrency(pess.operatingProfit, true)}</td>
                  <td class="text-right">${this.formatCurrency(opt.netIncome, true)}</td>
                  <td class="text-right">${this.formatCurrency(std.netIncome, true)}</td>
                  <td class="text-right">${this.formatCurrency(pess.netIncome, true)}</td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>

      <!-- 比較グラフ -->
      <div class="row">
        <div class="col-md-6">
          <canvas id="comparisonRevenueChart" height="200"></canvas>
        </div>
        <div class="col-md-6">
          <canvas id="comparisonProfitChart" height="200"></canvas>
        </div>
      </div>
    `;

    // 比較グラフを描画
    this.renderComparisonCharts(optimisticYearly, standardYearly, pessimisticYearly);
  }

  /**
   * 比較グラフの描画（TASK-032）
   */
  renderComparisonCharts(optimisticYearly, standardYearly, pessimisticYearly) {
    // 既存のチャートを破棄
    if (this.charts.comparisonRevenue) {
      destroyChart(this.charts.comparisonRevenue);
    }
    if (this.charts.comparisonProfit) {
      destroyChart(this.charts.comparisonProfit);
    }

    const labels = standardYearly.map(y => `${y.year}年`);

    // 売上高比較グラフ
    const revenueCanvas = document.getElementById('comparisonRevenueChart');
    if (revenueCanvas) {
      const ctx = revenueCanvas.getContext('2d');
      this.charts.comparisonRevenue = createChart(ctx, 'line', {
        labels,
        datasets: [
          {
            label: '楽観シナリオ',
            data: optimisticYearly.map(y => y.revenue),
            borderColor: chartColors.success,
            backgroundColor: chartColors.success + '20',
            fill: false,
            tension: 0.4
          },
          {
            label: '標準シナリオ',
            data: standardYearly.map(y => y.revenue),
            borderColor: chartColors.primary,
            backgroundColor: chartColors.primary + '20',
            fill: false,
            tension: 0.4
          },
          {
            label: '悲観シナリオ',
            data: pessimisticYearly.map(y => y.revenue),
            borderColor: chartColors.danger,
            backgroundColor: chartColors.danger + '20',
            fill: false,
            tension: 0.4
          }
        ]
      }, {
        plugins: {
          title: {
            display: true,
            text: '売上高シナリオ比較',
            font: { size: 16, weight: 'bold' }
          }
        }
      });
    }

    // 当期純利益比較グラフ
    const profitCanvas = document.getElementById('comparisonProfitChart');
    if (profitCanvas) {
      const ctx = profitCanvas.getContext('2d');
      this.charts.comparisonProfit = createChart(ctx, 'line', {
        labels,
        datasets: [
          {
            label: '楽観シナリオ',
            data: optimisticYearly.map(y => y.netIncome),
            borderColor: chartColors.success,
            backgroundColor: chartColors.success + '20',
            fill: false,
            tension: 0.4
          },
          {
            label: '標準シナリオ',
            data: standardYearly.map(y => y.netIncome),
            borderColor: chartColors.primary,
            backgroundColor: chartColors.primary + '20',
            fill: false,
            tension: 0.4
          },
          {
            label: '悲観シナリオ',
            data: pessimisticYearly.map(y => y.netIncome),
            borderColor: chartColors.danger,
            backgroundColor: chartColors.danger + '20',
            fill: false,
            tension: 0.4
          }
        ]
      }, {
        plugins: {
          title: {
            display: true,
            text: '当期純利益シナリオ比較',
            font: { size: 16, weight: 'bold' }
          }
        }
      });
    }
  }

  /**
   * シナリオラベルを取得
   */
  getScenarioLabel(scenario) {
    const labels = {
      optimistic: '楽観シナリオ',
      standard: '標準シナリオ',
      pessimistic: '悲観シナリオ'
    };
    return labels[scenario] || scenario;
  }

  /**
   * 通貨フォーマット
   */
  formatCurrency(value, compact = false) {
    if (compact) {
      return new Intl.NumberFormat('ja-JP', {
        style: 'currency',
        currency: 'JPY',
        notation: 'compact',
        compactDisplay: 'short',
        maximumFractionDigits: 1
      }).format(value);
    }
    return new Intl.NumberFormat('ja-JP', {
      style: 'currency',
      currency: 'JPY',
      maximumFractionDigits: 0
    }).format(value);
  }

  /**
   * パーセントフォーマット
   */
  formatPercent(value) {
    return `${value.toFixed(1)}%`;
  }

  /**
   * クリーンアップ
   */
  destroy() {
    // すべてのチャートを破棄
    Object.values(this.charts).forEach(chart => {
      if (chart) destroyChart(chart);
    });
    this.charts = {};
  }
}
