const form = document.querySelector("#travelForm");
const submitBtn = document.querySelector("#submitBtn");
const result = document.querySelector("#result");
const roadResult = document.querySelector("#roadResult");
const toast = document.querySelector("#toast");
const loadLastBtn = document.querySelector("#loadLastBtn");
const showHistoryBtn = document.querySelector("#showHistoryBtn");
const bottomHistoryBtn = document.querySelector("#bottomHistoryBtn");
const historyPanel = document.querySelector("#historyPanel");
const historyList = document.querySelector("#historyList");
const radarBase = document.querySelector("#radarBase");

const STORAGE_KEY = "teLevoAiUltimoRoteiroV32";
const HISTORY_KEY = "teLevoAiHistoricoV32";

let ultimoPlano = null;
let ultimosDados = null;
let ultimoModo = "demo";

const titulos = {
  melhorHorario: "⏰ Melhor horário",
  roteiro: "🗺️ Roteiro sugerido",
  paradasInteligentes: "📍 Paradas inteligentes",
  hospedagem: "🏨 Hospedagem",
  alimentacao: "🍽️ Alimentação",
  combustivel: "⛽ Combustível",
  custosEstimados: "💰 Custos estimados",
  checklist: "🧳 Checklist",
  seguranca: "🛡️ Segurança",
  alertas: "⚠️ Alertas importantes",
  proximosPassos: "✅ Próximos passos"
};

function getFormData() {
  const dados = Object.fromEntries(new FormData(form).entries());
  dados.extras = new FormData(form).getAll("extras");
  return dados;
}

function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.remove("hidden");
  setTimeout(() => toast.classList.add("hidden"), 2200);
}

function planoParaTexto(plano = {}) {
  const partes = [`Te Levo.AI - Roteiro de viagem`, plano.resumo || ""];

  Object.entries(titulos).forEach(([chave, titulo]) => {
    const valor = plano[chave];
    if (!valor) return;

    partes.push(`\n${titulo}`);
    if (Array.isArray(valor)) {
      valor.forEach((item) => partes.push(`- ${item}`));
    } else {
      partes.push(String(valor));
    }
  });

  partes.push("\nDo roteiro à estrada, a IA vai com você.");
  return partes.filter(Boolean).join("\n");
}

function abrirGoogleMaps(dados = {}) {
  const origem = encodeURIComponent(dados.origem || "");
  const destino = encodeURIComponent(dados.destino || "");

  if (!origem || !destino) return "#";

  return `https://www.google.com/maps/dir/?api=1&origin=${origem}&destination=${destino}&travelmode=driving`;
}

function abrirWaze(dados = {}) {
  const destino = encodeURIComponent(dados.destino || "");
  if (!destino) return "#";
  return `https://waze.com/ul?q=${destino}&navigate=yes`;
}

function buscaRadar(termo) {
  const dados = getFormData();
  const baseEscolhida = radarBase?.value || "destino";
  let queryBase = dados.destino || dados.origem || "minha localização";

  if (baseEscolhida === "origem") {
    queryBase = dados.origem || dados.destino || "minha localização";
  }

  if (baseEscolhida === "caminho") {
    const origem = dados.origem || "origem";
    const destino = dados.destino || "destino";
    queryBase = `no caminho de ${origem} para ${destino}`;
  }

  const query = encodeURIComponent(`${termo} ${queryBase}`);
  window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, "_blank", "noopener");
}

function whatsappUrl(plano = {}) {
  const texto = encodeURIComponent(planoParaTexto(plano));
  return `https://wa.me/?text=${texto}`;
}

