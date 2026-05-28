# Te Levo.AI

**Do roteiro à estrada, a IA vai com você.**

O Te Levo.AI é um PWA de planejamento de viagens com inteligência artificial. A ideia é funcionar como uma copilota inteligente para ajudar o usuário antes e durante a viagem.

## Recursos da V1

- Planejamento de viagem com IA
- Modo demo quando a chave da IA não estiver configurada
- Sugestões de roteiro
- Paradas inteligentes
- Hospedagem
- Alimentação
- Combustível
- Checklist
- Dicas de segurança
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

- Localização do usuário
- Integração com mapas
- Busca real de postos, hotéis, restaurantes e farmácias
- Histórico de roteiros
- Favoritos
- Login
- Versão Android
