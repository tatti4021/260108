/**
 * チャート・グラフビュー
 * 財務データの可視化を担当
 */

import {
  chartColors,
  createChart,
  destroyChart,
  isEmptyData,
  showNoDataMessage
} from '../utils/chart-config.js';

/**
 * ChartsViewクラス
 * 各種財務グラフの描画を管理
 */
export class ChartsView {
  constructor(container) {
    this.container = container;
    this.charts = {}; // チャートインスタンスを保存
  }

  /**
   * チャートを破棄してクリーンアップ
   * @param {string} chartId - チャートID
   */
  destroyChart(chartId) {
    if (this.charts[chartId]) {
      destroyChart(this.charts[chartId]);
      delete this.charts[chartId];
    }
  }

  /**
   * すべてのチャートを破棄
   */
  destroyAllCharts() {
    Object.keys(this.charts).forEach(chartId => {
      this.destroyChart(chartId);
    });
  }

  /**
   * 売上・利益推移グラフ（折れ線グラフ）
   * @param {string} canvasId - Canvas要素のID
   * @param {Array} periods - 期間データの配列
   */
  renderRevenueChart(canvasId, periods) {
    // 既存のチャートを破棄
    this.destroyChart(canvasId);

    const canvas = document.getElementById(canvasId);
    if (!canvas) {
      console.error(`Canvas element with id "${canvasId}" not found`);
      return;
    }

    // データがない場合
    if (!periods || periods.length === 0) {
      showNoDataMessage(canvas.parentElement, 'データがまだ入力されていません');
      return;
    }

    // データを準備
    const labels = periods.map(period => period.name || `期間${period.id}`);
    const revenueData = periods.map(period => period.pl?.revenue || 0);
    const operatingProfitData = periods.map(period => period.pl?.operatingProfit || 0);
    const netIncomeData = periods.map(period => period.pl?.netIncome || 0);

    // すべてのデータが0の場合
    if (isEmptyData(revenueData) && isEmptyData(operatingProfitData) && isEmptyData(netIncomeData)) {
      showNoDataMessage(canvas.parentElement, 'データがまだ入力されていません');
      return;
    }

    const data = {
      labels: labels,
      datasets: [
        {
          label: '売上高',
          data: revenueData,
          borderColor: chartColors.primary,
          backgroundColor: chartColors.primary + '20',
          fill: false,
          tension: 0.4
        },
        {
          label: '営業利益',
          data: operatingProfitData,
          borderColor: chartColors.success,
          backgroundColor: chartColors.success + '20',
          fill: false,
          tension: 0.4
        },
        {
          label: '当期純利益',
          data: netIncomeData,
          borderColor: chartColors.info,
          backgroundColor: chartColors.info + '20',
          fill: false,
          tension: 0.4
        }
      ]
    };

    const options = {
      plugins: {
        title: {
          display: true,
          text: '売上・利益推移',
          font: {
            size: 16,
            weight: 'bold'
          }
        }
      }
    };

    // チャートを作成して保存
    const ctx = canvas.getContext('2d');
    this.charts[canvasId] = createChart(ctx, 'line', data, options);
  }

  /**
   * 費用構成グラフ（円グラフ）
   * @param {string} canvasId - Canvas要素のID
   * @param {Object} plData - P/Lデータ
   */
  renderExpenseChart(canvasId, plData) {
    // 既存のチャートを破棄
    this.destroyChart(canvasId);

    const canvas = document.getElementById(canvasId);
    if (!canvas) {
      console.error(`Canvas element with id "${canvasId}" not found`);
      return;
    }

    // データがない場合
    if (!plData) {
      showNoDataMessage(canvas.parentElement, 'データがまだ入力されていません');
      return;
    }

    // 費用データを準備
    const expenseItems = [
      { label: '売上原価', value: plData.cogs || 0 },
      { label: '人件費', value: plData.laborCost || 0 },
      { label: '賃料', value: plData.rent || 0 },
      { label: '光熱費', value: plData.utilities || 0 },
      { label: '広告宣伝費', value: plData.advertising || 0 },
      { label: 'その他費用', value: plData.otherExpenses || 0 }
    ];

    // 0より大きい項目のみをフィルタリング
    const filteredItems = expenseItems.filter(item => item.value > 0);

    if (filteredItems.length === 0) {
      showNoDataMessage(canvas.parentElement, 'データがまだ入力されていません');
      return;
    }

    const data = {
      labels: filteredItems.map(item => item.label),
      datasets: [{
        data: filteredItems.map(item => item.value),
        backgroundColor: [
          chartColors.danger,
          chartColors.warning,
          chartColors.info,
          chartColors.purple,
          chartColors.pink,
          chartColors.secondary
        ],
        borderWidth: 2,
        borderColor: '#ffffff'
      }]
    };

    const options = {
      plugins: {
        title: {
          display: true,
          text: '費用構成',
          font: {
            size: 16,
            weight: 'bold'
          }
        }
      }
    };

    // チャートを作成して保存
    const ctx = canvas.getContext('2d');
    this.charts[canvasId] = createChart(ctx, 'pie', data, options);
  }

