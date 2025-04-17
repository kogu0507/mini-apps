// script.js

// ==================================================
// クラス定義
// ==================================================*/
/********************************  
* MeiGenerator クラスの定義
********************************/
class MeiGenerator {
    constructor() {
        this.meiSettingsSets = this.loadSettings();
        this.mainTemplates = this.loadMainTemplates();
        this.subTemplates = this.loadSubTemplates();
        this.generationParams = this.loadGenerationParams();
    }

    // --- ▼▼▼ 共通処理としてヘルパーメソッド化 ▼▼▼ ---
    /**
     * script要素からテンプレート文字列を読み込み、Live Serverの挿入コードを除去する
     * @param {Element} element - テンプレートが記述されたscript要素
     * @returns {string} - 整形されたテンプレート文字列
     */
    _extractTemplateContent(element) {
        let content = element.textContent || ''; // textContent を取得
        content = content.trim(); // 前後の空白を除去

        // Live Server が挿入するコメントを探す
        const liveServerComment = '<!-- Code injected by live-server -->';
        const commentIndex = content.indexOf(liveServerComment);

        // コメントが見つかった場合、それより前の部分だけを返す
        if (commentIndex !== -1) {
            content = content.substring(0, commentIndex).trimEnd(); // コメント前の部分を取得し、末尾の空白も除去
        }
        return content;
    }
    // --- ▲▲▲ 共通処理としてヘルパーメソッド化 ▲▲▲ ---

    loadSettings() {
        const settings = {};
        const settingsElements = document.querySelectorAll('.mei-settings-set');
        settingsElements.forEach(element => {
            const taskNumber = element.dataset.taskNumber;
            if (taskNumber) {
                try {
                    // --- ▼▼▼ 修正: ヘルパーメソッドを使用 ▼▼▼ ---
                    const jsonString = this._extractTemplateContent(element);
                    // JSON 文字列が空でないことを確認してからパース
                    if (jsonString) {
                        settings[taskNumber] = JSON.parse(jsonString);
                    } else {
                        console.warn(`Settings for task ${taskNumber} is empty after trim/cleanup.`);
                    }
                    // --- ▲▲▲ 修正 ▲▲▲ ---
                } catch (e) {
                    console.error(`Failed to parse settings for task ${taskNumber}:`, e, element.textContent);
                }
            }
        });
        return settings;
    }

    loadMainTemplates() {
        const templates = {};
        const templateElements = document.querySelectorAll('.mei-main-template');
        templateElements.forEach(element => {
            const templateNumber = element.dataset.templateNumber;
            if (templateNumber) {
                // --- ▼▼▼ 修正: ヘルパーメソッドを使用 ▼▼▼ ---
                templates[templateNumber] = this._extractTemplateContent(element);
                // --- ▲▲▲ 修正 ▲▲▲ ---
            }
        });
        return templates;
    }

    loadSubTemplates() {
        const templates = {};
        const templateElements = document.querySelectorAll('.mei-sub-template');
        templateElements.forEach(element => {
            const templateNumber = element.dataset.templateNumber;
            const templatePart = element.dataset.templatePart;
            const key = `${templateNumber}-${templatePart}`;
            if (!templates[key]) {
                templates[key] = {};
            }
            let subTemplateId = '';
            if (templatePart === 'staffDef') {
                subTemplateId = element.dataset.staffId;
            } else if (templatePart === 'content') {
                subTemplateId = element.dataset.contentId;
            }
            if (subTemplateId) {
                // --- ▼▼▼ 修正: ヘルパーメソッドを使用 ▼▼▼ ---
                templates[key][subTemplateId] = this._extractTemplateContent(element);
                // --- ▲▲▲ 修正 ▲▲▲ ---
            }
        });
        return templates;
    }

    getSettings(taskNumber) {
        // デフォルト設定のフォールバックを改善
        return this.meiSettingsSets[taskNumber] || this.meiSettingsSets['1'] || {};
    }

