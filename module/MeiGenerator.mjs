/*
 * MeiGenerator.mjs
 *
 * MEI (Music Encoding Initiative) ドキュメントをプログラムで組み立てるためのクラス
 * 新しい API: startMeasure/addStaff/endMeasure によって
 * 同一小節内に複数の staff をまとめて生成できるよう拡張。
 */

class MeiGenerator {
  /**
   * @param {Object} config
   * @param {string} config.title         - 楽曲タイトル
   * @param {string} config.date          - 日付 (YYYY-MM-DD)
   * @param {string} [config.seriesTitle] - シリーズ名 (任意)
   * @param {Array<Object>} config.staffDefs
   *   - 五線定義: [{ n, lines, clef: { shape, line } }, ...]
   * @param {Object} [config.staffGrpAttrs]
   *   - <staffGrp> に付与する属性 (例: { 'bar.thru': 'true', symbol: 'brace' })
   */
  constructor(config) {
    // --- 設定検証 ---
    if (!config || typeof config !== 'object') throw new Error('設定オブジェクトが必要です');
    const { title, date, staffDefs, keySig, meterSig } = config;
    if (!title || typeof title !== 'string') throw new Error('title は必須の文字列です');
    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error('date は YYYY-MM-DD 形式です');
    if (!Array.isArray(staffDefs) || staffDefs.length === 0)
      throw new Error('staffDefs は配列かつ空でない必要があります');

    // --- プロパティ初期化 ---
    this.title = title;
    this.date = date;
    this.seriesTitle = config.seriesTitle || '';
    this.staffDefs = staffDefs;
    this.staffGrpAttrs = config.staffGrpAttrs || {};

    // 初期調号・拍子記号（scoreDef 内で使う）
    this.keySig = (keySig != null) ? keySig : 0;
    this.meterSig = meterSig || { count: 4, unit: 4 };

    // 小節データ管理
    this.measures = [];    // 最終的な <measure> XML の配列
    this._current = null;  // startMeasure 中 ({ n, override:{…}, staffs:[] })
  }


  /**
   * 汎用タグ生成ヘルパー
   * @private
   */
  _makeElement(tag, attrs = {}, content = '', options = {}) {
    const indentLevel = options.indentLevel || 0;
    const indent = ' '.repeat(indentLevel);
    const attrStr = Object.entries(attrs)
      .map(([k, v]) => `${k}="${v}"`).join(' ');
    const open = attrStr ? `<${tag} ${attrStr}>` : `<${tag}>`;
    if (options.selfClosing) {
      return indent + open.replace(/>$/, ' />');
    }
    let inner = '';
    if (Array.isArray(content)) {
      inner = content.map(line => indent + '  ' + line).join('\n');
    } else if (typeof content === 'string' && content.trim()) {
      inner = content.split('\n').map(line => indent + '  ' + line.trim()).join('\n');
    }
    const close = `</${tag}>`;
    if (!inner) return indent + open + close;
    return `${indent}${open}\n${inner}\n${indent}${close}`;
  }

  /**
   * <staffGrp> 要素を作成
   * @private
   */
  _generateStaffGrp() {
    const defs = this.staffDefs.map(def => {
      const clef = this._makeElement('clef', def.clef, '', { selfClosing: true, indentLevel: 6 });
      return this._makeElement('staffDef', { n: def.n, lines: def.lines }, clef.trim(), { indentLevel: 4 });
    });
    return this._makeElement('staffGrp', this.staffGrpAttrs, defs, { indentLevel: 2 });
  }

  /**
 * <scoreDef> 内で最初に出力する調号／拍子記号要素を生成
 * @private
 * @returns {string[]} keySig と meterSig の XML 文字列配列
 */
  _generateScoreDef() {
    const keyXml = this._makeElement(
      'keySig',
      { sig: this.keySig.toString() },
      '',
      { selfClosing: true, indentLevel: 4 }
    );
    const meterXml = this._makeElement(
      'meterSig',
      { count: this.meterSig.count, unit: this.meterSig.unit },
      '',
      { selfClosing: true, indentLevel: 4 }
    );
    return [keyXml, meterXml];
  }


  /**
 * 新しい小節を開始（override で小節ごとの調号／拍子変更も可能）
 * @param {number} n
 * @param {Object} [override]
 * @param {number} [override.keySig]         - 小節先頭で変更する調号
 * @param {Object} [override.meterSig]       - 小節先頭で変更する拍子 { count, unit }
 */
  startMeasure(n, { keySig, meterSig } = {}) {
    if (this._current) throw new Error('前の小節が未終了です');
    this._current = {
      n,
      override: { keySig, meterSig },
      // ◉ ここをオブジェクトにして、staff ごとに layer をまとめて格納
      staffs: {}
    };
  }


