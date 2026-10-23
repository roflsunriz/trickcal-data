import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";


const source = readFileSync(
  new URL("../docs/javascripts/research-calculator-core.js", import.meta.url),
  "utf8",
);
const uiSource = readFileSync(
  new URL("../docs/javascripts/research-calculator.js", import.meta.url),
  "utf8",
);
assert.doesNotMatch(uiSource, /直接必要数/);
assert.match(uiSource, /localStorage/);
assert.match(uiSource, /trickcal-data\.research-calculator/);
assert.match(uiSource, /game-assets\.json/);
assert.match(uiSource, /function itemLabel/);
assert.match(uiSource, /原材料 → レベル1加工素材 → レベル2加工素材 → レベル3加工素材 → 研究室/);
assert.match(uiSource, /レベル3加工素材（研究室へ渡す最終成果物）/);
assert.match(uiSource, /planRows\(core\.LEVEL2_ITEMS\)/);
assert.match(uiSource, /planRows\(core\.LEVEL1_ITEMS\)/);
assert.match(uiSource, /原材料（生産室では作らない素材）/);
assert.match(uiSource, /details\.addEventListener\("toggle"/);
assert.match(uiSource, /sections: state\.sections/);
assert.doesNotMatch(uiSource, /field: "targets"/);
assert.match(uiSource, /所持数をすべて0にする/);
assert.doesNotMatch(uiSource, /state\.direct = \{\}/);
assert.doesNotMatch(uiSource, /第(?:10|11|12)段階を設定/);
assert.doesNotMatch(uiSource, /dataset\.preset/);
const context = {};
runInNewContext(source, context, { filename: "research-calculator-core.js" });
const calculator = context.TrickcalResearchCalculator;

assert.ok(calculator, "計算機コアが公開されていません");
assert.deepEqual(
  [...calculator.LEVEL2_ITEMS],
  ["MUSIMチップ", "バッテリーパック", "S電子半導体", "こねこね粘土", "LED電球"],
);
assert.deepEqual(
  [...calculator.LEVEL1_ITEMS],
  ["バラバラの基板", "柔らか金属", "曲がった針金", "地球から来た鉛", "EGOブロック", "手形"],
);

function calculatePreset(stage, stock = {}) {
  const preset = calculator.getPreset(stage);
  return calculator.calculate({ ...preset, stock });
}

function assertRaw(stage, expected) {
  const result = calculatePreset(stage);
  for (const [item, quantity] of Object.entries(expected)) {
    assert.equal(result.raw[item].demand, quantity, `第${stage}段階の${item}`);
  }
}

assertRaw(10, {
  サラサラの鉄粉: 1252,
  パリパリの金箔: 811,
  再生プラスチック: 1956,
  銅の匙: 1218,
  睡眠アイマスク: 64,
  曲がったもの: 0,
  やわらか粘土: 0,
});
assertRaw(11, {
  サラサラの鉄粉: 2052,
  パリパリの金箔: 792,
  再生プラスチック: 1908,
  銅の匙: 1080,
  睡眠アイマスク: 120,
  曲がったもの: 1152,
  やわらか粘土: 1920,
});
assertRaw(12, {
  サラサラの鉄粉: 2565,
  パリパリの金箔: 990,
  再生プラスチック: 2385,
  銅の匙: 1350,
  睡眠アイマスク: 150,
  曲がったもの: 1440,
  やわらか粘土: 2400,
});

const stage10 = calculatePreset(10);
assert.equal(stage10.plan.LED電球.craft, 7);
assert.equal(stage10.plan.地球から来た鉛.demand, 332);
assert.equal(stage10.plan.バラバラの基板.demand, 268);
assert.equal(stage10.plan.柔らか金属.demand, 652);
assert.equal(stage10.plan.曲がった針金.demand, 406);

const stage11 = calculatePreset(11);
assert.deepEqual(
  Object.fromEntries(calculator.PROCESSING_ITEMS.map((item) => [item, stage11.plan[item].craft])),
  {
    MUSIMチップ: 132,
    バッテリーパック: 120,
    S電子半導体: 120,
    こねこね粘土: 192,
    手形: 576,
    LED電球: 0,
    バラバラの基板: 264,
    柔らか金属: 636,
    曲がった針金: 360,
    地球から来た鉛: 600,
    EGOブロック: 384,
  },
);

const stage12 = calculatePreset(12);
assert.deepEqual(
  Object.fromEntries(calculator.PROCESSING_ITEMS.map((item) => [item, stage12.plan[item].craft])),
  {
    MUSIMチップ: 165,
    バッテリーパック: 150,
    S電子半導体: 150,
    こねこね粘土: 240,
    手形: 720,
    LED電球: 0,
    バラバラの基板: 330,
    柔らか金属: 795,
    曲がった針金: 450,
    地球から来た鉛: 750,
    EGOブロック: 480,
  },
);

const stocked = calculator.calculate({
  targets: { 感性コア: 1 },
  direct: {},
  stock: { MUSIMチップ: 1, 柔らか金属: 2, 再生プラスチック: 3 },
});
assert.equal(stocked.plan.感性コア.craft, 1);
assert.equal(stocked.plan.MUSIMチップ.craft, 0);
assert.equal(stocked.plan.柔らか金属.craft, 1);
assert.equal(stocked.raw.再生プラスチック.demand, 3);
assert.equal(stocked.raw.再生プラスチック.shortage, 0);

const mixedLevels = calculator.calculate({
  targets: { 感性コア: 2 },
  direct: {},
  stock: {
    感性コア: 1,
    MUSIMチップ: 1,
    バラバラの基板: 9,
    柔らか金属: 1,
    再生プラスチック: 2,
  },
});
assert.equal(mixedLevels.plan.感性コア.craft, 1);
assert.equal(mixedLevels.plan.MUSIMチップ.demand, 1);
assert.equal(mixedLevels.plan.MUSIMチップ.craft, 0);
assert.equal(mixedLevels.plan.バラバラの基板.demand, 0);
assert.equal(mixedLevels.plan.バラバラの基板.remaining, 9);
assert.equal(mixedLevels.plan.柔らか金属.demand, 3);
assert.equal(mixedLevels.plan.柔らか金属.craft, 2);
assert.equal(mixedLevels.raw.再生プラスチック.demand, 6);
assert.equal(mixedLevels.raw.再生プラスチック.shortage, 4);

const completed = calculatePreset(11, calculator.getPreset(11).targets);
assert.ok(Object.values(completed.plan).every((entry) => entry.craft === 0));
assert.ok(Object.values(completed.raw).every((entry) => entry.demand === 0));

assert.throws(
  () => calculator.calculate({ targets: { 感性コア: -1 } }),
  /0以上の整数/,
);

const normalized = calculator.normalizeSavedState({
  version: calculator.STORAGE_VERSION,
  stock: { MUSIMチップ: 7, サラサラの鉄粉: 99 },
  sections: { final: false, level2: true, level1: false, raw: false },
});
assert.equal(calculator.STORAGE_VERSION, 3);
assert.equal(normalized.stock.MUSIMチップ, 7);
assert.equal(normalized.stock.サラサラの鉄粉, 99);
assert.equal(normalized.stock.金の匙, 0);
assert.deepEqual(
  { ...normalized.sections },
  { final: false, level2: true, level1: false, raw: false },
);

const migratedV1 = calculator.normalizeSavedState({
  version: 1,
  selectedPreset: 12,
  targets: { 感性コア: 165 },
  stock: { MUSIMチップ: 7 },
});
assert.equal(migratedV1.version, calculator.STORAGE_VERSION);
assert.equal(migratedV1.stock.MUSIMチップ, 7);
assert.deepEqual(
  { ...migratedV1.sections },
  { final: true, level2: false, level1: false, raw: true },
);

const migratedV2 = calculator.normalizeSavedState({
  version: 2,
  selectedPreset: 11,
  targets: { 感性コア: 132 },
  stock: { バラバラの基板: 8 },
  sections: { final: false, intermediate: true, raw: false },
});
assert.equal(migratedV2.version, calculator.STORAGE_VERSION);
assert.equal(migratedV2.stock.バラバラの基板, 8);
assert.deepEqual(
  { ...migratedV2.sections },
  { final: false, level2: true, level1: true, raw: false },
);
assert.equal(
  calculator.normalizeSavedState({
    version: calculator.STORAGE_VERSION + 1,
    stock: {},
  }),
  null,
);
assert.equal(
  calculator.normalizeSavedState({
    version: calculator.STORAGE_VERSION,
    stock: { 感性コア: -1 },
    sections: { final: true, level2: false, level1: false, raw: true },
  }),
  null,
);
assert.equal(
  calculator.normalizeSavedState({
    version: calculator.STORAGE_VERSION,
    stock: {},
    sections: { final: true, level2: "open", level1: false, raw: true },
  }),
  null,
);
assert.throws(
  () => calculator.calculate({ targets: { 感性コア: 1.5 } }),
  /0以上の整数/,
);

console.log("素材クラフト計算機の全テストに成功しました");
