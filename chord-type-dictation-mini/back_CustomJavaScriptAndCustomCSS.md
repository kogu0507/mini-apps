https://cdn.jsdelivr.net/gh/kogu0507/mini-apps@main/chord-type-dictation-mini/style.min.css
https://cdn.jsdelivr.net/gh/kogu0507/mini-apps@main/chord-type-dictation-mini/script.min.js


https://kogu0507.github.io/dev/chord-type-dictation-mini/script.min.js

https://cdn.jsdelivr.net/gh/kogu0507/mini-apps@main/chord-type-dictation-mini/script.min.js


let synth;
let sampler;
let currentInstrument = 'synth';
let currentProblemNotes = [];
let currentProblemRoot = '';
let currentProblemChordType = '';

// コードタイプ定義 (音程情報含む)
const chordTypeDefinitions = [
    {
        symbol: 'majorTriad',
        codeSymbol: '',
        englishName: 'Major Triad',
        japaneseName: '長三和音',
        intervals: [0, 4, 7]
    },
    {
        symbol: 'minorTriad',
        codeSymbol: 'm',
        englishName: 'Minor Triad',
        japaneseName: '短三和音',
        intervals: [0, 3, 7]
    },
    {
        symbol: 'augmentedTriad',
        codeSymbol: 'aug',
        englishName: 'Augmented Triad',
        japaneseName: '増三和音',
        intervals: [0, 4, 8]
    },
    {
        symbol: 'diminishedTriad',
        codeSymbol: 'dim',
        englishName: 'Diminished Triad',
        japaneseName: '減三和音',
        intervals: [0, 3, 6]
    },
    {
        symbol: 'major7',
        codeSymbol: 'M7',
        englishName: 'Major 7th',
        japaneseName: '長七の和音',
        intervals: [0, 4, 7, 11]
    },
    {
        symbol: 'minor7',
        codeSymbol: 'm7',
        englishName: 'Minor 7th',
        japaneseName: '短七の和音',
        intervals: [0, 3, 7, 10] // 一般的な短七度 (マイナーセブンス)
    },
    {
        symbol: 'dominant7',
        codeSymbol: '7',
        englishName: 'Dominant 7th',
        japaneseName: '属七の和音',
        intervals: [0, 4, 7, 10]
    },
    {
        symbol: 'augmentedMajor7',
        codeSymbol: 'augM7',
        englishName: 'Augmented Major 7th',
        japaneseName: '増七の和音',
        intervals: [0, 4, 8, 11] // 一般的な増七度 (オーギュメントメジャーセブンス)
    },
    {
        symbol: 'halfDiminished7',
        codeSymbol: 'm7b5',
        englishName: 'Half Diminished 7th',
        japaneseName: '半減七の和音／減五短七の和音／導七の和音',
        intervals: [0, 3, 6, 10]
    },
    {
        symbol: 'diminished7',
        codeSymbol: 'dim7',
        englishName: 'Diminished 7th',
        japaneseName: '減七の和音',
        intervals: [0, 3, 6, 9]
    },
];

async function initializeApplication() {
    // ユーザーインタラクションでAudioContextを再開
    document.documentElement.addEventListener('mousedown', () => {
        if (Tone.context.state !== 'running') {
            Tone.context.resume();
            console.log("AudioContext resumed");
        }
    }, { once: true });

    await setupSynth();
    await setupSampler();
    setupEventListeners();
    updateUIStatus("準備完了！「問題を生成」ボタンを押してください。");
    // ページロード時に解答表示を確実に隠す
    document.getElementById('answerDisplay').classList.add('hidden');
}

async function setupSynth() {
    synth = new Tone.PolySynth(Tone.Synth).toDestination();
    console.log("PolySynth initialized.");
}

async function setupSampler() {
    return new Promise(resolve => {
        sampler = new Tone.Sampler({
            urls: {
                'C3': 'https://tonejs.github.io/audio/salamander/C3.mp3',
                'C4': 'https://tonejs.github.io/audio/salamander/C4.mp3',
                'C5': 'https://tonejs.github.io/audio/salamander/C5.mp3',
            },
            onload: () => {
                console.log("Sampler loaded.");
                resolve();
            }
        }).toDestination();
    });
}

/**
    * 現在の設定（選択されている楽器、ルート音、コードタイプ）を取得します。
    *
    * @returns {object} 設定オブジェクト
    * - instrument: 選択された楽器 ('synth' or 'sampler')
    * - rootNotes: 選択されたルート音の配列
    * - chordTypes: 選択されたコードタイプの配列
    * - isRootNotesExplicitlyEmpty: ルート音が何も選択されていないか (「全て選択」も含む)
    * - isChordTypesExplicitlyEmpty: コードタイプが何も選択されていないか (「全て選択」も含む)
    */
