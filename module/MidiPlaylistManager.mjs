// MidiPlaylistManager.mjs

import MidiPlayer from "./MidiPlayer.mjs";


/**
 * 再生リストを管理し、MIDIの再生シーケンスを実行するクラス。
 * 構造化されたプレイリストアイテム（再生、インターバルなど）を処理します。
 */

/*
    デフォルトの再生リストに合わせて再生
    再生リストにトラックを追加・削除
    新しい再生リストの追加・削除
    インターバルを空けて、次のトラックを再生
*/

class MidiPlaylistManager {

    static DEFAULT_PLAYLIST = {
        // 試験再生(mock playback)
        "play-through-4-times": [
            { type: "tonicChord", midiDataKey: "tonic-chord" }, { type: "interval", value: 4000 },
            { type: "play", midiDataKey: "play-1-to-8-measures" }, { type: "interval", value: 20000 },
            { type: "play", midiDataKey: "play-1-to-8-measures" }, { type: "interval", value: 20000 },
            { type: "play", midiDataKey: "play-1-to-8-measures" }, { type: "interval", value: 20000 },
            { type: "play", midiDataKey: "play-1-to-8-measures" }, { type: "interval", value: 120000 },
            { type: "bell", action: "end" },
        ],
        "play-through-5-times": [
            { type: "tonicChord", midiDataKey: "tonic-chord" }, { type: "interval", value: 4000 },
            { type: "play", midiDataKey: "play-1-to-8-measures" }, { type: "interval", value: 20000 },
            { type: "play", midiDataKey: "play-1-to-8-measures" }, { type: "interval", value: 20000 },
            { type: "play", midiDataKey: "play-1-to-8-measures" }, { type: "interval", value: 20000 },
            { type: "play", midiDataKey: "play-1-to-8-measures" }, { type: "interval", value: 20000 },
            { type: "play", midiDataKey: "play-1-to-8-measures" }, { type: "interval", value: 120000 },
            { type: "bell", action: "end" },
        ],
        "play-through-6-times": [
            { type: "tonicChord", midiDataKey: "tonic-chord" }, { type: "interval", value: 4000 },
            { type: "play", midiDataKey: "play-1-to-8-measures" }, { type: "interval", value: 20000 },
            { type: "play", midiDataKey: "play-1-to-8-measures" }, { type: "interval", value: 20000 },
            { type: "play", midiDataKey: "play-1-to-8-measures" }, { type: "interval", value: 20000 },
            { type: "play", midiDataKey: "play-1-to-8-measures" }, { type: "interval", value: 20000 },
            { type: "play", midiDataKey: "play-1-to-8-measures" }, { type: "interval", value: 20000 },
            { type: "play", midiDataKey: "play-1-to-8-measures" }, { type: "interval", value: 120000 },
            { type: "bell", action: "end" },
        ],
        "play-mock-exam": [
            { type: "tonicChord", midiDataKey: "tonic-chord" }, { type: "interval", value: 4000 },
            { type: "play", midiDataKey: "play-1-to-8-measures" }, { type: "interval", value: 20000 },
            { type: "play", midiDataKey: "play-1-to-4-measures" }, { type: "interval", value: 20000 },
            { type: "play", midiDataKey: "play-1-to-4-measures" }, { type: "interval", value: 20000 },
            { type: "play", midiDataKey: "play-1-to-8-measures" }, { type: "interval", value: 20000 },
            { type: "play", midiDataKey: "play-4-to-8-measures" }, { type: "interval", value: 20000 },
            { type: "play", midiDataKey: "play-4-to-8-measures" }, { type: "interval", value: 20000 },
            { type: "play", midiDataKey: "play-1-to-8-measures" }, { type: "interval", value: 120000 },
            { type: "bell", action: "end" },
        ],
        // 指定小節を再生 (Play Specific Measures)
        "play-1-measure-only": [{ type: "play", midiDataKey: "play-1-measure-only" }],
        "play-2-measure-only": [{ type: "play", midiDataKey: "play-2-measure-only" }],
        "play-3-measure-only": [{ type: "play", midiDataKey: "play-3-measure-only" }],
        "play-4-measure-only": [{ type: "play", midiDataKey: "play-4-measure-only" }],
        "play-5-measure-only": [{ type: "play", midiDataKey: "play-5-measure-only" }],
        "play-6-measure-only": [{ type: "play", midiDataKey: "play-6-measure-only" }],
        "play-7-measure-only": [{ type: "play", midiDataKey: "play-7-measure-only" }],
        "play-8-measure-only": [{ type: "play", midiDataKey: "play-8-measure-only" }],
        "play-1-to-2-measures": [{ type: "play", midiDataKey: "play-1-to-2-measures" }],
        "play-3-to-4-measures": [{ type: "play", midiDataKey: "play-3-to-4-measures" }],
        "play-5-to-6-measures": [{ type: "play", midiDataKey: "play-5-to-6-measures" }],
        "play-7-to-8-measures": [{ type: "play", midiDataKey: "play-7-to-8-measures" }],
        "play-1-to-4-measures": [{ type: "play", midiDataKey: "play-1-to-4-measures" }],
        "play-5-to-8-measures": [{ type: "play", midiDataKey: "play-5-to-8-measures" }],
        "play-1-to-8-measures": [{ type: "play", midiDataKey: "play-1-to-8-measures" }]
    }

