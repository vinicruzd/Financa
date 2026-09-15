(() => {
  "use strict";

  const CATEGORIES = [
    "Moradia", "Alimentação", "Transporte", "Saúde", "Educação",
    "Lazer", "Vestuário", "Contas Fixas", "Assinaturas",
    "Cuidados Pessoais", "Investimentos", "Doações", "Outros"
  ];

  const STORAGE_TX = "livrocaixa_transacoes";
  const STORAGE_BUDGET = "livrocaixa_orcamentos";

  const currencyFmt = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

  // ---------- State ----------
  let transactions = loadTransactions();
  let budgets = loadBudgets();
  let currentTipo = "Despesa";
  let chart = null;

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
  const chartCanvas = document.getElementById("categoryChart");
  const chartEmpty = document.getElementById("chartEmpty");
  const exportBtn = document.getElementById("exportBtn");
  const importInput = document.getElementById("importInput");
  const editBudgetsBtn = document.getElementById("editBudgetsBtn");
  const budgetModalOverlay = document.getElementById("budgetModalOverlay");
  const budgetForm = document.getElementById("budgetForm");
  const closeBudgetModal = document.getElementById("closeBudgetModal");
  const saveBudgetsBtn = document.getElementById("saveBudgetsBtn");

  // ---------- Init ----------
  function init() {
    CATEGORIES.forEach(cat => {
      const opt = document.createElement("option");
      opt.value = cat;
      opt.textContent = cat;
      fCategoria.appendChild(opt);
    });

    const today = new Date();
    fData.value = toDateInputValue(today);
    monthSelect.value = toMonthInputValue(today);

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

  function saveTransactions() {
    localStorage.setItem(STORAGE_TX, JSON.stringify(transactions));
  }

  function saveBudgetsToStorage() {
    localStorage.setItem(STORAGE_BUDGET, JSON.stringify(budgets));
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

  function uid() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
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
    renderChart();
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

    CATEGORIES.forEach(cat => {
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

  function renderChart() {
    const gastos = despesasPorCategoria();
    const labels = Object.keys(gastos);
    const values = Object.values(gastos);

    if (!labels.length) {
      chartCanvas.style.display = "none";
      chartEmpty.style.display = "block";
      if (chart) { chart.destroy(); chart = null; }
      return;
    }

    chartCanvas.style.display = "block";
    chartEmpty.style.display = "none";

    const palette = ["#1f6f4a", "#b8842c", "#b23a2e", "#5a6459", "#3f8c63",
                      "#d1a659", "#c85f52", "#7c8a7f", "#2a5a41", "#94693a"];

    if (chart) chart.destroy();
    chart = new Chart(chartCanvas, {
      type: "doughnut",
      data: {
        labels,
        datasets: [{
          data: values,
          backgroundColor: labels.map((_, i) => palette[i % palette.length]),
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

  // ---------- Budget modal ----------
  function openBudgetModal() {
    budgetForm.innerHTML = "";
    CATEGORIES.forEach(cat => {
      const row = document.createElement("div");
      row.className = "budget-form-row";
      row.innerHTML = `<label for="b_${cat}">${cat}</label>`;
      const input = document.createElement("input");
      input.type = "number";
      input.min = "0";
      input.step = "0.01";
      input.id = "b_" + cat;
      input.value = budgets[cat] || "";
      input.placeholder = "0,00";
      row.appendChild(input);
      budgetForm.appendChild(row);
    });
    budgetModalOverlay.classList.add("is-open");
  }

  function closeBudgetModalFn() {
    budgetModalOverlay.classList.remove("is-open");
  }

  function saveBudgets() {
    CATEGORIES.forEach(cat => {
      const input = document.getElementById("b_" + cat);
      const v = parseFloat(input.value);
      budgets[cat] = v > 0 ? Math.round(v * 100) / 100 : 0;
    });
    saveBudgetsToStorage();
    closeBudgetModalFn();
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
        transactions.push({
          id: uid(),
          data,
          descricao,
          categoria: CATEGORIES.includes(categoria) ? categoria : "Outros",
          tipo: tipo === "Receita" ? "Receita" : "Despesa",
          valor: Math.round(v * 100) / 100
        });
        imported++;
      });
      if (imported) {
        saveTransactions();
        renderAll();
      }
      importInput.value = "";
    };
    reader.readAsText(file, "UTF-8");
  }

  init();
})();
