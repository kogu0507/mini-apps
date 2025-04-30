// data/dictation-exercise/melody-dictation-001.js
import MeiGenerator from '../../module/MeiGenerator.mjs';


// 1. 初期設定
const config = {
  title: 'サンプル',
  date: '2025-04-29',

  // 大譜表
  staffDefs: [
      { n: 1, lines: 5, clef: { shape: 'G', line: 2 } },
      { n: 2, lines: 5, clef: { shape: 'F', line: 4 } }
  ],
  staffGrpAttrs: { 'bar.thru': 'true', symbol: 'brace' },

  // 調号と拍子記号（初期設定）
  keySig: "0",                // Cメジャー → sig="0" | Gメジャー → sig="1s" | Fメジャー → sig="1f"
  meterSig: { count: 4, unit: 4 }, // 4/4 拍子
};

const gen = new MeiGenerator(config);

// 2. 1小節目を生成
gen.startMeasure(1);
gen.addStaff({
  staff: 1, layer: 1,
  notes:`
      <note pname="c" oct="4" dur="2"/>
      <note pname="c" oct="4" dur="2"/>`
});
gen.addStaff({
  staff: 2, layer: 1,
  notes:`
      <note pname="f" oct="3" dur="2"/>
      <note pname="f" oct="3" dur="2"/>`
});
gen.endMeasure();

// 3. 2小節目から 2/4 拍子＋1つフラットに変更
//    ⇒ <scoreDef n="2" meter.count="2" meter.unit="4" key.sig="-1"/>
gen.addScoreDef(
  2,
  { count: 2, unit: 4 },    // meterSig
  { sig: '5s' }            // keySig 1f=♭1 1s=♯1
);
// 4. 2小節目を生成
gen.startMeasure(2);
gen.addStaff({
  staff: 1, layer: 1,
  notes:`
      <note pname="d" oct="4" dur="4"/>
      <note pname="d" oct="4" dur="4"/>`
});
gen.addStaff({
  staff: 2, layer: 1,
  notes:`
  <note pname="g" oct="4" dur="4"/>
  <note pname="g" oct="4" dur="4"/>`
});
gen.endMeasure();

// 5. 出力＆レンダリング
const meiXml = gen.build();
//console.log(meiXml);
//document.getElementById('mei-output').textContent = meiXml;





 /* 
  TODO:  
  MeiGeneratorのインスタンス作成
  MeiGeneratorにconfigを登録
  MeiGeneratorに各小節情報を登録
  MeiGeneratorで各小節の任意の情報を組み合わせてMEIファイルを量産
  export
 */
/*
const meiData = { 
  measure1Only:MeiGeneratorで,
  // ...8小節まで作る
  measure1To2:
  ...など、必要なのを作る
};

*/

const meiData = meiXml;
export default meiData;