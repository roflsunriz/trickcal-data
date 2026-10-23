import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";


const source = readFileSync(
  new URL("../docs/javascripts/research-calculator-core.js", import.meta.url),
  "utf8",
);
const context = {};
runInNewContext(source, context, { filename: "research-calculator-core.js" });
const calculator = context.TrickcalResearchCalculator;

assert.ok(calculator, "計算機コアが公開されていません");

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

const completed = calculatePreset(11, calculator.getPreset(11).targets);
assert.ok(Object.values(completed.plan).every((entry) => entry.craft === 0));
assert.ok(Object.values(completed.raw).every((entry) => entry.demand === 0));

assert.throws(
  () => calculator.calculate({ targets: { 感性コア: -1 } }),
  /0以上の整数/,
);
assert.throws(
  () => calculator.calculate({ targets: { 感性コア: 1.5 } }),
  /0以上の整数/,
);

console.log("素材クラフト計算機の全テストに成功しました");
