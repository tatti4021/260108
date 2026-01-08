/**
 * 財務分析ビューの実装
 * @module views/analysis
 */

import { getState, getCurrentPeriod, setCurrentPeriod } from '../utils/state.js';
import { calculatePLResults } from '../utils/pl-calc.js';
import {
  calculateTotalAssets,
  calculateCurrentAssets,
  calculateCurrentLiabilities,
  calculateTotalLiabilities,
  calculateTotalEquity
} from '../utils/bs-calc.js';
import {
  calculateGrossProfitMargin,
  calculateOperatingProfitMargin,
  calculateOrdinaryProfitMargin,
  calculateNetProfitMargin,
  calculateROE,
  calculateROA,
  calculateAssetTurnover,
  calculateCurrentRatio,
  calculateQuickRatio,
  calculateEquityRatio,
  calculateDebtRatio,
  getRatingLevel,
  formatRatioPercent,
  formatRatio,
  generateOverallAssessment
} from '../utils/ratios.js';

/**
 * 財務分析ビュークラス (TASK-022)
 */
export class AnalysisView {
  /**
   * コンストラクタ
   * @param {HTMLElement} container - コンテナ要素
   */
  constructor(container) {
    this.container = container;
    this.periodData = null;
    this.periodIndex = 0;
  }