    /**
     * @typedef {Object} PlaylistItem
     * @property {'play' | 'interval' | 'tonicChord' | 'bell'} type - アイテムの種類
     * @property {string} [midiDataKey] - typeが'play'または'tonicChord'の場合のMIDIデータキー
     * @property {number} [value] - typeが'interval'の場合の待機時間(ms)
     * @property {string} [action] - typeが'bell'の場合のアクション
     */

    /**
     * @typedef {Object} MidiDataMap
     * @property {string} midiDataKey - Base64エンコードされたMIDIデータなど
     */

    /**
     * MidiPlaylistManagerのインスタンスを作成します。
     * @param {object} [options] - オプション
     * @param {MidiDataMap} [options.midiData] - midiDataKeyと実際のMIDIデータのマップ
     * @param {string} [options.initialPlaylistName] - 初期状態でロードするプレイリスト名
     */
    constructor(options = {}) {
        this.midiPlayer = new MidiPlayer();
        /** @type {MidiDataMap} */
        this.midiData = options.midiData || {}; // MIDIデータを保持
        /** @type {PlaylistItem[]} */
        this.playlist = []; // 現在アクティブなプレイリストのアイテム配列
        this.currentTrackIndex = 0;
        this.isPlaying = false; // 再生中フラグ
        this._stopRequested = false; // 停止リクエストフラグ

        // イベントリスナーなどをここに登録 (例: MidiPlayerの再生終了イベント)
        // this.midiPlayer.on('ended', () => this._handleTrackEnd());

        // 初期プレイリストをロード
        if (options.initialPlaylistName) {
            this.loadPlaylist(options.initialPlaylistName);
        }
    }

    /**
         * 指定された名前のプレイリストをロードします。
         * @param {string} playlistName - DEFAULT_PLAYLIST内のキー名
         * @throws {Error} プレイリスト名が見つからない場合
         */
    loadPlaylist(playlistName) {
        const playlistData = MidiPlaylistManager.DEFAULT_PLAYLIST[playlistName];
        if (!playlistData) {
            throw new Error(`Playlist "${playlistName}" not found.`);
        }
        // structuredCloneでディープコピーして、元の定義を変更しないようにする
        this.playlist = structuredClone(playlistData);
        this.currentTrackIndex = 0;
        this.isPlaying = false;
        this._stopRequested = false;
        console.log(`Playlist "${playlistName}" loaded.`);
    }

    /**
     * midiDataKeyに対応するMIDIデータを取得します。
     * @param {string} midiDataKey
     * @returns {string | null} Base64データURL または null
     * @private
     */
    _getMidiData(midiDataKey) {
        const base64Data = this.midiData[midiDataKey];
        if (base64Data) {
            // 必要に応じて 'data:audio/midi;base64,' を付与
            return base64Data.startsWith('data:') ? base64Data : `data:audio/midi;base64,${base64Data}`;
        }
        console.warn(`MIDI data for key "${midiDataKey}" not found.`);
        return null;
    }

    /**
     * 現在のプレイリストの再生を開始または再開します。
     * プレイリストの先頭から、または一時停止した箇所から再生します。
     */
    async play() {
        if (this.isPlaying) {
            // すでに再生中の場合は再開を試みる (MidiPlayerに依存)
            this.midiPlayer.play(); // MidiPlayerが状態を持っていれば再開
            return;
        }
        if (this.playlist.length === 0) {
            console.warn("Playlist is empty. Nothing to play.");
            return;
        }

        this.isPlaying = true;
        this._stopRequested = false;
        console.log("Playlist started.");
        await this._executeNextItem(); // 最初のアイテムから実行開始
    }

