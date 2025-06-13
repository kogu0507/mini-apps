// modules/library-loader.mjs
const loadedLibraries = {}; // ロード済みのライブラリを追跡

/**
 * 指定されたライブラリをCDNからロードします。
 * 既にロードされている場合は、即座に解決されるPromiseを返します。
 *
 * @param {string} name ライブラリの名前（例: 'Tone.js', 'Verovio'）
 * @param {string} url ライブラリのCDN URL
 * @returns {Promise<void>} ライブラリのロードが完了したときに解決されるPromise
 */
export function loadScript(name, url) {
    if (loadedLibraries[name]) {
        console.log(`${name} is already loaded.`);
        return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = url;
        script.async = true;

        script.onload = () => {
            console.log(`${name} loaded from ${url}`);
            loadedLibraries[name] = true;
            resolve();
        };

        script.onerror = (error) => {
            const errorMessage = `Error loading ${name} from ${url}`;
            console.error(errorMessage, error);
            reject(new Error(errorMessage));
        };

        document.head.appendChild(script);
    });
}