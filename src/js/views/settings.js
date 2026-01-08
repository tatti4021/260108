/**
 * 設定画面ビューの実装
 * @module views/settings
 */

import { getState, updateCompany, resetState, initialize, saveState } from '../utils/state.js';
import { save, load } from '../utils/storage.js';

/**
 * 設定画面ビュークラス
 */
export class SettingsView {
  /**
   * コンストラクタ
   * @param {HTMLElement} container - コンテナ要素
   */
  constructor(container) {
    this.container = container;
  }

  /**
   * ビューをレンダリング
   */
  render() {
    const state = getState();
    const company = state.company || { name: '', fiscalYearStart: '04', currency: 'JPY' };

    this.container.innerHTML = `
      <div class="page-content">
        <h2 class="page-title">設定</h2>

        <!-- 会社情報設定 -->
        ${this.renderCompanySettings(company, state)}

        <!-- 表示設定 -->
        ${this.renderDisplaySettings(company)}

        <!-- データ管理 -->
        ${this.renderDataManagement(state)}
      </div>
    `;

    // イベントリスナーを設定
    this.attachEventListeners();
  }

  /**
   * 会社情報設定セクションをレンダリング
   * @param {Object} company - 会社情報
   * @param {Object} state - アプリケーション状態
   * @returns {string} HTML文字列
   */
  renderCompanySettings(company, state) {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let i = currentYear - 5; i <= currentYear + 5; i++) {
      years.push(i);
    }

    const months = [
      { value: '01', label: '1月' },
      { value: '02', label: '2月' },
      { value: '03', label: '3月' },
      { value: '04', label: '4月' },
      { value: '05', label: '5月' },
      { value: '06', label: '6月' },
      { value: '07', label: '7月' },
      { value: '08', label: '8月' },
      { value: '09', label: '9月' },
      { value: '10', label: '10月' },
      { value: '11', label: '11月' },
      { value: '12', label: '12月' }
    ];