    /**
     * プレイリストの次のアイテムを実行します。
     * @private
     */
    async _executeNextItem() {
        // 停止リクエストがあるか、プレイリストの終端に達したら終了
        if (this._stopRequested || this.currentTrackIndex >= this.playlist.length) {
            this.stop(); // 状態をリセットして終了
            console.log("Playlist finished or stopped.");
            return;
        }

        const item = this.playlist[this.currentTrackIndex];
        console.log(`Executing item ${this.currentTrackIndex}:`, item);

        try {
            switch (item.type) {
                case 'play':
                case 'tonicChord': // tonicChordもMIDI再生と仮定
                    const midiUrl = this._getMidiData(item.midiDataKey);
                    if (midiUrl) {
                        // MidiPlayerが再生終了を通知するイベントを持つと仮定
                        // await this.midiPlayer.loadAndPlay(midiUrl);
                        // --- 以下は仮の実装 ---
                        await this.midiPlayer.loadMidi(midiUrl);
                        // 再生終了を待つPromiseを返すようにMidiPlayerを改修する必要がある
                        await this.midiPlayer.playAndWait(); // 仮のメソッド
                        // --- 仮の実装ここまで ---
                    } else {
                        // MIDIデータがない場合はスキップして次へ
                        console.warn(`Skipping item due to missing MIDI data: ${item.midiDataKey}`);
                    }
                    break;

                case 'interval':
                    // 指定時間待機
                    await new Promise(resolve => setTimeout(resolve, item.value));
                    break;

                case 'bell':
                    // ベルのアクションを実行（具体的な実装は別途必要）
                    console.log(`Executing bell action: ${item.action}`);
                    // await this._playBellSound(item.action); // 例
                    break;

                default:
                    console.warn(`Unknown playlist item type: ${item.type}`);
                    break;
            }

            // 次のアイテムへ進む（停止リクエストがなければ）
            if (!this._stopRequested) {
                this.currentTrackIndex++;
                // 再帰的に次のアイテムを実行、またはイベントループに任せる
                // setTimeout(() => this._executeNextItem(), 0); // 非同期のスタックオーバーフローを防ぐ
                await this._executeNextItem(); // シンプルにするなら await でも良い場合がある
            }

        } catch (error) {
            console.error(`Error executing playlist item ${this.currentTrackIndex}:`, error);
            this.stop(); // エラー発生時も停止
        }
    }

    /**
     * 再生を一時停止します。
     */
    pause() {
        if (!this.isPlaying) return;
        // isPlaying は true のままにしておく（再開できるように）
        this.midiPlayer.pause();
        console.log("Playlist paused.");
        // 注意: interval中にpauseした場合の挙動は別途考慮が必要
    }

    /**
     * 再生を停止し、再生位置を先頭に戻します。
     */
    stop() {
        this.isPlaying = false;
        this._stopRequested = true; // 実行中の非同期処理を中断させるためのフラグ
        this.midiPlayer.stop();
        this.currentTrackIndex = 0; // 再生位置をリセット
        console.log("Playlist stopped.");
    }

    // --- next/previous はプレイリスト実行ロジック(_executeNextItem)に統合されるため、
    //     単純なトラック切り替えとしては不要になる可能性が高い ---
    /*
    next() {
        // 実行中に手動で次のMIDIトラックに飛ばす、などの用途なら必要かもしれないが、
        // intervalなどを考慮すると複雑になるため、一旦コメントアウト
    }
    previous() {
        // 同上
    }
    */

    /**
     * 現在のプレイリストのアイテム配列を取得します。
     * @returns {PlaylistItem[]}
     */
    getPlaylist() {
        return this.playlist;
    }

    /**
     * 現在再生中のアイテムのインデックスを取得します。
     * @returns {number}
     */
    getCurrentTrackIndex() {
        return this.currentTrackIndex;
    }

    /**
     * 再生するアイテムのインデックスを強制的に設定します。
     * 再生中に呼び出す場合は注意が必要です。一度 stop() してから設定する方が安全です。
     * @param {number} index
     */
    setCurrentTrackIndex(index) {
        if (index >= 0 && index < this.playlist.length) {
            this.currentTrackIndex = index;
        } else {
            console.warn(`Invalid index: ${index}`);
        }
    }

    // --- addTrack/removeTrack はプレイリスト編集機能として実装可能 ---
    /**
     * (参考) Base64 MIDIデータをMIDIデータマップに追加します。
     * プレイリスト自体に追加するのではなく、参照可能なデータを増やすイメージ。
     * @param {string} key - midiDataKeyとして使うキー
     * @param {string} base64 - Base64エンコードされたMIDIデータ（プレフィックスなし）
     */
    addMidiData(key, base64) {
        this.midiData[key] = base64;
        console.log(`MIDI data added with key: ${key}`);
    }

    /**
     * (参考) 現在ロードされているプレイリストにアイテムを追加します。
     * @param {PlaylistItem} item - 追加するプレイリストアイテム
     * @param {number} [index=this.playlist.length] - 挿入位置 (デフォルトは末尾)
     */
    addPlaylistItem(item, index = this.playlist.length) {
        if (index < 0 || index > this.playlist.length) {
            index = this.playlist.length;
        }
        this.playlist.splice(index, 0, item);
        console.log(`Playlist item added at index ${index}:`, item);
        // 再生中に変更した場合の整合性は別途考慮が必要
    }

    /**
    * (参考) 現在ロードされているプレイリストからアイテムを削除します。
    * @param {number} index - 削除するアイテムのインデックス
    */
    removePlaylistItem(index) {
        if (index >= 0 && index < this.playlist.length) {
            const removedItem = this.playlist.splice(index, 1);
            console.log(`Playlist item removed at index ${index}:`, removedItem[0]);
            // 再生位置(currentTrackIndex)の調整が必要な場合がある
            if (this.currentTrackIndex >= index && this.currentTrackIndex > 0) {
                // 削除されたアイテムより後ろ、または同じ位置にいたら、インデックスを調整
                // ただし、再生中の挙動は複雑になるため注意
                // this.currentTrackIndex--;
            }
        } else {
            console.warn(`Invalid index for removal: ${index}`);
        }
    }
}

export default MidiPlaylistManager;