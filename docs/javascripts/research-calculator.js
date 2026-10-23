(function () {
  "use strict";

  const MAX_COUNT = 99_999_999;
  const STORAGE_KEY = "trickcal-data.research-calculator";
  const numberFormat = new Intl.NumberFormat("ja-JP");
  const calculatorScriptUrl = document.currentScript && document.currentScript.src;
  const manifestUrl = calculatorScriptUrl
    ? new URL("../assets/game-assets.json", calculatorScriptUrl)
    : new URL("assets/game-assets.json", document.baseURI);
  let iconMapPromise;

  function element(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }

  async function loadItemIcons() {
    if (iconMapPromise) return iconMapPromise;
    iconMapPromise = (async () => {
      try {
        const response = await fetch(manifestUrl, { credentials: "same-origin" });
        if (!response.ok) return new Map();
        const manifest = await response.json();
        if (!Array.isArray(manifest.research_items)) return new Map();
        const icons = new Map();
        for (const entry of manifest.research_items) {
          if (
            typeof entry.name !== "string"
            || typeof entry.file !== "string"
            || !Number.isInteger(entry.x)
            || !Number.isInteger(entry.y)
          ) {
            continue;
          }
          const icon = {
            src: new URL(entry.file, manifestUrl).href,
            x: entry.x,
            y: entry.y,
          };
          icons.set(entry.name, icon);
          if (Array.isArray(entry.aliases)) {
            for (const alias of entry.aliases) {
              if (typeof alias === "string") icons.set(alias, icon);
            }
          }
        }
        return icons;
      } catch (error) {
        return new Map();
      }
    })();
    return iconMapPromise;
  }

  function itemLabel(item, iconMap) {
    const label = element("span", "lab-item");
    const icon = iconMap.get(item);
    if (icon) {
      const crop = element("span", "lab-icon");
      const image = document.createElement("img");
      image.src = icon.src;
      image.alt = "";
      image.loading = "lazy";
      image.style.setProperty("--lab-icon-x", `${icon.x}px`);
      image.style.setProperty("--lab-icon-y", `${icon.y}px`);
      crop.append(image);
      label.append(crop);
    }
    label.append(document.createTextNode(item));
    return label;
  }

  function numberInput(item, field, stage) {
    const input = document.createElement("input");
    input.type = "number";
    input.min = "0";
    input.max = String(MAX_COUNT);
    input.step = "1";
    input.inputMode = "numeric";
    input.value = "0";
    input.className = "research-calculator__input";
    input.dataset.item = item;
    input.dataset.field = field;
    input.id = `research-${stage}-${field}-${item}`;
    input.setAttribute("aria-label", `${item}の所持数`);
    return input;
  }

  function inputTable(stage, items, columns, iconMap) {
    const wrapper = element("div", "research-calculator__table-wrap");
    const table = element("table", "research-calculator__table");
    const head = document.createElement("thead");
    const headRow = document.createElement("tr");
    headRow.append(element("th", "", "アイテム"));
    for (const column of columns) {
      headRow.append(element("th", "", column.label));
    }
    head.append(headRow);
    table.append(head);

    const body = document.createElement("tbody");
    for (const item of items) {
      const row = document.createElement("tr");
      const itemCell = document.createElement("th");
      itemCell.append(itemLabel(item, iconMap));
      row.append(itemCell);
      for (const column of columns) {
        const cell = document.createElement("td");
        if (column.field) {
          cell.append(numberInput(item, column.field, stage));
        } else {
          cell.textContent = numberFormat.format(column.values[item] || 0);
        }
        row.append(cell);
      }
      body.append(row);
    }
    table.append(body);
    wrapper.append(table);
    return wrapper;
  }

  function inputSection(section, title, description, table, open) {
    const details = element("details", "research-calculator__inputs");
    details.dataset.section = section;
    details.open = open;
    details.append(element("summary", "", title));
    details.append(element("p", "research-calculator__hint", description));
    details.append(table);
    return details;
  }

  function resultTable(headers, rows, iconMap) {
    const wrapper = element("div", "research-calculator__table-wrap");
    const table = element("table", "research-calculator__table research-calculator__result-table");
    const head = document.createElement("thead");
    const headRow = document.createElement("tr");
    for (const header of headers) headRow.append(element("th", "", header));
    head.append(headRow);
    table.append(head);
    const body = document.createElement("tbody");
    for (const values of rows) {
      const row = document.createElement("tr");
      values.forEach((value, index) => {
        const cell = document.createElement(index === 0 ? "th" : "td");
        if (index === 0) cell.append(itemLabel(value, iconMap));
        else cell.textContent = value;
        row.append(cell);
      });
      body.append(row);
    }
    table.append(body);
    wrapper.append(table);
    return wrapper;
  }

  function readInputs(container, fixedTargets, fixedDirect) {
    const values = {
      targets: { ...fixedTargets },
      direct: { ...fixedDirect },
      stock: {},
    };
    const errors = [];
    for (const input of container.querySelectorAll("input[data-item][data-field]")) {
      const value = input.value.trim() === "" ? 0 : Number(input.value);
      const valid = Number.isSafeInteger(value) && value >= 0 && value <= MAX_COUNT;
      input.setAttribute("aria-invalid", String(!valid));
      if (!valid) {
        errors.push(`${input.dataset.item}は0～${numberFormat.format(MAX_COUNT)}の整数で入力してください`);
        continue;
      }
      values.stock[input.dataset.item] = value;
    }
    return { values, errors };
  }

  function setAllInputs(container, value) {
    for (const input of container.querySelectorAll("input[data-item][data-field]")) {
      input.value = String(value);
      input.setAttribute("aria-invalid", "false");
    }
  }

  function setInputValues(container, stock) {
    setAllInputs(container, 0);
    for (const [item, value] of Object.entries(stock)) {
      const input = container.querySelector(`input[data-field="stock"][data-item="${item}"]`);
      if (input) input.value = String(value);
    }
  }

  function canUseStorage() {
    try {
      const probe = `${STORAGE_KEY}.probe`;
      localStorage.setItem(probe, "1");
      localStorage.removeItem(probe);
      return true;
    } catch (error) {
      return false;
    }
  }

  function loadSavedState(core) {
    if (!canUseStorage()) return { available: false, saved: null };
    try {
      const serialized = localStorage.getItem(STORAGE_KEY);
      if (serialized === null) return { available: true, saved: null };
      const saved = core.normalizeSavedState(JSON.parse(serialized));
      if (saved === null) localStorage.removeItem(STORAGE_KEY);
      return { available: true, saved };
    } catch (error) {
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch (removeError) {
        // 保存領域自体を利用できない場合は、計算機の動作だけを継続する。
      }
      return { available: true, saved: null };
    }
  }

  function saveState(values, state, core, statusNode) {
    if (!state.storageAvailable) return;
    const candidate = {
      version: core.STORAGE_VERSION,
      stock: values.stock,
      sections: state.sections,
    };
    const normalized = core.normalizeSavedState(candidate);
    if (normalized === null) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
      statusNode.textContent = "入力内容と開閉状態はこのブラウザに自動保存されます。";
    } catch (error) {
      state.storageAvailable = false;
      statusNode.textContent = "このブラウザでは入力内容を保存できません。";
    }
  }

  function renderPresetNote(noteNode, direct) {
    const entries = Object.entries(direct).filter(([, quantity]) => quantity > 0);
    noteNode.hidden = entries.length === 0;
    noteNode.textContent = entries.length
      ? `第10段階で研究室へ直接渡すレベル1・2加工素材も必要数へ加算しています: ${entries.map(([item, quantity]) => `${item} ${numberFormat.format(quantity)}個`).join("、")}`
      : "";
  }

  function renderResults(container, resultNode, core, state) {
    const { values, errors } = readInputs(container, state.targets, state.direct);
    resultNode.replaceChildren();
    if (errors.length) {
      const list = element("ul", "research-calculator__errors");
      for (const error of errors) list.append(element("li", "", error));
      resultNode.append(list);
      return null;
    }

    let result;
    try {
      result = core.calculate(values);
    } catch (error) {
      resultNode.append(element("p", "research-calculator__errors", error.message));
      return null;
    }

    function planRows(items) {
      return items.map((item) => {
        const entry = result.plan[item];
        return [
          item,
          numberFormat.format(entry.demand),
          numberFormat.format(entry.stockUsed),
          numberFormat.format(entry.craft),
          numberFormat.format(entry.remaining),
        ];
      });
    }

    const planHeaders = ["加工素材", "必要総数", "所持から使用", "生産する個数", "生産後の残数"];
    resultNode.append(
      element(
        "p",
        "research-calculator__flow",
        "生産の流れ: 原材料 → レベル1加工素材 → レベル2加工素材 → レベル3加工素材 → 研究室",
      ),
    );
    resultNode.append(element("h4", "", "レベル3加工素材（研究室へ渡す最終成果物）"));
    resultNode.append(resultTable(planHeaders, planRows(core.FINAL_ITEMS), state.iconMap));

    resultNode.append(element("h4", "", "レベル2加工素材"));
    resultNode.append(resultTable(planHeaders, planRows(core.LEVEL2_ITEMS), state.iconMap));

    resultNode.append(element("h4", "", "レベル1加工素材"));
    resultNode.append(resultTable(planHeaders, planRows(core.LEVEL1_ITEMS), state.iconMap));

    const rawRows = core.RAW_ITEMS.map((item) => {
      const entry = result.raw[item];
      return [
        item,
        numberFormat.format(entry.demand),
        numberFormat.format(entry.owned),
        numberFormat.format(entry.shortage),
        numberFormat.format(entry.remaining),
      ];
    });
    resultNode.append(element("h4", "", "原材料（生産室では作らない素材）"));
    resultNode.append(resultTable(["原材料", "生産に必要", "所持", "不足（集める）", "使用後の残数"], rawRows, state.iconMap));
    const shortages = core.RAW_ITEMS.filter((item) => result.raw[item].shortage > 0);
    resultNode.append(
      element(
        "p",
        shortages.length ? "research-calculator__summary is-short" : "research-calculator__summary is-ready",
        shortages.length
          ? `不足している原材料が${shortages.length}種類あります。`
          : "所持している素材だけで必要な生産を完了できます。",
      ),
    );
    return values;
  }

  function initializeCalculator(container, core, iconMap) {
    if (container.dataset.initialized === "true") return;
    container.dataset.initialized = "true";
    const stage = Number(container.dataset.stage);
    const preset = core.getPreset(stage);
    const state = {
      targets: { ...preset.targets },
      direct: { ...preset.direct },
      storageAvailable: false,
      sections: { ...core.SECTION_DEFAULTS },
      iconMap,
    };
    container.replaceChildren();

    container.append(
      element(
        "p",
        "research-calculator__description",
        `研究室の第${stage}段階で必要なレベル3加工素材を目標に、各レベルの所持数を先に使って、生産する個数と不足する原材料を計算します。所持数と入力欄の開閉状態はこのブラウザにだけ保存され、外部へ送信されません。`,
      ),
    );

    const clear = element("button", "research-calculator__button is-secondary", "所持数をすべて0にする");
    clear.type = "button";
    clear.dataset.action = "clear";
    container.append(clear);
    const presetNote = element("p", "research-calculator__preset-note");
    presetNote.hidden = true;
    container.append(presetNote);
    const storageStatus = element("p", "research-calculator__storage-status");
    storageStatus.setAttribute("aria-live", "polite");
    container.append(storageStatus);

    const sectionNodes = {
      final: inputSection(
        "final",
        "レベル3加工素材（最終成果物）",
        "研究室で必要な数は表示中の段階から自動設定されます。現在持っている数だけ入力します。",
        inputTable(stage, core.FINAL_ITEMS, [
          { label: "研究必要数", values: state.targets },
          { field: "stock", label: "所持数" },
        ], iconMap),
        true,
      ),
      level2: inputSection(
        "level2",
        "レベル2加工素材の所持数",
        "持っている分は先に使用し、不足分だけをレベル1加工素材から生産します。",
        inputTable(stage, core.LEVEL2_ITEMS, [{ field: "stock", label: "所持数" }], iconMap),
        false,
      ),
      level1: inputSection(
        "level1",
        "レベル1加工素材の所持数",
        "持っている分は先に使用し、不足分だけを原材料から生産します。",
        inputTable(stage, core.LEVEL1_ITEMS, [{ field: "stock", label: "所持数" }], iconMap),
        false,
      ),
      raw: inputSection(
        "raw",
        "原材料の所持数",
        "冒険協会などで集めた、生産室では作らない素材の現在庫を入力します。",
        inputTable(stage, core.RAW_ITEMS, [{ field: "stock", label: "所持数" }], iconMap),
        true,
      ),
    };
    container.append(...Object.values(sectionNodes));

    const resultNode = element("div", "research-calculator__results");
    resultNode.setAttribute("aria-live", "polite");
    container.append(resultNode);

    const loaded = loadSavedState(core);
    state.storageAvailable = loaded.available;
    if (loaded.saved) {
      setInputValues(container, loaded.saved.stock);
      state.sections = { ...loaded.saved.sections };
      for (const [section, details] of Object.entries(sectionNodes)) {
        details.open = state.sections[section];
      }
      renderPresetNote(presetNote, state.direct);
      storageStatus.textContent = "保存済みの入力内容と開閉状態を復元しました。";
    } else {
      renderPresetNote(presetNote, state.direct);
      storageStatus.textContent = loaded.available
        ? "入力内容と開閉状態はこのブラウザに自動保存されます。"
        : "このブラウザでは入力内容を保存できません。";
    }
    const initialValues = renderResults(container, resultNode, core, state);
    state.lastValidValues = initialValues;

    container.addEventListener("input", () => {
      const values = renderResults(container, resultNode, core, state);
      if (values) {
        state.lastValidValues = values;
        saveState(values, state, core, storageStatus);
      }
    });
    container.addEventListener("click", (event) => {
      const button = event.target.closest("button");
      if (!button) return;
      if (button.dataset.action === "clear") {
        setAllInputs(container, 0);
      }
      const values = renderResults(container, resultNode, core, state);
      if (values) {
        state.lastValidValues = values;
        saveState(values, state, core, storageStatus);
      }
    });
    for (const [section, details] of Object.entries(sectionNodes)) {
      details.addEventListener("toggle", () => {
        state.sections[section] = details.open;
        if (state.lastValidValues) {
          saveState(state.lastValidValues, state, core, storageStatus);
        }
      });
    }
  }

  async function initializeAll() {
    const core = globalThis.TrickcalResearchCalculator;
    const iconMap = await loadItemIcons();
    for (const container of document.querySelectorAll("[data-research-calculator]")) {
      if (!core) {
        container.textContent = "計算機の読み込みに失敗しました。ページを再読み込みしてください。";
        continue;
      }
      initializeCalculator(container, core, iconMap);
    }
  }

  if (globalThis.document$ && typeof globalThis.document$.subscribe === "function") {
    globalThis.document$.subscribe(() => { void initializeAll(); });
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => { void initializeAll(); }, { once: true });
  } else {
    void initializeAll();
  }
})();