    return `
      <div class="card mb-4">
        <div class="card-header">
          <h3 class="card-title">会社情報</h3>
        </div>
        <div class="card-body">
          <form id="companySettingsForm">
            <div class="form-group">
              <label class="form-label">会社名</label>
              <input
                type="text"
                class="form-control"
                id="companyName"
                name="companyName"
                value="${company.name || ''}"
                placeholder="例: 株式会社サンプル"
              >
              <small class="form-text">財務諸表のヘッダーに表示されます</small>
            </div>

            <div class="form-group">
              <label class="form-label">会計年度開始月</label>
              <select class="form-select" id="fiscalYearStart" name="fiscalYearStart">
                ${months.map(month => `
                  <option value="${month.value}" ${company.fiscalYearStart === month.value ? 'selected' : ''}>
                    ${month.label}
                  </option>
                `).join('')}
              </select>
              <small class="form-text">会計年度の開始月を選択してください</small>
            </div>

            <button type="submit" class="btn btn-primary">会社情報を保存</button>
          </form>
        </div>
      </div>
    `;
  }

  /**
   * 表示設定セクションをレンダリング
   * @param {Object} company - 会社情報
   * @returns {string} HTML文字列
   */
  renderDisplaySettings(company) {
    const currencies = [
      { code: 'JPY', name: '日本円', symbol: '¥' },
      { code: 'USD', name: '米ドル', symbol: '$' },
      { code: 'EUR', name: 'ユーロ', symbol: '€' }
    ];

    return `
      <div class="card mb-4">
        <div class="card-header">
          <h3 class="card-title">表示設定</h3>
        </div>
        <div class="card-body">
          <form id="displaySettingsForm">
            <div class="form-group">
              <label class="form-label">通貨単位</label>
              <select class="form-select" id="currency" name="currency">
                ${currencies.map(curr => `
                  <option value="${curr.code}" ${company.currency === curr.code ? 'selected' : ''}>
                    ${curr.name} (${curr.symbol})
                  </option>
                `).join('')}
              </select>
              <small class="form-text">金額の表示に使用する通貨を選択してください</small>
            </div>

            <button type="submit" class="btn btn-primary">表示設定を保存</button>
          </form>
        </div>
      </div>
    `;
  }

  /**
   * データ管理セクションをレンダリング
   * @param {Object} state - アプリケーション状態
   * @returns {string} HTML文字列
   */
  renderDataManagement(state) {
    const hasData = state.initialized && state.periods && state.periods.length > 0;

    return `
      <div class="card mb-4">
        <div class="card-header">
          <h3 class="card-title">データ管理</h3>
        </div>
        <div class="card-body">
          <div style="margin-bottom: 1.5rem;">
            <h4 style="font-size: 1rem; font-weight: 600; margin-bottom: 0.5rem;">
              データの初期化
            </h4>
            <p class="text-muted" style="font-size: 0.875rem; margin-bottom: 1rem;">
              ${hasData ? '既にデータが初期化されています。' : 'データを初期化して財務モデリングを開始します。'}
            </p>

            <form id="initializeForm" style="margin-bottom: 1rem;">
              <div class="form-group">
                <label class="form-label">開始年</label>
                <input
                  type="number"
                  class="form-control"
                  id="startYear"
                  name="startYear"
                  value="${new Date().getFullYear()}"
                  min="2000"
                  max="2100"
                  style="max-width: 150px;"
                >
              </div>

              <div class="form-group">
                <label class="form-label">開始月</label>
                <select class="form-select" id="startMonth" name="startMonth" style="max-width: 150px;">
                  ${Array.from({ length: 12 }, (_, i) => i + 1).map(m => `
                    <option value="${m}" ${m === 1 ? 'selected' : ''}>${m}月</option>
                  `).join('')}
                </select>
              </div>

              <div class="form-group">
                <label class="form-label">期間数（月）</label>
                <input
                  type="number"
                  class="form-control"
                  id="numPeriods"
                  name="numPeriods"
                  value="12"
                  min="1"
                  max="120"
                  style="max-width: 150px;"
                >
              </div>

              <button type="submit" class="btn ${hasData ? 'btn-warning' : 'btn-primary'}">
                ${hasData ? 'データを再初期化' : 'データを初期化'}
              </button>
            </form>
          </div>

          <div style="border-top: 1px solid var(--color-border); padding-top: 1.5rem; margin-bottom: 1.5rem;">
            <h4 style="font-size: 1rem; font-weight: 600; margin-bottom: 0.5rem;">
              データのバックアップ
            </h4>
            <p class="text-muted" style="font-size: 0.875rem; margin-bottom: 1rem;">
              現在のデータをJSONファイルとしてエクスポート・インポートできます。
            </p>

            <div style="display: flex; gap: 0.5rem;">
              <button id="exportBtn" class="btn btn-secondary" ${!hasData ? 'disabled' : ''}>
                📥 データをエクスポート
              </button>
              <button id="importBtn" class="btn btn-secondary">
                📤 データをインポート
              </button>
            </div>
            <input type="file" id="importFile" accept=".json" style="display: none;">
          </div>

          <div style="border-top: 1px solid var(--color-border); padding-top: 1.5rem;">
            <h4 style="font-size: 1rem; font-weight: 600; margin-bottom: 0.5rem;">
              データのリセット
            </h4>
            <p class="text-muted" style="font-size: 0.875rem; margin-bottom: 1rem;">
              すべてのデータを削除します。この操作は元に戻せません。
            </p>

            <button id="resetBtn" class="btn btn-danger" ${!hasData ? 'disabled' : ''}>
              🗑️ すべてのデータを削除
            </button>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * イベントリスナーを設定
   */
  attachEventListeners() {
    // 会社情報フォーム
    const companyForm = document.getElementById('companySettingsForm');
    if (companyForm) {
      companyForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.handleSaveCompanySettings();
      });
    }

    // 表示設定フォーム
    const displayForm = document.getElementById('displaySettingsForm');
    if (displayForm) {
      displayForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.handleSaveDisplaySettings();
      });
    }

    // 初期化フォーム
    const initForm = document.getElementById('initializeForm');
    if (initForm) {
      initForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.handleInitialize();
      });
    }

    // エクスポートボタン
    const exportBtn = document.getElementById('exportBtn');
    if (exportBtn) {
      exportBtn.addEventListener('click', () => this.handleExport());
    }

    // インポートボタン
    const importBtn = document.getElementById('importBtn');
    const importFile = document.getElementById('importFile');
    if (importBtn && importFile) {
      importBtn.addEventListener('click', () => importFile.click());
      importFile.addEventListener('change', (e) => this.handleImport(e));
    }

    // リセットボタン
    const resetBtn = document.getElementById('resetBtn');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => this.handleReset());
    }
  }

  /**
   * 会社情報を保存
   */
  handleSaveCompanySettings() {
    const name = document.getElementById('companyName').value;
    const fiscalYearStart = document.getElementById('fiscalYearStart').value;

    const state = getState();
    const updatedCompany = {
      ...state.company,
      name,
      fiscalYearStart
    };

    updateCompany(updatedCompany);
    this.showSuccessMessage('会社情報を保存しました');
  }

  /**
   * 表示設定を保存
   */
  handleSaveDisplaySettings() {
    const currency = document.getElementById('currency').value;

    const state = getState();
    const updatedCompany = {
      ...state.company,
      currency
    };

    updateCompany(updatedCompany);
    this.showSuccessMessage('表示設定を保存しました');
  }

  /**
   * データを初期化
   */
  handleInitialize() {
    const startYear = parseInt(document.getElementById('startYear').value);
    const startMonth = parseInt(document.getElementById('startMonth').value);
    const numPeriods = parseInt(document.getElementById('numPeriods').value);

    const state = getState();
    const hasData = state.initialized && state.periods && state.periods.length > 0;

    if (hasData) {
      const confirmed = confirm(
        '既存のデータがあります。再初期化すると現在のデータは失われます。\n' +
        '続行しますか？'
      );

      if (!confirmed) {
        return;
      }
    }

    try {
      initialize({
        startYear,
        startMonth,
        numPeriods,
        forceNew: true
      });

      this.showSuccessMessage('データを初期化しました');
      this.render(); // 再レンダリング
    } catch (error) {
      this.showErrorMessage('初期化に失敗しました: ' + error.message);
    }
  }

  /**
   * データをエクスポート
   */
  handleExport() {
    const state = getState();

    // JSONとしてダウンロード
    const dataStr = JSON.stringify(state, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `financial-model-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    this.showSuccessMessage('データをエクスポートしました');
  }

  /**
   * データをインポート
   * @param {Event} event - ファイル選択イベント
   */
  handleImport(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const importedData = JSON.parse(e.target.result);

        // バリデーション
        if (!importedData.company || !importedData.periods) {
          throw new Error('無効なデータフォーマットです');
        }

        const confirmed = confirm(
          '現在のデータは上書きされます。\n' +
          'よろしいですか？'
        );

        if (!confirmed) {
          return;
        }

        // データを保存
        save('app_state', importedData);

        // ページをリロード
        this.showSuccessMessage('データをインポートしました。ページを再読み込みします...');

        setTimeout(() => {
          window.location.reload();
        }, 1500);

      } catch (error) {
        this.showErrorMessage('インポートに失敗しました: ' + error.message);
      }
    };

    reader.readAsText(file);

    // ファイル入力をリセット
    event.target.value = '';
  }

  /**
   * すべてのデータをリセット
   */
  handleReset() {
    const confirmed = confirm(
      'すべてのデータが削除されます。\n' +
      'この操作は元に戻せません。\n' +
      '本当に削除しますか？'
    );

    if (!confirmed) {
      return;
    }

    // 二重確認
    const doubleConfirmed = confirm(
      '最終確認: 本当にすべてのデータを削除しますか？'
    );

    if (!doubleConfirmed) {
      return;
    }

    try {
      resetState();
      this.showSuccessMessage('すべてのデータを削除しました');
      this.render(); // 再レンダリング
    } catch (error) {
      this.showErrorMessage('削除に失敗しました: ' + error.message);
    }
  }

  /**
   * 成功メッセージを表示
   * @param {string} message - メッセージ
   */
  showSuccessMessage(message) {
    this.showMessage(message, 'success');
  }

  /**
   * エラーメッセージを表示
   * @param {string} message - メッセージ
   */
  showErrorMessage(message) {
    this.showMessage(message, 'danger');
  }

  /**
   * メッセージを表示
   * @param {string} message - メッセージ
   * @param {string} type - メッセージタイプ ('success' or 'danger')
   */
  showMessage(message, type = 'success') {
    // 既存のメッセージがあれば削除
    const existingMessage = document.querySelector('.settings-message');
    if (existingMessage) {
      existingMessage.remove();
    }

    // メッセージを作成
    const messageEl = document.createElement('div');
    messageEl.className = `alert alert-${type} settings-message`;
    messageEl.style.position = 'fixed';
    messageEl.style.top = '20px';
    messageEl.style.right = '20px';
    messageEl.style.zIndex = '9999';
    messageEl.style.minWidth = '300px';
    messageEl.textContent = message;

    document.body.appendChild(messageEl);

    // 3秒後に自動削除
    setTimeout(() => {
      messageEl.remove();
    }, 3000);
  }
}