function getSettings() {
    const selectedInstrument = document.querySelector('input[name="instrument"]:checked').value;

    // 全てのルート音チェックボックス (「全て選択」を除く)
    const rootNoteCheckboxes = Array.from(document.querySelectorAll('input[name="rootNote"]:not([value="allRootNotes"])'));
    // 「全て選択」ルート音チェックボックス
    const allRootNotesCheckbox = document.querySelector('input[name="rootNote"][value="allRootNotes"]');

    // 全てのコードタイプチェックボックス (「全て選択」を除く)
    const chordTypeCheckboxes = Array.from(document.querySelectorAll('input[name="chordType"]:not([value="allChordTypes"])'));
    // 「全て選択」コードタイプチェックボックス
    const allChordTypesCheckbox = document.querySelector('input[name="chordType"][value="allChordTypes"]');

    let finalRootNotes = [];
    if (allRootNotesCheckbox.checked) {
        // 「全て選択」がチェックされている場合は、すべてのルート音を使用
        finalRootNotes = rootNoteCheckboxes.map(cb => cb.value);
    } else {
        // 「全て選択」がチェックされていない場合は、個別にチェックされたルート音のみを使用
        finalRootNotes = rootNoteCheckboxes.filter(checkbox => checkbox.checked).map(checkbox => checkbox.value);
    }

    let finalChordTypes = [];
    if (allChordTypesCheckbox.checked) {
        // 「全て選択」がチェックされている場合は、すべてのコードタイプを使用
        finalChordTypes = chordTypeCheckboxes.map(cb => cb.value);
    } else {
        // 「全て選択」がチェックされていない場合は、個別にチェックされたコードタイプのみを使用
        finalChordTypes = chordTypeCheckboxes.filter(checkbox => checkbox.checked).map(checkbox => checkbox.value);
    }

    // ユーザーが「何も選択していない」状態を判定
    const isRootNotesExplicitlyEmpty = finalRootNotes.length === 0;
    const isChordTypesExplicitlyEmpty = finalChordTypes.length === 0;

    return {
        instrument: selectedInstrument,
        rootNotes: finalRootNotes,
        chordTypes: finalChordTypes,
        isRootNotesExplicitlyEmpty: isRootNotesExplicitlyEmpty,
        isChordTypesExplicitlyEmpty: isChordTypesExplicitlyEmpty
    };
}


function determineChordType(availableChordTypes) {
    if (availableChordTypes.length === 0) return null;
    const randomIndex = Math.floor(Math.random() * availableChordTypes.length);
    return availableChordTypes[randomIndex];
}

function generateChordNotes(rootNoteName, chordType) {
    const rootMidi = Tone.Midi(rootNoteName).toMidi();
    let notes = [];

    // chordTypeDefinitions から該当する定義を探す
    const chordDef = chordTypeDefinitions.find(def => def.symbol === chordType);

    if (chordDef && chordDef.intervals) {
        // 定義が見つかり、intervalsプロパティがあればそれを使う
        notes = chordDef.intervals.map(interval => rootMidi + interval);
    } else {
        // 見つからない場合は、エラーログを出すか、デフォルトのルート音のみにするなど対応
        console.warn(`Chord type definition not found or missing intervals: ${chordType}. Playing root only.`);
        notes = [rootMidi]; // フォールバックとしてルート音のみを再生
    }

    return notes.map(midi => Tone.Midi(midi).toNote());
}

/**
    * 新しい問題を生成し、通常の和音で再生します。
    */
