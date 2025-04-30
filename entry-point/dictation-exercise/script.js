// ロジック統括モジュールのインポート
//import DictationExerciseLogic from '../../module/DictationExerciseLogic.mjs';

document.addEventListener('DOMContentLoaded', async () => {
    console.log('Entry-point scriptが実行されました。');

    // HTMLのscriptタグからデータURLを取得
    const scripts = document.querySelectorAll('script[data-load-url]');

    for (const script of scripts) {
        const dataUrl = script.dataset.loadUrl;

        if (dataUrl) {
            try {
                // 直接 import() を使用してデータをロード
                const dataModule = await import(dataUrl);
                const data = dataModule.default;

                if (data) {
                    // DictationExerciseLogicにロードしたデータを渡して処理を開始
                    //DictationExerciseLogic(data, script.parentElement); // 親要素を渡す例

                    // 今はテストでここ
                    console.log(`dataUrl: ${dataUrl}`);
                    console.log(`data: ${data}`);
                    
                } else {
                    console.error(`データのロードに失敗しました: ${dataUrl} (default exportが見つかりません)`);
                }
            } catch (error) {
                console.error(`データのロード中にエラーが発生しました: ${dataUrl}`, error);
            }
        }
    }

    // その他の初期化処理 (必要であれば)
    // mainLogic.initialize();
});