  /**
   * 現在の小節に layer を追加（同一 staff の中で重ねる）
   * @param {Object} data
   * @param {number} data.staff - staff 番号
   * @param {number} data.layer - layer 番号
   * @param {string} data.notes - <note/> 要素文字列 (改行区切り)
   */
  addStaff({ staff, layer, notes }) {
    if (!this._current) throw new Error('先に startMeasure を呼んでください');

    // notes を行分割してトリム
    const noteLines = notes
      .trim()
      .split('\n')
      .map(l => l.trim());

    // <layer> 要素を生成
    const layerXml = this._makeElement(
      'layer',
      { n: layer },
      noteLines,
      { indentLevel: 6 }
    );

    // staff 番号ごとの配列に追加
    if (!this._current.staffs[staff]) {
      this._current.staffs[staff] = [];
    }
    this._current.staffs[staff].push(layerXml);
  }


  /**
   * 現在の小節を終了し、<measure> 要素を組み立てて内部配列に追加
   */
  endMeasure() {
    if (!this._current) throw new Error('startMeasure が呼ばれていません');

    const elems = [];
    const over = this._current.override;

    // ◉ 小節先頭で調号／拍子をオーバーライド
    if (over.keySig != null) {
      elems.push(
        this._makeElement(
          'keySig',
          { sig: over.keySig.toString() },
          '',
          { selfClosing: true, indentLevel: 4 }
        )
      );
    }
    if (over.meterSig) {
      elems.push(
        this._makeElement(
          'meterSig',
          { count: over.meterSig.count, unit: over.meterSig.unit },
          '',
          { selfClosing: true, indentLevel: 4 }
        )
      );
    }

    // ◉ staff ごとにまとめて <staff> 要素を生成
    const staffElements = [];
    this.staffDefs.forEach(def => {
      const staffNum = def.n;
      const layers = this._current.staffs[staffNum] || [];
      if (layers.length > 0) {
        // <staff n="…"> layerXml1, layerXml2, … </staff>
        staffElements.push(
          this._makeElement(
            'staff',
            { n: staffNum },
            layers,
            { indentLevel: 4 }
          )
        );
      }
    });

    // 全要素を結合して <measure> を生成
    const allChildren = [...elems, ...staffElements];
    const measureXml = this._makeElement(
      'measure',
      { 'xml:id': `m${this._current.n}`, n: this._current.n },
      allChildren,
      { indentLevel: 2 }
    );

    this.measures.push(measureXml);
    this._current = null;
  }


  /**
   * 小節間にスコア定義を挿入（拍子・調号を切り替え）
   * @param {number} n                    - n 属性 (この小節から適用)
   * @param {Object} [meterSig]           - 拍子記号設定 { count: 分子, unit: 分母 }
   * @param {Object} [keySig]             - 調号設定 { sig: '1f' など }
   */
  addScoreDef(n, meterSig = {}, keySig = {}) {
    // 1. 属性オブジェクトを組み立て
    const attrs = { n };
    if (meterSig.count != null) attrs['meter.count'] = meterSig.count;
    if (meterSig.unit != null) attrs['meter.unit'] = meterSig.unit;
    if (keySig.sig != null) attrs['keysig'] = keySig.sig;

    // 2. <scoreDef ... /> を生成（自己終了タグ）
    const scoreDefXml = this._makeElement(
      'scoreDef',
      attrs,
      '',
      { selfClosing: true, indentLevel: 2 }
    );

    // 3. measures 配列に追加（build() 時に順番どおり出力される）
    this.measures.push(scoreDefXml);
  }

