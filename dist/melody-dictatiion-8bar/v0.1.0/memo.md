
# melody-dictation-8bar v0.1.0 メモ

## 📌 概要

8小節のメロディ聴音ミニアプリ。
受験対策や聴音練習の補助として使用。
主に WordPress 記事内からは、
https://kogu0507.github.io/mini-apps/dist/melody-dictation-8bar/v0.1.0/script.js
https://kogu0507.github.io/mini-apps/dist/melody-dictation-8bar/v0.1.0/style.css

<!-- WordPressやピアノ教室サイトから読み込む場合 -->
<script src="https://kogu0507.github.io/mini-apps/dist/melody-dictation-8bar/v0.1.0/script.js"></script>
<link rel="stylesheet" href="https://kogu0507.github.io/mini-apps/dist/melody-dictation-8bar/v0.1.0/style.css">


## 🛠️ バージョン情報

- バージョン: v0.1.0
- 公開日: 2025-04-18
- GitHub Pages URL:  
https://kogu0507.github.io/mini-apps/dist/melody-dictation-8bar/v0.1.0/script.js
https://kogu0507.github.io/mini-apps/dist/melody-dictation-8bar/v0.1.0/style.css

## ✅ 実装内容

- 再生ボタンで8小節のメロディを再生（8小節、4小節、2小節、各小節）
- HTMLに埋め込まれたdataを読み取ってsvg表示＆MIDI再生
- `verovio` 使用 CDN読み込み
- `MIDIjs` 使用 CDN読み込み


## 🔧 ファイル一覧

- `script.js`：楽譜表示、再生ロジックとUI制御
- `style.css`：最小限のスタイル調整
- `memo.md`：このメモ

## 📝 制作メモ・課題

- 今後、テンポ変更・繰り返し再生・コード付き再生に拡張する可能性あり？
- スクリプトの一部関数は `common/` に移して他アプリと共有？

## 📦 その他

- WordPress側の読み込み用タグは別ファイル `template.html` に記載予定（未定）