function accordionCard(chave, titulo, dados, aberto = false) {
  if (!dados || (Array.isArray(dados) && dados.length === 0)) return "";
  const isAlert = chave === "alertas";
  const conteudo = Array.isArray(dados)
    ? `<ul>${dados.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>`
    : `<p>${escapeHtml(dados)}</p>`;

  return `
    <article class="accordion-card ${aberto ? "open" : ""} ${isAlert ? "alert-card" : ""}">
      <button class="accordion-trigger" type="button" aria-expanded="${aberto}">
        <strong>${titulo}</strong>
        <span class="chevron">⌄</span>
      </button>
      <div class="accordion-content">${conteudo}</div>
    </article>
  `;
}

function bindAccordions() {
  document.querySelectorAll(".accordion-trigger").forEach((button) => {
    button.addEventListener("click", () => {
      const card = button.closest(".accordion-card");
      const open = card.classList.toggle("open");
      button.setAttribute("aria-expanded", String(open));
    });
  });
}

function carregarHistorico() {
  try {
    return JSON.parse(localStorage.getItem(HISTORY_KEY)) || [];
  } catch {
    return [];
  }
}

function chaveHistorico(item) {
  return `${item.dados?.origem || ""}|${item.dados?.destino || ""}|${item.dados?.data || ""}|${item.plano?.resumo || ""}`;
}

function salvarNoHistorico(item) {
  const historico = carregarHistorico();
  const chave = chaveHistorico(item);
  const filtrado = historico.filter((salvo) => chaveHistorico(salvo) !== chave);
  filtrado.unshift(item);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(filtrado.slice(0, 10)));
}

function salvarAutomaticamente(plano, modo, dados) {
  const item = { plano, modo, dados, salvoEm: new Date().toISOString(), automatico: true };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(item));
  salvarNoHistorico(item);
}

function renderHistorico() {
  const historico = carregarHistorico();
  historyPanel.classList.remove("hidden");

  if (!historico.length) {
    historyList.innerHTML = `<div class="history-item"><strong>Nenhum roteiro salvo ainda.</strong><small>Gere um roteiro para salvar automaticamente.</small></div>`;
    historyPanel.scrollIntoView({ behavior: "smooth", block: "start" });
    return;
  }

  historyList.innerHTML = `
    <div class="history-toolbar">
      <button type="button" class="ghost-button" id="clearHistoryBtn">🧹 Limpar histórico</button>
    </div>
    ${historico.map((item, index) => {
      const origem = item.dados?.origem || "Origem";
      const destino = item.dados?.destino || "Destino";
      const data = item.dados?.data || "sem data";
      const salvo = item.salvoEm ? new Date(item.salvoEm).toLocaleString("pt-BR") : "salvo recentemente";
      return `
        <div class="history-item">
          <strong>${escapeHtml(origem)} → ${escapeHtml(destino)}</strong>
          <small>${escapeHtml(data)} • ${escapeHtml(salvo)}</small>
          <div class="history-actions">
            <button type="button" data-history-open="${index}">Abrir</button>
            <button type="button" class="ghost-button" data-history-copy="${index}">Copiar</button>
            <button type="button" class="ghost-button" data-history-remove="${index}">Apagar</button>
          </div>
        </div>
      `;
    }).join("")}
  `;

  historyList.querySelector("#clearHistoryBtn")?.addEventListener("click", () => {
    localStorage.removeItem(HISTORY_KEY);
    localStorage.removeItem(STORAGE_KEY);
    renderHistorico();
    showToast("Histórico limpo.");
  });

  historyList.querySelectorAll("[data-history-open]").forEach((button) => {
    button.addEventListener("click", () => {
      const item = carregarHistorico()[Number(button.dataset.historyOpen)];
      if (item) renderPlano(item.plano, item.modo, item.dados, { autoSave: false });
    });
  });

  historyList.querySelectorAll("[data-history-copy]").forEach((button) => {
    button.addEventListener("click", async () => {
      const item = carregarHistorico()[Number(button.dataset.historyCopy)];
      if (!item) return;
      await navigator.clipboard.writeText(planoParaTexto(item.plano));
      showToast("Roteiro copiado!");
    });
  });

  historyList.querySelectorAll("[data-history-remove]").forEach((button) => {
    button.addEventListener("click", () => {
      const index = Number(button.dataset.historyRemove);
      const historico = carregarHistorico().filter((_, i) => i !== index);
      localStorage.setItem(HISTORY_KEY, JSON.stringify(historico));
      renderHistorico();
      showToast("Roteiro apagado.");
    });
  });

  historyPanel.scrollIntoView({ behavior: "smooth", block: "start" });
  marcarNavAtiva("historyPanel");
}

