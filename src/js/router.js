/**
 * ルーティングモジュール
 * SPAのページ切り替えをハッシュベースで管理
 */

class Router {
    constructor() {
        this.routes = {};
        this.currentPage = null;
    }

    /**
     * ルートを登録
     * @param {string} path - ルートパス
     * @param {Function} handler - ページレンダリング関数
     */
    register(path, handler) {
        this.routes[path] = handler;
    }

    /**
     * 現在のハッシュに基づいてページを読み込む
     */
    navigate() {
        // ハッシュからページ名を取得（デフォルトはdashboard）
        const hash = window.location.hash.slice(1) || 'dashboard';

        // ルートが存在するか確認
        if (this.routes[hash]) {
            this.currentPage = hash;
            this.routes[hash]();
            this.updateActiveNav(hash);
        } else {
            // 存在しない場合はダッシュボードにリダイレクト
            window.location.hash = '#dashboard';
        }
    }

    /**
     * ナビゲーションのアクティブ状態を更新
     * @param {string} page - アクティブにするページ名
     */
    updateActiveNav(page) {
        // すべてのナビゲーションアイテムからactiveクラスを削除
        const navItems = document.querySelectorAll('.nav-item');
        navItems.forEach(item => {
            item.classList.remove('active');
        });

        // 現在のページに対応するナビゲーションアイテムにactiveクラスを追加
        const activeNav = document.querySelector(`.nav-item[data-page="${page}"]`);
        if (activeNav) {
            activeNav.classList.add('active');
        }
    }

    /**
     * ルーターを初期化し、ハッシュ変更イベントをリスン
     */
    init() {
        // ハッシュ変更時にナビゲート
        window.addEventListener('hashchange', () => this.navigate());

        // 初期読み込み時にナビゲート
        this.navigate();
    }
}

// ページレンダリング関数

/**
 * ダッシュボードページを表示
 */
export function renderDashboard() {
    // DashboardViewをインポートして使用
    import('./views/dashboard.js').then(module => {
        const { DashboardView } = module;
        const container = document.getElementById('mainContent');
        const dashboardView = new DashboardView(container);
        dashboardView.render();
    }).catch(error => {
        console.error('Failed to load Dashboard view:', error);
        document.getElementById('mainContent').innerHTML = `
            <div class="page-content">
                <h2 class="page-title">ダッシュボード</h2>
                <div class="alert alert-danger">
                    ビューの読み込みに失敗しました: ${error.message}
                </div>
            </div>
        `;
    });
}

/**
 * 通貨フォーマット
 */
function formatCurrency(value) {
    return new Intl.NumberFormat('ja-JP', {
        style: 'currency',
        currency: 'JPY',
        maximumFractionDigits: 0
    }).format(value);
}

/**
 * 損益計算書ページを表示
 */
export function renderPL() {
    // PLViewをインポートして使用
    import('./views/pl.js').then(async module => {
        const { PLView } = module;
        const stateModule = await import('./utils/state.js');
        const { getState, getCurrentPeriod } = stateModule;

        const state = getState();
        const currentPeriod = getCurrentPeriod();
        const periodIndex = state.currentPeriodIndex || 0;

        const container = document.getElementById('mainContent');
        const plView = new PLView(container);

        if (currentPeriod) {
            plView.render(currentPeriod, periodIndex);
        } else {
            // データがない場合のフォールバック
            container.innerHTML = `
                <div class="page-content">
                    <h2 class="page-title">損益計算書 (P/L)</h2>
                    <div class="alert alert-warning">
                        データが初期化されていません。アプリケーションを初期化してください。
                    </div>
                </div>
            `;
        }
    }).catch(error => {
        console.error('Failed to load PL view:', error);
        document.getElementById('mainContent').innerHTML = `
            <div class="page-content">
                <h2 class="page-title">損益計算書 (P/L)</h2>
                <div class="alert alert-danger">
                    ビューの読み込みに失敗しました: ${error.message}
                </div>
            </div>
        `;
    });
}

/**
 * 貸借対照表ページを表示
 */
