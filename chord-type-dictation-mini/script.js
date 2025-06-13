// script.js

// import { loadToneJs } from './modules/tonejs-loader.mjs'; // 開発用
import { loadToneJs } from 'https://cdn.jsdelivr.net/gh/kogu0507/mini-apps@main/chord-type-dictation-mini/module/tonejs-loader.min.mjs'; // 本番用


// アプリケーションの初期化処理
document.addEventListener('DOMContentLoaded', () => {
    const statusMessage = document.getElementById('statusMessage');
    statusMessage.textContent = 'Tone.jsをロード中...';

    loadToneJs().then(() => {
        statusMessage.textContent = '準備完了！';
        console.log('Tone.js has been loaded and is ready to use!');
        // ここでTone.jsを使った初期化処理やイベントリスナーの登録など、
        // アプリケーションのメインロジックを開始します。

        // --- 変更点: アプリのメイン初期化関数をここで呼び出す ---
        initializeApplication();
        // --------------------------------------------------------

    }).catch(error => {
        statusMessage.textContent = 'エラー: Tone.jsのロードに失敗しました。';
        console.error('Failed to load Tone.js:', error);
    });
});

/* 以下、アプリのコード */

let synth;
let sampler;
// --- 追加: Volumeノードを追加 ---
let synthVolume;
let samplerVolume;
// --- /追加 ---
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

    // --- 変更: setupSynthとsetupSamplerの呼び出し順序と、Volumeノードの初期化 ---
    // まずVolumeノードを初期化
    synthVolume = new Tone.Volume(-12).toDestination(); // 例: シンセの音量を-12dB下げる
    samplerVolume = new Tone.Volume(0).toDestination(); // 例: サンプラーの音量を0dB（デフォルト）

    await setupSynth();
    await setupSampler();
    // --- /変更 ---
    setupEventListeners();
    updateUIStatus("準備完了！「問題を生成」ボタンを押してください。");

    // --- 変更: ページロード時に解答表示と設定表示を確実に隠す ---
    document.getElementById('answerDisplay').classList.add('hidden');
    // 初期状態で設定を隠したい場合は、settingsContentにもhiddenクラスを追加
    // document.getElementById('settingsContent').classList.add('hidden');
    // --- /変更 ---
}

async function setupSynth() {
    // --- 変更: synthをsynthVolumeに接続 ---
    synth = new Tone.PolySynth(Tone.Synth).connect(synthVolume);
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
        // --- 変更: samplerをsamplerVolumeに接続 ---
        }).connect(samplerVolume);
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
    // --- 変更: visibility-toggle-button クラスを持つボタンを特定 ---
    // 解答セクションのボタンを探す
    const showAnswerButton = document.querySelector('#answer-section .visibility-toggle-button');
    const startButton = document.getElementById('startButton');

    if (answerDisplay && !answerDisplay.classList.contains('hidden')) { // もし表示されていたら隠す
        hideAnswer();
        if (showAnswerButton) { // ボタンが存在することを確認
            showAnswerButton.textContent = '解答を表示／隠す'; // ボタンテキストをデフォルトに戻す
        }
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

    // --- 変更: activeInstrumentをVolumeノードに接続されたものに変更 ---
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
            // data-visibility-toggle-target の値に基づいて適切なテキストを生成
            const baseText = targetId === 'answerDisplay' ? '解答' : '設定';
            toggleButton.textContent = `${baseText}を隠す`;
        } else {
            // 表示から非表示へ
            targetElement.classList.add('hidden');
            // ボタンのテキストを更新
            const baseText = targetId === 'answerDisplay' ? '解答' : '設定';
            toggleButton.textContent = `${baseText}を表示`;
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
    // const showAnswerButton = document.getElementById('showAnswerButton'); // 削除済み
    // const toggleSettingsButton = document.getElementById('toggleSettingsButton'); // 削除済み

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

    // --- 変更: 汎用的な表示/非表示トグルボタンのイベントリスナー ---
    document.querySelectorAll('.visibility-toggle-button').forEach(button => {
        button.addEventListener('click', (event) => {
            const targetId = event.target.dataset.visibilityToggleTarget;
            if (targetId) {
                // 解答表示ボタンの場合は onShowCallback (setAnswerDisplay) を渡す
                const onShowCallback = (targetId === 'answerDisplay') ? setAnswerDisplay : null;
                toggleVisibility(targetId, event.target, onShowCallback);
            }
        });
    });
    // --- /変更 ---

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