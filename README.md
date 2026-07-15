# 麗澤大学周辺の市境 Webmap

柏市・松戸市・流山市と、麗澤大学敷地の位置関係を見せるための静的Webmapです。

## ファイル配置

このフォルダに次のように配置します。

```text
reitaku-webmap/
  index.html
  style.css
  main.js
  data/
    kashiwa_matudo_nagareyama.geojson
    reitaku.geojson
```

`data` フォルダには、QGISで作成した次の2ファイルを入れてください。

- `kashiwa_matudo_nagareyama.geojson`
- `reitaku.geojson`

## ローカル確認

VS Codeなどでフォルダを開き、簡易サーバーで表示します。

```powershell
python -m http.server 8000
```

ブラウザで以下を開きます。

```text
http://localhost:8000
```

## GitHub Pagesで公開

1. このフォルダの中身をリポジトリに入れます。
2. GitHubで `Settings` → `Pages` を開きます。
3. `Deploy from a branch` を選びます。
4. `main` ブランチ、`/root` を選びます。
5. 表示されたURLを開きます。

## データ出典を書く場合

ページやREADMEに、国土数値情報など元データの出典を追記してください。