async function generateAndPlayNewProblem() {
    // 問題生成時に解答を隠し、ボタンのテキストを「解答を表示」に戻す
    const answerDisplay = document.getElementById('answerDisplay');
    const showAnswerButton = document.getElementById('showAnswerButton');
    const startButton = document.getElementById('startButton');

    if (!answerDisplay.classList.contains('hidden')) { // もし表示されていたら隠す
        hideAnswer();
        showAnswerButton.textContent = '解答を表示';
    }

    // ボタンのテキストを「問題を生成」に戻す
    startButton.textContent = '問題を生成中...';
    startButton.disabled = true; // 問題生成中はボタンを無効化

    updateUIStatus("新しい問題を生成中...");
    const settings = getSettings();

    // ルート音またはコードタイプが**明示的に**選択されていない場合、警告メッセージを表示し音を出さない
    if (settings.isRootNotesExplicitlyEmpty || settings.isChordTypesExplicitlyEmpty) {
        let errorMessage = "問題を生成できません。";
        if (settings.isRootNotesExplicitlyEmpty && settings.isChordTypesExplicitlyEmpty) {
            errorMessage += "ルート音とコードタイプが一つも選択されていません。";
        } else if (settings.isRootNotesExplicitlyEmpty) {
            errorMessage += "出題するルート音が一つも選択されていません。";
        } else { // settings.isChordTypesExplicitlyEmpty
            errorMessage += "出題するコードタイプが一つも選択されていません。";
        }
        updateUIStatus(errorMessage + "設定を確認してください。");
        startButton.textContent = '問題を生成';
        startButton.disabled = false;
        return; // ここで処理を終了し、音を鳴らさない
    }

    // ここから下は、設定が有効な場合のみ実行される
    const randomRootNote = settings.rootNotes[Math.floor(Math.random() * settings.rootNotes.length)];
    const rootNoteWithOctave = `${randomRootNote.split('_')[0]}4`; // オクターブを固定（例: C4）

    const chosenChordType = determineChordType(settings.chordTypes);
    if (!chosenChordType) {
        // この分岐は、上記 ExplicitlyEmpty のチェックでカバーされるはずですが、念のため残します。
        updateUIStatus("出題するコードタイプが選択されていません。設定を確認してください。");
        startButton.textContent = '問題を生成';
        startButton.disabled = false;
        return;
    }

    const chordNotes = generateChordNotes(rootNoteWithOctave, chosenChordType);

    currentProblemNotes = chordNotes; // 生成されたノートをグローバル変数に保存
    currentProblemRoot = randomRootNote;
    currentProblemChordType = chosenChordType;

    updateUIStatus(`問題再生中... (選択楽器: ${settings.instrument === 'synth' ? 'シンセ' : 'サンプラー'})`);
    await playDictation(chordNotes, settings.instrument, false); // 通常の和音再生

    updateUIStatus("再生が完了しました。解答表示ボタンで解答が表示されます。");
    startButton.textContent = '次の問題へ'; // 再生完了後、ボタンを「次の問題へ」に変更
    startButton.disabled = false; // ボタンを有効化
}

/**
    * 生成された和音の音源を再生します。
    * @param {string[]} notes - 再生するノート名の配列
    * @param {string} instrumentType - 使用する楽器 ('synth' または 'sampler')
    * @param {boolean} [isArpeggio=false] - 分散和音として再生するかどうか (オプション、デフォルトはfalse)
    */
async function playDictation(notes, instrumentType, isArpeggio = false) {
    if (notes.length === 0) {
        console.warn("再生するノートがありません。");
        updateUIStatus("再生するノートがありません。まず問題を生成してください。");
        return;
    }

    const now = Tone.now();
    const duration = '1n'; // 全音符の長さ
    const arpeggioInterval = 0.15; // 分散和音の各音間の間隔

    const activeInstrument = instrumentType === 'synth' ? synth : sampler;

    if (isArpeggio) {
        notes.forEach((note, index) => {
            activeInstrument.triggerAttackRelease(note, duration, now + index * arpeggioInterval);
        });
    } else {
        activeInstrument.triggerAttackRelease(notes, duration, now);
    }

    // 全ての音が鳴り終わるまでの時間を計算し、待機
    const longestDuration = isArpeggio ? Tone.Time(duration).toSeconds() + (notes.length - 1) * arpeggioInterval : Tone.Time(duration).toSeconds();
    return new Promise(resolve => setTimeout(resolve, (longestDuration + 0.5) * 1000)); // 少し余裕を持たせる
}

/**
    * ルート音名とコードシンボルから、異名同音を含めたコードネームを生成します。
    * @param {string} root - ルート音名 (例: "C", "C#_Db")
    * @param {string} codeSymbol - コードタイプシンボル (例: "m", "M7")
    * @returns {string} 異名同音を含むコードネーム (例: "C#m / Dbm")
    */
function formatChordNameWithEnharmonic(root, codeSymbol) {
    if (root.includes('_')) {
        const [firstNote, secondNote] = root.split('_');
        return `${firstNote}${codeSymbol} / ${secondNote}${codeSymbol}`;
    }
    return `${root}${codeSymbol}`;
}

/**
    * 解答表示エリアに解答をセットし、必要に応じて表示します。
    * toggleVisibilityの対象になるため、直接表示/非表示のロジックは持ちません。
    */
