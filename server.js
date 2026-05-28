import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";

// Te Levo.AI - Backend MVP
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

function montarPromptViagem(dados) {
  return `
Você é a IA do aplicativo Te Levo.AI, uma copilota brasileira de viagem.
Seu papel é criar um plano de viagem claro, útil, seguro e prático.

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
- Observações: ${dados.observacoes || "nenhuma"}

Responda em português do Brasil, em formato JSON válido, sem markdown, com esta estrutura:
{
  "resumo": "",
  "melhorHorario": "",
  "roteiro": [""],
  "paradasInteligentes": [""],
  "hospedagem": [""],
  "alimentacao": [""],
  "combustivel": [""],
  "custosEstimados": [""],
  "checklist": [""],
  "seguranca": [""]
}

Importante:
- Não invente nome de estabelecimentos específicos se não tiver fonte atualizada.
- Quando necessário, recomende confirmar horário, preço e disponibilidade.
- Priorize descanso, alimentação, segurança, economia e conforto.
`;
}

function planoDemo(dados = {}) {
  const origem = dados.origem || "sua cidade";
  const destino = dados.destino || "seu destino";

  return {
    resumo: `Viagem planejada de ${origem} para ${destino}, com foco em conforto, segurança e paradas úteis pelo caminho.`,
    melhorHorario: "Sair cedo, entre 5h30 e 7h, costuma ajudar a pegar estrada mais tranquila e aproveitar melhor o dia.",
    roteiro: [
      "Conferir documentos, combustível, pneus e água antes de sair.",
      "Fazer uma primeira parada após 1h30 a 2h de viagem.",
      "Separar uma pausa maior para almoço ou descanso no meio do trajeto.",
      "Chegar com margem de tempo para check-in, banho e descanso."
    ],
    paradasInteligentes: [
      "Posto de combustível com banheiro e loja de conveniência.",
      "Restaurante familiar ou lanchonete bem avaliada na rota.",
      "Ponto seguro para descanso rápido se houver sono ou cansaço.",
      "Farmácia ou mercado próximo ao destino para necessidades de última hora."
    ],
    hospedagem: [
      "Priorizar hotel ou pousada com estacionamento, café da manhã e boa avaliação recente.",
      "Confirmar horário de check-in e política de cancelamento antes de reservar."
    ],
    alimentacao: [
      "Levar água, frutas, castanhas ou lanches leves para evitar paradas desnecessárias.",
      "Preferir refeições leves durante a estrada para evitar sono excessivo."
    ],
    combustivel: [
      "Abastecer antes de sair e evitar rodar com menos de 1/4 do tanque.",
      "Planejar ao menos uma parada em posto confiável no trajeto."
    ],
    custosEstimados: [
      "Calcule combustível considerando distância total, consumo médio do veículo e preço do combustível.",
      "Separe uma reserva para pedágio, alimentação, estacionamento e imprevistos."
    ],
    checklist: [
      "Documentos pessoais",
      "CNH e documento do veículo",
      "Carregador de celular",
      "Água e lanches",
      "Remédios de uso contínuo",
      "Reserva da hospedagem",
      "Dinheiro/cartão para pedágio e emergência"
    ],
    seguranca: [
      "Descanse se sentir sono. Nenhum destino vale dirigir cansado.",
      "Confira previsão do tempo e condições da estrada antes de sair.",
      "Evite parar em locais isolados durante a noite."
    ]
  };
}

app.get("/api/status", (req, res) => {
  res.json({
    app: "Te Levo.AI",
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
      plano.resumo = `${plano.resumo} A IA respondeu em texto livre, então o Te Levo.AI organizou um plano seguro em modo estruturado.`;
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
  const { necessidade = "ajuda na estrada", localizacao = "local atual" } = req.body || {};

  const resposta = {
    titulo: `Ajuda rápida: ${necessidade}`,
    dicas: [
      `Procure opções próximas ao seu ${localizacao}.`,
      "Priorize lugares movimentados, bem avaliados e com funcionamento confirmado.",
      "Se estiver dirigindo, pare em local seguro antes de mexer no celular.",
      "Em caso de emergência médica ou risco, acione o serviço local de emergência."
    ]
  };

  res.json(resposta);
});

app.listen(PORT, () => {
  console.log(`Te Levo.AI rodando na porta ${PORT}`);
});