  /**
   * ビューをレンダリング
   * @param {Object} periodData - 期間データ
   * @param {number} periodIndex - 期間インデックス
   */
  render(periodData = null, periodIndex = 0) {
    // periodDataが指定されていない場合は現在の期間を使用
    if (!periodData) {
      const state = getState();
      periodIndex = state.currentPeriodIndex || 0;
      periodData = state.periods[periodIndex];
    }

    this.periodData = periodData;
    this.periodIndex = periodIndex;

    // P/LとB/Sデータから財務比率を計算
    const ratios = this.calculateAllRatios(periodData);

    const html = `
      <div class="page-content">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
          <h2 class="page-title">財務分析</h2>
          <div>
            ${this.renderPeriodSelector()}
          </div>
        </div>

        <!-- 総合評価 -->
        ${this.renderOverallAssessment(ratios)}

        <!-- 収益性指標 -->
        ${this.renderProfitabilitySection(ratios.profitability)}

        <!-- 効率性指標 -->
        ${this.renderEfficiencySection(ratios.efficiency)}

        <!-- 安全性指標 -->
        ${this.renderSafetySection(ratios.safety)}
      </div>
    `;

    this.container.innerHTML = html;
    this.attachEventListeners();
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
   * 全ての財務比率を計算
   * @param {Object} periodData - 期間データ
   * @returns {Object} 計算された財務比率
   */
  calculateAllRatios(periodData) {
    const pl = periodData?.pl || {};
    const bs = periodData?.bs || {};

    // P/L計算結果
    const plResults = calculatePLResults(pl);

    // B/S計算結果
    const totalAssets = calculateTotalAssets(bs.assets);
    const currentAssets = calculateCurrentAssets(bs.assets);
    const currentLiabilities = calculateCurrentLiabilities(bs.liabilities);
    const totalLiabilities = calculateTotalLiabilities(bs.liabilities);
    const totalEquity = calculateTotalEquity(bs.equity);
    const inventory = bs.assets?.current?.inventory || 0;

    // 収益性指標
    const profitability = {
      grossProfitMargin: calculateGrossProfitMargin(pl.revenue, pl.cogs),
      operatingProfitMargin: calculateOperatingProfitMargin(plResults.operatingProfit, pl.revenue),
      ordinaryProfitMargin: calculateOrdinaryProfitMargin(plResults.ordinaryProfit, pl.revenue),
      netProfitMargin: calculateNetProfitMargin(plResults.netProfit, pl.revenue)
    };

    // 効率性指標
    const efficiency = {
      roe: calculateROE(plResults.netProfit, totalEquity),
      roa: calculateROA(plResults.netProfit, totalAssets),
      assetTurnover: calculateAssetTurnover(pl.revenue, totalAssets)
    };

    // 安全性指標
    const safety = {
      currentRatio: calculateCurrentRatio(currentAssets, currentLiabilities),
      quickRatio: calculateQuickRatio(currentAssets, inventory, currentLiabilities),
      equityRatio: calculateEquityRatio(totalEquity, totalAssets),
      debtRatio: calculateDebtRatio(totalLiabilities, totalAssets)
    };

    return { profitability, efficiency, safety };
  }

  /**
   * 総合評価セクションをレンダリング
   * @param {Object} ratios - 計算された全指標
   * @returns {string} HTML文字列
   */
  renderOverallAssessment(ratios) {
    const assessment = generateOverallAssessment(ratios);

    return `
      <div class="card mb-4">
        <div class="card-header">
          <h3 class="card-title">総合評価</h3>
        </div>
        <div class="card-body">
          <p style="font-size: 1rem; line-height: 1.6; margin: 0;">${assessment}</p>
        </div>
      </div>
    `;
  }

  /**
   * 収益性指標セクションをレンダリング
   * @param {Object} profitability - 収益性指標
   * @returns {string} HTML文字列
   */
  renderProfitabilitySection(profitability) {
    return `
      <div class="card mb-4">
        <div class="card-header">
          <h3 class="card-title">収益性指標</h3>
        </div>
        <div class="card-body">
          <div class="grid grid-cols-4" style="gap: 1rem;">
            ${this.renderKPICard('売上総利益率', profitability.grossProfitMargin, 'grossProfitMargin', '%')}
            ${this.renderKPICard('営業利益率', profitability.operatingProfitMargin, 'operatingProfitMargin', '%')}
            ${this.renderKPICard('経常利益率', profitability.ordinaryProfitMargin, 'ordinaryProfitMargin', '%')}
            ${this.renderKPICard('当期純利益率', profitability.netProfitMargin, 'netProfitMargin', '%')}
          </div>
        </div>
      </div>
    `;
  }

  /**
   * 効率性指標セクションをレンダリング
   * @param {Object} efficiency - 効率性指標
   * @returns {string} HTML文字列
   */
  renderEfficiencySection(efficiency) {
    return `
      <div class="card mb-4">
        <div class="card-header">
          <h3 class="card-title">効率性指標</h3>
        </div>
        <div class="card-body">
          <div class="grid grid-cols-3" style="gap: 1rem;">
            ${this.renderKPICard('ROE', efficiency.roe, 'roe', '%', '自己資本利益率')}
            ${this.renderKPICard('ROA', efficiency.roa, 'roa', '%', '総資産利益率')}
            ${this.renderKPICard('総資産回転率', efficiency.assetTurnover, 'assetTurnover', '回')}
          </div>
        </div>
      </div>
    `;
  }

  /**
   * 安全性指標セクションをレンダリング
   * @param {Object} safety - 安全性指標
   * @returns {string} HTML文字列
   */
  renderSafetySection(safety) {
    return `
      <div class="card mb-4">
        <div class="card-header">
          <h3 class="card-title">安全性指標</h3>
        </div>
        <div class="card-body">
          <div class="grid grid-cols-4" style="gap: 1rem;">
            ${this.renderKPICard('流動比率', safety.currentRatio, 'currentRatio', '%')}
            ${this.renderKPICard('当座比率', safety.quickRatio, 'quickRatio', '%')}
            ${this.renderKPICard('自己資本比率', safety.equityRatio, 'equityRatio', '%')}
            ${this.renderKPICard('負債比率', safety.debtRatio, 'debtRatio', '%')}
          </div>
        </div>
      </div>
    `;
  }

  /**
   * KPIカードをレンダリング
   * @param {string} label - ラベル
   * @param {number|null} value - 値
   * @param {string} ratioType - 比率タイプ
   * @param {string} unit - 単位
   * @param {string} subtitle - サブタイトル（オプション）
   * @returns {string} HTML文字列
   */
  renderKPICard(label, value, ratioType, unit = '%', subtitle = '') {
    const level = getRatingLevel(ratioType, value);
    const colorClass = this.getLevelColorClass(level);

    let displayValue;
    if (unit === '%') {
      displayValue = formatRatioPercent(value);
    } else if (unit === '回') {
      displayValue = formatRatio(value, 2) + unit;
    } else {
      displayValue = formatRatio(value) + unit;
    }

    return `
      <div class="kpi-card ${colorClass}">
        <div class="kpi-label">${label}</div>
        ${subtitle ? `<div class="kpi-subtitle">${subtitle}</div>` : ''}
        <div class="kpi-value">${displayValue}</div>
        <div class="kpi-status">${this.getLevelLabel(level)}</div>
      </div>
    `;
  }

  /**
   * レベルに応じたCSSクラスを取得
   * @param {string} level - レベル
   * @returns {string} CSSクラス名
   */
  getLevelColorClass(level) {
    const classMap = {
      good: 'kpi-good',
      warning: 'kpi-warning',
      danger: 'kpi-danger',
      unknown: 'kpi-unknown'
    };
    return classMap[level] || 'kpi-unknown';
  }

  /**
   * レベルに応じたラベルを取得
   * @param {string} level - レベル
   * @returns {string} ラベル
   */
  getLevelLabel(level) {
    const labelMap = {
      good: '良好',
      warning: '注意',
      danger: '警告',
      unknown: 'データなし'
    };
    return labelMap[level] || '-';
  }

  /**
   * イベントリスナーをアタッチ
   */
  attachEventListeners() {
    // 期間セレクタ変更イベント
    const periodSelector = document.getElementById('periodSelector');
    if (periodSelector) {
      periodSelector.addEventListener('change', (e) => {
        this.handlePeriodChange(parseInt(e.target.value));
      });
    }
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
}