  /**
   * 費用推移グラフ（積み上げ棒グラフ）
   * @param {string} canvasId - Canvas要素のID
   * @param {Array} periods - 期間データの配列
   */
  renderExpenseTrendChart(canvasId, periods) {
    // 既存のチャートを破棄
    this.destroyChart(canvasId);

    const canvas = document.getElementById(canvasId);
    if (!canvas) {
      console.error(`Canvas element with id "${canvasId}" not found`);
      return;
    }

    // データがない場合
    if (!periods || periods.length === 0) {
      showNoDataMessage(canvas.parentElement, 'データがまだ入力されていません');
      return;
    }

    // データを準備
    const labels = periods.map(period => period.name || `期間${period.id}`);
    const cogsData = periods.map(period => period.pl?.cogs || 0);
    const laborCostData = periods.map(period => period.pl?.laborCost || 0);
    const rentData = periods.map(period => period.pl?.rent || 0);
    const utilitiesData = periods.map(period => period.pl?.utilities || 0);
    const advertisingData = periods.map(period => period.pl?.advertising || 0);
    const otherExpensesData = periods.map(period => period.pl?.otherExpenses || 0);

    const data = {
      labels: labels,
      datasets: [
        {
          label: '売上原価',
          data: cogsData,
          backgroundColor: chartColors.danger,
          borderWidth: 0
        },
        {
          label: '人件費',
          data: laborCostData,
          backgroundColor: chartColors.warning,
          borderWidth: 0
        },
        {
          label: '賃料',
          data: rentData,
          backgroundColor: chartColors.info,
          borderWidth: 0
        },
        {
          label: '光熱費',
          data: utilitiesData,
          backgroundColor: chartColors.purple,
          borderWidth: 0
        },
        {
          label: '広告宣伝費',
          data: advertisingData,
          backgroundColor: chartColors.pink,
          borderWidth: 0
        },
        {
          label: 'その他費用',
          data: otherExpensesData,
          backgroundColor: chartColors.secondary,
          borderWidth: 0
        }
      ]
    };

    const options = {
      plugins: {
        title: {
          display: true,
          text: '費用推移',
          font: {
            size: 16,
            weight: 'bold'
          }
        }
      },
      scales: {
        x: {
          stacked: true
        },
        y: {
          stacked: true
        }
      }
    };

    // チャートを作成して保存
    const ctx = canvas.getContext('2d');
    this.charts[canvasId] = createChart(ctx, 'bar', data, options);
  }

