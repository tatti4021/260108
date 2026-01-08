/**
 * Chart.js 基本設定モジュール
 * グラフ作成のための共通設定とヘルパー関数
 */

// 共通カラーパレット
export const chartColors = {
  primary: '#3b82f6',
  secondary: '#6b7280',
  success: '#22c55e',
  danger: '#ef4444',
  warning: '#f59e0b',
  info: '#06b6d4',
  purple: '#8b5cf6',
  pink: '#ec4899',
  indigo: '#6366f1',
  teal: '#14b8a6'
};

// グラデーションカラー（収益・利益用）
export const gradientColors = {
  revenue: ['#3b82f6', '#2563eb', '#1d4ed8'],
  profit: ['#22c55e', '#16a34a', '#15803d'],
  expense: ['#ef4444', '#dc2626', '#b91c1c']
};

// 共通オプション
export const defaultOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'top',
      labels: {
        font: {
          family: "'Segoe UI', 'Helvetica Neue', Arial, sans-serif",
          size: 12
        },
        padding: 15,
        usePointStyle: true
      }
    },
    tooltip: {
      mode: 'index',
      intersect: false,
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      titleFont: {
        size: 13,
        weight: 'bold'
      },
      bodyFont: {
        size: 12
      },
      padding: 12,
      cornerRadius: 4,
      displayColors: true,
      callbacks: {
        label: function(context) {
          let label = context.dataset.label || '';
          if (label) {
            label += ': ';
          }
          if (context.parsed.y !== null) {
            label += new Intl.NumberFormat('ja-JP', {
              style: 'currency',
              currency: 'JPY',
              maximumFractionDigits: 0
            }).format(context.parsed.y);
          }
          return label;
        }
      }
    }
  },
  interaction: {
    mode: 'nearest',
    axis: 'x',
    intersect: false
  },
  scales: {
    y: {
      beginAtZero: true,
      ticks: {
        callback: function(value) {
          return new Intl.NumberFormat('ja-JP', {
            style: 'currency',
            currency: 'JPY',
            notation: 'compact',
            compactDisplay: 'short',
            maximumFractionDigits: 1
          }).format(value);
        },
        font: {
          size: 11
        }
      },
      grid: {
        color: 'rgba(0, 0, 0, 0.05)'
      }
    },
    x: {
      ticks: {
        font: {
          size: 11
        }
      },
      grid: {
        display: false
      }
    }
  }
};

// 折れ線グラフ用オプション
export const lineChartOptions = {
  ...defaultOptions,
  elements: {
    line: {
      tension: 0.4, // 滑らかな曲線
      borderWidth: 2
    },
    point: {
      radius: 4,
      hoverRadius: 6,
      hitRadius: 10
    }
  }
};

// 棒グラフ用オプション
export const barChartOptions = {
  ...defaultOptions,
  elements: {
    bar: {
      borderRadius: 4,
      borderWidth: 0
    }
  }
};

// 円グラフ用オプション
export const pieChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'right',
      labels: {
        font: {
          family: "'Segoe UI', 'Helvetica Neue', Arial, sans-serif",
          size: 12
        },
        padding: 15,
        usePointStyle: true,
        generateLabels: function(chart) {
          const data = chart.data;
          if (data.labels.length && data.datasets.length) {
            return data.labels.map((label, i) => {
              const value = data.datasets[0].data[i];
              const total = data.datasets[0].data.reduce((a, b) => a + b, 0);
              const percentage = ((value / total) * 100).toFixed(1);

              return {
                text: `${label} (${percentage}%)`,
                fillStyle: data.datasets[0].backgroundColor[i],
                hidden: false,
                index: i
              };
            });
          }
          return [];
        }
      }
    },
    tooltip: {
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      titleFont: {
        size: 13,
        weight: 'bold'
      },
      bodyFont: {
        size: 12
      },
      padding: 12,
      cornerRadius: 4,
      callbacks: {
        label: function(context) {
          let label = context.label || '';
          if (label) {
            label += ': ';
          }
          const value = context.parsed;
          const total = context.dataset.data.reduce((a, b) => a + b, 0);
          const percentage = ((value / total) * 100).toFixed(1);

          label += new Intl.NumberFormat('ja-JP', {
            style: 'currency',
            currency: 'JPY',
            maximumFractionDigits: 0
          }).format(value);
          label += ` (${percentage}%)`;

          return label;
        }
      }
    }
  }
};

