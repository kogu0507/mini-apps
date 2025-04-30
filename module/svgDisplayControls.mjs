// module/svgDisplayControls.mjs

/**
 * SVGコンテナの表示（サイズ、高さ）を制御するスライダーの機能を設定します。
 * @param {object} config - 設定オブジェクト
 * @param {string} config.targetContainerId - サイズと高さを変更する対象のコンテナ要素のID。
 * @param {object} [config.sizeSlider] - サイズ調整スライダーの設定 (オプション)
 * @param {string} config.sizeSlider.sliderId - サイズrange input要素のID。
 * @param {string} config.sizeSlider.valueDisplayId - サイズ値を表示するspan要素のID。
 * @param {object} [config.heightSlider] - 高さ調整スライダーの設定 (オプション)
 * @param {string} config.heightSlider.sliderId - 高さrange input要素のID。
 * @param {string} config.heightSlider.valueDisplayId - 高さ値を表示するspan要素のID。
 */
function setupSvgDisplayControls(config) {
    const targetContainer = document.getElementById(config.targetContainerId);

    if (!targetContainer) {
        console.error(`SVG Display Controls: Target container element with ID "${config.targetContainerId}" not found.`);
        return;
    }
    console.log(`SVG Display Controls initializing for target: #${config.targetContainerId}`);

    // --- サイズ調整スライダーの設定 ---
    if (config.sizeSlider) {
        const sizeSlider = document.getElementById(config.sizeSlider.sliderId);
        const sizeValueDisplay = document.getElementById(config.sizeSlider.valueDisplayId);

        if (sizeSlider && sizeValueDisplay) {
            const updateSize = (value) => {
                sizeValueDisplay.textContent = parseFloat(value).toFixed(1);
                targetContainer.style.transformOrigin = 'top left';
                targetContainer.style.transform = `scale(${value})`;
            };

            // 初期値を設定
            updateSize(sizeSlider.value);

            // イベントリスナーを追加
            sizeSlider.addEventListener('input', (event) => {
                updateSize(event.target.value);
            });
            console.log(` - Size slider initialized (Slider: #${config.sizeSlider.sliderId}, Display: #${config.sizeSlider.valueDisplayId})`);
        } else {
            if (!sizeSlider) console.error(` - Size slider element with ID "${config.sizeSlider.sliderId}" not found.`);
            if (!sizeValueDisplay) console.error(` - Size value display element with ID "${config.sizeSlider.valueDisplayId}" not found.`);
        }
    }

    // --- 高さ調整スライダーの設定 ---
    if (config.heightSlider) {
        const heightSlider = document.getElementById(config.heightSlider.sliderId);
        const heightValueDisplay = document.getElementById(config.heightSlider.valueDisplayId);

        if (heightSlider && heightValueDisplay) {
            const updateHeight = (value) => {
                heightValueDisplay.textContent = value; // 高さは整数なのでそのまま表示
                targetContainer.style.height = `${value}px`; // 高さをピクセル単位で設定
            };

            // 初期値を設定
            updateHeight(heightSlider.value);

            // イベントリスナーを追加
            heightSlider.addEventListener('input', (event) => {
                updateHeight(event.target.value);
            });

            // オプション：初期状態で無効化されている場合、有効化する処理をどこかで行う
            // 例: SVGが読み込まれた後など
            // heightSlider.disabled = false;
            console.log(` - Height slider initialized (Slider: #${config.heightSlider.sliderId}, Display: #${config.heightSlider.valueDisplayId})`);
             // 初期状態で無効なら、その旨をログに出す
            if (heightSlider.disabled) {
                console.log(`   - Note: Height slider #${config.heightSlider.sliderId} is currently disabled.`);
            }

        } else {
            if (!heightSlider) console.error(` - Height slider element with ID "${config.heightSlider.sliderId}" not found.`);
            if (!heightValueDisplay) console.error(` - Height value display element with ID "${config.heightSlider.valueDisplayId}" not found.`);
        }
    }
}

// setupSvgDisplayControls 関数をデフォルトエクスポートする
export default setupSvgDisplayControls;
