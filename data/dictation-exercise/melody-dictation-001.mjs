// data/dictation-exercise/melody-dictation-001.js
// d:\_WORK_GoogleDrivveMyPC\GitHubPagese\mini-apps\data\dictation-exercise\melody-dictation-001.mjs
import MeiGenerator from '../../module/MeiGenerator.mjs';


// 1. 初期設定 (ベースとなる設定)
const baseConfig = {
  title: 'melody dictation 001',
  date: '2025-05-01',

  // 単一譜表（ト音記号）
  staffDefs: [
    { n: 1, lines: 5, clef: { shape: 'G', line: 2 } }
  ],

  // 調号と拍子記号（初期設定）
  keySig: "0",                // Cメジャー
  meterSig: { count: 4, unit: 4 }, // 4/4 拍子
};

// 2. 各小節のデータ定義
//    キーを 'm' + 小節番号 にしてアクセスしやすくする
const measuresData = {
  m1:{
    staff: 1, layer: 1,
    notes: `
      <!-- Measure 1 -->
      <note pname="c" oct="4" dur="4"/>
      <note pname="d" oct="4" dur="4"/>
      <note pname="e" oct="4" dur="4"/>
      <note pname="f" oct="4" dur="4"/>
    `
  },
  m2:{
    staff: 1, layer: 1,
    notes: `
      <!-- Measure 2 -->
      <note pname="g" oct="4" dur="4"/>
      <beam>
      <note pname="f" oct="4" dur="8"/>
      <note pname="e" oct="4" dur="8"/>
      </beam>
      <note pname="d" oct="4" dur="4"/>
      <rest dur="4"/>
    `
  },
  m3:{
    staff: 1, layer: 1,
    notes: `
      <!-- Measure 3 -->
      <beam>
      <note pname="e" oct="4" dur="8"/>
      <note pname="f" oct="4" dur="8"/>
      <note pname="g" oct="4" dur="8"/>
      <note pname="a" oct="4" dur="8"/>
      </beam>
      <note pname="g" oct="4" dur="4" dots="1"/>
      <note pname="c" oct="5" dur="8"/>
    `
  },
  m4:{
    staff: 1, layer: 1,
    notes: `
      <!-- Measure 4 -->
      <beam>
      <note pname="d" oct="5" dur="8"/>
      <note pname="c" oct="5" dur="8"/>
      <note pname="b" oct="4" dur="8"/>
      <note pname="a" oct="4" dur="8"/>
      </beam>
      <note pname="g" oct="4" dur="4"/>
      <rest dur="4"/>
    `
  },
  m5:{
    staff: 1, layer: 1,
    notes: `
      <!-- Measure 5 -->
      <note pname="c" oct="5" dur="4"/>
      <note pname="g" oct="4" dur="4"/>
      <note pname="c" oct="5" dur="4" dots="1"/>
      <note pname="b" oct="4" dur="8">
      <accid accid="f" />
      </note>
    `
  },
  m6:{
    staff: 1, layer: 1,
    notes: `
      <!-- Measure 6 -->
      <beam>
      <note pname="a" oct="4" dur="8"/>
      <note pname="g" oct="4" dur="8">
      <accid accid="s" />
      </note>
      </beam>
      <note pname="a" oct="4" dur="4"/>
      <rest dur="8" />
      <beam>
      <note pname="f" oct="4" dur="8"/>
      <note pname="g" oct="4" dur="8"/>
      <note pname="a" oct="4" dur="8">
      <accid accid="f" />
      </note>
      </beam>
    `
  },
  m7:{
    staff: 1, layer: 1,
    notes: `
      <!-- Measure 7 -->
      <note pname="g" oct="4" dur="4"/>
      <beam>
      <note pname="c" oct="5" dur="8"/>
      <note pname="d" oct="5" dur="8"/>
      </beam>
      <note pname="e" oct="5" dur="4" tie="i"/>
      <beam>
      <note pname="e" oct="5" dur="16" tie="t"/>
      <note pname="d" oct="5" dur="16"/>
      <note pname="c" oct="5" dur="16"/>
      <note pname="b" oct="4" dur="16"/>
      </beam>
    `
  },
  m8:{
    staff: 1, layer: 1,
    notes: `
      <!-- Measure 8 -->
      <beam>
      <note pname="a" oct="4" dur="8" dots="1"/>
      <note pname="b" oct="4" dur="16"/>
      </beam>
      <beam>
      <note pname="g" oct="4" dur="8"/>
      <note pname="d" oct="5" dur="8"/>
      </beam>
      <note pname="c" oct="5" dur="4"/>
      <rest dur="4" />
    `
  }
};

// 3. 指定範囲のMEIを生成するヘルパー関数
function generateMeiForMeasures(startMeasureNum, endMeasureNum) {
  // MeiGenerator を初期化
  // 注意: この例では調号や拍子記号が途中で変わらない前提です。
  // もし変わる場合は、開始小節に応じた config を設定する必要があります。
  const gen = new MeiGenerator(baseConfig);

  // 指定範囲の小節を追加
  for (let i = startMeasureNum; i <= endMeasureNum; i++) {
    const measureKey = `m${i}`; // オブジェクトのキー (m1, m2, ...)
    const measureContent = measuresData[measureKey];

    if (measureContent) {
      // 将来的に scoreDef の変更を扱う場合はここに追加
      // if (measureContent.scoreDefChanges) { ... gen.addScoreDef(...) ... }

      gen.startMeasure(i);
      gen.addStaff(measureContent); // staff, layer, notes を含むオブジェクトを渡す
      gen.endMeasure();
    } else {
      console.warn(`Measure data for measure ${i} not found.`);
    }
  }

  return gen.build();
}

// 4. ヘルパー関数を使って各範囲のMEIデータを生成
const meiData = {
  measure1: generateMeiForMeasures(1, 1),
  measure2: generateMeiForMeasures(2, 2),
  measure3: generateMeiForMeasures(3, 3),
  measure4: generateMeiForMeasures(4, 4),
  measure5: generateMeiForMeasures(5, 5),
  measure6: generateMeiForMeasures(6, 6),
  measure7: generateMeiForMeasures(7, 7),
  measure8: generateMeiForMeasures(8, 8),

  measures1to2: generateMeiForMeasures(1, 2),
  measures3to4: generateMeiForMeasures(3, 4),
  measures5to6: generateMeiForMeasures(5, 6),
  measures7to8: generateMeiForMeasures(7, 8),

  measures1to4: generateMeiForMeasures(1, 4),
  measures5to8: generateMeiForMeasures(5, 8),

  measures1to8: generateMeiForMeasures(1, 8),
};


export default meiData;
