/********************************
 * MidiPlayer クラスの定義
 ********************************/
export class MidiPlayer extends EventTarget {
    // デフォルトの MIDI.js の URL
    static DEFAULT_MIDI_JS_URL = 'https://www.midijs.net/lib/midi.js';

    constructor(midiJsSrc = MidiPlayer.DEFAULT_MIDI_JS_URL) {
        super(); // EventTarget を継承するため super() を呼び出す
        // MIDIjs（ライブラリ）の参照を保持する変数
        this.midi = null;
        // MIDI.js が正常にロードされたかどうかのフラグ
        this.isReady = false;
        // ロードした MIDI データ（data URL 形式）を保持
        this.midiData = null;
        // 初期化処理を開始
        this._initMidiJS(midiJsSrc)
            .then(() => {
                console.log('MidiPlayer initialized successfully.');
                this.dispatchEvent(new CustomEvent('ready')); // 初期化完了イベントを発火
            })
            .catch((error) => {
                console.error('Failed to initialize MidiPlayer:', error);
                this.dispatchEvent(new CustomEvent('error', { detail: error })); // エラーイベントを発火
            });
    }

    /**
     * MIDI.js を動的にロードし、初期化を行う非同期処理
     * @param {string} midiJsSrc - MIDI.js ライブラリの URL（省略可能、デフォルト値を使用）
     * @returns {Promise<void>} ライブラリ読み込み完了の Promise
     */
    async _initMidiJS(midiJsSrc) {
        if (!midiJsSrc) {
            return Promise.reject('MIDI.js の URL が指定されていません。');
        }

        return new Promise((resolve, reject) => {
            if (typeof MIDIjs !== 'undefined') {
                this.midi = MIDIjs;
                this.isReady = true;
                console.log("MIDIjs already loaded.");
                resolve();
            } else {
                const script = document.createElement('script');
                script.src = midiJsSrc;
                script.onload = () => {
                    if (typeof MIDIjs !== 'undefined') {
                        this.midi = MIDIjs;
                        this.isReady = true;
                        console.log(`Script loaded: ${midiJsSrc}`);
                        resolve();
                    } else {
                        console.error('MIDIjs object not found after script load.');
                        reject('MIDIjs がスクリプト読み込み後に利用できませんでした。');
                    }
                };
                script.onerror = (error) => {
                    console.error(`MIDI.js の読み込みに失敗しました: ${midiJsSrc}`, error);
                    reject(new Error(`Failed to load script: ${midiJsSrc}`));
                };
                document.head.appendChild(script);
            }
        });
    }

    /**
     * MIDI データ（data URL 形式）をロードする
     * @param {string} midiData - data URL 形式の MIDI データ
     */
    async load(midiData) {
        if (!this.isReady) {
            console.error('MidiPlayer is not ready. Ensure the "ready" event has been dispatched.');
            return;
        }
        this.midiData = midiData;
        this.dispatchEvent(new CustomEvent('loaded')); // ロード完了イベントを発火
    }

    /**
     * ロードされた MIDI データを再生する
     */
    play() {
        if (this.isReady && this.midiData) {
            this.midi.play(this.midiData, () => {
                this.dispatchEvent(new CustomEvent('ended')); // 再生終了イベントを発火
            });
            this.dispatchEvent(new CustomEvent('play')); // 再生開始イベントを発火
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
            this.dispatchEvent(new CustomEvent('pause')); // 一時停止イベントを発火
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
            this.dispatchEvent(new CustomEvent('stop')); // 停止イベントを発火
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
            if (this.midi && typeof this.midi.soundfontUrl !== 'undefined') {
                this.midi.soundfontUrl = url;
                console.log(`SoundFont URL set to: ${url}`);
                this.dispatchEvent(new CustomEvent('soundfonturlset')); // SoundFont URL 設定完了イベントを発火
            } else {
                console.warn('Setting SoundFont URL is not supported by the loaded MIDI library or MIDIjs object is not available.');
            }
        } else {
            console.warn('Cannot set SoundFont URL: MIDI Player is not ready.');
        }
    }
}

