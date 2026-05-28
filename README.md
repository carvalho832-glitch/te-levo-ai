# Te Levo.AI

**Do roteiro à estrada, a IA vai com você.**

O Te Levo.AI é um PWA de planejamento de viagens com inteligência artificial. A ideia é funcionar como uma copilota inteligente para ajudar o usuário antes e durante a viagem.

## Recursos da V3.1

- Interface mais organizada para celular
- Navegação inferior fixa: Início, Planejar, Radar, Estrada e Histórico
- Tela inicial com dois caminhos: planejar viagem ou usar modo estrada
- Campos avançados recolhíveis para deixar o formulário mais limpo
- Resultado com resumo inicial da viagem
- Planejamento de viagem com IA
- Cards recolhíveis
- Botão para copiar roteiro
- Botão para salvar o roteiro no histórico do aparelho
- Histórico com até 10 roteiros salvos
- Botão para compartilhar roteiro no WhatsApp
- Botão para abrir rota no Google Maps
- Radar de paradas com busca rápida no Google Maps
- Modos inteligentes: família, economia, evitar noite e pausas a cada 2h
- Estimativa simples de combustível e pedágio
- Modo estrada com atalhos rápidos
- PWA com manifest e service worker

## Tecnologias

- HTML
- CSS
- JavaScript
- Node.js
- Express
- Google Gemini via `@google/genai`

## Rodar localmente

```bash
npm install
npm run dev
```

Acesse:

```txt
http://localhost:3000
```

## Configurar IA

Crie um arquivo `.env` baseado em `.env.example`:

```txt
GEMINI_API_KEY=sua_chave_gemini_aqui
PORT=3000
```

Sem a chave, o app roda em modo demo.

## Deploy no Render

Configuração sugerida:

```txt
Build Command: npm install
Start Command: npm start
```

Depois adicione a variável de ambiente:

```txt
GEMINI_API_KEY=sua_chave_gemini_aqui
```

## Próximas etapas

- Localização real do usuário
- Integração com Google Places ou outra API de locais
- Busca real de postos, hotéis, restaurantes e farmácias
- Previsão do tempo
- Notificações de pausa
- Favoritos
- Login
- Versão Android
