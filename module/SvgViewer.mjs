// SvgViewer.mjs

class SvgViewer {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        if (!this.container) {
            console.error(`SvgViewer: 指定された containerId "${containerId}" の要素が見つかりませんでした。`);
        }
    }

    display(svgString) {
        if (this.container) {
            this.container.innerHTML = svgString;
        } else {
            console.error('SvgViewer: コンテナ要素が存在しないため、SVG を表示できません。');
        }
    }

    clear() {
        if (this.container) {
            this.container.innerHTML = '';
        } else {
            console.error('SvgViewer: コンテナ要素が存在しないため、クリアできません。');
        }
    }
}


export default SvgViewer;

/*
<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>SvgViewer テスト</title>
    <style>
        #svg-container {
            width: 200px;
            height: 200px;
            border: 1px solid black;
            margin-bottom: 10px;
        }
    </style>
</head>
<body>
    <h1>SvgViewer テスト</h1>

    <div id="svg-container">
        </div>

    <button id="display-button">SVG を表示</button>
    <button id="clear-button">クリア</button>

    <script type="module">
        import SvgViewer from '../module/SvgViewer.mjs';

        const containerId = 'svg-container';
        const viewer = new SvgViewer(containerId);

        const displayButton = document.getElementById('display-button');
        const clearButton = document.getElementById('clear-button');

        const sampleSvg = `
            <svg width="100" height="100">
                <circle cx="50" cy="50" r="40" stroke="blue" stroke-width="3" fill="lightblue" />
            </svg>
        `;

        displayButton.addEventListener('click', () => {
            viewer.display(sampleSvg);
        });

        clearButton.addEventListener('click', () => {
            viewer.clear();
        });

        // 存在しないコンテナ ID でインスタンスを作成してエラーハンドリングのテスト
        const invalidViewer = new SvgViewer('non-existent-container');
        invalidViewer.display('<svg></svg>'); // エラーメッセージがコンソールに出力されるはずです
        invalidViewer.clear();              // エラーメッセージがコンソールに出力されるはずです

    </script>
</body>
</html>
*/