  /**
   * B/S構成グラフ（横棒グラフ・左右対称）
   * @param {string} canvasId - Canvas要素のID
   * @param {Object} bsData - B/Sデータ
   */
  renderBSChart(canvasId, bsData) {
    // 既存のチャートを破棄
    this.destroyChart(canvasId);

    const canvas = document.getElementById(canvasId);
    if (!canvas) {
      console.error(`Canvas element with id "${canvasId}" not found`);
      return;
    }

    // データがない場合
    if (!bsData) {
      showNoDataMessage(canvas.parentElement, 'データがまだ入力されていません');
      return;
    }

    // 資産データ
    const currentAssets = bsData.currentAssets || 0;
    const fixedAssets = bsData.fixedAssets || 0;

    // 負債・純資産データ
    const currentLiabilities = bsData.currentLiabilities || 0;
    const longTermLiabilities = bsData.longTermLiabilities || 0;
    const equity = bsData.equity || 0;

    // すべてが0の場合
    if (currentAssets === 0 && fixedAssets === 0 &&
        currentLiabilities === 0 && longTermLiabilities === 0 && equity === 0) {
      showNoDataMessage(canvas.parentElement, 'データがまだ入力されていません');
      return;
    }

    const data = {
      labels: ['流動資産', '固定資産', '流動負債', '固定負債', '純資産'],
      datasets: [{
        label: 'B/S構成',
        data: [
          currentAssets,      // 資産（左側）
          fixedAssets,        // 資産（左側）
          -currentLiabilities, // 負債（右側、マイナスで表示）
          -longTermLiabilities, // 負債（右側、マイナスで表示）
          -equity             // 純資産（右側、マイナスで表示）
        ],
        backgroundColor: [
          chartColors.primary,   // 流動資産
          chartColors.info,      // 固定資産
          chartColors.warning,   // 流動負債
          chartColors.danger,    // 固定負債
          chartColors.success    // 純資産
        ],
        borderWidth: 0
      }]
    };

    const options = {
      indexAxis: 'y', // 横棒グラフ
      plugins: {
        title: {
          display: true,
          text: 'B/S構成（資産・負債・純資産）',
          font: {
            size: 16,
            weight: 'bold'
          }
        },
        legend: {
          display: false
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              const value = Math.abs(context.parsed.x);
              return context.label + ': ' + new Intl.NumberFormat('ja-JP', {
                style: 'currency',
                currency: 'JPY',
                maximumFractionDigits: 0
              }).format(value);
            }
          }
        }
      },
      scales: {
        x: {
          ticks: {
            callback: function(value) {
              return new Intl.NumberFormat('ja-JP', {
                style: 'currency',
                currency: 'JPY',
                notation: 'compact',
                compactDisplay: 'short',
                maximumFractionDigits: 1
              }).format(Math.abs(value));
            }
          }
        }
      }
    };

    // チャートを作成して保存
    const ctx = canvas.getContext('2d');
    this.charts[canvasId] = createChart(ctx, 'bar', data, options);
  }

  /**
   * C/Fウォーターフォールチャート
   * @param {string} canvasId - Canvas要素のID
   * @param {Object} cfData - C/Fデータ
   */
  renderCFWaterfallChart(canvasId, cfData) {
    // 既存のチャートを破棄
    this.destroyChart(canvasId);

    const canvas = document.getElementById(canvasId);
    if (!canvas) {
      console.error(`Canvas element with id "${canvasId}" not found`);
      return;
    }

    // データがない場合
    if (!cfData) {
      showNoDataMessage(canvas.parentElement, 'データがまだ入力されていません');
      return;
    }

    // C/Fデータを取得
    const openingBalance = cfData.openingBalance || 0;
    const operatingCF = cfData.operatingCF || 0;
    const investingCF = cfData.investingCF || 0;
    const financingCF = cfData.financingCF || 0;
    const closingBalance = cfData.closingBalance || 0;

    // ウォーターフォール用のデータを計算
    let cumulative = openingBalance;
    const operatingEnd = cumulative + operatingCF;
    cumulative = operatingEnd;
    const investingEnd = cumulative + investingCF;
    cumulative = investingEnd;
    const financingEnd = cumulative + financingCF;

    // 各段階の開始点と変化量
    const dataPoints = [
      { label: '期首残高', start: 0, value: openingBalance, end: openingBalance },
      { label: '営業CF', start: openingBalance, value: operatingCF, end: operatingEnd },
      { label: '投資CF', start: operatingEnd, value: investingCF, end: investingEnd },
      { label: '財務CF', start: investingEnd, value: financingCF, end: financingEnd },
      { label: '期末残高', start: 0, value: closingBalance, end: closingBalance }
    ];

    // 背景色を決定（プラスは緑、マイナスは赤）
    const backgroundColors = dataPoints.map((point, index) => {
      if (index === 0 || index === 4) return chartColors.secondary; // 期首・期末残高
      return point.value >= 0 ? chartColors.success : chartColors.danger;
    });

    const data = {
      labels: dataPoints.map(p => p.label),
      datasets: [{
        label: 'キャッシュフロー',
        data: dataPoints.map(p => [p.start, p.end]),
        backgroundColor: backgroundColors,
        borderWidth: 0,
        barThickness: 40
      }]
    };

    const options = {
      plugins: {
        title: {
          display: true,
          text: 'キャッシュフロー推移',
          font: {
            size: 16,
            weight: 'bold'
          }
        },
        legend: {
          display: false
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              const index = context.dataIndex;
              const point = dataPoints[index];
              let label = point.label + ': ';

              if (index === 0 || index === 4) {
                // 期首・期末残高
                label += new Intl.NumberFormat('ja-JP', {
                  style: 'currency',
                  currency: 'JPY',
                  maximumFractionDigits: 0
                }).format(point.value);
              } else {
                // CF変動
                const sign = point.value >= 0 ? '+' : '';
                label += sign + new Intl.NumberFormat('ja-JP', {
                  style: 'currency',
                  currency: 'JPY',
                  maximumFractionDigits: 0
                }).format(point.value);
              }

              return label;
            }
          }
        }
      },
      scales: {
        y: {
          beginAtZero: false
        }
      }
    };

    // チャートを作成して保存
    const ctx = canvas.getContext('2d');
    this.charts[canvasId] = createChart(ctx, 'bar', data, options);
  }

  /**
   * ダッシュボード用の簡易売上推移グラフ
   * @param {string} canvasId - Canvas要素のID
   * @param {Array} periods - 期間データの配列
   */
  renderSimpleRevenueChart(canvasId, periods) {
    // 既存のチャートを破棄
    this.destroyChart(canvasId);

    const canvas = document.getElementById(canvasId);
    if (!canvas) {
      console.error(`Canvas element with id "${canvasId}" not found`);
      return;
    }

    // データがない場合
    if (!periods || periods.length === 0) {
      showNoDataMessage(canvas.parentElement, 'データがまだ入力されていません');
      return;
    }

    // データを準備
    const labels = periods.map(period => period.name || `期間${period.id}`);
    const revenueData = periods.map(period => period.pl?.revenue || 0);

    // データが0の場合
    if (isEmptyData(revenueData)) {
      showNoDataMessage(canvas.parentElement, 'データがまだ入力されていません');
      return;
    }

    const data = {
      labels: labels,
      datasets: [{
        label: '売上高',
        data: revenueData,
        borderColor: chartColors.primary,
        backgroundColor: chartColors.primary + '40',
        fill: true,
        tension: 0.4
      }]
    };

    const options = {
      plugins: {
        legend: {
          display: false
        }
      }
    };

    // チャートを作成して保存
    const ctx = canvas.getContext('2d');
    this.charts[canvasId] = createChart(ctx, 'line', data, options);
  }

  /**
   * ダッシュボード用の簡易利益推移グラフ
   * @param {string} canvasId - Canvas要素のID
   * @param {Array} periods - 期間データの配列
   */
  renderSimpleProfitChart(canvasId, periods) {
    // 既存のチャートを破棄
    this.destroyChart(canvasId);

    const canvas = document.getElementById(canvasId);
    if (!canvas) {
      console.error(`Canvas element with id "${canvasId}" not found`);
      return;
    }

    // データがない場合
    if (!periods || periods.length === 0) {
      showNoDataMessage(canvas.parentElement, 'データがまだ入力されていません');
      return;
    }

    // データを準備
    const labels = periods.map(period => period.name || `期間${period.id}`);
    const profitData = periods.map(period => period.pl?.netIncome || 0);

    // データが0の場合
    if (isEmptyData(profitData)) {
      showNoDataMessage(canvas.parentElement, 'データがまだ入力されていません');
      return;
    }

    const data = {
      labels: labels,
      datasets: [{
        label: '当期純利益',
        data: profitData,
        borderColor: chartColors.success,
        backgroundColor: chartColors.success + '40',
        fill: true,
        tension: 0.4
      }]
    };

    const options = {
      plugins: {
        legend: {
          display: false
        }
      }
    };

    // チャートを作成して保存
    const ctx = canvas.getContext('2d');
    this.charts[canvasId] = createChart(ctx, 'line', data, options);
  }
}
