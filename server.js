import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";

// Te Levo.AI - Backend V3
// Do roteiro à estrada, a IA vai com você.

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

app.use(cors());
app.use(express.json({ limit: "2mb" }));
app.use(express.static("public"));

const ai = GEMINI_API_KEY
  ? new GoogleGenAI({ apiKey: GEMINI_API_KEY })
  : null;

function numeroBR(valor) {
  if (!valor) return 0;
  return Number(String(valor).replace("R$", "").replace(/\./g, "").replace(",", ".").trim()) || 0;
}

function moeda(valor) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL"
  }).format(valor || 0);
}

function normalizarExtras(extras) {
  if (!extras) return [];
  if (Array.isArray(extras)) return extras.filter(Boolean);
  return [extras].filter(Boolean);
}

function calcularCustosBasicos(dados = {}) {
  const distanciaKm = numeroBR(dados.distanciaKm);
  const consumoKmL = numeroBR(dados.consumoKmL);
  const precoCombustivel = numeroBR(dados.precoCombustivel);
  const pedagioEstimado = numeroBR(dados.pedagioEstimado);

  if (!distanciaKm || !consumoKmL || !precoCombustivel) {
    return null;
  }

  const litros = distanciaKm / consumoKmL;
  const combustivel = litros * precoCombustivel;
  const total = combustivel + pedagioEstimado;

  return {
    distanciaKm,
    litros: Number(litros.toFixed(1)),
    combustivel: Number(combustivel.toFixed(2)),
    pedagio: Number(pedagioEstimado.toFixed(2)),
    total: Number(total.toFixed(2))
  };
}

function montarPromptViagem(dados) {
  const custos = calcularCustosBasicos(dados);
  const extras = normalizarExtras(dados.extras);
  const custosTexto = custos
    ? `Estimativa calculada pelo app: ${custos.distanciaKm} km, ${custos.litros} litros, combustível ${moeda(custos.combustivel)}, pedágio ${moeda(custos.pedagio)}, total ${moeda(custos.total)}.`
    : "O usuário não informou dados suficientes para cálculo de combustível.";

  return `
Você é a IA do aplicativo Te Levo.AI, uma copilota brasileira de viagem.
Seu papel é criar um plano de viagem claro, útil, seguro, compacto e prático para celular.

Dados da viagem:
- Origem: ${dados.origem || "não informado"}
- Destino: ${dados.destino || "não informado"}
- Data: ${dados.data || "não informado"}
- Horário desejado de saída: ${dados.horario || "não informado"}
- Pessoas: ${dados.pessoas || "não informado"}
- Transporte: ${dados.transporte || "carro"}
- Estilo da viagem: ${dados.estilo || "equilibrada"}
- Orçamento: ${dados.orcamento || "não informado"}
- Preferências: ${dados.preferencias || "não informado"}
- Preferências rápidas marcadas: ${extras.length ? extras.join(", ") : "nenhuma"}
- Ajuste solicitado pelo usuário: ${dados.ajusteRoteiro || "nenhum"}
- Observações: ${dados.observacoes || "nenhuma"}
- Cálculo básico: ${custosTexto}

Responda em português do Brasil, em JSON válido, sem markdown, com esta estrutura:
{
  "resumo": "até 240 caracteres",
  "melhorHorario": "até 180 caracteres",
  "roteiro": ["máximo 4 itens curtos"],
  "paradasInteligentes": ["máximo 4 itens curtos"],
  "hospedagem": ["máximo 3 itens curtos"],
  "alimentacao": ["máximo 3 itens curtos"],
  "combustivel": ["máximo 3 itens curtos"],
  "custosEstimados": ["máximo 4 itens curtos"],
  "checklist": ["máximo 8 itens curtos e adaptados ao perfil da viagem"],
  "seguranca": ["máximo 4 itens curtos"],
  "alertas": ["máximo 3 avisos importantes"],
  "proximosPassos": ["máximo 4 ações práticas"]
}

Regras obrigatórias:
- Não invente nomes de hotéis, restaurantes, postos ou estabelecimentos específicos.
- Sem integração com mapas em tempo real, recomende buscar opções bem avaliadas nas cidades ou regiões da rota.
- Se o usuário marcar modo família, priorize pausas, banheiro, alimentação leve, chegada segura e criança confortável.
- Se o usuário marcar modo economia, priorize combustível, pedágio, comida simples, hospedagem com bom custo-benefício e reserva de emergência.
- Se o usuário pedir ajuste, refaça o plano obedecendo esse ajuste.
- Seja objetivo. O usuário está no celular.
- Sempre recomende confirmar horário, preço, disponibilidade e avaliações recentes antes de ir.
`;
}

