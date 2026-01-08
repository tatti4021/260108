/**
 * ダッシュボードビューの実装
 * @module views/dashboard
 */

import { getState, subscribe } from '../utils/state.js';
import { calculatePLResults, formatCurrency } from '../utils/pl-calc.js';
import { calculateTotalAssets, calculateTotalEquity } from '../utils/bs-calc.js';

/**
 * ダッシュボードビュークラス
 */
export class DashboardView {
  /**
   * コンストラクタ
   * @param {HTMLElement} container - コンテナ要素
   */
  constructor(container) {
    this.container = container;
    this.unsubscribe = null;

    // 状態変更を購読
    this.unsubscribe = subscribe(() => {
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
   * 主要KPIを計算
   * @returns {Object} KPIデータ
   */
  calculateKPIs() {
    const state = getState();

    if (!state.periods || state.periods.length === 0) {
      return {
        revenue: 0,
        operatingProfit: 0,
        netProfit: 0,
        cash: 0,
        totalAssets: 0,
        totalEquity: 0
      };
    }

    // 現在の期間データを取得
    const currentPeriod = state.periods[state.currentPeriodIndex] || state.periods[0];

    // P/L指標を計算
    const plResults = calculatePLResults(currentPeriod.pl);

    // B/S指標を計算
    const totalAssets = calculateTotalAssets(currentPeriod.bs.assets);
    const totalEquity = calculateTotalEquity(currentPeriod.bs.equity);
    const cash = currentPeriod.bs.assets.current.cash;

    return {
      revenue: currentPeriod.pl.revenue || 0,
      operatingProfit: plResults.operatingProfit,
      netProfit: plResults.netProfit,
      cash: cash,
      totalAssets: totalAssets,
      totalEquity: totalEquity
    };
  }

  /**
   * 売上推移データを取得
   * @returns {Array} 売上推移データ
   */
  getSalesTrend() {
    const state = getState();

    if (!state.periods || state.periods.length === 0) {
      return [];
    }

    // 最新6期間のデータを取得
    const periods = state.periods.slice(-6);

    return periods.map(period => ({
      label: `${period.year}/${period.month}`,
      revenue: period.pl.revenue || 0,
      operatingProfit: calculatePLResults(period.pl).operatingProfit,
      netProfit: calculatePLResults(period.pl).netProfit
    }));
  }

  /**
   * ビューをレンダリング
   */
  render() {
    const state = getState();
    const kpis = this.calculateKPIs();
    const salesTrend = this.getSalesTrend();

    if (!state.initialized || !state.periods || state.periods.length === 0) {
      this.renderEmptyState();
      return;
    }

    const currentPeriod = state.periods[state.currentPeriodIndex] || state.periods[0];

    this.container.innerHTML = `
      <div class="page-content">
        <h2 class="page-title">ダッシュボード</h2>

        <!-- 期間表示 -->
        <div class="card mb-4">
          <div class="card-body" style="padding: 1rem;">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <span style="font-weight: 600;">現在の期間:</span>
              <span style="font-size: 1.125rem; font-weight: 700; color: var(--color-primary);">
                ${currentPeriod.year}年 ${currentPeriod.month}月
              </span>
            </div>
          </div>
        </div>

        <!-- KPIカード -->
        ${this.renderKPICards(kpis)}

        <!-- チャートとサマリー -->
        <div class="grid grid-cols-2 mb-6" style="gap: 1.5rem;">
          ${this.renderSalesTrendChart(salesTrend)}
          ${this.renderFinancialSummary(currentPeriod, kpis)}
        </div>

        <!-- クイックアクション -->
        ${this.renderQuickActions()}
      </div>
    `;

    // チャートを描画
    this.renderCharts(salesTrend);
  }

  /**
   * 空の状態をレンダリング
   */
  renderEmptyState() {
    this.container.innerHTML = `
      <div class="page-content">
        <h2 class="page-title">ダッシュボード</h2>
        <div class="card">
          <div class="card-body" style="text-align: center; padding: 3rem;">
            <h3 style="color: var(--color-text-secondary); margin-bottom: 1rem;">
              データがまだ初期化されていません
            </h3>
            <p style="color: var(--color-text-secondary); margin-bottom: 2rem;">
              設定画面からアプリケーションを初期化してください
            </p>
            <a href="#settings" class="btn btn-primary">設定画面へ</a>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * KPIカードをレンダリング
   * @param {Object} kpis - KPIデータ
   * @returns {string} HTML文字列
   */
  renderKPICards(kpis) {
    const cards = [
      {
        title: '売上高',
        value: formatCurrency(kpis.revenue),
        color: 'var(--color-primary)',
        icon: '📈'
      },
      {
        title: '営業利益',
        value: formatCurrency(kpis.operatingProfit),
        color: 'var(--color-secondary)',
        icon: '💰'
      },
      {
        title: '当期純利益',
        value: formatCurrency(kpis.netProfit),
        color: 'var(--color-success)',
        icon: '✅'
      },
      {
        title: '現金残高',
        value: formatCurrency(kpis.cash),
        color: 'var(--color-warning)',
        icon: '💵'
      }
    ];

    return `
      <div class="grid grid-cols-4 mb-6" style="gap: 1.5rem;">
        ${cards.map(card => `
          <div class="card" style="border-top: 4px solid ${card.color};">
            <div class="card-body">
              <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.5rem;">
                <h3 class="text-muted" style="font-size: 0.875rem; margin: 0;">${card.title}</h3>
                <span style="font-size: 1.5rem;">${card.icon}</span>
              </div>
              <p style="font-size: 1.75rem; font-weight: bold; margin: 0; color: ${card.color};">
                ${card.value}
              </p>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  }

  /**
   * 売上推移チャートをレンダリング
   * @param {Array} salesTrend - 売上推移データ
   * @returns {string} HTML文字列
   */
  renderSalesTrendChart(salesTrend) {
    return `
      <div class="card">
        <div class="card-header">
          <h3 class="card-title">売上・利益推移（直近6期間）</h3>
        </div>
        <div class="card-body">
          <canvas id="salesTrendChart" height="200"></canvas>
        </div>
      </div>
    `;
  }

  /**
   * 財務サマリーをレンダリング
   * @param {Object} currentPeriod - 現在の期間データ
   * @param {Object} kpis - KPIデータ
   * @returns {string} HTML文字列
   */
  renderFinancialSummary(currentPeriod, kpis) {
    const plResults = calculatePLResults(currentPeriod.pl);

    return `
      <div class="card">
        <div class="card-header">
          <h3 class="card-title">財務状況サマリー</h3>
        </div>
        <div class="card-body">
          <div class="summary-item">
            <span class="summary-label">総資産:</span>
            <span class="summary-value">${formatCurrency(kpis.totalAssets)}</span>
          </div>
          <div class="summary-item">
            <span class="summary-label">純資産:</span>
            <span class="summary-value">${formatCurrency(kpis.totalEquity)}</span>
          </div>
          <div class="summary-item" style="margin-top: 1rem; padding-top: 1rem; border-top: 1px solid var(--color-border);">
            <span class="summary-label">売上総利益率:</span>
            <span class="summary-value">${plResults.margins.grossProfitMargin.toFixed(1)}%</span>
          </div>
          <div class="summary-item">
            <span class="summary-label">営業利益率:</span>
            <span class="summary-value">${plResults.margins.operatingProfitMargin.toFixed(1)}%</span>
          </div>
          <div class="summary-item">
            <span class="summary-label">当期純利益率:</span>
            <span class="summary-value">${plResults.margins.netProfitMargin.toFixed(1)}%</span>
          </div>
        </div>
      </div>

      <style>
        .summary-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.5rem 0;
        }
        .summary-label {
          font-size: 0.875rem;
          color: var(--color-text-secondary);
        }
        .summary-value {
          font-size: 1rem;
          font-weight: 600;
          color: var(--color-text-primary);
        }
      </style>
    `;
  }

  /**
   * クイックアクションをレンダリング
   * @returns {string} HTML文字列
   */
  renderQuickActions() {
    return `
      <div class="card">
        <div class="card-header">
          <h3 class="card-title">クイックアクション</h3>
        </div>
        <div class="card-body">
          <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem;">
            <a href="#pl" class="btn btn-secondary" style="text-decoration: none;">
              📊 P/L入力
            </a>
            <a href="#bs" class="btn btn-secondary" style="text-decoration: none;">
              📋 B/S入力
            </a>
            <a href="#cf" class="btn btn-secondary" style="text-decoration: none;">
              💸 C/F入力
            </a>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * チャートを描画
   * @param {Array} salesTrend - 売上推移データ
   */
  renderCharts(salesTrend) {
    // Canvas要素を取得
    const canvas = document.getElementById('salesTrendChart');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');

    // キャンバスをクリア
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (salesTrend.length === 0) {
      // データがない場合のメッセージ
      ctx.font = '14px Arial';
      ctx.fillStyle = '#999';
      ctx.textAlign = 'center';
      ctx.fillText('データがありません', canvas.width / 2, canvas.height / 2);
      return;
    }

    // 簡易的なバーチャートを描画
    const labels = salesTrend.map(d => d.label);
    const revenueData = salesTrend.map(d => d.revenue);
    const profitData = salesTrend.map(d => d.netProfit);

    const maxValue = Math.max(...revenueData, ...profitData);
    const barWidth = (canvas.width - 100) / salesTrend.length / 2;
    const chartHeight = canvas.height - 60;

    // 軸とラベルを描画
    ctx.strokeStyle = '#ddd';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(50, chartHeight);
    ctx.lineTo(canvas.width - 20, chartHeight);
    ctx.stroke();

    // データバーを描画
    salesTrend.forEach((item, index) => {
      const x = 60 + index * (barWidth * 2 + 10);

      // 売上高バー（青）
      const revenueHeight = maxValue > 0 ? (item.revenue / maxValue) * (chartHeight - 40) : 0;
      ctx.fillStyle = '#4A90E2';
      ctx.fillRect(x, chartHeight - revenueHeight, barWidth, revenueHeight);

      // 純利益バー（緑）
      const profitHeight = maxValue > 0 ? (item.netProfit / maxValue) * (chartHeight - 40) : 0;
      ctx.fillStyle = '#7ED321';
      ctx.fillRect(x + barWidth + 5, chartHeight - profitHeight, barWidth, profitHeight);

      // ラベル
      ctx.fillStyle = '#666';
      ctx.font = '10px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(item.label, x + barWidth, chartHeight + 15);
    });

    // 凡例を描画
    ctx.font = '12px Arial';
    ctx.textAlign = 'left';

    ctx.fillStyle = '#4A90E2';
    ctx.fillRect(60, 10, 15, 15);
    ctx.fillStyle = '#333';
    ctx.fillText('売上高', 80, 22);

    ctx.fillStyle = '#7ED321';
    ctx.fillRect(160, 10, 15, 15);
    ctx.fillStyle = '#333';
    ctx.fillText('当期純利益', 180, 22);
  }
}
