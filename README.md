# VR Multiplayer Experience

マルチプレイヤー対応のVR体験を提供するWebアプリケーションです。複数のユーザーが同じ仮想空間で交流し、インタラクティブな3Dオブジェクトと対話することができます。

![VR Multiplayer Demo](./static/demo.gif)

## 🌟 主な機能

- **マルチプレイヤーVR体験**: 複数のユーザーが同じ仮想空間で交流
- **リアルタイム同期**: WebSocketを使用したプレイヤーの位置・回転の同期
- **インタラクティブな3Dオブジェクト**: VRコントローラーを使用した操作
- **空間音響**: 3D空間内での立体的な音響体験
- **クロスプラットフォーム**: 様々なVRデバイスに対応

## 🔧 技術スタック

- **フレームワーク**:
  - [Deno](https://deno.land/) - セキュアなJavaScriptランタイム
  - [Fresh](https://fresh.deno.dev/) v1.7.3 - DenoのWebフレームワーク
  - [Preact](https://preactjs.com/) v10.22.0 - 軽量なReactライクなUIライブラリ

- **3D/VR技術**:
  - [Three.js](https://threejs.org/) v0.161.0 - 3Dグラフィックスライブラリ
  - [React Three Fiber](https://docs.pmnd.rs/react-three-fiber/) v8.15.12 - Three.jsのReactレンダラー
  - [React Three Drei](https://github.com/pmndrs/drei) v9.92.7 - Three.js/Fiberのヘルパー
  - WebXR API - VRデバイスとの連携

- **スタイリング**:
  - [TailwindCSS](https://tailwindcss.com/) v3.4.1 - ユーティリティファーストCSSフレームワーク

## 🚀 インストールと実行

### 前提条件

- [Deno](https://deno.land/#installation) がインストールされていること
- VR体験には[WebXR対応デバイス](https://developer.mozilla.org/en-US/docs/Web/API/WebXR_Device_API#browser_compatibility)が必要

### セットアップ

1. リポジトリのクローン:
```bash
git clone https://github.com/yourusername/vrtest.git
cd vrtest
```

2. 開発サーバーの起動:
```bash
deno task start
```

3. ブラウザで開く:
```
http://localhost:8000
```

## 💻 開発とデバッグ

### 開発モード

開発モードでは、VRデバイスがなくてもPC上で開発とデバッグが可能です：

1. **デバッグモードの有効化**:
```bash
# 開発サーバー起動時にデバッグフラグを追加
deno task start --debug
```

2. **キーボード・マウス操作**:
- WASD: カメラの移動
- マウス: カメラの回転
- クリック: オブジェクトとの対話
- スペース: ジャンプ

3. **開発者ツール**:
- F12キーでChrome DevToolsを開く
- Consoleタブ: WebSocket通信ログの確認
- Networkタブ: WebSocket接続状態の監視
- Sourcesタブ: ブレークポイントを使用したデバッグ

### デバッグ情報の表示

1. **WebSocket通信のデバッグ**:
```typescript
// routes/api/ws.ts にデバッグログを追加
console.log('[WS] メッセージ受信:', message);
```

2. **3D環境の状態確認**:
- 画面左上に座標とFPSを表示
- オブジェクトの衝突判定の可視化
- カメラの視錐台の表示

3. **パフォーマンスモニタリング**:
- Chrome DevToolsのPerformanceタブ
- Three.jsの統計情報（Stats.js）
- メモリ使用量の監視

### エラーハンドリング

1. **WebSocket接続エラー**:
```typescript
ws.onerror = (error) => {
  console.error('[WS] エラー:', error);
  // 再接続ロジック
};
```

2. **3Dオブジェクトのロードエラー**:
```typescript
loader.onError = (error) => {
  console.error('[3D] ロードエラー:', error);
  // フォールバックモデルの表示
};
```

3. **VR機能の互換性チェック**:
```typescript
if (!navigator.xr) {
  console.warn('[VR] WebXR未対応のブラウザです');
  // 非VRモードへのフォールバック
}
```

## 💡 使用方法

1. アプリケーションにアクセスすると、3D空間が表示されます
2. VR対応デバイスを接続している場合、「VRを開始」ボタンが表示されます
3. VRモードでは:
   - コントローラーを使用して3Dオブジェクトと対話
   - 他のプレイヤーと同じ空間で交流
   - 空間音響を体験

## 🤝 貢献方法

1. このリポジトリをフォーク
2. 新しいブランチを作成 (`git checkout -b feature/amazing-feature`)
3. 変更をコミット (`git commit -m 'Add amazing feature'`)
4. ブランチをプッシュ (`git push origin feature/amazing-feature`)
5. プルリクエストを作成

## 📝 ライセンス

このプロジェクトは[MITライセンス](LICENSE)の下で公開されています。

## 👥 開発者

- 開発者名 - [@yourusername](https://github.com/yourusername)

## 📫 お問い合わせ

質問や提案がありましたら、Issuesセクションに投稿してください。