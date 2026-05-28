const form = document.querySelector("#travelForm");
const submitBtn = document.querySelector("#submitBtn");
const result = document.querySelector("#result");
const roadResult = document.querySelector("#roadResult");
const toast = document.querySelector("#toast");
const loadLastBtn = document.querySelector("#loadLastBtn");

const STORAGE_KEY = "teLevoAiUltimoRoteiroV2";

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
  alertas: "⚠️ Alertas importantes"
};

function getFormData() {
  return Object.fromEntries(new FormData(form).entries());
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

function renderPlano(plano, modo, dados = {}) {
  result.classList.remove("hidden");
  const mapsUrl = abrirGoogleMaps(dados);

  result.innerHTML = `
    <div class="result-head">
      <h2>Seu plano de viagem está pronto ✨</h2>
      <p>${escapeHtml(plano.resumo || "A copilota montou uma sugestão inicial para sua viagem.")}</p>
      <div class="result-actions">
        <button type="button" id="copyPlanBtn">📋 Copiar roteiro</button>
        <button type="button" id="savePlanBtn" class="ghost-button">💾 Salvar</button>
        <a class="ghost-link secondary" href="${mapsUrl}" target="_blank" rel="noopener">🗺️ Abrir rota</a>
      </div>
      <small>${modo === "demo" ? "Modo demo ativo: conecte sua GEMINI_API_KEY para usar IA real." : "Gerado com IA."}</small>
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
  `;

  bindAccordions();

  document.querySelector("#copyPlanBtn")?.addEventListener("click", async () => {
    await navigator.clipboard.writeText(planoParaTexto(plano));
    showToast("Roteiro copiado!");
  });

  document.querySelector("#savePlanBtn")?.addEventListener("click", () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ plano, modo, dados, salvoEm: new Date().toISOString() }));
    showToast("Roteiro salvo no aparelho!");
  });

  result.scrollIntoView({ behavior: "smooth", block: "start" });
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  const dados = getFormData();
  submitBtn.disabled = true;
  submitBtn.innerHTML = '<span class="loading">Gerando roteiro V2</span>';

  try {
    const response = await fetch("/api/planejar-viagem", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(dados)
    });

    const data = await response.json();
    renderPlano(data.plano, data.modo, dados);
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
    submitBtn.textContent = "✨ Gerar meu roteiro V2";
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
    renderPlano(salvo.plano, salvo.modo, salvo.dados);
    showToast("Último roteiro carregado!");
  } catch {
    showToast("Não consegui carregar o roteiro salvo.");
  }
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

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js");
  });
}