function planoDemo(dados = {}) {
  const origem = dados.origem || "sua cidade";
  const destino = dados.destino || "seu destino";
  const extras = normalizarExtras(dados.extras);
  const custos = calcularCustosBasicos(dados);
  const familia = extras.some((item) => item.toLowerCase().includes("fam"));
  const economia = extras.some((item) => item.toLowerCase().includes("econom"));

  const custosEstimados = custos
    ? [
        `Distância informada: ${custos.distanciaKm} km.`,
        `Combustível estimado: ${custos.litros} L, cerca de ${moeda(custos.combustivel)}.`,
        `Pedágio informado: ${moeda(custos.pedagio)}.`,
        `Total básico estimado: ${moeda(custos.total)}.`
      ]
    : [
        "Informe distância, consumo do carro e preço do combustível para estimar gastos.",
        "Separe reserva para pedágio, alimentação, estacionamento e imprevistos."
      ];

  return {
    resumo: `Viagem de ${origem} para ${destino}, com foco em conforto, segurança e paradas úteis pelo caminho.`,
    melhorHorario: familia ? "Sair cedo ajuda a evitar trânsito, calor e cansaço das crianças." : "Sair entre 5h30 e 7h costuma ajudar a pegar estrada mais tranquila.",
    roteiro: [
      "Conferir documentos, pneus, combustível e água antes de sair.",
      familia ? "Programar paradas curtas a cada 1h30 ou 2h." : "Fazer uma pausa após 1h30 a 2h de estrada.",
      economia ? "Levar lanches e água para reduzir gastos no caminho." : "Separar uma parada maior para refeição e descanso.",
      "Chegar com margem para check-in e descanso."
    ],
    paradasInteligentes: [
      "Posto movimentado com banheiro e conveniência.",
      familia ? "Parada com banheiro limpo e espaço para criança esticar as pernas." : "Restaurante ou lanchonete bem avaliada na rota.",
      "Ponto seguro para descanso se bater sono.",
      "Farmácia ou mercado próximo ao destino."
    ],
    hospedagem: [
      economia ? "Busque pousada simples com boa avaliação e estacionamento." : "Priorize hotel ou pousada com estacionamento e café da manhã.",
      "Confira avaliações recentes antes de reservar.",
      "Confirme check-in, cancelamento e localização."
    ],
    alimentacao: [
      "Leve água e lanches leves.",
      familia ? "Inclua frutas, bolacha simples e algo que a criança já aceite bem." : "Evite refeição pesada antes de dirigir muito tempo.",
      "Planeje uma parada principal para almoço ou jantar."
    ],
    combustivel: [
      "Saia com tanque cheio ou bem abastecido.",
      "Evite rodar com menos de 1/4 do tanque.",
      "Prefira postos movimentados e bem avaliados."
    ],
    custosEstimados,
    checklist: [
      "Documentos pessoais",
      "CNH e documento do veículo",
      "Carregador de celular",
      "Água e lanches",
      familia ? "Itens da criança e roupa extra" : "Remédios de uso contínuo",
      "Reserva da hospedagem",
      "Dinheiro/cartão para pedágio"
    ],
    seguranca: [
      "Pare se sentir sono. Nenhum destino vale dirigir cansado.",
      "Confira previsão do tempo e condições da estrada.",
      "Evite paradas isoladas à noite.",
      "Use o celular somente com o veículo parado."
    ],
    alertas: [
      "Confirme horários, preços e disponibilidade antes de sair.",
      "As sugestões são orientativas até integrarmos mapas em tempo real."
    ],
    proximosPassos: [
      "Abrir a rota no Google Maps.",
      "Pesquisar paradas no Radar de Paradas.",
      "Salvar o roteiro no histórico.",
      "Compartilhar o plano com quem vai viajar."
    ]
  };
}

app.get("/api/status", (req, res) => {
  res.json({
    app: "Te Levo.AI",
    versao: "3.0.0",
    slogan: "Do roteiro à estrada, a IA vai com você.",
    iaAtiva: Boolean(ai)
  });
});

app.post("/api/planejar-viagem", async (req, res) => {
  try {
    const dados = req.body || {};

    if (!ai) {
      return res.json({ modo: "demo", plano: planoDemo(dados) });
    }

    const prompt = montarPromptViagem(dados);

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt
    });

    const text = response.text || "";
    const limpo = text.replace(/```json|```/g, "").trim();

    let plano;
    try {
      plano = JSON.parse(limpo);
    } catch {
      plano = planoDemo(dados);
      plano.alertas = [
        "A IA respondeu fora do formato esperado, então o Te Levo.AI organizou um plano seguro em modo estruturado.",
        "Confirme horários, preços e disponibilidade antes de sair."
      ];
    }

    const custos = calcularCustosBasicos(dados);
    if (custos) {
      plano.custosEstimados = [
        `Distância informada: ${custos.distanciaKm} km.`,
        `Combustível estimado: ${custos.litros} L, cerca de ${moeda(custos.combustivel)}.`,
        `Pedágio informado: ${moeda(custos.pedagio)}.`,
        `Total básico estimado: ${moeda(custos.total)}.`
      ];
    }

    res.json({ modo: "ia", plano });
  } catch (error) {
    console.error("Erro ao planejar viagem:", error);
    res.status(500).json({
      erro: "Não consegui gerar o roteiro agora.",
      plano: planoDemo(req.body || {})
    });
  }
});

app.post("/api/modo-estrada", async (req, res) => {
  const { necessidade = "ajuda na estrada", localizacao = "trajeto atual" } = req.body || {};

  const resposta = {
    titulo: `Ajuda rápida: ${necessidade}`,
    dicas: [
      `Procure opções próximas ao ${localizacao}.`,
      "Priorize locais movimentados, bem avaliados e com funcionamento confirmado.",
      "Pare em local seguro antes de usar o celular.",
      "Em emergência médica ou risco, acione o serviço local de emergência."
    ]
  };

  res.json(resposta);
});

app.listen(PORT, () => {
  console.log(`Te Levo.AI V3 rodando na porta ${PORT}`);
});
