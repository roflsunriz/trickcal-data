(function () {
  "use strict";

  const MAX_COUNT = 99_999_999;
  const numberFormat = new Intl.NumberFormat("ja-JP");

  function element(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
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
    input.setAttribute("aria-label", `${item}の${field === "targets" ? "目標数" : "所持数"}`);
    return input;
  }

  function inputTable(stage, items, columns) {
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
      row.append(element("th", "", item));
      for (const column of columns) {
        const cell = document.createElement("td");
        cell.append(numberInput(item, column.field, stage));
        row.append(cell);
      }
      body.append(row);
    }
    table.append(body);
    wrapper.append(table);
    return wrapper;
  }

  function inputSection(title, description, table, open) {
    const details = element("details", "research-calculator__inputs");
    details.open = open;
    details.append(element("summary", "", title));
    details.append(element("p", "research-calculator__hint", description));
    details.append(table);
    return details;
  }

  function resultTable(headers, rows) {
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
        const cell = element(index === 0 ? "th" : "td", "", value);
        row.append(cell);
      });
      body.append(row);
    }
    table.append(body);
    wrapper.append(table);
    return wrapper;
  }

  function readInputs(container, fixedDirect) {
    const values = { targets: {}, direct: { ...fixedDirect }, stock: {} };
    const errors = [];
    for (const input of container.querySelectorAll("input[data-item][data-field]")) {
      const value = input.value.trim() === "" ? 0 : Number(input.value);
      const valid = Number.isSafeInteger(value) && value >= 0 && value <= MAX_COUNT;
      input.setAttribute("aria-invalid", String(!valid));
      if (!valid) {
        errors.push(`${input.dataset.item}は0～${numberFormat.format(MAX_COUNT)}の整数で入力してください`);
        continue;
      }
      values[input.dataset.field][input.dataset.item] = value;
    }
    return { values, errors };
  }

  function setAllInputs(container, value) {
    for (const input of container.querySelectorAll("input[data-item][data-field]")) {
      input.value = String(value);
      input.setAttribute("aria-invalid", "false");
    }
  }

  function renderPresetNote(noteNode, direct) {
    const entries = Object.entries(direct).filter(([, quantity]) => quantity > 0);
    noteNode.hidden = entries.length === 0;
    noteNode.textContent = entries.length
      ? `第10段階で研究に直接使う中間生成物も自動加算しています: ${entries.map(([item, quantity]) => `${item} ${numberFormat.format(quantity)}個`).join("、")}`
      : "";
  }

  function setPreset(container, stage, core, state, noteNode) {
    setAllInputs(container, 0);
    const preset = core.getPreset(stage);
    state.direct = { ...preset.direct };
    for (const [item, value] of Object.entries(preset.targets)) {
      const input = container.querySelector(`input[data-field="targets"][data-item="${item}"]`);
      if (input) input.value = String(value);
    }
    renderPresetNote(noteNode, state.direct);
  }

  function renderResults(container, resultNode, core, state) {
    const { values, errors } = readInputs(container, state.direct);
    resultNode.replaceChildren();
    if (errors.length) {
      const list = element("ul", "research-calculator__errors");
      for (const error of errors) list.append(element("li", "", error));
      resultNode.append(list);
      return;
    }

    let result;
    try {
      result = core.calculate(values);
    } catch (error) {
      resultNode.append(element("p", "research-calculator__errors", error.message));
      return;
    }

    const craftRows = core.CRAFT_ORDER
      .filter((item) => {
        const entry = result.plan[item];
        return entry.demand > 0 || entry.owned > 0;
      })
      .map((item) => {
        const entry = result.plan[item];
        return [
          item,
          numberFormat.format(entry.demand),
          numberFormat.format(entry.stockUsed),
          numberFormat.format(entry.craft),
          numberFormat.format(entry.remaining),
        ];
      });
    resultNode.append(element("h4", "", "クラフト計画"));
    if (craftRows.length) {
      resultNode.append(
        resultTable(["アイテム", "必要総数", "所持から使用", "クラフト", "使用後の残数"], craftRows),
      );
    } else {
      resultNode.append(element("p", "", "目標数を入力してください。"));
    }

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
    resultNode.append(element("h4", "", "基礎素材"));
    resultNode.append(resultTable(["素材", "消費", "所持", "不足", "使用後の残数"], rawRows));
    const shortages = core.RAW_ITEMS.filter((item) => result.raw[item].shortage > 0);
    resultNode.append(
      element(
        "p",
        shortages.length ? "research-calculator__summary is-short" : "research-calculator__summary is-ready",
        shortages.length
          ? `不足している基礎素材が${shortages.length}種類あります。`
          : "所持している基礎素材でクラフトできます。",
      ),
    );
  }

  function initializeCalculator(container, core) {
    if (container.dataset.initialized === "true") return;
    container.dataset.initialized = "true";
    const stage = Number(container.dataset.stage);
    const state = { direct: {} };
    container.replaceChildren();

    container.append(
      element(
        "p",
        "research-calculator__description",
        "目標数と現在の所持数を入力すると、追加でクラフトする成果物・中間生成物と、不足する基礎素材を計算します。入力内容は保存・送信されません。",
      ),
    );

    const controls = element("div", "research-calculator__controls");
    for (const presetStage of [10, 11, 12]) {
      const button = element("button", "research-calculator__button", `第${presetStage}段階を設定`);
      button.type = "button";
      button.dataset.preset = String(presetStage);
      if (presetStage === stage) button.classList.add("is-current");
      controls.append(button);
    }
    const clear = element("button", "research-calculator__button is-secondary", "すべて0にする");
    clear.type = "button";
    clear.dataset.action = "clear";
    controls.append(clear);
    container.append(controls);
    const presetNote = element("p", "research-calculator__preset-note");
    presetNote.hidden = true;
    container.append(presetNote);

    container.append(
      inputSection(
        "最終成果物",
        "完成後に必要な目標数と、すでに持っている数を入力します。",
        inputTable(stage, core.FINAL_ITEMS, [
          { field: "targets", label: "目標数" },
          { field: "stock", label: "所持数" },
        ]),
        true,
      ),
    );
    container.append(
      inputSection(
        "中間生成物",
        "現在の所持数を入力します。上位アイテムから必要数を自動計算し、所持分を差し引きます。",
        inputTable(stage, core.INTERMEDIATE_ITEMS, [{ field: "stock", label: "所持数" }]),
        false,
      ),
    );
    container.append(
      inputSection(
        "基礎素材の所持数",
        "クラフトに使える基礎素材の現在庫を入力します。",
        inputTable(stage, core.RAW_ITEMS, [{ field: "stock", label: "所持数" }]),
        true,
      ),
    );

    const resultNode = element("div", "research-calculator__results");
    resultNode.setAttribute("aria-live", "polite");
    container.append(resultNode);

    container.addEventListener("input", () => renderResults(container, resultNode, core, state));
    container.addEventListener("click", (event) => {
      const button = event.target.closest("button");
      if (!button) return;
      if (button.dataset.preset) {
        setPreset(container, Number(button.dataset.preset), core, state, presetNote);
      }
      if (button.dataset.action === "clear") {
        setAllInputs(container, 0);
        state.direct = {};
        renderPresetNote(presetNote, state.direct);
      }
      renderResults(container, resultNode, core, state);
    });

    setPreset(container, stage, core, state, presetNote);
    renderResults(container, resultNode, core, state);
  }

  function initializeAll() {
    const core = globalThis.TrickcalResearchCalculator;
    for (const container of document.querySelectorAll("[data-research-calculator]")) {
      if (!core) {
        container.textContent = "計算機の読み込みに失敗しました。ページを再読み込みしてください。";
        continue;
      }
      initializeCalculator(container, core);
    }
  }

  if (globalThis.document$ && typeof globalThis.document$.subscribe === "function") {
    globalThis.document$.subscribe(initializeAll);
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initializeAll, { once: true });
  } else {
    initializeAll();
  }
})();