export function renderBS() {
    // BSViewをインポートして使用
    import('./views/bs.js').then(module => {
        const container = document.getElementById('mainContent');
        const bsView = new module.BSView(container);
        bsView.render();
    }).catch(error => {
        console.error('Failed to load BS view:', error);
        document.getElementById('mainContent').innerHTML = `
            <div class="page-content">
                <h2 class="page-title">貸借対照表 (B/S)</h2>
                <div class="alert alert-danger">
                    ビューの読み込みに失敗しました: ${error.message}
                </div>
            </div>
        `;
    });
}

/**
 * キャッシュフローページを表示
 */
export function renderCF() {
    // CFViewをインポートして使用
    import('./views/cf.js').then(async module => {
        const { CFView } = module;
        const stateModule = await import('./utils/state.js');
        const { getState } = stateModule;

        const state = getState();
        const periodIndex = state.currentPeriodIndex || 0;

        const container = document.getElementById('mainContent');
        const cfView = new CFView(container);

        if (state.periods && state.periods.length > 0) {
            cfView.render(periodIndex);
        } else {
            // データがない場合のフォールバック
            container.innerHTML = `
                <div class="page-content">
                    <h2 class="page-title">キャッシュフロー計算書 (C/F)</h2>
                    <div class="alert alert-warning">
                        データが初期化されていません。アプリケーションを初期化してください。
                    </div>
                </div>
            `;
        }
    }).catch(error => {
        console.error('Failed to load CF view:', error);
        document.getElementById('mainContent').innerHTML = `
            <div class="page-content">
                <h2 class="page-title">キャッシュフロー計算書 (C/F)</h2>
                <div class="alert alert-danger">
                    ビューの読み込みに失敗しました: ${error.message}
                </div>
            </div>
        `;
    });
}

/**
 * 財務分析ページを表示
 */
export function renderAnalysis() {
    // AnalysisViewをインポートして使用
    import('./views/analysis.js').then(async module => {
        const { AnalysisView } = module;
        const stateModule = await import('./utils/state.js');
        const { getState } = stateModule;

        const state = getState();
        const periodIndex = state.currentPeriodIndex || 0;

        const container = document.getElementById('mainContent');
        const analysisView = new AnalysisView(container);

        if (state.periods && state.periods.length > 0) {
            analysisView.render(state.periods[periodIndex], periodIndex);
        } else {
            // データがない場合のフォールバック
            container.innerHTML = `
                <div class="page-content">
                    <h2 class="page-title">財務分析</h2>
                    <div class="alert alert-warning">
                        データが初期化されていません。アプリケーションを初期化してください。
                    </div>
                </div>
            `;
        }
    }).catch(error => {
        console.error('Failed to load Analysis view:', error);
        document.getElementById('mainContent').innerHTML = `
            <div class="page-content">
                <h2 class="page-title">財務分析</h2>
                <div class="alert alert-danger">
                    ビューの読み込みに失敗しました: ${error.message}
                </div>
            </div>
        `;
    });
}

/**
 * 予測・シミュレーションページを表示
 */
export function renderForecast() {
    // ForecastViewをインポートして使用
    import('./views/forecast.js').then(module => {
        const { ForecastView } = module;
        const container = document.getElementById('mainContent');
        const forecastView = new ForecastView(container);
        forecastView.render();
    }).catch(error => {
        console.error('Failed to load Forecast view:', error);
        document.getElementById('mainContent').innerHTML = `
            <div class="page-content">
                <h2 class="page-title">予測・シミュレーション</h2>
                <div class="alert alert-danger">
                    ビューの読み込みに失敗しました: ${error.message}
                </div>
            </div>
        `;
    });
}

/**
 * 設定ページを表示
 */
export function renderSettings() {
    // SettingsViewをインポートして使用
    import('./views/settings.js').then(module => {
        const { SettingsView } = module;
        const container = document.getElementById('mainContent');
        const settingsView = new SettingsView(container);
        settingsView.render();
    }).catch(error => {
        console.error('Failed to load Settings view:', error);
        document.getElementById('mainContent').innerHTML = `
            <div class="page-content">
                <h2 class="page-title">設定</h2>
                <div class="alert alert-danger">
                    ビューの読み込みに失敗しました: ${error.message}
                </div>
            </div>
        `;
    });
}

// ルーターをエクスポート
export default Router;
