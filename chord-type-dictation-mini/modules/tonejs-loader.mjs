// modules/tonejs-loader.mjs
// import { loadScript } from './library-loader.mjs'; // 開発用
import { loadScript } from 'https://cdn.jsdelivr.net/gh/kogu0507/mini-apps@main/chord-type-dictation-mini/module/library-loader.min.mjs'; // 本番用

/**
 * Tone.jsをロードします。
 * @returns {Promise<void>}
 */
export function loadToneJs() {
    return loadScript('Tone.js', 'https://unpkg.com/tone@14.7.77/build/Tone.js');
}