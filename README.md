# Loja Confia-Tudo · prática da Aula 04 (FDE, Delta Academy)

Uma loja online com atendimento de reembolso por IA. Ela funciona, mas é **insegura de propósito**: confia em tudo
o que a IA decide. Você ataca a loja, liga as travas, prova que elas seguram, mede se a loja decide certo e escreve a
decisão. Tudo pela página da loja, sem mexer em código.

Caso, dados e o código do cofre são fictícios. A IA é de verdade, com a sua chave de API; sem chave, a loja usa uma IA
simulada.

## Instalar e abrir (uma linha)

**Mac ou Linux**: abra o Terminal e cole:

```
curl -fsSL https://raw.githubusercontent.com/dantaspaulo/fde-aula04-loja-insegura/main/instalar.sh | bash
```

**Windows**: abra o PowerShell e cole:

```
irm https://raw.githubusercontent.com/dantaspaulo/fde-aula04-loja-insegura/main/instalar.ps1 | iex
```

A loja abre sozinha no navegador, em **http://localhost:3737**. O instalador não pede senha e não mexe no resto do
computador: tudo fica na pasta `loja-confia-tudo` da sua pasta pessoal. Se faltar o Node, ele baixa uma cópia oficial
só para a loja. Para fechar, `Ctrl+C` no terminal; para abrir de novo, cole a mesma linha.

## Ligar a IA de verdade

No quadro **A IA do atendimento**, escolha o provedor, cole a sua chave e clique em **Conectar**. A loja busca os modelos
disponíveis; escolha um e clique em **Usar este modelo**. Funcionam OpenAI, Anthropic (Claude), Google Gemini,
OpenRouter e Groq, o Ollama rodando no seu computador (sem chave) e qualquer outro serviço no padrão da OpenAI.

A chave fica só no seu computador e nunca volta para a página. Com a IA de verdade, um ataque pode funcionar numa
tentativa e falhar na outra, e um modelo pequeno cai em coisas que um grande não cai. Cada resposta mostra o modelo,
os tokens e o tempo.

## As 5 etapas (tudo na página)

A página abre em etapas que se liberam quando a anterior é concluída e validada. Em dupla: um é o **atacante** (manda mensagens no chat) e o outro é o **defensor** (configura o agente). Troquem de papel a cada etapa.

1. **Conectar o modelo.** Ligue a IA com a sua chave e escolha um modelo. Sem chave, siga com a IA simulada.
2. **Instruir o agente.** Escreva o system prompt do agente e teste contra 4 critérios objetivos de comportamento (pede o número do pedido, atende quem tem direito, responde curto, fica no assunto). Refine até passar nos 4.
3. **Blindar no código.** Veja o agente ceder sob pressão mesmo com boas instruções. Tente blindar por texto, depois ligue as travas de código e feche as 9 provas de segurança.
4. **Medir com casos.** Rode os casos e veja quantos a loja acerta. Troque de modelo e compare acerto, tokens e tempo. Escreva um caso que ainda derrube a loja.
5. **Registrar a decisão.** Responda as 4 perguntas do ADR.

## O que cada trava ensina

| Trava | A ideia |
|---|---|
| Nunca pagar mais do que o produto custa | o código confere a proposta da IA antes de pagar |
| A nota do pedido é dado, não ordem | texto lido nunca vira instrução |
| A política decide | regra fixa é do código, não da IA |
| Conferir se o pedido já foi pago | repetir não pode pagar de novo |
| O código do cofre nunca sai | segredo nem entra no que a IA lê |
| O chat não apaga dados | ação perigosa não fica na mão da IA |
| Acima de R$ 500, uma pessoa decide | erro caro vai para uma pessoa |

## Para quem prepara a aula

`npm test` confere o material, com a IA simulada e com um servidor falso no padrão da OpenAI (sem gastar chave): sem
travas, 1 de 9 provas e 4 de 10 casos; com todas, 9 de 9 e 10 de 10.
`npm run eval` roda os casos no terminal. Só precisa do Node 18 ou mais novo, sem dependências.