/**
 * チャートを作成
 * @param {HTMLCanvasElement} ctx - Canvas要素のコンテキスト
 * @param {string} type - チャートタイプ ('line', 'bar', 'pie', 'doughnut')
 * @param {Object} data - チャートデータ
 * @param {Object} options - カスタムオプション（オプショナル）
 * @returns {Chart} Chart.jsインスタンス
 */
export function createChart(ctx, type, data, options = {}) {
  if (!ctx) {
    console.error('Canvas context is required');
    return null;
  }

  // チャートタイプに応じたデフォルトオプションを選択
  let baseOptions;
  switch (type) {
    case 'line':
      baseOptions = lineChartOptions;
      break;
    case 'bar':
      baseOptions = barChartOptions;
      break;
    case 'pie':
    case 'doughnut':
      baseOptions = pieChartOptions;
      break;
    default:
      baseOptions = defaultOptions;
  }

  // オプションをマージ
  const mergedOptions = mergeOptions(baseOptions, options);

  try {
    return new Chart(ctx, {
      type: type,
      data: data,
      options: mergedOptions
    });
  } catch (error) {
    console.error('Failed to create chart:', error);
    return null;
  }
}

/**
 * チャートを破棄
 * @param {Chart} chart - Chart.jsインスタンス
 */
export function destroyChart(chart) {
  if (chart && typeof chart.destroy === 'function') {
    chart.destroy();
  }
}

/**
 * オプションをディープマージ
 * @param {Object} target - ターゲットオブジェクト
 * @param {Object} source - ソースオブジェクト
 * @returns {Object} マージされたオブジェクト
 */
function mergeOptions(target, source) {
  const output = { ...target };

  if (isObject(target) && isObject(source)) {
    Object.keys(source).forEach(key => {
      if (isObject(source[key])) {
        if (!(key in target)) {
          output[key] = source[key];
        } else {
          output[key] = mergeOptions(target[key], source[key]);
        }
      } else {
        output[key] = source[key];
      }
    });
  }

  return output;
}

/**
 * オブジェクトかどうかを判定
 * @param {*} item - チェックする項目
 * @returns {boolean}
 */
function isObject(item) {
  return item && typeof item === 'object' && !Array.isArray(item);
}

/**
 * データが空かどうかをチェック
 * @param {Array} data - チェックするデータ配列
 * @returns {boolean}
 */
export function isEmptyData(data) {
  if (!data || !Array.isArray(data)) return true;
  return data.length === 0 || data.every(value => value === 0 || value === null || value === undefined);
}

/**
 * 「データなし」メッセージを表示
 * @param {HTMLElement} container - コンテナ要素
 * @param {string} message - 表示するメッセージ（オプショナル）
 */
export function showNoDataMessage(container, message = 'データがありません') {
  if (!container) return;

  container.innerHTML = `
    <div style="display: flex; align-items: center; justify-content: center; height: 100%; min-height: 200px;">
      <p style="color: #6b7280; font-size: 14px; text-align: center;">${message}</p>
    </div>
  `;
}

/**
 * 数値をフォーマット
 * @param {number} value - フォーマットする数値
 * @param {string} style - フォーマットスタイル ('currency', 'decimal', 'percent')
 * @returns {string}
 */
export function formatNumber(value, style = 'currency') {
  const options = {
    style: style,
    maximumFractionDigits: 0
  };

  if (style === 'currency') {
    options.currency = 'JPY';
  }

  return new Intl.NumberFormat('ja-JP', options).format(value);
}