    concatenateSubTemplates(templateNumber, part, idSequence) {
        const subTemplatesForPart = this.subTemplates[`${templateNumber}-${part}`] || {};
        let concatenatedString = '';
        // idSequence が配列であることを確認
        if (!Array.isArray(idSequence)) {
            console.warn(`Invalid idSequence for template ${templateNumber}, part ${part}:`, idSequence);
            return ''; // 空文字列を返すか、エラーを投げる
        }
        for (const id of idSequence) {
            if (subTemplatesForPart[id]) {
                // サブテンプレート間に不要な空白が入らないように注意
                concatenatedString += subTemplatesForPart[id]; // trim() は読み込み時に行っているのでここでは不要
            } else {
                console.warn(`Sub template (part: ${part}, id: ${id}) for template ${templateNumber} not found.`);
            }
        }
        return concatenatedString;
    }

    loadGenerationParams() {
        const params = {};
        const paramElements = document.querySelectorAll('.mei-generation-params');
        paramElements.forEach(element => {
            const taskId = element.dataset.taskId;
            if (taskId) {
                try {
                    // --- ▼▼▼ 修正: ヘルパーメソッドを使用 ▼▼▼ ---
                    const jsonString = this._extractTemplateContent(element);
                    // JSON 文字列が空でないことを確認してからパース
                    if (jsonString) {
                        params[taskId] = JSON.parse(jsonString);
                    } else {
                        console.warn(`Generation params for task ${taskId} is empty after trim/cleanup.`);
                    }
                    // --- ▲▲▲ 修正 ▲▲▲ ---
                } catch (e) {
                    console.error(`Failed to parse generation params for task ${taskId}:`, e, element.textContent);
                }
            }
        });
        return params;
    }

    generateMei(params) {
        // taskId を受け取れるようにしておく（デバッグ用）
        const { templateNumber, taskNumber, contentIdSequence, staffDefIdSequence, taskId } = params;

        const mainTemplate = this.mainTemplates[templateNumber];
        if (!mainTemplate) {
            console.error(`Main template with number ${templateNumber} not found.`);
            return null;
        }
        let meiTemplate = mainTemplate;
        const settings = this.getSettings(taskNumber);

        // 譜表定義 (staffDef) を取得して挿入
        const staffDefIds = staffDefIdSequence || ['staff1'];
        const staffDefs = this.concatenateSubTemplates(templateNumber, 'staffDef', staffDefIds)
            // 置換する前に settings の値が存在するか確認
            .replace('${clefShape}', settings.defaultClefShape || 'G') // デフォルト値を指定
            .replace('${clefLine}', settings.defaultClefLine || '2');   // デフォルト値を指定
        if (!staffDefs && staffDefIds.length > 0) { // staffDefIds が空でないのに staffDefs が空の場合に警告
            console.warn(`Staff definitions could not be generated for template ${templateNumber}`);
        }
        meiTemplate = meiTemplate.replace('${staffDefs}', staffDefs);

        // コンテンツ (content) を取得して挿入
        const contentSequence = contentIdSequence || [];
        const content = this.concatenateSubTemplates(templateNumber, 'content', contentSequence);
        if (!content && contentSequence.length > 0) {
            console.warn(`Content could not be generated for template ${templateNumber} with sequence: ${contentSequence.join(', ')}`);
        }
        // 置換する前に settings の値が存在するか確認し、デフォルト値を設定
        meiTemplate = meiTemplate
            .replace('${title}', settings.defaultTitle || '')
            .replace('${meterCount}', settings.defaultMeterCount || '4')
            .replace('${meterUnit}', settings.defaultMeterUnit || '4')
            .replace('${staffGrpSymbol}', settings.defaultStaffGrpSymbol || 'none') // staffGrpSymbol のデフォルト値も考慮
            .replace('${content}', content);

        // --- ▼▼▼ デバッグ用ログは原因特定できたのでコメントアウトまたは削除 ▼▼▼ ---
        /*
         if (taskId === 'task1-1to8') {
             console.log(`--- Final MEI for ${taskId} ---`);
             console.log(meiTemplate);
             console.log(`--- End MEI ---`);
         }
        */
        // --- ▲▲▲ デバッグ用ログ ▲▲▲ ---

        return meiTemplate;
    }

    generateAllMei() {
        const allMeiData = {};
        for (const taskId in this.generationParams) {
            // taskId を generateMei に渡す
            const params = { ...this.generationParams[taskId], taskId: taskId };
            const meiData = this.generateMei(params);
            if (meiData) {
                allMeiData[taskId] = meiData;
            } else {
                // generateMei が null を返した場合の警告
                console.warn(`Failed to generate MEI for task ${taskId}`);
            }
        }
        return allMeiData;
    }
}

