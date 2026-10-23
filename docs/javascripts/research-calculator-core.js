(function (global) {
  "use strict";

  const FINAL_ITEMS = ["感性コア", "金の匙", "徹夜アイマスク", "キャラのハンコ"];
  const LEVEL2_ITEMS = [
    "MUSIMチップ",
    "バッテリーパック",
    "S電子半導体",
    "こねこね粘土",
    "LED電球",
  ];
  const LEVEL1_ITEMS = [
    "バラバラの基板",
    "柔らか金属",
    "曲がった針金",
    "地球から来た鉛",
    "EGOブロック",
    "手形",
  ];
  const PROCESSING_ITEMS = [...LEVEL2_ITEMS, ...LEVEL1_ITEMS];
  const RAW_ITEMS = [
    "サラサラの鉄粉",
    "パリパリの金箔",
    "再生プラスチック",
    "銅の匙",
    "睡眠アイマスク",
    "曲がったもの",
    "やわらか粘土",
  ];
  const STORAGE_VERSION = 3;
  const SECTION_DEFAULTS = Object.freeze({
    final: true,
    level2: false,
    level1: false,
    raw: true,
  });
  const CRAFT_ORDER = [
    ...FINAL_ITEMS,
    ...LEVEL2_ITEMS,
    ...LEVEL1_ITEMS,
  ];

  const RECIPES = {
    感性コア: { MUSIMチップ: 1, 柔らか金属: 3 },
    金の匙: { バッテリーパック: 1, 曲がった針金: 3 },
    徹夜アイマスク: { S電子半導体: 1, 地球から来た鉛: 3 },
    キャラのハンコ: { こねこね粘土: 1, 手形: 3 },
    MUSIMチップ: { バラバラの基板: 2, サラサラの鉄粉: 1 },
    バッテリーパック: { 柔らか金属: 2, サラサラの鉄粉: 1 },
    S電子半導体: { 地球から来た鉛: 2, 睡眠アイマスク: 1 },
    こねこね粘土: { EGOブロック: 2, やわらか粘土: 1 },
    手形: { やわらか粘土: 3 },
    LED電球: { 曲がった針金: 2, パリパリの金箔: 1 },
    バラバラの基板: { パリパリの金箔: 3 },
    柔らか金属: { 再生プラスチック: 3 },
    曲がった針金: { 銅の匙: 3 },
    地球から来た鉛: { サラサラの鉄粉: 3 },
    EGOブロック: { 曲がったもの: 3 },
  };

  const PRESETS = {
    10: {
      targets: { 感性コア: 128, 金の匙: 128, 徹夜アイマスク: 64, キャラのハンコ: 0 },
      direct: {
        地球から来た鉛: 12,
        バラバラの基板: 12,
        柔らか金属: 12,
        曲がった針金: 8,
        LED電球: 7,
      },
    },
    11: {
      targets: { 感性コア: 132, 金の匙: 120, 徹夜アイマスク: 120, キャラのハンコ: 192 },
      direct: {},
    },
    12: {
      targets: { 感性コア: 165, 金の匙: 150, 徹夜アイマスク: 150, キャラのハンコ: 240 },
      direct: {},
    },
  };

  function countOf(record, item) {
    const value = record && Object.hasOwn(record, item) ? record[item] : 0;
    if (!Number.isSafeInteger(value) || value < 0) {
      throw new RangeError(`${item}は0以上の整数で指定してください`);
    }
    return value;
  }

  function calculate(input) {
    const targets = input && input.targets ? input.targets : {};
    const direct = input && input.direct ? input.direct : {};
    const stock = input && input.stock ? input.stock : {};
    const required = {};
    const plan = {};

    for (const item of CRAFT_ORDER) {
      const goal = FINAL_ITEMS.includes(item)
        ? countOf(targets, item)
        : countOf(direct, item);
      const demand = (required[item] || 0) + goal;
      const owned = countOf(stock, item);
      const stockUsed = Math.min(owned, demand);
      const craft = demand - stockUsed;
      plan[item] = { demand, owned, stockUsed, craft, remaining: owned - stockUsed };

      for (const [ingredient, quantity] of Object.entries(RECIPES[item])) {
        const next = (required[ingredient] || 0) + craft * quantity;
        if (!Number.isSafeInteger(next)) {
          throw new RangeError("計算結果が安全な整数の範囲を超えました");
        }
        required[ingredient] = next;
      }
    }

    const raw = {};
    for (const item of RAW_ITEMS) {
      const demand = required[item] || 0;
      const owned = countOf(stock, item);
      raw[item] = {
        demand,
        owned,
        shortage: Math.max(0, demand - owned),
        remaining: Math.max(0, owned - demand),
      };
    }
    return { plan, raw };
  }

  function getPreset(stage) {
    const preset = PRESETS[stage];
    if (!preset) {
      throw new RangeError(`未対応の生産ラボ段階です: ${stage}`);
    }
    return {
      targets: { ...preset.targets },
      direct: { ...preset.direct },
    };
  }

  function normalizeSavedState(candidate) {
    if (
      !candidate
      || typeof candidate !== "object"
      || ![1, 2, STORAGE_VERSION].includes(candidate.version)
    ) {
      return null;
    }
    if (!candidate.stock || typeof candidate.stock !== "object") return null;

    let sections = { ...SECTION_DEFAULTS };
    if (candidate.version === STORAGE_VERSION) {
      if (!candidate.sections || typeof candidate.sections !== "object") return null;
      for (const section of Object.keys(SECTION_DEFAULTS)) {
        if (typeof candidate.sections[section] !== "boolean") return null;
        sections[section] = candidate.sections[section];
      }
    } else if (candidate.version === 2) {
      if (!candidate.sections || typeof candidate.sections !== "object") return null;
      for (const section of ["final", "intermediate", "raw"]) {
        if (typeof candidate.sections[section] !== "boolean") return null;
      }
      sections = {
        final: candidate.sections.final,
        level2: candidate.sections.intermediate,
        level1: candidate.sections.intermediate,
        raw: candidate.sections.raw,
      };
    }

    try {
      const stockItems = [...FINAL_ITEMS, ...PROCESSING_ITEMS, ...RAW_ITEMS];
      const stock = Object.fromEntries(
        stockItems.map((item) => [item, countOf(candidate.stock, item)]),
      );
      return { version: STORAGE_VERSION, stock, sections };
    } catch (error) {
      if (error instanceof RangeError) return null;
      throw error;
    }
  }

  global.TrickcalResearchCalculator = Object.freeze({
    FINAL_ITEMS: Object.freeze([...FINAL_ITEMS]),
    LEVEL2_ITEMS: Object.freeze([...LEVEL2_ITEMS]),
    LEVEL1_ITEMS: Object.freeze([...LEVEL1_ITEMS]),
    PROCESSING_ITEMS: Object.freeze([...PROCESSING_ITEMS]),
    RAW_ITEMS: Object.freeze([...RAW_ITEMS]),
    CRAFT_ORDER: Object.freeze([...CRAFT_ORDER]),
    SECTION_DEFAULTS,
    STORAGE_VERSION,
    calculate,
    getPreset,
    normalizeSavedState,
  });
})(globalThis);