  /**
   * MEI ドキュメント全体を生成して返却
   */
  build() {
    // --- header 部分は省略 ---
    const header = [
      '<?xml version="1.0" encoding="UTF-8"?>',
      '<?xml-model href="https://music-encoding.org/schema/5.1/mei-all.rng" type="application/xml" schematypens="http://relaxng.org/ns/structure/1.0"?>',
      '<mei xmlns="http://www.music-encoding.org/ns/mei" meiversion="5.1">',
      '  <meiHead>',
      '    <fileDesc>',
      `      <titleStmt><title>${this.title}</title></titleStmt>`,
      `      <pubStmt><date>${this.date}</date></pubStmt>${this.seriesTitle ? '\n      <seriesStmt><title>' + this.seriesTitle + '</title></seriesStmt>' : ''}`,
      '    </fileDesc>',
      '    <encodingDesc>',
      '      <appInfo>',
      '        <application version="1.0.0" label="2">',
      '          <name>Verovio</name>',
      '        </application>',
      '      </appInfo>',
      '    </encodingDesc>',
      '  </meiHead>',
      '  <music>',
      '    <body>',
      '      <mdiv>',
      '        <score>',
      '          <scoreDef>'
    ];

    // ■ ここで初期調号・拍子を出力
    const scoreDefs = this._generateScoreDef();

    // ■ staffGrp を続ける
    const staffGrp = this._generateStaffGrp();

    // section～footer はこれまで通り
    const sectionOpen = '          <section>';
    const sectionClose = '          </section>';
    const footer = [
      '        </score>',
      '      </mdiv>',
      '    </body>',
      '  </music>',
      '</mei>'
    ];

    return [
      ...header,
      ...scoreDefs,
      staffGrp,
      '          </scoreDef>',
      sectionOpen,
      ...this.measures,
      sectionClose,
      ...footer
    ].join('\n');
  }

}

export default MeiGenerator;

/*
-- HTML 使用例 --
<!DOCTYPE html>
<html lang="ja">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>MeiGenerator テスト</title>
    <script src="https://www.verovio.org/javascript/latest/verovio-toolkit-wasm.js" defer></script>
</head>

<body>
    <h1>MeiGenerator テスト</h1>

    <pre id="mei-output" style="white-space: pre-wrap; word-break: break-all;"></pre>
    <div id="notation"></div>
    <script type="module">
        import MeiGenerator from '../module/MeiGenerator.mjs';
        document.addEventListener("DOMContentLoaded", (event) => {
            verovio.module.onRuntimeInitialized = async _ => {
                // 1. 初期設定
                const config = {
                    title: 'サンプル',
                    date: '2025-04-29',

                    // 大譜表
                    staffDefs: [
                        { n: 1, lines: 5, clef: { shape: 'G', line: 2 } },
                        { n: 2, lines: 5, clef: { shape: 'F', line: 4 } }
                    ],
                    staffGrpAttrs: { 'bar.thru': 'true', symbol: 'brace' },

                    // 調号と拍子記号（初期設定）
                    keySig: "0",                // Cメジャー → sig="0" | Gメジャー → sig="1s" | Fメジャー → sig="1f"
                    meterSig: { count: 4, unit: 4 }, // 4/4 拍子
                };

                const gen = new MeiGenerator(config);

                // 2. 1小節目を生成
                gen.startMeasure(1);
                gen.addStaff({
                    staff: 1, layer: 1,
                    notes:`
                        <note pname="c" oct="4" dur="2"/>
                        <note pname="c" oct="4" dur="2"/>`
                });
                gen.addStaff({
                    staff: 2, layer: 1,
                    notes:`
                        <note pname="f" oct="3" dur="2"/>
                        <note pname="f" oct="3" dur="2"/>`
                });
                gen.endMeasure();

                // 3. 2小節目から 2/4 拍子＋1つフラットに変更
                //    ⇒ <scoreDef n="2" meter.count="2" meter.unit="4" key.sig="-1"/>
                gen.addScoreDef(
                    2,
                    { count: 2, unit: 4 },    // meterSig
                    { sig: '5s' }            // keySig 1f=♭1 1s=♯1
                );
                // 4. 2小節目を生成
                gen.startMeasure(2);
                gen.addStaff({
                    staff: 1, layer: 1,
                    notes:`
                        <note pname="d" oct="4" dur="4"/>
                        <note pname="d" oct="4" dur="4"/>`
                });
                gen.addStaff({
                    staff: 2, layer: 1,
                    notes:`
                    <note pname="g" oct="4" dur="4"/>
                    <note pname="g" oct="4" dur="4"/>`
                });
                gen.endMeasure();

                // 5. 出力＆レンダリング
                const meiXml = gen.build();
                console.log(meiXml);
                document.getElementById('mei-output').textContent = meiXml;

                // verovioでSVG表示
                const tk = new verovio.toolkit();
                tk.setOptions({
                    scale: 60,
                    landscape: true,
                    //adjustPageWidth: true 
                    adjustPageWidth: false,
                    adjustPageHeight: true
                });
                document.getElementById('notation').innerHTML = tk.renderData(meiXml, {});
            }
        });
    </script>
</body>

</html>
*/
