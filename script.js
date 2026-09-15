(() => {
  "use strict";

  const DEFAULT_CATEGORIES = [
    "Moradia", "Alimentação", "Transporte", "Saúde", "Educação",
    "Lazer", "Vestuário", "Contas Fixas", "Assinaturas",
    "Cuidados Pessoais", "Investimentos", "Doações", "Outros"
  ];

  const STORAGE_TX = "livrocaixa_transacoes";
  const STORAGE_BUDGET = "livrocaixa_orcamentos";
  const STORAGE_CATEGORIES = "livrocaixa_categorias";

  const MONTH_LABELS = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];

  const currencyFmt = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

  // ---------- State ----------
  let transactions = loadTransactions();
  let budgets = loadBudgets();
  let categories = loadCategories();
  let currentTipo = "Despesa";
  let categoryChart = null;
  let trendChart = null;

  // ---------- Elements ----------
  const monthSelect = document.getElementById("monthSelect");
  const entryForm = document.getElementById("entryForm");
  const fData = document.getElementById("fData");
  const fDescricao = document.getElementById("fDescricao");
  const fCategoria = document.getElementById("fCategoria");
  const fValor = document.getElementById("fValor");
  const tipoToggle = document.getElementById("tipoToggle");
  const ledgerBody = document.getElementById("ledgerBody");
  const emptyState = document.getElementById("emptyState");
  const balanceValue = document.getElementById("balanceValue");
  const sumReceitas = document.getElementById("sumReceitas");
  const sumDespesas = document.getElementById("sumDespesas");
  const sumSaldo = document.getElementById("sumSaldo");
  const budgetList = document.getElementById("budgetList");
  const categoryChartCanvas = document.getElementById("categoryChart");
  const chartEmpty = document.getElementById("chartEmpty");
  const trendChartCanvas = document.getElementById("trendChart");
  const exportBtn = document.getElementById("exportBtn");
  const importInput = document.getElementById("importInput");
  const editBudgetsBtn = document.getElementById("editBudgetsBtn");
  const budgetModalOverlay = document.getElementById("budgetModalOverlay");
  const budgetForm = document.getElementById("budgetForm");
  const closeBudgetModal = document.getElementById("closeBudgetModal");
  const saveBudgetsBtn = document.getElementById("saveBudgetsBtn");
  const newCatBtn = document.getElementById("newCatBtn");
  const newCatInline = document.getElementById("newCatInline");
  const newCatInput = document.getElementById("newCatInput");
  const newCatConfirm = document.getElementById("newCatConfirm");
  const newCatModalInput = document.getElementById("newCatModalInput");
  const newCatModalConfirm = document.getElementById("newCatModalConfirm");

  // Categories currently listed inside the open modal (may include unsaved additions/removals)
  let modalCategories = [];

  // ---------- Init ----------
  function init() {
    const today = new Date();
    fData.value = toDateInputValue(today);
    monthSelect.value = toMonthInputValue(today);

    renderCategorySelect();

    tipoToggle.addEventListener("click", (e) => {
      const btn = e.target.closest(".toggle-opt");
      if (!btn) return;
      currentTipo = btn.dataset.tipo;
      [...tipoToggle.children].forEach(b => b.classList.toggle("is-active", b === btn));
    });

    entryForm.addEventListener("submit", onAddTransaction);
    monthSelect.addEventListener("change", renderAll);
    exportBtn.addEventListener("click", exportCsv);
    importInput.addEventListener("change", importCsv);
    editBudgetsBtn.addEventListener("click", openBudgetModal);
    closeBudgetModal.addEventListener("click", closeBudgetModalFn);
    budgetModalOverlay.addEventListener("click", (e) => {
      if (e.target === budgetModalOverlay) closeBudgetModalFn();
    });
    saveBudgetsBtn.addEventListener("click", saveBudgets);

    newCatBtn.addEventListener("click", () => {
      newCatInline.hidden = !newCatInline.hidden;
      if (!newCatInline.hidden) newCatInput.focus();
    });
    newCatConfirm.addEventListener("click", () => {
      const added = addCategory(newCatInput.value);
      if (added) {
        newCatInput.value = "";
        newCatInline.hidden = true;
        renderCategorySelect();
        fCategoria.value = added;
      }
    });
    newCatInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") { e.preventDefault(); newCatConfirm.click(); }
    });

    newCatModalConfirm.addEventListener("click", () => {
      const name = (newCatModalInput.value || "").trim();
      if (!name || modalCategories.includes(name)) return;
      modalCategories.push(name);
      newCatModalInput.value = "";
      renderBudgetFormRows();
    });
    newCatModalInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") { e.preventDefault(); newCatModalConfirm.click(); }
    });

    renderAll();
  }

  // ---------- Storage ----------
  function loadTransactions() {
    try {
      const raw = localStorage.getItem(STORAGE_TX);
      return raw ? JSON.parse(raw) : [];
    } catch { return []; }
  }

  function loadBudgets() {
    try {
      const raw = localStorage.getItem(STORAGE_BUDGET);
      return raw ? JSON.parse(raw) : {};
    } catch { return {}; }
  }

  function loadCategories() {
    try {
      const raw = localStorage.getItem(STORAGE_CATEGORIES);
      if (raw) return JSON.parse(raw);
    } catch { /* fall through to default */ }
    localStorage.setItem(STORAGE_CATEGORIES, JSON.stringify(DEFAULT_CATEGORIES));
    return DEFAULT_CATEGORIES.slice();
  }

  function saveTransactions() {
    localStorage.setItem(STORAGE_TX, JSON.stringify(transactions));
  }

  function saveBudgetsToStorage() {
    localStorage.setItem(STORAGE_BUDGET, JSON.stringify(budgets));
  }

  function saveCategoriesToStorage() {
    localStorage.setItem(STORAGE_CATEGORIES, JSON.stringify(categories));
  }

  // ---------- Helpers ----------
  function toDateInputValue(date) {
    return date.toISOString().slice(0, 10);
  }

  function toMonthInputValue(date) {
    return date.toISOString().slice(0, 7);
  }

  function monthOf(dateStr) {
    return dateStr.slice(0, 7);
  }

  function formatDateDisplay(dateStr) {
    const [y, m, d] = dateStr.split("-");
    return `${d}/${m}/${y}`;
  }

  function monthLabel(monthStr) {
    const [y, m] = monthStr.split("-");
    return `${MONTH_LABELS[parseInt(m, 10) - 1]}/${y.slice(2)}`;
  }

  function uid() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  }

  // ---------- Categories ----------
  function addCategory(rawName) {
    const name = (rawName || "").trim();
    if (!name || categories.includes(name)) return null;
    categories.push(name);
    saveCategoriesToStorage();
    return name;
  }

  function renderCategorySelect() {
    const prev = fCategoria.value;
    fCategoria.innerHTML = "";
    categories.forEach(cat => {
      const opt = document.createElement("option");
      opt.value = cat;
      opt.textContent = cat;
      fCategoria.appendChild(opt);
    });
    if (categories.includes(prev)) fCategoria.value = prev;
  }

  // ---------- Add transaction ----------
  function onAddTransaction(e) {
    e.preventDefault();
    const valor = parseFloat(fValor.value);
    if (!fData.value || !fDescricao.value.trim() || !valor || valor <= 0) return;

    transactions.push({
      id: uid(),
      data: fData.value,
      descricao: fDescricao.value.trim(),
      categoria: fCategoria.value,
      tipo: currentTipo,
      valor: Math.round(valor * 100) / 100
    });

    saveTransactions();
    fDescricao.value = "";
    fValor.value = "";
    fDescricao.focus();
    monthSelect.value = monthOf(fData.value);
    renderAll();
  }

  function deleteTransaction(id) {
    transactions = transactions.filter(t => t.id !== id);
    saveTransactions();
    renderAll();
  }

  // ---------- Render ----------
  function currentMonthTransactions() {
    const m = monthSelect.value;
    return transactions
      .filter(t => monthOf(t.data) === m)
      .sort((a, b) => a.data < b.data ? 1 : -1);
  }

  function renderAll() {
    renderLedger();
    renderSummary();
    renderBudgets();
    renderCategoryChart();
    renderTrendChart();
  }

  function renderLedger() {
    const rows = currentMonthTransactions();
    ledgerBody.innerHTML = "";
    emptyState.style.display = rows.length ? "none" : "block";

    rows.forEach(t => {
      const tr = document.createElement("tr");

      const tdData = document.createElement("td");
      tdData.textContent = formatDateDisplay(t.data);

      const tdDesc = document.createElement("td");
      tdDesc.textContent = t.descricao;

      const tdCat = document.createElement("td");
      const tag = document.createElement("span");
      tag.className = "cat-tag";
      tag.textContent = t.categoria;
      tdCat.appendChild(tag);

      const tdValor = document.createElement("td");
      tdValor.className = "col-valor " + (t.tipo === "Receita" ? "is-green" : "is-red");
      tdValor.textContent = (t.tipo === "Receita" ? "" : "− ") + currencyFmt.format(t.valor);

      const tdDel = document.createElement("td");
      const btn = document.createElement("button");
      btn.className = "row-del";
      btn.title = "Excluir lançamento";
      btn.textContent = "✕";
      btn.addEventListener("click", () => deleteTransaction(t.id));
      tdDel.appendChild(btn);

      tr.append(tdData, tdDesc, tdCat, tdValor, tdDel);
      ledgerBody.appendChild(tr);
    });
  }

  function renderSummary() {
    const rows = currentMonthTransactions();
    const receitas = rows.filter(t => t.tipo === "Receita").reduce((s, t) => s + t.valor, 0);
    const despesas = rows.filter(t => t.tipo === "Despesa").reduce((s, t) => s + t.valor, 0);
    const saldo = receitas - despesas;

    sumReceitas.textContent = currencyFmt.format(receitas);
    sumDespesas.textContent = currencyFmt.format(despesas);
    sumSaldo.textContent = currencyFmt.format(saldo);
    balanceValue.textContent = currencyFmt.format(saldo);
    balanceValue.classList.toggle("is-negative", saldo < 0);
  }

  function despesasPorCategoria() {
    const rows = currentMonthTransactions().filter(t => t.tipo === "Despesa");
    const map = {};
    rows.forEach(t => { map[t.categoria] = (map[t.categoria] || 0) + t.valor; });
    return map;
  }

  function renderBudgets() {
    const gastos = despesasPorCategoria();
    budgetList.innerHTML = "";

    categories.forEach(cat => {
      const orc = budgets[cat] || 0;
      const gasto = gastos[cat] || 0;
      if (orc === 0 && gasto === 0) return;

      const pct = orc > 0 ? gasto / orc : (gasto > 0 ? 1 : 0);
      const item = document.createElement("div");
      item.className = "budget-item";

      const top = document.createElement("div");
      top.className = "budget-item-top";
      top.innerHTML = `<span class="cat-name">${cat}</span><span class="cat-nums">${currencyFmt.format(gasto)} / ${currencyFmt.format(orc)}</span>`;

      const bar = document.createElement("div");
      bar.className = "budget-bar";
      const fill = document.createElement("div");
      fill.className = "budget-bar-fill";
      if (pct >= 1) fill.classList.add("is-over-100");
      else if (pct >= 0.8) fill.classList.add("is-over");
      fill.style.width = Math.min(pct, 1) * 100 + "%";
      bar.appendChild(fill);

      item.append(top, bar);
      budgetList.appendChild(item);
    });

    if (!budgetList.children.length) {
      budgetList.innerHTML = '<p class="panel-note">Defina orçamentos ou registre despesas para ver o progresso aqui.</p>';
    }
  }

  const PALETTE = ["#1f6f4a", "#b8842c", "#b23a2e", "#5a6459", "#3f8c63",
                    "#d1a659", "#c85f52", "#7c8a7f", "#2a5a41", "#94693a",
                    "#6a7fae", "#a45c8c", "#4f8a8b"];

  function renderCategoryChart() {
    const gastos = despesasPorCategoria();
    const labels = Object.keys(gastos);
    const values = Object.values(gastos);

    if (!labels.length) {
      categoryChartCanvas.style.display = "none";
      chartEmpty.style.display = "block";
      if (categoryChart) { categoryChart.destroy(); categoryChart = null; }
      return;
    }

    categoryChartCanvas.style.display = "block";
    chartEmpty.style.display = "none";

    if (categoryChart) categoryChart.destroy();
    categoryChart = new Chart(categoryChartCanvas, {
      type: "doughnut",
      data: {
        labels,
        datasets: [{
          data: values,
          backgroundColor: labels.map((_, i) => PALETTE[i % PALETTE.length]),
          borderColor: "#f8f7f1",
          borderWidth: 2
        }]
      },
      options: {
        plugins: {
          legend: {
            position: "bottom",
            labels: { font: { family: "Inter", size: 11 }, color: "#1b2a22", boxWidth: 10, padding: 10 }
          }
        }
      }
    });
  }

  function lastSixMonths(anchorMonthStr) {
    const [y, m] = anchorMonthStr.split("-").map(Number);
    const months = [];
    for (let i = 5; i >= 0; i--) {
      let year = y, month = m - i;
      while (month <= 0) { month += 12; year -= 1; }
      months.push(`${year}-${String(month).padStart(2, "0")}`);
    }
    return months;
  }

  function renderTrendChart() {
    const months = lastSixMonths(monthSelect.value);
    const receitasData = months.map(m =>
      transactions.filter(t => monthOf(t.data) === m && t.tipo === "Receita").reduce((s, t) => s + t.valor, 0)
    );
    const despesasData = months.map(m =>
      transactions.filter(t => monthOf(t.data) === m && t.tipo === "Despesa").reduce((s, t) => s + t.valor, 0)
    );

    if (trendChart) trendChart.destroy();
    trendChart = new Chart(trendChartCanvas, {
      type: "bar",
      data: {
        labels: months.map(monthLabel),
        datasets: [
          { label: "Receitas", data: receitasData, backgroundColor: "#1f6f4a" },
          { label: "Despesas", data: despesasData, backgroundColor: "#b23a2e" }
        ]
      },
      options: {
        scales: {
          y: { beginAtZero: true, ticks: { font: { family: "IBM Plex Mono", size: 10 } } },
          x: { ticks: { font: { family: "Inter", size: 11 } } }
        },
        plugins: {
          legend: {
            position: "bottom",
            labels: { font: { family: "Inter", size: 11 }, color: "#1b2a22", boxWidth: 10, padding: 10 }
          }
        }
      }
    });
  }

  // ---------- Categories & budget modal ----------
  function openBudgetModal() {
    modalCategories = categories.slice();
    renderBudgetFormRows();
    budgetModalOverlay.classList.add("is-open");
  }

  function renderBudgetFormRows() {
    budgetForm.innerHTML = "";
    modalCategories.forEach(cat => {
      const row = document.createElement("div");
      row.className = "budget-form-row";

      const label = document.createElement("label");
      label.textContent = cat;
      label.setAttribute("for", "b_" + cat);

      const input = document.createElement("input");
      input.type = "number";
      input.min = "0";
      input.step = "0.01";
      input.id = "b_" + cat;
      input.dataset.cat = cat;
      input.value = budgets[cat] || "";
      input.placeholder = "0,00";

      const del = document.createElement("button");
      del.type = "button";
      del.className = "row-del";
      del.title = "Excluir categoria";
      del.textContent = "✕";
      del.addEventListener("click", () => {
        modalCategories = modalCategories.filter(c => c !== cat);
        renderBudgetFormRows();
      });

      row.append(label, input, del);
      budgetForm.appendChild(row);
    });

    if (!modalCategories.length) {
      budgetForm.innerHTML = '<p class="panel-note">Nenhuma categoria. Adicione uma abaixo.</p>';
    }
  }

  function closeBudgetModalFn() {
    budgetModalOverlay.classList.remove("is-open");
  }

  function saveBudgets() {
    const newBudgets = {};
    modalCategories.forEach(cat => {
      const input = document.getElementById("b_" + cat);
      const v = input ? parseFloat(input.value) : 0;
      newBudgets[cat] = v > 0 ? Math.round(v * 100) / 100 : 0;
    });
    categories = modalCategories.slice();
    budgets = newBudgets;
    saveCategoriesToStorage();
    saveBudgetsToStorage();
    closeBudgetModalFn();
    renderCategorySelect();
    renderAll();
  }

  // ---------- CSV export/import ----------
  function exportCsv() {
    const header = "data,descricao,categoria,tipo,valor";
    const lines = transactions
      .slice()
      .sort((a, b) => a.data < b.data ? -1 : 1)
      .map(t => [t.data, csvEscape(t.descricao), t.categoria, t.tipo, t.valor.toFixed(2)].join(","));
    const csv = [header, ...lines].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "livro-caixa-transacoes.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  function csvEscape(value) {
    if (/[",\n]/.test(value)) return '"' + value.replace(/"/g, '""') + '"';
    return value;
  }

  function parseCsvLine(line) {
    const result = [];
    let cur = "", inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const c = line[i];
      if (inQuotes) {
        if (c === '"' && line[i + 1] === '"') { cur += '"'; i++; }
        else if (c === '"') { inQuotes = false; }
        else { cur += c; }
      } else {
        if (c === '"') inQuotes = true;
        else if (c === ",") { result.push(cur); cur = ""; }
        else cur += c;
      }
    }
    result.push(cur);
    return result;
  }

  function importCsv(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const text = reader.result;
      const lines = text.split(/\r?\n/).filter(l => l.trim().length);
      let imported = 0;
      lines.slice(1).forEach(line => {
        const [data, descricao, categoria, tipo, valor] = parseCsvLine(line);
        const v = parseFloat(valor);
        if (!data || !descricao || !v) return;
        if (categoria && !categories.includes(categoria)) {
          categories.push(categoria);
        }
        transactions.push({
          id: uid(),
          data,
          descricao,
          categoria: categoria || "Outros",
          tipo: tipo === "Receita" ? "Receita" : "Despesa",
          valor: Math.round(v * 100) / 100
        });
        imported++;
      });
      if (imported) {
        saveTransactions();
        saveCategoriesToStorage();
        renderCategorySelect();
        renderAll();
      }
      importInput.value = "";
    };
    reader.readAsText(file, "UTF-8");
  }

  init();
})();