function setAnswerDisplay() {
    if (currentProblemNotes.length === 0) {
        updateUIStatus("まず問題を生成してください。");
        return false; // 解答を表示できないことを示す
    }

    const correctAnswerDiv = document.getElementById('correctAnswer');

    // chordTypeDefinitions から現在のコードタイプを探す
    const currentChordDef = chordTypeDefinitions.find(
        def => def.symbol === currentProblemChordType
    );

    let fullChordName = '';
    let displayedRoot = '';
    let displayedChordType = '';

    if (currentChordDef) {
        // ルート名とコードシンボルを組み合わせてコードネームを生成 (異名同音対応)
        fullChordName = formatChordNameWithEnharmonic(currentProblemRoot, currentChordDef.codeSymbol);

        // ルート音も異名同音を考慮して表示
        displayedRoot = currentProblemRoot.replace('_', ' / ');

        displayedChordType = `${currentChordDef.englishName}<br>${currentChordDef.japaneseName}`;
    } else {
        // 定義が見つからない場合のフォールバック
        fullChordName = currentProblemRoot.replace('_', ' / ') + ' (Unknown Type)';
        displayedRoot = currentProblemRoot.replace('_', ' / ');
        displayedChordType = `Unknown Type（${currentProblemChordType}）`; // 内部のコードタイプをそのまま表示
        console.warn(`Unknown chord type: ${currentProblemChordType}`);
    }

    let answerHtmlContent = `
        <p><strong>【解答】</strong></p>
        <dl class="answer-details">
            <dt>コードネーム</dt>
            <dd>${fullChordName}</dd>

            <dt>ルート</dt>
            <dd>${displayedRoot}</dd>

            <dt>コードタイプ</dt>
            <dd>${displayedChordType}</dd>
        </dl>
    `;

    correctAnswerDiv.innerHTML = answerHtmlContent; // innerHTMLをdivに設定

    updateUIStatus("解答が表示されました。");
    return true; // 解答がセットされたことを示す
}


/**
    * 解答表示を強制的に隠します。
    * 「問題を生成」ボタンを押した際に、確実に隠すために使用。
    */
function hideAnswer() {
    const answerDisplay = document.getElementById('answerDisplay');
    answerDisplay.classList.add('hidden');
}

/**
    * ユーザーインターフェースの状態メッセージを更新します。
    * @param {string} message - 表示するメッセージ
    */
function updateUIStatus(message) {
    document.getElementById('statusMessage').textContent = message;
}

/**
    * 指定された要素の表示/非表示を切り替えます。
    * @param {string} targetId - 切り替える要素のID
    * @param {HTMLElement} toggleButton - トグルをトリガーしたボタン要素
    * @param {Function} [onShowCallback] - 表示する前に実行するコールバック関数
    */
function toggleVisibility(targetId, toggleButton, onShowCallback = null) {
    const targetElement = document.getElementById(targetId);
    if (targetElement) {
        if (targetElement.classList.contains('hidden')) {
            // 非表示から表示へ
            if (onShowCallback && !onShowCallback()) {
                // コールバックがfalseを返したら表示しない
                return;
            }
            targetElement.classList.remove('hidden');
            // ボタンのテキストを更新
            toggleButton.textContent = `${toggleButton.id === 'showAnswerButton' ? '解答を隠す' : '設定を隠す'}`;
        } else {
            // 表示から非表示へ
            targetElement.classList.add('hidden');
            // ボタンのテキストを更新
            toggleButton.textContent = `${toggleButton.id === 'showAnswerButton' ? '解答を表示' : '設定を表示'}`;
        }
    } else {
        console.warn(`Target element with ID "${targetId}" not found.`);
    }
}

/**
    * イベントリスナーを設定します。
    */
