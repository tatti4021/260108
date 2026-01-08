/**
 * 財務モデリングシステム - メインアプリケーション
 * アプリケーションの初期化とイベント管理
 */

import Router, {
    renderDashboard,
    renderPL,
    renderBS,
    renderCF,
    renderAnalysis,
    renderForecast,
    renderSettings
} from './router.js';

import { initialize, saveState } from './utils/state.js';
import { initializeIntegration } from './utils/integration.js';

/**
 * アプリケーションクラス
 */
class FinancialModelingApp {
    constructor() {
        this.router = new Router();
        this.lastSaved = null;
    }

    /**
     * アプリケーションの初期化
     */
    init() {
        console.log('財務モデリングシステムを初期化中...');

        // 状態管理システムを初期化
        try {
            initialize({
                startYear: new Date().getFullYear(),
                startMonth: 1,
                numPeriods: 12,
                forceNew: false
            });
            console.log('状態管理システムを初期化しました');
        } catch (error) {
            console.error('状態管理システムの初期化に失敗:', error);
        }

        // 財務三表の連携機能を初期化
        try {
            initializeIntegration();
            console.log('財務三表の連携機能を初期化しました');
        } catch (error) {
            console.error('連携機能の初期化に失敗:', error);
        }

        // ルートを登録
        this.setupRoutes();

        // イベントリスナーを設定
        this.setupEventListeners();

        // ルーターを初期化
        this.router.init();

        // 最終保存時刻を更新
        this.updateLastSaved();

        console.log('初期化完了');
    }

    /**
     * ルートの設定
     */
    setupRoutes() {
        this.router.register('dashboard', renderDashboard);
        this.router.register('pl', renderPL);
        this.router.register('bs', renderBS);
        this.router.register('cf', renderCF);
        this.router.register('analysis', renderAnalysis);
        this.router.register('forecast', renderForecast);
        this.router.register('settings', renderSettings);
    }

    /**
     * イベントリスナーの設定
     */
    setupEventListeners() {
        // 保存ボタン
        const saveBtn = document.getElementById('saveBtn');
        if (saveBtn) {
            saveBtn.addEventListener('click', () => this.handleSave());
        }

        // データ取込ボタン
        const importBtn = document.getElementById('importBtn');
        if (importBtn) {
            importBtn.addEventListener('click', () => this.handleImport());
        }

        // Excelエクスポートボタン
        const exportExcelBtn = document.getElementById('exportExcelBtn');
        if (exportExcelBtn) {
            exportExcelBtn.addEventListener('click', () => this.handleExportExcel());
        }

        // PDFエクスポートボタン
        const exportPdfBtn = document.getElementById('exportPdfBtn');
        if (exportPdfBtn) {
            exportPdfBtn.addEventListener('click', () => this.handleExportPdf());
        }

        // ナビゲーションアイテムのクリックイベント
        const navItems = document.querySelectorAll('.nav-item');
        navItems.forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const page = item.dataset.page;
                window.location.hash = `#${page}`;
            });
        });
    }

    /**
     * データを保存
     */
    handleSave() {
        console.log('データを保存中...');

        try {
            // 状態管理システムを使って保存
            const saved = saveState();

            if (saved) {
                // 最終保存時刻を更新
                this.lastSaved = new Date();
                this.updateLastSaved();

                // 成功メッセージを表示
                this.showNotification('データを保存しました', 'success');
                console.log('保存完了');
            } else {
                throw new Error('保存に失敗しました');
            }
        } catch (error) {
            console.error('保存エラー:', error);
            this.showNotification('保存に失敗しました', 'danger');
        }
    }

    /**
     * データをインポート
     */
    handleImport() {
        console.log('データ取込処理...');

        // ファイル選択ダイアログを表示（モック）
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json,.csv,.xlsx';
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (file) {
                console.log('選択されたファイル:', file.name);
                this.showNotification(`ファイル「${file.name}」のインポート機能は後続のSessionで実装されます`, 'info');
            }
        };
        input.click();
    }

    /**
     * Excelにエクスポート
     */
    handleExportExcel() {
        console.log('Excelエクスポート処理...');
        this.showNotification('Excelエクスポート機能は後続のSessionで実装されます', 'info');
    }

    /**
     * PDFにエクスポート
     */
    handleExportPdf() {
        console.log('PDFエクスポート処理...');
        this.showNotification('PDFエクスポート機能は後続のSessionで実装されます', 'info');
    }

    /**
     * 最終保存時刻を更新
     */
    updateLastSaved() {
        const lastSavedElement = document.getElementById('lastSaved');
        if (lastSavedElement) {
            if (this.lastSaved) {
                const timeStr = this.lastSaved.toLocaleTimeString('ja-JP', {
                    hour: '2-digit',
                    minute: '2-digit'
                });
                lastSavedElement.textContent = `最終保存: ${timeStr}`;
            } else {
                // LocalStorageから読み込み
                const savedData = localStorage.getItem('financialModelingData');
                if (savedData) {
                    const data = JSON.parse(savedData);
                    const savedTime = new Date(data.timestamp);
                    const timeStr = savedTime.toLocaleTimeString('ja-JP', {
                        hour: '2-digit',
                        minute: '2-digit'
                    });
                    lastSavedElement.textContent = `最終保存: ${timeStr}`;
                }
            }
        }
    }

    /**
     * 通知を表示
     * @param {string} message - 表示するメッセージ
     * @param {string} type - 通知タイプ (success, info, warning, danger)
     */
    showNotification(message, type = 'info') {
        // 通知要素を作成
        const notification = document.createElement('div');
        notification.className = `alert alert-${type}`;
        notification.style.position = 'fixed';
        notification.style.top = '80px';
        notification.style.right = '20px';
        notification.style.zIndex = '9999';
        notification.style.minWidth = '300px';
        notification.style.boxShadow = 'var(--shadow-lg)';
        notification.textContent = message;

        // DOMに追加
        document.body.appendChild(notification);

        // 3秒後に削除
        setTimeout(() => {
            notification.style.opacity = '0';
            notification.style.transition = 'opacity 0.3s';
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 300);
        }, 3000);
    }
}

/**
 * DOMContentLoadedイベントでアプリケーションを初期化
 */
document.addEventListener('DOMContentLoaded', () => {
    const app = new FinancialModelingApp();
    app.init();

    // グローバルスコープに追加（デバッグ用）
    window.financialApp = app;
});
