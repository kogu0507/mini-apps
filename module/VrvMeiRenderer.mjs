/*
 * VrvRenderer.mjs
 * TODO:コメント
 */

class VrvRenderer {
    // 公式 CDN の URL を static 定数として保持
    static VEROVIO_CDN_URL = "https://www.verovio.org/javascript/develop/verovio-toolkit-wasm.js";

    // SVG 楽譜生成用の default オプション設定
    static defaultSvgOptions = {
        pageWidth: 1600,      // 楽譜の横幅
        scale: 80,            // 拡大率
        adjustPageHeight: 1   // ページ高さの自動調整
    };
    // MIDI 変換用のオプションが必要な場合は defaultMidiOptions に追加できます
    static defaultMidiOptions = {};

    /**
     * コンストラクタ
     * @param {Object} toolkitInstance - verovio の toolkit インスタンス
     */
    constructor(toolkitInstance) {
        this.vrvToolkit = toolkitInstance;
    }

    /**
     * 指定されたスクリプトを動的に読み込む静的メソッド
     * @param {string} url - 読み込むスクリプトの URL
     * @returns {Promise<void>} - スクリプト読み込み完了の Promise
     */
    static loadScript(url) {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = url;
            script.defer = true;
            script.onload = () => {
                console.log(`Script loaded: ${url}`);
                resolve();
            };
            script.onerror = () => {
                reject(new Error(`Failed to load script: ${url}`));
            };
            document.head.appendChild(script);
        });
    }

    /**
     * verovio の初期化完了を待ち、VrvRenderer のインスタンスを生成する静的ファクトリメソッド
     * @returns {Promise<VrvRenderer>} - 初期化完了後に返される VrvRenderer インスタンス
     */
    static async createInstance() {
        try {
            // 公式 CDN からスクリプトを動的に読み込む
            await VrvRenderer.loadScript(VrvRenderer.VEROVIO_CDN_URL);

            // verovio の初期化完了を待つ
            await new Promise((resolve, reject) => {
                verovio.module.onRuntimeInitialized = resolve;
            });

            // toolkit のインスタンス生成
            const toolkitInstance = new verovio.toolkit();
            console.log("verovio module initialized and toolkit instance created.");
            return new VrvRenderer(toolkitInstance);
        } catch (err) {
            console.error("Error during verovio initialization:", err);
            throw err;
        }
    }

    /**
     * MEI データを SVG に変換するメソッド
     * ※まず setOptions() によりオプションを設定し、MEI データをロードした後、
     *     renderToSVG() を呼び出します。
     * @param {string} meiData - MEI 形式のデータ
     * @param {Object} options - SVG 変換時のオプション（必要に応じて上書き可能）
     * @returns {string} - 変換後の SVG 文字列
     */
    renderToSvg(meiData, options = {}) {
        try {
            // デフォルトオプションと引数のオプションをマージ
            const mergedOptions = { ...VrvRenderer.defaultSvgOptions, ...options };

            // まず toolkit にオプションをセット（例: scale, pageWidth, adjustPageHeight）
            this.vrvToolkit.setOptions(mergedOptions);
            // MEI データをロード
            this.vrvToolkit.loadData(meiData);
            // SVG をレンダリング（引数なしで renderToSVG() を呼び出す）
            return this.vrvToolkit.renderToSVG();
        } catch (err) {
            console.error("Error converting to SVG:", err);
            throw err;
        }
    }

    /**
     * MEI データを MIDI に変換するメソッド
     * ※必要に応じて setOptions() を先に呼び出します。
     * @param {string} meiData - MEI 形式のデータ
     * @param {Object} options - MIDI 変換時のオプション
     * @returns {Uint8Array|string} - 変換後の MIDI データ（仕様に依存）
     */
    renderToMidi(meiData, options = {}) {
        try {
            const mergedOptions = { ...VrvRenderer.defaultMidiOptions, ...options };
            this.vrvToolkit.setOptions(mergedOptions);
            this.vrvToolkit.loadData(meiData);
            return this.vrvToolkit.renderToMIDI();
        } catch (err) {
            console.error("Error converting to MIDI:", err);
            throw err;
        }
    }
}

export default VrvRenderer;


/*
<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>VrvMeiRenderer テスト</title>
    <style>
        #svg-container {
            border: 1px solid #ccc;
            margin-top: 20px;
        }
    </style>
</head>
<body>
    <h1>VrvMeiRenderer テスト</h1>
    <div id="svg-container">
        Loading SVG...
    </div>
    <script type="text/plain" id="mei-data">
        <?xml version="1.0" encoding="UTF-8"?>
        <?xml-model href="https://music-encoding.org/schema/dev/mei-all.rng" type="application/xml" schematypens="http://relaxng.org/ns/structure/1.0"?>
        <?xml-model href="https://music-encoding.org/schema/dev/mei-all.rng" type="application/xml" schematypens="http://purl.oclc.org/dsdl/schematron"?>
        <mei xmlns="http://www.music-encoding.org/ns/mei" meiversion="5.0.0-dev">
          <music>
            <body>
              <mdiv>
                <score>
                  <scoreDef>
                    <staffGrp symbol="bracket">
                      <staffDef n="1" lines="5" clef.shape="G" clef.line="2"/>
                      <staffDef n="2" lines="5" clef.shape="F" clef.line="4"/>
                    </staffGrp>
                  </scoreDef>
                  <section>
                    <measure n="1">
                      <staff n="1">
                        <layer n="1">
                          <note dur="4" pname="g" oct="4"/>
                          <note dur="4" pname="a" oct="4"/>
                          <note dur="4" pname="b" oct="4"/>
                          <note dur="4" pname="c" oct="5"/>
                        </layer>
                      </staff>
                      <staff n="2">
                        <layer n="1">
                          <note dur="4" pname="c" oct="3"/>
                          <note dur="4" pname="d" oct="3"/>
                          <note dur="4" pname="e" oct="3"/>
                          <note dur="4" pname="f" oct="3"/>
                        </layer>
                      </staff>
                    </measure>
                  </section>
                </score>
              </mdiv>
            </body>
          </music>
        </mei>
    </script>

    <script type="module">
        import VrvMeiRenderer from '../module/VrvMeiRenderer.mjs';

        async function renderTest() {
            try {
                const renderer = await VrvMeiRenderer.createInstance();

                // ID "mei-data" の script 要素から MEI データを取得
                const meiDataElement = document.getElementById('mei-data');
                const meiData = meiDataElement.textContent;

                const svg = renderer.renderToSvg(meiData, { pageWidth: 600 });
                const svgContainer = document.getElementById('svg-container');
                if (svgContainer) {
                    svgContainer.innerHTML = svg;
                }

            } catch (error) {
                console.error("Rendering failed:", error);
                const svgContainer = document.getElementById('svg-container');
                if (svgContainer) {
                    svgContainer.innerText = `Error: ${error.message}`;
                }
            }
        }

        renderTest();
    </script>
</body>
</html>
*/