function setupEventListeners() {
    const startButton = document.getElementById('startButton');
    const playNormalChordButton = document.getElementById('playNormalChordButton');
    const playArpeggioButton = document.getElementById('playArpeggioButton');
    const showAnswerButton = document.getElementById('showAnswerButton');
    //const toggleSettingsButton = document.getElementById('toggleSettingsButton');

    const instrumentRadios = document.querySelectorAll('input[name="instrument"]');
    const allRootNotesCheckbox = document.querySelector('input[name="rootNote"][value="allRootNotes"]');
    const rootNoteCheckboxes = document.querySelectorAll('input[name="rootNote"]:not([value="allRootNotes"])');
    const allChordTypesCheckbox = document.querySelector('input[name="chordType"][value="allChordTypes"]');
    const chordTypeCheckboxes = document.querySelectorAll('input[name="chordType"]:not([value="allChordTypes"])');

    // --- ボタンのイベントリスナー ---
    // 「問題を生成」ボタン: 新しい問題を生成し、通常再生
    startButton.addEventListener('click', generateAndPlayNewProblem);

    // 「通常の和音で再生」ボタン: 現在の問題を通常再生
    playNormalChordButton.addEventListener('click', async () => {
        if (currentProblemNotes.length === 0) {
            updateUIStatus("まず「問題を生成」ボタンを押して問題を生成してください。");
            return;
        }
        updateUIStatus("通常の和音で再生中...");
        const settings = getSettings();
        await playDictation(currentProblemNotes, settings.instrument, false);
        updateUIStatus("再生が完了しました。");
    });

    // 「分散和音で再生」ボタン: 現在の問題を分散再生
    playArpeggioButton.addEventListener('click', async () => {
        if (currentProblemNotes.length === 0) {
            updateUIStatus("まず「問題を生成」ボタンを押して問題を生成してください。");
            return;
        }
        updateUIStatus("分散和音で再生中...");
        const settings = getSettings();
        await playDictation(currentProblemNotes, settings.instrument, true);
        updateUIStatus("分散再生が完了しました。");
    });

    // 「解答を表示／隠す」ボタン
    showAnswerButton.addEventListener('click', (event) => {
        const targetId = event.target.dataset.visibilityToggleTarget;
        if (targetId) {
            toggleVisibility(targetId, event.target, setAnswerDisplay);
        }
    });

    // 「設定表示／隠す」ボタン
    /* 
    toggleSettingsButton.addEventListener('click', (event) => {
        const targetId = event.target.dataset.visibilityToggleTarget;
        if (targetId) {
            toggleVisibility(targetId, event.target);
        }
    });
        */



    // --- /ボタンのイベントリスナー ---

    // --- 設定関連のイベントリスナー ---
    instrumentRadios.forEach(radio => {
        radio.addEventListener('change', (event) => {
            currentInstrument = event.target.value;
            updateUIStatus(`${currentInstrument === 'synth' ? 'シンセ' : 'サンプラー'}が選択されました。`);
        });
    });

    // 「全て選択」チェックボックスの挙動 (ルート音)
    allRootNotesCheckbox.addEventListener('change', (event) => {
        rootNoteCheckboxes.forEach(checkbox => {
            checkbox.checked = event.target.checked;
        });
    });

    // 個別のチェックボックスが変更されたときに「全て選択」のチェックを調整 (ルート音)
    rootNoteCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', () => {
            allRootNotesCheckbox.checked = Array.from(rootNoteCheckboxes).every(cb => cb.checked);
        });
    });

    // 「全て選択」チェックボックスの挙動 (コードタイプ)
    allChordTypesCheckbox.addEventListener('change', (event) => {
        chordTypeCheckboxes.forEach(checkbox => {
            checkbox.checked = event.target.checked;
        });
    });

    // 個別のチェックボックスが変更されたときに「全て選択」のチェックを調整 (コードタイプ)
    chordTypeCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', () => {
            allChordTypesCheckbox.checked = Array.from(chordTypeCheckboxes).every(cb => cb.checked);
        });
    });
    // --- /設定関連のイベントリスナー ---
}

initializeApplication();






























































https://cdn.jsdelivr.net/gh/kogu0507/mini-apps@main/chord-type-dictation-mini/style.min.css

/* ——— 汎用 ——— */
button {
    padding: 15px 35px;
    font-size: 1.3em;
    cursor: pointer;
    border: none;
    border-radius: 5px;
    color: white;
    background-color: #007bff;
    transition: background-color 0.3s ease;
    min-width: 180px;
}

button:hover {
    background-color: #0056b3;
}



/* 非表示にするクラス */
.hidden {
    display: none !important;
}

/* ——— 汎用ここまで ——— */






/* ——— 共通コンテナレイアウト ——— */
.container {
    /* 中央寄せ＆最大幅 */
    width: 100%;
    max-width: 700px;
    margin: 0 auto;
    padding: 20px;
    box-sizing: border-box;
}

/* ——— コントロールセクション固有スタイル ——— */
#control-section {
    display: flex;
    flex-direction: column;
    align-items: center;
    /* 以下、#control-section.container の中身をここへ */
}

/* ——— 設定エリア固有スタイル ——— */
#settingsArea {
    /* もともとの設定表示用スタイル */
    background-color: #e9ecef;
    border: 1px solid #dee2e6;
    border-radius: 5px;
    /* …などなど… */
}

/* ——— 共通コンテナレイアウト ここまで ——— */







/* ——— コントロールセクション系 ——— */
.control-group {
    background-color: #fff;
    border-radius: 8px;
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
    padding: 25px;
    margin-bottom: 25px;
    width: auto;
    /* width: 90%; */
    max-width: 700px;
}

.controls {
    display: flex;
    flex-wrap: wrap;
    gap: 15px;
    margin-bottom: 10px;
}

.controls label {
    font-size: 1.0em;
    cursor: pointer;
    display: flex;
    align-items: center;
}

.controls input[type="radio"],
.controls input[type="checkbox"] {
    margin-right: 8px;
    transform: scale(1.1);
}

/* 各button-group間のスペース */
.button-group {
    width: 100%;
    /* 親要素の幅いっぱいに広げる */
    margin-bottom: 20px;
    /* 各グループ間の下マージン */
    /* グループ全体を視覚的にまとめるためのスタイル */
    border: 1px solid #ccc;
    /* 枠線 */
    border-radius: 8px;
    /* 角丸を少し大きめに */
    background-color: #ffffff;
    /* 背景色を白に */
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
    /* 少し立体感のある影 */
    overflow: hidden;
    /* 角丸でボタンがはみ出さないように */
}

/* メッセージのスタイル */
.message {
    font-size: 1.1em;
    color: #333;
    text-align: center;
    margin-bottom: 20px;
    /* メッセージと次の要素の間のスペース */
    padding: 0 10px;
    /* 左右の余白 */
}