export default MidiPlayer;

/*
<!DOCTYPE html>
<html>

<head>
    <title>MidiPlayer Example</title>
    <script type="module">
        import MidiPlayer from '../module/MidiPlayer.mjs';

        const midiPlayer = new MidiPlayer();

        midiPlayer.addEventListener('ready', () => {
            console.log('MidiPlayer is ready!');
            const base64 = "TVRoZAAAAAYAAQADAHhNVHJrAAAABAD/LwBNVHJrAAAAJACQQ1p4kEVaAJBDAHiQR1oAkEUAeJBIWgCQRwB4kEgAAP8vAE1UcmsAAAAkAJAwWniQMloAkDAAeJA0WgCQMgB4kDVaAJA0AHiQNQAA/y8A";
            const dataUrl = 'data:audio/midi;base64,' + base64;
            midiPlayer.load(dataUrl);


            // MIDI データのロードなど、初期化完了後の処理
//             fetch('your-midi-file.mid', {
//                 headers: {
//                     'Content-Type': 'application/x-midi'
//                 }
//             })
//                 .then(response => response.arrayBuffer())
//                 .then(buffer => {
//                     const base64 = btoa(String.fromCharCode.apply(null, new Uint8Array(buffer)));
//                     const dataUrl = 'data:audio/midi;base64,' + base64;
//                     midiPlayer.load(dataUrl);
//                 })
//                 .catch(error => console.error('Failed to load MIDI file:', error));
            
            });

            midiPlayer.addEventListener('error', (event) => {
                console.error('MidiPlayer initialization error:', event.detail);
            });
    
            midiPlayer.addEventListener('loaded', () => {
                console.log('MIDI data loaded.');
                document.getElementById('playBtn').disabled = false;
                document.getElementById('pauseBtn').disabled = false;
                document.getElementById('stopBtn').disabled = false;
            });
    
            midiPlayer.addEventListener('play', () => {
                console.log('Playback started.');
            });
    
            midiPlayer.addEventListener('pause', () => {
                console.log('Playback paused.');
            });
    
            midiPlayer.addEventListener('stop', () => {
                console.log('Playback stopped.');
            });
    
            midiPlayer.addEventListener('ended', () => {
                console.log('Playback ended.');
            });
    
            midiPlayer.addEventListener('soundfonturlset', () => {
                console.log('SoundFont URL has been set.');
            });
    
            document.addEventListener('DOMContentLoaded', () => {
                const playBtn = document.getElementById('playBtn');
                const pauseBtn = document.getElementById('pauseBtn');
                const stopBtn = document.getElementById('stopBtn');
                const soundfontUrlInput = document.getElementById('soundfontUrl');
                const setSoundfontBtn = document.getElementById('setSoundfontBtn');
    
                playBtn.disabled = true;
                pauseBtn.disabled = true;
                stopBtn.disabled = true;
    
                playBtn.addEventListener('click', () => midiPlayer.play());
                pauseBtn.addEventListener('click', () => midiPlayer.pause());
                stopBtn.addEventListener('click', () => midiPlayer.stop());
                setSoundfontBtn.addEventListener('click', () => {
                    const url = soundfontUrlInput.value;
                    if (url) {
                        midiPlayer.setSoundfontUrl(url);
                    } else {
                        console.warn('SoundFont URL is empty.');
                    }
                });
            });
        </script>
    </head>
    
    <body>
        <h1>MidiPlayer Example</h1>
        <button id="playBtn">Play</button>
        <button id="pauseBtn">Pause</button>
        <button id="stopBtn">Stop</button>
        <div>
            <label for="soundfontUrl">SoundFont URL:</label>
            <input type="text" id="soundfontUrl" size="80"
                value="https://cdn.jsdelivr.net/npm/@magenta/soundfont/soundfonts/sgm_plus">
            <button id="setSoundfontBtn">Set SoundFont</button>
        </div>
    </body>
    
    </html>
*/