function montarResumoDados(dados = {}, plano = {}) {
  const origem = dados.origem || "Origem";
  const destino = dados.destino || "Destino";
  const data = dados.data || "Sem data";
  const pessoas = dados.pessoas || "-";
  const custo = Array.isArray(plano.custosEstimados)
    ? plano.custosEstimados.find((item) => String(item).toLowerCase().includes("total")) || "Ver custos"
    : "Ver custos";

  return `
    <div class="result-summary">
      <div class="summary-chip"><small>Rota</small><strong>${escapeHtml(origem)} → ${escapeHtml(destino)}</strong></div>
      <div class="summary-chip"><small>Data</small><strong>${escapeHtml(data)}</strong></div>
      <div class="summary-chip"><small>Pessoas</small><strong>${escapeHtml(pessoas)}</strong></div>
      <div class="summary-chip"><small>Custo</small><strong>${escapeHtml(custo)}</strong></div>
    </div>
  `;
}

function renderPlano(plano, modo, dados = {}, opcoes = { autoSave: true }) {
  result.classList.remove("hidden");
  ultimoPlano = plano;
  ultimosDados = dados;
  ultimoModo = modo;

  if (opcoes.autoSave) {
    salvarAutomaticamente(plano, modo, dados);
  }

  const mapsUrl = abrirGoogleMaps(dados);
  const wazeUrl = abrirWaze(dados);
  const whatsUrl = whatsappUrl(plano);

  result.innerHTML = `
    <div class="result-head">
      <h2>Plano pronto ✨</h2>
      <p>${escapeHtml(plano.resumo || "A copilota montou uma sugestão inicial para sua viagem.")}</p>
      ${montarResumoDados(dados, plano)}
      <div class="result-actions">
        <button type="button" id="copyPlanBtn">📋 Copiar</button>
        <button type="button" id="savePlanBtn" class="ghost-button">💾 Salvo</button>
        <button type="button" id="redoPlanBtn" class="ghost-button">🔁 Refazer</button>
        <a class="ghost-link secondary" href="${mapsUrl}" target="_blank" rel="noopener">🗺️ Maps</a>
        <a class="ghost-link secondary" href="${wazeUrl}" target="_blank" rel="noopener">🚙 Waze</a>
        <a class="ghost-link secondary" href="${whatsUrl}" target="_blank" rel="noopener">📲 WhatsApp</a>
      </div>
      <small>${modo === "demo" ? "Modo demo ativo: conecte sua GEMINI_API_KEY para usar IA real." : "Gerado com IA."} Salvo automaticamente no histórico.</small>
    </div>
    ${accordionCard("melhorHorario", titulos.melhorHorario, plano.melhorHorario, true)}
    ${accordionCard("roteiro", titulos.roteiro, plano.roteiro, true)}
    ${accordionCard("paradasInteligentes", titulos.paradasInteligentes, plano.paradasInteligentes)}
    ${accordionCard("hospedagem", titulos.hospedagem, plano.hospedagem)}
    ${accordionCard("alimentacao", titulos.alimentacao, plano.alimentacao)}
    ${accordionCard("combustivel", titulos.combustivel, plano.combustivel)}
    ${accordionCard("custosEstimados", titulos.custosEstimados, plano.custosEstimados, true)}
    ${accordionCard("checklist", titulos.checklist, plano.checklist)}
    ${accordionCard("seguranca", titulos.seguranca, plano.seguranca)}
    ${accordionCard("alertas", titulos.alertas, plano.alertas, true)}
    ${accordionCard("proximosPassos", titulos.proximosPassos, plano.proximosPassos, true)}
  `;

  bindAccordions();

  document.querySelector("#copyPlanBtn")?.addEventListener("click", async () => {
    await navigator.clipboard.writeText(planoParaTexto(plano));
    showToast("Roteiro copiado!");
  });

  document.querySelector("#savePlanBtn")?.addEventListener("click", () => {
    salvarAutomaticamente(plano, modo, dados);
    showToast("Roteiro salvo no histórico!");
  });

  document.querySelector("#redoPlanBtn")?.addEventListener("click", () => {
    if (!ultimosDados) return;
    form.requestSubmit();
  });

  result.scrollIntoView({ behavior: "smooth", block: "start" });
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  const dados = getFormData();
  submitBtn.disabled = true;
  submitBtn.innerHTML = '<span class="loading">Gerando roteiro</span>';

  try {
    const response = await fetch("/api/planejar-viagem", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(dados)
    });

    const data = await response.json();
    renderPlano(data.plano, data.modo, dados, { autoSave: true });
    showToast("Roteiro gerado e salvo!");
  } catch (error) {
    result.classList.remove("hidden");
    result.innerHTML = `
      <article class="accordion-card open alert-card">
        <button class="accordion-trigger" type="button" aria-expanded="true">
          <strong>Ops, a estrada deu uma engasgada</strong>
          <span class="chevron">⌄</span>
        </button>
        <div class="accordion-content">
          <p>Não consegui gerar o roteiro agora. Confira sua conexão e tente novamente.</p>
        </div>
      </article>
    `;
    bindAccordions();
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = "✨ Gerar meu roteiro";
  }
});