/* button-group 内の全てのボタンに適用される基本スタイル */
.button-group button {
    display: block;
    /* ボタンをブロック要素にして縦に並べる */
    width: 100%;
    /* グループの幅いっぱいに広げる */
    padding: 15px 20px;
    /* ボタンの内側の余白 */
    font-size: 1.1em;
    /* フォントサイズ */
    font-weight: bold;
    color: #ffffff;
    /* 文字色を白に */
    background-color: #007bff;
    /* 青色の背景 */
    border: none;
    /* ボーダーをなくす */
    cursor: pointer;
    transition: background-color 0.2s ease-in-out;
    /* ホバー時のアニメーション */
    box-sizing: border-box;
    /* paddingを含めて幅を計算 */
}

/* 各ボタンがグループ内でくっつくように、角丸とボーダーを調整 */
.button-group button:not(:last-child) {
    border-bottom: 1px solid #0056b3;
    /* 各ボタン間の区切り線 */
    border-radius: 0;
    /* 途中のボタンの角丸をなくす */
}

/* 最初のボタンのスタイル（トップの角丸） */
.button-group button:first-child {
    border-top-left-radius: 7px;
    /* グループの角丸より少し小さく */
    border-top-right-radius: 7px;
}

/* 最後のボタンのスタイル（ボトムの角丸） */
.button-group button:last-child {
    border-bottom-left-radius: 7px;
    /* グループの角丸より少し小さく */
    border-bottom-right-radius: 7px;
}

/* グループにボタンが1つしかない場合のスタイル */
.button-group button:only-child {
    border-radius: 7px;
    /* 単独のボタンに角丸を適用 */
}

/* 特定のボタンの背景色（例: 問題を生成ボタン） */
#startButton {
    background-color: #28a745;
    /* 緑色 */
}

#startButton:hover {
    background-color: #218838;
}

/* その他のボタンのホバーエフェクト */
.button-group button:hover {
    background-color: #0056b3;
    /* 濃い青色 */
}

/* 解答表示エリアのスタイル（hiddenクラスがない場合の表示） */
#answerDisplay {
    width: 100%;
    padding: 15px;
    background-color: #e9ecef;
    border-radius: 8px;
    text-align: center;
    color: #495057;
    font-weight: bold;
    margin-top: 10px;
    /* メッセージやボタンからの上マージン */
}

#answerDisplay.hidden {
    display: none;
}

/* 解答テキストのスタイル */
#correctAnswer {
    font-size: 1.2em;
    color: #007bff;
}


.message {
    margin-top: 25px;
    font-size: 1.2em;
    color: #007bff;
    font-weight: bold;
}

/* ——— コントロールセクション系 ここまで ——— */




/* -------- 解答表示エリアと設定エリアのスタイル -------- */
/* #answerDisplay,
#settingsArea {
    background-color: #e9ecef;
    border: 1px solid #dee2e6;
    border-radius: 5px;
    padding: 20px;
    margin-top: 20px;
    width: 100%;
    
    max-width: 700px;
    text-align: center;
    color: #343a40;
} */

/* 解答表示エリア内の「正解」見出しのスタイル */
#answerDisplay p strong {
    font-size: 1.5em;
    color: #007bff;
    margin-bottom: 15px;
    display: block;
}


/* dl, dt, dd のスタイル */
.answer-details {
    display: grid;
    /* デフォルトは2カラム */
    grid-template-columns: 1fr;
    gap: 0px 0;
    margin: 0 auto;
    max-width: 400px;
    text-align: center;
    font-size: 1.2em;
}

.answer-details dt {
    font-weight: bold;
    color: #555;
    margin-top: 10px;
    white-space: nowrap;
}

.answer-details dd {
    margin: 0;
    color: #333;
}







/* -------- ルート選択鍵盤 -------- */

.controls.root-notes {
    display: grid;
    grid-template-columns: repeat(24, 1fr);
    grid-template-rows: auto auto;
    gap: 5px;
    align-items: end;
    margin: 0 auto;
    max-width: 600px;

    overflow-x: auto;
    /* 横方向にはみ出た場合にスクロールバーを表示 */
    white-space: nowrap;
    /* 子要素が折り返さないようにする（Flexbox/Gridを使っている場合は不要なことも） */
    padding-bottom: 10px;
    /* スクロールバーがコンテンツに重ならないように下部に余白 */
    scrollbar-width: thin;
    /* Firefox用: スクロールバーを細くする */
    scrollbar-color: #888 #f1f1f1;
    /* Firefox用: スクロールバーの色 */

}

/* WebKit系ブラウザ（Chrome, Safariなど）用のスクロールバーのスタイル */
.controls.root-notes::-webkit-scrollbar {
    height: 10px;
    /* スクロールバーの高さ */
}

