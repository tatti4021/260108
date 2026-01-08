# 財務モデリングシステム 開発者ガイド

Version 1.0.0

---

## 目次

1. [システムアーキテクチャ](#システムアーキテクチャ)
2. [ディレクトリ構造](#ディレクトリ構造)
3. [主要モジュールの説明](#主要モジュールの説明)
4. [データフロー](#データフロー)
5. [開発環境のセットアップ](#開発環境のセットアップ)
6. [テスト](#テスト)
7. [拡張ガイド](#拡張ガイド)
8. [コーディング規約](#コーディング規約)
9. [トラブルシューティング](#トラブルシューティング)

---

## システムアーキテクチャ

### 概要

本システムは、以下の技術スタックで構築されたクライアントサイドWebアプリケーションです：

- **フロントエンド**: Vanilla JavaScript (ES6 Modules)
- **UI**: HTML5 + CSS3
- **グラフ描画**: Chart.js 4.4.1
- **データ永続化**: Browser LocalStorage
- **アーキテクチャパターン**: MVC的な分離（Model-View-Utils）

### 設計原則

1. **モジュール性**: 機能ごとにモジュール化し、再利用性を高める
2. **単一責任の原則**: 各モジュールは1つの責任のみを持つ
3. **疎結合**: モジュール間の依存を最小限に抑える
4. **状態管理の集中化**: アプリケーション状態は`state.js`で一元管理
5. **自動連携**: P/L → B/S → C/Fの自動連携により整合性を保つ

### システム構成図

```
┌─────────────────────────────────────────────────┐
│                   index.html                     │
│              (Entry Point & Layout)              │
└────────────┬────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────┐
│                    app.js                        │
│            (Application Bootstrap)               │
└────────────┬────────────────────────────────────┘
             │
    ┌────────┼────────┐
    ▼        ▼        ▼
┌────────┐┌────────┐┌────────────┐
│Router  ││State   ││Integration │
│        ││Manager ││Manager     │
└────────┘└────────┘└────────────┘
    │        │        │
    ▼        ▼        ▼
┌──────────────────────────────┐
│         Views Layer          │
│  (dashboard, pl, bs, cf,     │
│   analysis, forecast,        │
│   settings, charts)          │
└────────────┬─────────────────┘
             │
    ┌────────┼────────┐
    ▼        ▼        ▼
┌────────┐┌────────┐┌────────┐
│Models  ││Utils   ││Calc    │
│        ││        ││Logic   │
└────────┘└────────┘└────────┘
```

---

## ディレクトリ構造

```
/home/user/260108/
├── index.html              # エントリーポイント
├── README.md               # プロジェクト概要
│
├── assets/                 # 静的リソース
│   └── images/             # 画像ファイル
│
├── src/                    # ソースコード
│   ├── css/                # スタイルシート
│   │   ├── variables.css   # CSS変数定義
│   │   ├── styles.css      # 基本スタイル
│   │   └── components.css  # コンポーネントスタイル
│   │
│   └── js/                 # JavaScriptコード
│       ├── app.js          # アプリケーションエントリー
│       ├── router.js       # ルーティング管理
│       │
│       ├── models/         # データモデル
│       │   ├── company.js      # 会社情報モデル
│       │   ├── period.js       # 期間データモデル
│       │   └── forecast.js     # 予測設定モデル
│       │
│       ├── views/          # ビューコンポーネント
│       │   ├── dashboard.js    # ダッシュボード画面
│       │   ├── pl.js           # P/L画面
│       │   ├── bs.js           # B/S画面
│       │   ├── cf.js           # C/F画面
│       │   ├── analysis.js     # 財務分析画面
│       │   ├── forecast.js     # 予測・シミュレーション画面
│       │   ├── settings.js     # 設定画面
│       │   └── charts.js       # グラフ描画ユーティリティ
│       │
│       └── utils/          # ユーティリティ
│           ├── state.js        # 状態管理
│           ├── storage.js      # LocalStorage操作
│           ├── pl-calc.js      # P/L計算ロジック
│           ├── bs-calc.js      # B/S計算ロジック
│           ├── cf-calc.js      # C/F計算ロジック
│           ├── ratios.js       # 財務比率計算
│           ├── integration.js  # 財務三表連携
│           ├── forecast-calc.js # 予測計算
│           ├── chart-config.js # Chart.js設定
│           ├── csv.js          # CSVエクスポート
│           ├── json-io.js      # JSON I/O
│           └── input-helpers.js # 入力補助
│
├── tests/                  # テストコード
│   ├── test-runner.html    # テストランナー（ブラウザ実行）
│   ├── unit/               # ユニットテスト
│   │   ├── pl-calc.test.js     # P/L計算テスト
│   │   ├── bs-calc.test.js     # B/S計算テスト
│   │   └── ratios.test.js      # 財務比率テスト
│   │
│   └── integration/        # 統合テスト
│       ├── state.test.js       # 状態管理テスト
│       └── integration.test.js # 財務三表連携テスト
│
└── docs/                   # ドキュメント
    ├── USER_MANUAL.md      # ユーザーマニュアル
    └── DEVELOPER_GUIDE.md  # 開発者ガイド（本ドキュメント）
```

---

## 主要モジュールの説明

### 1. app.js

**役割**: アプリケーションのエントリーポイント

**主な機能**:
- システムの初期化
- ルーターの初期化
- イベントリスナーの設定
- 財務三表連携の初期化

**主要な関数**:
```javascript
async function initApp() {
  // アプリケーション初期化
}
```

---

### 2. router.js

**役割**: ページ遷移とルーティングの管理

**主な機能**:
- ハッシュベースのルーティング
- ビューの動的読み込み
- ナビゲーションのアクティブ状態管理

**主要な関数**:
```javascript
export function initRouter() {
  // ルーター初期化
}

export function navigateTo(page) {
  // ページ遷移
}
```

**ルーティングテーブル**:
```javascript
const routes = {
  'dashboard': () => import('./views/dashboard.js'),
  'pl': () => import('./views/pl.js'),
  'bs': () => import('./views/bs.js'),
  'cf': () => import('./views/cf.js'),
  'analysis': () => import('./views/analysis.js'),
  'forecast': () => import('./views/forecast.js'),
  'settings': () => import('./views/settings.js')
};
```

---

### 3. state.js

**役割**: アプリケーション全体の状態管理

**データ構造**:
```javascript
{
  company: {
    name: string,
    industry: string,
    fiscalYearEnd: string
  },
  periods: [
    {
      year: number,
      month: number,
      pl: { /* P/Lデータ */ },
      bs: { /* B/Sデータ */ },
      cf: { /* C/Fデータ */ }
    },
    // ... 複数期間
  ],
  forecast: {
    revenueGrowthRate: number,
    cogsRate: number,
    sgaGrowthRate: number
  },
  currentPeriodIndex: number,
  initialized: boolean
}
```

**主要な関数**:
```javascript
// 状態の取得
export const getState = () => { ... }

// 状態の更新
export const setState = (newState, autoSave = true) => { ... }

// 状態変更の購読
export const subscribe = (callback) => { ... }

// 初期化
export const initialize = (options = {}) => { ... }

// 期間操作
export const updatePeriod = (index, periodData) => { ... }
export const getCurrentPeriod = () => { ... }
```

**設計パターン**: Observer Pattern（購読/通知）

---

### 4. storage.js

**役割**: LocalStorageへのデータ永続化

**主要な関数**:
```javascript
// データ保存
export function save(key, data) { ... }

// データ読み込み
export function load(key) { ... }

// データ削除
export function remove(key) { ... }

// ストレージクリア
export function clear() { ... }
```

**注意点**:
- データはJSON形式でシリアライズ
- LocalStorageの容量制限に注意（通常5-10MB）
- エラーハンドリングを実装済み

---

### 5. pl-calc.js, bs-calc.js, cf-calc.js

**役割**: 各財務諸表の計算ロジック

**pl-calc.js の主要関数**:
```javascript
// 売上総利益 = 売上高 - 売上原価
export function calculateGrossProfit(revenue, cogs) { ... }

// 営業利益 = 売上総利益 - 販管費
export function calculateOperatingProfit(revenue, cogs, sgaExpenses) { ... }

// 当期純利益 = 経常利益 - 税金
export function calculateNetProfit(ordinaryProfit, tax) { ... }

// 利益率計算
export function calculateProfitMargins(pl) { ... }
```

**bs-calc.js の主要関数**:
```javascript
// 資産合計
export function calculateTotalAssets(assets) { ... }

// 負債合計
export function calculateTotalLiabilities(liabilities) { ... }

// バランスチェック
export function checkBalance(assets, liabilities, equity) { ... }
```

**cf-calc.js の主要関数**:
```javascript
// 営業CF計算
export function calculateOperatingCF(cf) { ... }

// 投資CF計算
export function calculateInvestingCF(cf) { ... }

// 財務CF計算
export function calculateFinancingCF(cf) { ... }

// 期末現金残高計算
export function calculateCFResults(cf) { ... }
```

---

### 6. ratios.js

**役割**: 財務比率の計算と評価

**主要な関数**:
```javascript
// 収益性指標
export function calculateROE(netProfit, equity) { ... }
export function calculateROA(netProfit, totalAssets) { ... }

// 安全性指標
export function calculateCurrentRatio(currentAssets, currentLiabilities) { ... }
export function calculateEquityRatio(equity, totalAssets) { ... }

// 評価レベルの判定
export function getRatingLevel(ratioType, value) { ... }

// 総合評価の生成
export function generateOverallAssessment(ratios) { ... }
```

**評価基準**:
各指標に対して、'good', 'warning', 'danger', 'unknown' の4段階評価を提供

---

### 7. integration.js

**役割**: 財務三表の自動連携

**主要な関数**:
```javascript
// P/L → B/S連携（当期純利益 → 利益剰余金）
export function syncPLtoBS(periodIndex) { ... }

// B/S → C/F連携（現金残高、科目増減）
export function syncBStoCF(periodIndex) { ... }

// 全期間の連携
export function syncAllPeriods() { ... }

// 連携機能の初期化
export function initializeIntegration() { ... }
```

**連携フロー**:
```
P/L入力 → 当期純利益計算
    ↓
B/S利益剰余金更新
    ↓
B/S科目増減計算
    ↓
C/F自動更新
    ↓
B/S現金残高同期
```

---

### 8. Views (dashboard.js, pl.js, bs.js, cf.js, etc.)

**役割**: 各画面のビューロジック

**共通構造**:
```javascript
export function render(container) {
  // HTMLテンプレートの生成
  container.innerHTML = `...`;

  // イベントリスナーの設定
  setupEventListeners();

  // 初期データの読み込み
  loadData();
}

function setupEventListeners() {
  // ボタンクリック、入力変更などのイベント処理
}

function loadData() {
  // 状態からデータを取得して表示
}
```

**ビューの責任**:
- HTMLの生成と描画
- ユーザー入力の受付
- 状態の更新（state.jsを通じて）
- 計算結果の表示

---

## データフロー

### 1. データ入力フロー

```
ユーザー入力
    ↓
View: イベントハンドラー
    ↓
Utils: データ検証・フォーマット
    ↓
State: setState()でデータ更新
    ↓
Storage: LocalStorageに自動保存
    ↓
Integration: 自動連携処理
    ↓
State: 連携後のデータ更新
    ↓
Subscribers: 購読者に通知
    ↓
View: UIの再描画
```

### 2. データ読み込みフロー

```
アプリ起動
    ↓
State: initialize()
    ↓
Storage: load()でデータ取得
    ↓
State: データ復元 or 新規作成
    ↓
Router: 初期ページへナビゲート
    ↓
View: render()で画面描画
    ↓
View: getState()でデータ取得
    ↓
View: データを画面に表示
```

### 3. 財務三表連携フロー

```
P/L画面でデータ入力
    ↓
setState() → 状態更新
    ↓
Subscriber通知
    ↓
Integration: syncPLtoBS()
    ↓
P/L計算: calculateNetProfit()
    ↓
B/S更新: 利益剰余金 = 前期 + 当期純利益
    ↓
updatePeriod() → B/S状態更新
    ↓
Integration: syncBStoCF()
    ↓
B/S科目増減計算
    ↓
C/F更新: 営業CF項目の自動設定
    ↓
C/F計算: calculateCFResults()
    ↓
B/S現金残高更新: cash = 期末現金
    ↓
updatePeriod() → 最終状態更新
```

---

## 開発環境のセットアップ

### 必要なツール

- **Webブラウザ**: Chrome, Edge, Firefoxの最新版
- **テキストエディタ**: VS Code, Sublime Text, Atomなど
- **ローカルサーバー**: Live Server（VS Code拡張）または `python -m http.server`

### セットアップ手順

1. **リポジトリのクローン**
```bash
git clone <repository-url>
cd 260108
```

2. **ローカルサーバーの起動**

VS Codeの場合:
```
右クリック → "Open with Live Server"
```

Pythonの場合:
```bash
python -m http.server 8000
# ブラウザで http://localhost:8000 を開く
```

3. **開発用ブラウザの設定**
- デベロッパーツールを開く（F12キー）
- コンソールでエラーを確認
- ネットワークタブでリソース読み込みを確認

### 推奨VS Code拡張機能

- **Live Server**: ローカル開発サーバー
- **ESLint**: JavaScriptのリント
- **Prettier**: コードフォーマッター
- **Path Intellisense**: パス補完
- **Auto Rename Tag**: HTMLタグの自動リネーム

---

## テスト

### テストの実行

#### ブラウザでの実行
1. `tests/test-runner.html` をブラウザで開く
2. 「すべてのテストを実行」ボタンをクリック
3. テスト結果を確認

#### ユニットテストのみ
「ユニットテストのみ」ボタンをクリック

#### 統合テストのみ
「統合テストのみ」ボタンをクリック

### テストの構成

#### ユニットテスト
- **pl-calc.test.js**: P/L計算ロジックのテスト
- **bs-calc.test.js**: B/S計算ロジックのテスト
- **ratios.test.js**: 財務比率計算のテスト（0除算を含む）

#### 統合テスト
- **state.test.js**: 状態管理とデータ保存・読込のテスト
- **integration.test.js**: 財務三表連携のテスト

### テストの書き方

新しいテストを追加する場合:

```javascript
import * as module from '../../src/js/utils/module.js';

function test(name, fn) {
  tests.push({ name, fn });
}

function assertEquals(actual, expected, message = '') {
  if (actual !== expected) {
    throw new Error(`${message}: Expected ${expected}, got ${actual}`);
  }
}

test('テスト名', () => {
  const result = module.someFunction(input);
  assertEquals(result, expected);
});

export function runTests() {
  // テスト実行ロジック
}
```

---

## 拡張ガイド

### 新しい財務諸表を追加する

#### 1. モデルの作成

`src/js/models/new-statement.js`:
```javascript
export function createNewStatement() {
  return {
    item1: 0,
    item2: 0,
    // ...
  };
}
```

#### 2. 計算ロジックの実装

`src/js/utils/new-calc.js`:
```javascript
export function calculateTotal(data) {
  return data.item1 + data.item2;
}
```

#### 3. ビューの作成

`src/js/views/new-statement.js`:
```javascript
export function render(container) {
  container.innerHTML = `
    <h2>新しい財務諸表</h2>
    <!-- UI要素 -->
  `;

  setupEventListeners();
  loadData();
}

function setupEventListeners() {
  // イベント処理
}

function loadData() {
  const state = getState();
  // データ表示
}
```

#### 4. ルーターへの登録

`src/js/router.js`:
```javascript
const routes = {
  // ...
  'new-statement': () => import('./views/new-statement.js')
};
```

#### 5. ナビゲーションへの追加

`index.html`:
```html
<a href="#new-statement" class="nav-item" data-page="new-statement">
  <span class="nav-icon">📄</span>
  <span class="nav-text">新しい財務諸表</span>
</a>
```

#### 6. 期間モデルへの追加

`src/js/models/period.js`:
```javascript
export function createPeriod(year, month) {
  return {
    // ...
    newStatement: createNewStatement()
  };
}
```

---

### 新しい財務指標を追加する

#### 1. 計算関数の実装

`src/js/utils/ratios.js`:
```javascript
/**
 * 新しい指標を計算
 * @param {number} value1 - 値1
 * @param {number} value2 - 値2
 * @returns {number|null} 指標値、計算不可の場合はnull
 */
export function calculateNewRatio(value1, value2) {
  if (!value2 || value2 === 0) return null;
  return (value1 / value2) * 100;
}
```

#### 2. 評価基準の追加

`src/js/utils/ratios.js` の `getRatingLevel()`:
```javascript
const thresholds = {
  // ...
  newRatio: { good: 50, warning: 30 }
};
```

#### 3. ビューへの追加

`src/js/views/analysis.js`:
```javascript
const newRatio = calculateNewRatio(value1, value2);
html += `
  <div class="ratio-item">
    <span class="ratio-label">新しい指標</span>
    <span class="ratio-value ${getRatingLevel('newRatio', newRatio)}">
      ${formatRatioPercent(newRatio)}
    </span>
  </div>
`;
```

#### 4. テストの追加

`tests/unit/ratios.test.js`:
```javascript
test('calculateNewRatio - 正常計算', () => {
  assertApproxEquals(ratios.calculateNewRatio(100, 200), 50);
});

test('calculateNewRatio - 0除算', () => {
  assertNull(ratios.calculateNewRatio(100, 0));
});
```

---

### グラフの追加

#### 1. チャート設定の作成

`src/js/utils/chart-config.js`:
```javascript
export function createNewChartConfig(data) {
  return {
    type: 'line',
    data: {
      labels: data.labels,
      datasets: [{
        label: '新しいグラフ',
        data: data.values,
        borderColor: 'rgb(75, 192, 192)',
        tension: 0.1
      }]
    },
    options: {
      responsive: true,
      // ...
    }
  };
}
```

#### 2. ビューでの描画

```javascript
import { createNewChartConfig } from '../utils/chart-config.js';

const canvas = document.getElementById('newChart');
const ctx = canvas.getContext('2d');
const config = createNewChartConfig(chartData);
new Chart(ctx, config);
```

---

### エクスポート形式の追加

#### 1. エクスポート関数の実装

`src/js/utils/export.js`:
```javascript
export function exportToNewFormat(data) {
  // フォーマット変換ロジック
  const formatted = convertData(data);

  // ダウンロード処理
  const blob = new Blob([formatted], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'export.txt';
  a.click();
}
```

#### 2. UIへの追加

```javascript
document.getElementById('exportNewBtn').addEventListener('click', () => {
  const state = getState();
  exportToNewFormat(state);
});
```

---

## コーディング規約

### JavaScriptスタイルガイド

#### 命名規則
- **変数・関数**: camelCase
  ```javascript
  const userName = 'John';
  function calculateTotal() { ... }
  ```

- **定数**: UPPER_SNAKE_CASE
  ```javascript
  const MAX_VALUE = 100;
  const API_ENDPOINT = 'https://api.example.com';
  ```

- **クラス**: PascalCase
  ```javascript
  class UserProfile { ... }
  ```

#### コメント
- **JSDoc形式**を使用
  ```javascript
  /**
   * 関数の説明
   * @param {number} value - パラメータの説明
   * @returns {number} 戻り値の説明
   */
  function example(value) { ... }
  ```

#### モジュール
- **ES6 Modules**を使用
  ```javascript
  // エクスポート
  export function myFunction() { ... }
  export const myVariable = 10;

  // インポート
  import { myFunction, myVariable } from './module.js';
  ```

#### エラーハンドリング
- **try-catch**を適切に使用
  ```javascript
  try {
    const data = JSON.parse(jsonString);
  } catch (error) {
    console.error('Failed to parse JSON:', error);
    return null;
  }
  ```

#### 非同期処理
- **async/await**を優先
  ```javascript
  async function loadData() {
    try {
      const response = await fetch(url);
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Failed to load data:', error);
    }
  }
  ```

### CSSスタイルガイド

#### BEM命名規則
```css
/* Block */
.card { ... }

/* Element */
.card__title { ... }
.card__content { ... }

/* Modifier */
.card--highlighted { ... }
```

#### CSS変数の使用
```css
:root {
  --primary-color: #667eea;
  --secondary-color: #764ba2;
  --text-color: #333;
}

.button {
  background-color: var(--primary-color);
  color: white;
}
```

---

## トラブルシューティング

### モジュールが見つからないエラー

**エラー**:
```
Failed to load module script: The server responded with a non-JavaScript MIME type
```

**原因**:
- ローカルファイルとして開いている（`file://`プロトコル）
- サーバーがJavaScriptファイルを正しいMIMEタイプで提供していない

**解決策**:
- ローカルサーバーを使用する（Live Server、python http.server など）
- `.js`ファイルが正しく配信されているか確認

---

### LocalStorageが動作しない

**原因**:
- プライベートブラウジングモード
- LocalStorageが無効化されている
- ストレージ容量の超過

**解決策**:
```javascript
// LocalStorageの可用性チェック
function isLocalStorageAvailable() {
  try {
    const test = '__test__';
    localStorage.setItem(test, test);
    localStorage.removeItem(test);
    return true;
  } catch (e) {
    return false;
  }
}
```

---

### 状態更新が反映されない

**原因**:
- 購読が正しく設定されていない
- 状態更新時に`autoSave`がfalseになっている

**解決策**:
```javascript
// 購読の設定を確認
const unsubscribe = subscribe((newState) => {
  console.log('State updated:', newState);
  updateUI(newState);
});

// 状態更新時にautoSaveを有効化
setState({ key: value }, true);
```

---

### 財務三表の連携が動作しない

**原因**:
- `initializeIntegration()`が呼ばれていない
- 無限ループを防ぐための`autoSave: false`設定

**解決策**:
```javascript
// app.jsで初期化を確認
import { initializeIntegration } from './utils/integration.js';
initializeIntegration();

// integration.jsの購読処理を確認
// setState時にautoSaveをfalseにして無限ループを防ぐ
```

---

## ベストプラクティス

### 1. パフォーマンス最適化

- **不要な再描画を避ける**
  ```javascript
  // NG: 毎回全体を再描画
  function updateUI() {
    container.innerHTML = generateHTML();
  }

  // OK: 変更部分のみ更新
  function updateUI(changedData) {
    const element = document.getElementById('specific-element');
    element.textContent = changedData.value;
  }
  ```

- **デバウンス/スロットルの使用**
  ```javascript
  let timeout;
  input.addEventListener('input', (e) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => {
      handleInput(e.target.value);
    }, 300);
  });
  ```

### 2. セキュリティ

- **XSS対策**
  ```javascript
  // NG: innerHTML で直接ユーザー入力を使用
  div.innerHTML = userInput;

  // OK: textContent を使用
  div.textContent = userInput;
  ```

- **データ検証**
  ```javascript
  function validateInput(value) {
    if (typeof value !== 'number' || isNaN(value)) {
      throw new Error('Invalid input');
    }
    if (value < 0 || value > MAX_VALUE) {
      throw new Error('Out of range');
    }
    return value;
  }
  ```

### 3. 保守性

- **マジックナンバーを避ける**
  ```javascript
  // NG
  if (ratio > 0.01) { ... }

  // OK
  const BALANCE_TOLERANCE = 0.01;
  if (ratio > BALANCE_TOLERANCE) { ... }
  ```

- **関数は小さく保つ**
  - 1つの関数は1つの責任のみ
  - 目安: 50行以内

- **早期リターン**
  ```javascript
  function calculate(value) {
    if (!value) return null;
    if (value < 0) return null;

    // メイン処理
    return result;
  }
  ```

---

## リリースプロセス

### 1. バージョン管理

`index.html`と`docs/USER_MANUAL.md`のバージョン番号を更新:
```html
<span class="version">Version 1.1.0</span>
```

### 2. テストの実行

```bash
# ブラウザでtest-runner.htmlを開いてテスト実行
# すべてのテストが成功することを確認
```

### 3. ドキュメントの更新

- USER_MANUAL.mdの更新履歴を追加
- DEVELOPER_GUIDE.mdに変更点を記載

### 4. ビルド（該当する場合）

現在はビルドプロセスはありませんが、将来的にバンドラー（Webpack、Rollupなど）を導入する場合:
```bash
npm run build
```

---

## 貢献ガイドライン

### Issue報告

- バグの場合: 再現手順、期待される動作、実際の動作を記載
- 機能要望の場合: ユースケース、期待される機能を明確に記載

### Pull Request

1. フォークして作業ブランチを作成
2. コードを実装
3. テストを追加・更新
4. ドキュメントを更新
5. Pull Requestを作成

---

## サポートとコミュニティ

- **GitHub Issues**: バグ報告・機能要望
- **Discussions**: 質問・アイデアの共有

---

**財務モデリングシステム 開発者ガイド 終わり**
