// visibilityToggle.mjs

/**
 * data-toggle-visibility-target 属性を持つボタンを探し、
 * クリック時に対応する要素の表示・非表示を切り替えるイベントリスナーを設定します。
 * また、初期状態で対象要素を非表示にします。
 */
function setupVisibilityToggles() {
    const toggleButtons = document.querySelectorAll('[data-toggle-visibility-target]');
    console.log("setupVisibilityToggles called.");

    toggleButtons.forEach(button => {
        const targetSelector = button.dataset.toggleVisibilityTarget;
        // querySelectorはCSSセレクタを受け付けるので、ID以外も指定可能
        const targetElement = document.querySelector(targetSelector);

        if (targetElement) {
            // 既に hidden クラスが付いていない場合のみ追加する
            if (!targetElement.classList.contains('hidden')) {
                targetElement.classList.add('hidden');
                //console.log(`Initially hiding element targeted by: ${targetSelector}`);
            }
            

            button.addEventListener('click', () => {
                targetElement.classList.toggle('hidden');
                //console.log(`Visibility of element targeted by "${targetSelector}" toggled.`);

                // --- オプション: ボタン自体の見た目も変える場合 ---
                // 例: ボタンに 'open' クラスを付け外しして矢印の向きを変えるなど
                // button.classList.toggle('open');
                // --- ここまでオプション ---
            });
        } else {
            // セレクタに一致する要素が見つからない場合のエラー
            console.error(`Target element not found for selector: "${targetSelector}" specified in button:`, button);
        }
    });
}

// setupVisibilityToggles 関数をデフォルトエクスポートする
export default setupVisibilityToggles;