.controls.root-notes::-webkit-scrollbar-track {
    background: #f1f1f1;
    /* トラックの色 */
    border-radius: 5px;
}

.controls.root-notes::-webkit-scrollbar-thumb {
    background: #888;
    /* サム（動かす部分）の色 */
    border-radius: 5px;
}

.controls.root-notes::-webkit-scrollbar-thumb:hover {
    background: #555;
    /* ホバー時の色 */
}

/* 各鍵盤の基本スタイル */
.controls.root-notes .grid-key {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 8px 5px;
    border-radius: 4px;
    box-shadow: 0 2px 2px rgba(0, 0, 0, 0.1);
    font-weight: bold;
    cursor: pointer;
    transition: background-color 0.2s ease;
    min-width: 30px;
}

/* 白鍵のスタイル */
.controls.root-notes .grid-key.C-key,
.controls.root-notes .grid-key.D-key,
.controls.root-notes .grid-key.E-key,
.controls.root-notes .grid-key.F-key,
.controls.root-notes .grid-key.G-key,
.controls.root-notes .grid-key.A-key,
.controls.root-notes .grid-key.B-key {
    background-color: #fff;
    border: 1px solid #ccc;
    color: #333;
    grid-row: 2;
    height: 80px;
}

/* 黒鍵のスタイル */
.controls.root-notes .grid-key.Csharp-Db-key,
.controls.root-notes .grid-key.Dsharp-Eb-key,
.controls.root-notes .grid-key.Fsharp-Gb-key,
.controls.root-notes .grid-key.Gsharp-Ab-key,
.controls.root-notes .grid-key.Asharp-Bb-key {
    background-color: #333;
    border: 1px solid #666;
    color: #eee;
    font-size: 0.9em;
    grid-row: 1;
    height: 50px;
    position: relative;
    z-index: 1;


    width: 45px;
    /* 例: 30pxから45pxに増やしてみる */
    padding: 8px 3px;
    /* 左右のpaddingを少し減らしてスペースを確保 */
    font-size: 0.8em;
    /* もし45pxでも足りなければ、フォントサイズをさらに小さくする */
}

/* チェックボックスのスタイル調整 (全ての鍵盤に適用) */
.controls.root-notes .grid-key input[type="checkbox"] {
    margin-top: 5px;
    margin-right: 0;
    order: 2;
}

.controls.root-notes .grid-key span {
    order: 1;
}

/* 各鍵盤のグリッド列位置の指定 */
/* 白鍵 */
.C-key {
    grid-column: 1 / span 4;
}

.D-key {
    grid-column: 5 / span 4;
}

.E-key {
    grid-column: 9 / span 4;
}

.F-key {
    grid-column: 13 / span 4;
}

.G-key {
    grid-column: 17 / span 4;
}

.A-key {
    grid-column: 21 / span 4;
}

.B-key {
    grid-column: 25 / span 4;
}

/* 黒鍵 */
.Csharp-Db-key {
    grid-column: 3 / span 3;
}

.Dsharp-Eb-key {
    grid-column: 7 / span 3;
}

.Fsharp-Gb-key {
    grid-column: 15 / span 3;
}

.Gsharp-Ab-key {
    grid-column: 19 / span 3;
}

.Asharp-Bb-key {
    grid-column: 23 / span 3;
}

/* 「全て選択」チェックボックスを独立した行に */
.full-width-checkbox {
    grid-column: 1 / -1;
    text-align: center;
    margin-top: 20px;
}





/* -------- コードタイプ選択リスト -------- */

/* 親要素のスタイル */
.control-group {
    margin-bottom: 20px;
}

h3 {
    text-align: center;
    margin-bottom: 15px;
    color: #333;
    font-size: 1.5em;
    /* 見出しのフォントサイズ */
}

/* 縦グループボタンのコンテナ */
.chord-buttons {
    display: flex;
    /* Flexboxで子要素を制御 */
    flex-direction: column;
    /* 縦方向に並べる */
    gap: 8px;
    /* ボタン間の隙間 */
    padding: 0 10px;
    /* 左右に少し余白 */
    max-width: 500px;
    /* コンテナの最大幅を設定 (PC表示での見た目調整) */
    margin: 0 auto;
    /* 中央寄せ */
}

/* 各ボタン（label）のスタイル */
.chord-buttons label {
    display: block;
    /* ブロック要素として表示 */
    width: 100%;
    /* 親要素の幅いっぱいに広げる */
    padding: 12px 15px;
    /* 上下左右のパディング */
    border: 1px solid #ccc;
    /* 枠線 */
    border-radius: 8px;
    /* 角を丸くする */
    background-color: #f9f9f9;
    /* デフォルトの背景色 */
    color: #333;
    /* 文字色 */
    cursor: pointer;
    /* マウスカーソルをポインターにする */
    text-align: center;
    /* テキストを中央揃え */
    transition: background-color 0.2s, border-color 0.2s, color 0.2s;
    /* ホバーやクリック時のアニメーション */
    position: relative;
    /* チェックマークの位置調整の基準 */
    font-family: 'Segoe UI', 'Helvetica Neue', Arial, sans-serif;
    /* 読みやすいフォントを指定 */
}