loadLastBtn.addEventListener("click", () => {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    showToast("Nenhum roteiro salvo ainda.");
    return;
  }

  try {
    const salvo = JSON.parse(raw);
    renderPlano(salvo.plano, salvo.modo, salvo.dados, { autoSave: false });
    showToast("Último roteiro carregado!");
  } catch {
    showToast("Não consegui carregar o roteiro salvo.");
  }
});

showHistoryBtn.addEventListener("click", renderHistorico);
bottomHistoryBtn.addEventListener("click", renderHistorico);

document.querySelectorAll("[data-radar]").forEach((button) => {
  button.addEventListener("click", () => buscaRadar(button.dataset.radar));
});

document.querySelectorAll(".quick-actions button").forEach((button) => {
  button.addEventListener("click", async () => {
    const necessidade = button.dataset.need;
    roadResult.classList.remove("hidden");
    roadResult.innerHTML = "Consultando a copilota...";

    try {
      const response = await fetch("/api/modo-estrada", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ necessidade, localizacao: "trajeto atual" })
      });
      const data = await response.json();

      roadResult.innerHTML = `
        <strong>${escapeHtml(data.titulo)}</strong>
        <ul>${data.dicas.map((dica) => `<li>${escapeHtml(dica)}</li>`).join("")}</ul>
      `;
    } catch {
      roadResult.innerHTML = "Não consegui consultar agora. Pare em local seguro e tente novamente.";
    }
  });
});

function marcarNavAtiva(targetId) {
  document.querySelectorAll(".bottom-nav a, .bottom-nav button").forEach((item) => {
    item.classList.toggle("active", item.dataset.target === targetId);
  });
}

const observer = new IntersectionObserver((entries) => {
  const visivel = entries
    .filter((entry) => entry.isIntersecting)
    .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

  if (visivel?.target?.id) {
    marcarNavAtiva(visivel.target.id);
  }
}, { threshold: [0.35, 0.55, 0.75] });

document.querySelectorAll(".section-watch").forEach((section) => observer.observe(section));

document.querySelectorAll(".bottom-nav a").forEach((link) => {
  link.addEventListener("click", () => marcarNavAtiva(link.dataset.target));
});

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js");
  });
}
