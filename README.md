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
    schools.geojson
```

`data` フォルダには、QGISで作成した次の2ファイルを入れてください。

- `kashiwa_matudo_nagareyama.geojson`
- `reitaku.geojson`

学校データを入れる場合は、`schools.geojson` または `schools.csv` を追加してください。

### schools.geojson の形式

学校はPointのGeoJSONにしてください。座標は `[経度, 緯度]` の順です。

```json
{
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "properties": {
        "name": "学校名",
        "category": "小学校"
      },
      "geometry": {
        "type": "Point",
        "coordinates": [139.954, 35.833]
      }
    }
  ]
}
```

### schools.csv の形式

CSVの場合は、次の列名に対応しています。

```csv
name,category,lat,lng
学校名,小学校,35.833,139.954
```

日本語列名なら以下でも読み込めます。

```csv
学校名,種別,緯度,経度
学校名,中学校,35.833,139.954
```

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