/* チェックボックスを隠す */
.chord-buttons input[type="checkbox"] {
    position: absolute;
    opacity: 0;
    /* 見えないようにする */
    pointer-events: none;
    /* マウスイベントを受け付けないようにする */
}

/* チェックされたlabel要素自体のスタイルを変更 */
/* :has() は新しいセレクタのため、ブラウザサポートに注意 */
.chord-buttons label:has(input[type="checkbox"]:checked) {
    background-color: #e0f2ff;
    /* 明るい青系の背景色 */
    border-color: #007bff;
    /* 青い枠線 */
    color: #007bff;
    /* チェック時の文字色 */
    font-weight: bold;
    /* チェック時のフォントの太さ */
}

/* チェックされたボタン内のテキストにチェックマークのスペースを確保 */
.chord-buttons input[type="checkbox"]:checked+.chord-name {
    padding-left: 20px;
    /* チェックマークのスペースを確保 */
}

/* チェックマークを左に追加 */
.chord-buttons input[type="checkbox"]:checked+.chord-name::before {
    content: '✔';
    /* チェックマークの文字 */
    color: #007bff;
    /* チェックマークの色 */
    font-size: 0.9em;
    /* チェックマークのサイズ */
    position: absolute;
    /* 相対位置で配置 */
    left: 5px;
    /* 左端からの位置 */
    top: 50%;
    /* 垂直方向の中央 */
    transform: translateY(-50%);
    /* 中央揃えの最終調整 */
}

/* ラベルにマウスが乗った時のスタイル (PC向け) */
.chord-buttons label:hover {
    background-color: #e9e9e9;
    /* ホバー時の背景色 */
    border-color: #aaa;
    /* ホバー時の枠線色 */
}

/* チェックされている状態でマウスが乗った時のスタイル */
.chord-buttons label:has(input[type="checkbox"]:checked):hover {
    background-color: #cceeff;
    /* チェック済みかつホバー時の背景色 */
    border-color: #0056b3;
    /* チェック済みかつホバー時の枠線色 */
}

/* アクティブ（タップ/クリック中）時のスタイル */
.chord-buttons label:active {
    background-color: #ddd;
    /* アクティブ時の背景色 */
    border-color: #999;
    /* アクティブ時の枠線色 */
}

/* 英語と日本語のテキストコンテナ */
.chord-buttons .chord-name {
    display: block;
    /* 英語と日本語を縦に並べるためのブロック表示 */
    font-size: 1.1em;
    /* デフォルトのフォントサイズ */
}

/* 日本語テキストのスタイル（必要に応じて調整） */
/* 現状のHTMLでは<br>の後に直接テキストが続くため、特定のセレクタは不要 */
/* もし日本語部分を<span class="japanese-text">で囲む場合は、そのクラスに対してスタイルを適用してください */
/* 例: .chord-buttons .japanese-text { font-size: 0.9em; color: #666; } */


/* --- レスポンシブデザイン（モバイル対応） --- */
@media (max-width: 768px) {

    /* 画面幅が768px以下のデバイスに適用 (一般的なタブレット縦向きまで) */
    .chord-buttons {
        padding: 0 5px;
        /* モバイルでは左右のパディングを少し減らす */
    }

    .chord-buttons label {
        padding: 10px 12px;
        /* モバイルではパディングを少し小さく */
        font-size: 15px;
        /* モバイルでの文字サイズ */
        border-radius: 6px;
        /* モバイルでは角を少し小さく丸める */
    }

    .chord-buttons .chord-name {
        font-size: 1em;
        /* モバイルでの和音名のフォントサイズ */
    }

    .chord-buttons input[type="checkbox"]:checked+.chord-name {
        padding-left: 25px;
        /* チェックマークのスペースを少し広げる */
    }

    .chord-buttons input[type="checkbox"]:checked+.chord-name::before {
        left: 8px;
        /* チェックマークの左からの位置を調整 */
        font-size: 1em;
        /* チェックマークのサイズ調整 */
    }
}

/* さらに小さなスマートフォン向けの調整 (例: 480px以下) */
@media (max-width: 480px) {
    .chord-buttons label {
        padding: 8px 10px;
        /* さらにパディングを減らす */
        font-size: 14px;
        /* さらにフォントサイズを小さく */
    }

    .chord-buttons input[type="checkbox"]:checked+.chord-name {
        padding-left: 22px;
    }

    .chord-buttons input[type="checkbox"]:checked+.chord-name::before {
        left: 6px;
    }
}

/* -------- コードタイプ選択リスト↑ -------- */
