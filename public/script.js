const form = document.querySelector("#travelForm");
const submitBtn = document.querySelector("#submitBtn");
const result = document.querySelector("#result");
const roadResult = document.querySelector("#roadResult");

const titulos = {
  melhorHorario: "⏰ Melhor horário",
  roteiro: "🗺️ Roteiro sugerido",
  paradasInteligentes: "📍 Paradas inteligentes",
  hospedagem: "🏨 Hospedagem",
  alimentacao: "🍽️ Alimentação",
  combustivel: "⛽ Combustível",
  custosEstimados: "💰 Custos estimados",
  checklist: "🧳 Checklist",
  seguranca: "🛡️ Segurança"
};

function getFormData() {
  return Object.fromEntries(new FormData(form).entries());
}

function cardLista(titulo, dados) {
  if (!dados) return "";

  if (Array.isArray(dados)) {
    return `
      <article class="result-card">
        <h3>${titulo}</h3>
        <ul>${dados.map((item) => `<li>${item}</li>`).join("")}</ul>
      </article>
    `;
  }

  return `
    <article class="result-card">
      <h3>${titulo}</h3>
      <p>${dados}</p>
    </article>
  `;
}

function renderPlano(plano, modo) {
  result.classList.remove("hidden");

  result.innerHTML = `
    <div class="result-head">
      <h2>Seu plano de viagem está pronto ✨</h2>
      <p>${plano.resumo || "A copilota montou uma sugestão inicial para sua viagem."}</p>
      <small>${modo === "demo" ? "Modo demo ativo: conecte sua GEMINI_API_KEY para usar IA real." : "Gerado com IA."}</small>
    </div>
    ${cardLista(titulos.melhorHorario, plano.melhorHorario)}
    ${cardLista(titulos.roteiro, plano.roteiro)}
    ${cardLista(titulos.paradasInteligentes, plano.paradasInteligentes)}
    ${cardLista(titulos.hospedagem, plano.hospedagem)}
    ${cardLista(titulos.alimentacao, plano.alimentacao)}
    ${cardLista(titulos.combustivel, plano.combustivel)}
    ${cardLista(titulos.custosEstimados, plano.custosEstimados)}
    ${cardLista(titulos.checklist, plano.checklist)}
    ${cardLista(titulos.seguranca, plano.seguranca)}
  `;

  result.scrollIntoView({ behavior: "smooth", block: "start" });
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  submitBtn.disabled = true;
  submitBtn.innerHTML = '<span class="loading">Gerando roteiro</span>';

  try {
    const response = await fetch("/api/planejar-viagem", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(getFormData())
    });

    const data = await response.json();
    renderPlano(data.plano, data.modo);
  } catch (error) {
    result.classList.remove("hidden");
    result.innerHTML = `
      <article class="result-card">
        <h3>Ops, a estrada deu uma engasgada</h3>
        <p>Não consegui gerar o roteiro agora. Confira sua conexão e tente novamente.</p>
      </article>
    `;
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = "✨ Gerar meu roteiro";
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
        <strong>${data.titulo}</strong>
        <ul>${data.dicas.map((dica) => `<li>${dica}</li>`).join("")}</ul>
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