/********************************  
* VrvConverter クラス定義（動的ロード + static 定数利用）
********************************/
class VrvConverter {
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
     * verovio の初期化完了を待ち、VrvConverter のインスタンスを生成する静的ファクトリメソッド
     * @returns {Promise<VrvConverter>} - 初期化完了後に返される VrvConverter インスタンス
     */
    static async createInstance() {
        try {
            // 公式 CDN からスクリプトを動的に読み込む
            await VrvConverter.loadScript(VrvConverter.VEROVIO_CDN_URL);

            // verovio の初期化完了を待つ
            await new Promise((resolve, reject) => {
                verovio.module.onRuntimeInitialized = resolve;
            });

            // toolkit のインスタンス生成
            const toolkitInstance = new verovio.toolkit();
            console.log("verovio module initialized and toolkit instance created.");
            return new VrvConverter(toolkitInstance);
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
    convertToSvg(meiData, options = {}) {
        try {
            // デフォルトオプションと引数のオプションをマージ
            const mergedOptions = { ...VrvConverter.defaultSvgOptions, ...options };

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
    convertToMidi(meiData, options = {}) {
        try {
            const mergedOptions = { ...VrvConverter.defaultMidiOptions, ...options };
            this.vrvToolkit.setOptions(mergedOptions);
            this.vrvToolkit.loadData(meiData);
            return this.vrvToolkit.renderToMIDI();
        } catch (err) {
            console.error("Error converting to MIDI:", err);
            throw err;
        }
    }
}

/********************************  
* SvgViewer クラスの定義
********************************/
class SvgViewer {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
    }

    display(svgString) {
        if (this.container) {
            this.container.innerHTML = svgString;
        }
    }

    clear() {
        if (this.container) {
            this.container.innerHTML = '';
        }
    }
}


/********************************  
* MidiPlayer クラスの定義（重複定義防止）  
********************************/
if (typeof window.MidiPlayer === 'undefined') {
    class MidiPlayer {
        constructor() {
            // MIDIjs（ライブラリ）の参照を保持する変数  
            this.midi = null;
            // MIDI.js が正常にロードされたかどうかのフラグ  
            this.isReady = false;
            // ロードした MIDI データ（data URL 形式）を保持  
            this.midiData = null;

        }

        /**  
        * MIDI.js を動的にロードし、初期化を行う非同期処理  
        * @param {string} midiJsSrc - MIDI.js ライブラリの URL
        * @returns {Promise<void>} ライブラリ読み込み完了の Promise 
        */
        async _initMidiJS(midiJsSrc) { // 引数を追加
            // --- ▼▼▼ 修正 ▼▼▼ ---
            // midiJsSrc が undefined や null でないことを確認
            if (!midiJsSrc) {
                return Promise.reject('MIDI.js の URL が指定されていません。');
            }
            // --- ▲▲▲ 修正 ▲▲▲ ---

            return new Promise((resolve, reject) => {
                // 既に MIDIjs がグローバルに存在する場合はそれを利用する  
                if (typeof MIDIjs !== 'undefined') {
                    this.midi = MIDIjs;
                    this.isReady = true;
                    console.log("MIDIjs already loaded."); // 既にロードされている場合のログ
                    resolve();
                } else {
                    // MIDI.js を動的に読み込むために script タグを作成  
                    const script = document.createElement('script');
                    script.src = midiJsSrc; // 引数で渡された URL を使用
                    // スクリプト読み込み成功時の処理  
                    script.onload = () => {
                        if (typeof MIDIjs !== 'undefined') {
                            this.midi = MIDIjs;
                            this.isReady = true;
                            console.log(`Script loaded: ${midiJsSrc}`); // 読み込み成功ログ
                            resolve();
                        } else {
                            // スクリプトはロードされたが、MIDIjs オブジェクトが見つからない場合
                            console.error('MIDIjs object not found after script load.');
                            reject('MIDIjs がスクリプト読み込み後に利用できませんでした。');
                        }
                    };
                    // 読み込みエラー時の処理  
                    script.onerror = (error) => {
                        // --- ▼▼▼ 修正 ▼▼▼ ---
                        // エラーオブジェクトの内容をより詳細に出力
                        console.error(`MIDI.js の読み込みに失敗しました: ${midiJsSrc}`, error);
                        reject(new Error(`Failed to load script: ${midiJsSrc}`)); // Errorオブジェクトを渡す
                        // --- ▲▲▲ 修正 ▲▲▲ ---
                    };
                    // <head> に script タグを追加して読み込み開始  
                    document.head.appendChild(script);
                }
            });
            // --- ▼▼▼ 削除 ▼▼▼ ---
            // .catch ブロックは呼び出し元で処理するため削除
            // .catch((error) => {
            //     console.error('初期化エラー:', error);
            // });
            // --- ▲▲▲ 削除 ▲▲▲ ---
        }

        /**  
        * MIDI データ（data URL 形式）をロードする  
        * @param {string} midiData - data URL 形式の MIDI データ  
        */
        async load(midiData) {
            // ライブラリの初期化が完了していない場合は警告を出す（再生は試みない）
            if (!this.isReady) {
                // --- ▼▼▼ 修正 ▼▼▼ ---
                // _initMidiJS をここで呼び出すのではなく、初期化が完了しているかチェックするだけにする
                console.error('MidiPlayer is not ready. Call _initMidiJS first.');
                return; // ロード処理を中断
                // --- ▲▲▲ 修正 ▲▲▲ ---
            }

            // MIDI.js に渡すための MIDI データを格納  
            this.midiData = midiData;
        }

        /**  
        * ロードされた MIDI データを再生する  
        */
        play() {
            if (this.isReady && this.midiData) {
                // MIDIjs の play メソッドに data URL を渡して再生  
                this.midi.play(this.midiData);
            } else if (!this.isReady) {
                console.warn('MIDI Player is not ready.');
            } else {
                console.warn('MIDI data not loaded.');
            }
        }

        /**  
        * MIDI の再生を一時停止する  
        */
        pause() {
            if (this.isReady && typeof this.midi.pause === 'function') {
                this.midi.pause();
            } else if (this.isReady) {
                console.warn('Pause function is not supported by this MIDI library.');
            } else {
                console.warn('MIDI Player is not ready.');
            }
        }

        /**  
        * 再生中の MIDI の停止  
        */
        stop() {
            if (this.isReady && typeof this.midi.stop === 'function') {
                this.midi.stop();
            } else if (this.isReady) {
                console.warn('Stop function is not supported by this MIDI library.');
            } else {
                console.warn('MIDI Player is not ready.');
            }
        }

        /**  
        * SoundFont の URL を設定する  
        * @param {string} url - 利用する SoundFont の URL  
        */
        setSoundfontUrl(url) {
            if (this.isReady) {
                // MIDIjs ライブラリが soundfontUrl プロパティを持っているか確認
                if (this.midi && typeof this.midi.soundfontUrl !== 'undefined') {
                    this.midi.soundfontUrl = url;
                    console.log(`SoundFont URL set to: ${url}`); // 設定成功ログ
                } else {
                    // --- ▼▼▼ 修正 ▼▼▼ ---
                    // 警告メッセージを具体的に
                    console.warn('Setting SoundFont URL is not supported by the loaded MIDI library or MIDIjs object is not available.');
                    // --- ▲▲▲ 修正 ▲▲▲ ---
                }
            } else {
                console.warn('Cannot set SoundFont URL: MIDI Player is not ready.');
            }
        }
    }
    // グローバルに MidiPlayer クラスを設定  
    window.MidiPlayer = MidiPlayer;
} else {
    console.warn('MidiPlayer は既に定義されています');
}


// Verovio公式で利用している MIDI.js のURL（グローバルは MIDIjs となる）  
// const MIDI_JS_SRC = 'https://www.midijs.net/lib/midi.js';
// おすすめの SoundFont のURL（利用ライブラリに合わせた設定。ライブラリ側でサポートされていれば有効）  
// const DEFAULT_SOUNDFONT_URL = 'https://gleitz.github.io/midi-js-soundfonts/FluidR3_GM/';
// →<script type="application/json" id="app-config">から読み込むことにしたため

// ==================================================
// メイン
// ==================================================
document.addEventListener("DOMContentLoaded", async (event) => {
    
    // ▼▼▼ ローディング表示要素を取得 ▼▼▼
    const loadingIndicator = document.getElementById("loading-indicator");
    // ▲▲▲ ローディング表示要素を取得 ▲▲▲

    const logContainer = document.getElementById("log-container"); // ログ表示用

    // --- ▼▼▼ 追加: エラーメッセージ表示関数 ▼▼▼ ---
    function displayError(message) {
        console.error(message);
        if (logContainer) {
            logContainer.innerText += `\nエラー: ${message}`;
        }
        // ▼▼▼ エラー発生時もローディング表示を隠す ▼▼▼
        if (loadingIndicator) {
            loadingIndicator.style.display = 'none';
        }
        // ▲▲▲ エラー発生時もローディング表示を隠す ▲▲▲
        // 必要であれば、ここで処理を中断させる throw new Error(message); を追加
    }
    // --- ▲▲▲ 追加 ▲▲▲ ---

    // ▼▼▼ 処理開始前にローディング表示を表示 ▼▼▼
    if (loadingIndicator) {
        loadingIndicator.style.display = 'flex'; // CSSで設定した display プロパティ値（例: flex）
    }
    // ▲▲▲ 処理開始前にローディング表示を表示 ▲▲▲

    // HTMLから設定値を読み込む
    const configElement = document.getElementById('app-config');
    if (!configElement) {
        displayError('設定要素 #app-config が見つかりません。');
        return; // 処理を中断
    }
    let appConfig;
    try {
        appConfig = JSON.parse(configElement.textContent);
    } catch (e) {
        displayError(`設定ファイル #app-config の JSON パースに失敗しました: ${e}`);
        return; // 処理を中断
    }
    const midiJsSrc = appConfig.midiJsSrc;
    const defaultSoundfontUrl = appConfig.defaultSoundfontUrl;

    // --- ▼▼▼ 修正: 設定値の存在チェックを強化 ▼▼▼ ---
    if (!midiJsSrc) {
        displayError('#app-config に midiJsSrc が定義されていません。');
        return; // 処理を中断
    }
    if (!defaultSoundfontUrl) {
        // SoundFont URL は警告にとどめる（必須ではない場合）
        console.warn('#app-config に defaultSoundfontUrl が定義されていません。デフォルトの SoundFont が使用される可能性があります。');
        // displayError('#app-config に defaultSoundfontUrl が定義されていません。');
        // return; // 必要なら中断
    }
    // --- ▲▲▲ 修正 ▲▲▲ ---

    // MeiGenerator のインスタンスを作成
    const meiGenerator = new MeiGenerator();
    const svgViewer = new SvgViewer("svg-container");
    // MidiPlayer のインスタンスを作成
    const midiPlayer = new MidiPlayer();

    try {
        // --- ▼▼▼ MIDI Player の初期化とエラーハンドリング ▼▼▼ ---
        try {
            await midiPlayer._initMidiJS(midiJsSrc);
            console.log("MidiPlayer initialized successfully.");
            if (defaultSoundfontUrl) {
                midiPlayer.setSoundfontUrl(defaultSoundfontUrl);
            }
        } catch (error) {
            displayError(`MidiPlayer の初期化に失敗しました: ${error.message || error}`);
            return; // 初期化失敗時はここで処理中断
        }
        // --- ▲▲▲ MIDI Player の初期化とエラーハンドリング ▲▲▲ ---

    // 全ての定義された MEI データを生成する
    let allGeneratedData;
    try {
        allGeneratedData = meiGenerator.generateAllMei();
    } catch (error) {
        displayError(`MEIデータの生成中にエラーが発生しました: ${error}`);
        return; // MEI生成失敗時はここで処理中断
    }

    // VrvConverter のインスタンス生成と変換実行
    const converter = await VrvConverter.createInstance();

    // SVG 生成
        const svgOutput = converter.convertToSvg(allGeneratedData['task1-1to8'], {
            pageWidth: 1600,
            scale: 30,
            adjustPageHeight: 1
        });
        svgViewer.display(svgOutput);

        // --- ▼▼▼ MIDI データ生成ループ ▼▼▼ ---
        const midiData = {};
        const taskIdsForMidi = Object.keys(meiGenerator.generationParams);

        for (const taskId of taskIdsForMidi) {
            if (allGeneratedData[taskId]) {
                try {
                    const midiBase64 = converter.convertToMidi(allGeneratedData[taskId], {});
                    midiData[taskId] = midiBase64;
                    console.log(`Generated MIDI for ${taskId}`);
                } catch (midiError) {
                    console.error(`Error converting MIDI for ${taskId}:`, midiError);
                    // MIDI変換エラーは警告に留め、処理は続行するかもしれない
                    displayError(`MIDI変換エラー (${taskId}): ${midiError}`);
                }
            } else {
                console.warn(`MEI data for MIDI task ${taskId} not found in allGeneratedData.`);
            }
        }
        // --- ▲▲▲ MIDI データ生成ループ ▲▲▲ ---

        // ボタンの disabled を解除する関数
        function enableButtons() {
            document.getElementById('svg-size-slider').disabled = false;
            const midiButtons = document.querySelectorAll('.play-midi-button');
            midiButtons.forEach(button => button.disabled = false);
            document.getElementById('stop-button').disabled = false;
            document.getElementById('play-practice-exam-button').disabled = false;
            // コンテナ高さ調整スライダーも有効化（もし実装されていれば）
            const heightSlider = document.getElementById('container-height-slider');
            if (heightSlider) heightSlider.disabled = false;
        }

        // ボタンを有効化
        enableButtons();

        // 再生ファンクション (MIDI データが生成されているかチェックを追加) (変更なし)
        function createPlayFunction(taskId) {
            return () => {
                if (midiData[taskId]) {
                    midiPlayer.load('data:audio/midi;base64,' + midiData[taskId]);
                    midiPlayer.play();
                } else {
                    console.warn(`Cannot play: MIDI data for ${taskId} not available.`);
                    displayError(`再生できません: ${taskId} のMIDIデータがありません。`);
                }
            };
        }

        // --- ▼▼▼ 修正: 再生ボタンへのイベントリスナー設定をループ化 ▼▼▼ ---
        // 共通クラスを持つすべての再生ボタンを取得
        const playMidiButtons = document.querySelectorAll('.play-midi-button');

        // 各ボタンにイベントリスナーを設定
        playMidiButtons.forEach(button => {
            // ボタンの data-task-id 属性から taskId を取得
            const taskId = button.dataset.taskId;
            if (taskId) {
                // taskId を使って再生関数を作成し、クリックイベントに紐付ける
                button.addEventListener('click', createPlayFunction(taskId));
            } else {
                console.warn('Button is missing data-task-id attribute:', button);
            }
        });

        // 停止ボタンは個別に対応
        document.getElementById('stop-button').addEventListener('click', () => midiPlayer.stop());
        // --- ▲▲▲ 修正 ▲▲▲ ---

        // --- ▼▼▼ 修正: 模擬試験再生ロジック ▼▼▼ ---
        const practiceExamButton = document.getElementById('play-practice-exam-button');
        practiceExamButton.addEventListener('click', () => {
            const sequenceId = practiceExamButton.dataset.sequenceId;
            const sequenceElement = document.getElementById(sequenceId);
            if (!sequenceElement) {
                displayError(`試験シーケンス定義 #${sequenceId} が見つかりません。`);
                return;
            }

            let sequenceConfig;
            try {
                sequenceConfig = JSON.parse(sequenceElement.textContent);
            } catch (e) {
                displayError(`試験シーケンス定義 #${sequenceId} の JSON パースに失敗しました: ${e}`);
                return;
            }

            console.log("模擬試験を再生します (シーケンスID: " + sequenceId + ")");

            const { bpm, beatsPerBar, intervals, sequence } = sequenceConfig;

            if (!bpm || !beatsPerBar || !intervals || !Array.isArray(sequence)) {
                displayError(`試験シーケンス定義 #${sequenceId} の形式が正しくありません。`);
                return;
            }

            // --- 定数化 ---
            const SECONDS_PER_MINUTE = 60;
            const MILLISECONDS_PER_SECOND = 1000;
            // ---

            const secondsPerBeat = SECONDS_PER_MINUTE / bpm;
            const secondsPerBar = secondsPerBeat * beatsPerBar;
            const timeFactors = {
                '8bars': secondsPerBar * 8 * MILLISECONDS_PER_SECOND,
                '4bars': secondsPerBar * 4 * MILLISECONDS_PER_SECOND,
                // 必要に応じて他の 'Xbars' も追加
            };

            // 再生関数のマップを作成（毎回 createPlayFunction を呼ばないように）
            const playFunctions = {};
            sequence.forEach(item => {
                if (!playFunctions[item.taskId]) {
                    playFunctions[item.taskId] = createPlayFunction(item.taskId);
                }
            });

            let currentTime = 0; // 現在の遅延時間 (ms)

            // delayAfter 文字列をミリ秒に変換する関数
            function parseDelay(delayString) {
                if (typeof delayString === 'number') {
                    return delayString;
                }
                if (typeof delayString !== 'string') {
                    console.warn(`Invalid delay format: ${delayString}. Using 0.`);
                    return 0;
                }

                let totalDelay = 0;
                const parts = delayString.split('+').map(part => part.trim());

                parts.forEach(part => {
                    if (timeFactors[part]) {
                        totalDelay += timeFactors[part];
                    } else if (part.startsWith('intervals.')) {
                        const intervalKey = part.substring('intervals.'.length);
                        totalDelay += intervals[intervalKey] || 0;
                    } else {
                        const num = parseInt(part, 10);
                        if (!isNaN(num)) {
                            totalDelay += num;
                        } else {
                            console.warn(`Cannot parse delay part: ${part}`);
                        }
                    }
                });
                return totalDelay;
            }

            // シーケンスに従って setTimeout を設定
            sequence.forEach((item, index) => {
                const playFunc = playFunctions[item.taskId];
                if (playFunc) {
                    setTimeout(() => {
                        console.log(`再生 (${index + 1}/${sequence.length}): ${item.taskId}`);
                        playFunc();
                    }, currentTime);

                    // 次の再生までの遅延時間を加算
                    currentTime += parseDelay(item.delayAfter);

                } else {
                    console.warn(`Play function for taskId "${item.taskId}" not found.`);
                    // delayAfter 分だけ待機時間は加算しておく
                    currentTime += parseDelay(item.delayAfter);
                }
            });
        });
        // --- ▲▲▲ 修正 ▲▲▲ ---

        // SVG サイズ調整スライダー (変更なし)
        const svgContainer = document.getElementById('svg-container');
        const svgSizeSlider = document.getElementById('svg-size-slider');
        const svgSizeValueDisplay = document.getElementById('svg-size-value');

        function adjustSvgSize(scaleFactor) {
            const svgElement = svgContainer.querySelector('svg');
            if (svgElement) {
                svgElement.style.transformOrigin = 'top left';
                svgElement.style.transform = `scale(${scaleFactor})`;
            }
        }

        svgSizeSlider.addEventListener('input', function () {
            const scaleFactor = parseFloat(this.value);
            svgSizeValueDisplay.textContent = scaleFactor.toFixed(1);
            adjustSvgSize(scaleFactor);
        });
        adjustSvgSize(parseFloat(svgSizeSlider.value));

        // 表示／非表示ボタン (変更なし)
        const toggleButtons = document.querySelectorAll('[data-target]');
        toggleButtons.forEach(button => {
            button.addEventListener('click', function () {
                const targetSelector = this.dataset.target;
                const targetElement = document.querySelector(targetSelector);
                if (targetElement) {
                    targetElement.classList.toggle('hidden');
                } else {
                    console.error(`ターゲット要素 "${targetSelector}" が見つかりません。`);
                }
            });
        });


    } catch (err) {
        // VrvConverter の初期化や SVG/MIDI 変換中のエラーなど、主要な処理中のエラー
        displayError(`処理中にエラーが発生しました: ${err.message || err}`);
        // エラー発生時も finally ブロックは実行されるので、ローディング表示はそこで隠される
    } finally {
        // ▼▼▼ 正常終了時、またはエラー発生時に関わらず、最後にローディング表示を隠す ▼▼▼
        if (loadingIndicator) {
            loadingIndicator.style.display = 'none';
        }
        console.log("Initialization and setup complete."); // 完了ログ
        // ▲▲▲ 正常終了時、またはエラー発生時に関わらず、最後にローディング表示を隠す ▲▲▲
    }

}); // DOMContentLoaded の終わり




// 必要に応じて、特定のタスクの MEI データにアクセスすることもできます。
//console.log("MEI for task1:", allGeneratedData['task1']);
