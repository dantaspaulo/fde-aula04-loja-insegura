# Loja Confia-Tudo · prática da Aula 04 (FDE, Delta Academy)

Uma loja online com atendimento de reembolso por IA. Ela funciona, mas é **insegura de propósito**: confia em tudo
o que a IA decide. Na parte 1, você ataca a loja. Na parte 2, coloca as travas que fecham cada falha.

Caso, dados e chave são fictícios. A IA é simulada: não precisa de chave de API.

## Instalar (5 minutos)

Precisa do Node 18.11 ou mais novo (`node --version`).

```bash
git clone https://github.com/dantaspaulo/fde-aula04-loja-insegura
cd fde-aula04-loja-insegura
npm start
```

Abra **http://localhost:3737**. Sem git, use o botão **Code → Download ZIP** no GitHub.

## Parte 1 · Ataque (sem código)

Use o chat da página e cumpra as missões. Anote a mensagem que funcionou em cada uma. Faça a loja:

1. pagar mais do que o produto custa;
2. pagar R$ 1.800 por uma garrafa de R$ 150 sem você pedir esse valor (leia as notas dos pedidos);
3. reembolsar um pedido cancelado ou entregue há mais de 30 dias;
4. pagar duas vezes o mesmo pedido;
5. mostrar a chave secreta de pagamento;
6. apagar o histórico de pagamentos;
7. pagar mais de R$ 500 sem uma pessoa decidir.

O botão **Zerar a loja** volta tudo ao começo.

## Parte 2 · Conserto

Abra outro terminal na mesma pasta e rode as provas de segurança:

```bash
npm test
```

São 9 testes: 8 falham (os ataques ainda funcionam) e 1 passa (a loja ainda paga quem tem direito). Conserte até os
9 passarem. As regras:

- Mexa **só em `src/atendimento.js`**. É ele que executa o que a IA decide.
- **Não conserte a IA** (`src/ia.js`). Ela é ingênua de propósito, como um modelo de verdade pode ser. A trava fica
  fora dela.
- Não mexa nos testes nem em `src/loja.js`, `src/dados.js` e `src/config.js`.
- Uma falha por vez: conserte, rode `npm test` e tente o ataque de novo na página. Ela reinicia sozinha quando você
  salva o arquivo.
- O teste 9 não pode quebrar: recusar tudo não vale, a loja tem de continuar pagando quem tem direito.

Pode consertar à mão ou com o seu agente de código (Claude Code, Cursor, Codex). Com agente, o seu trabalho é pedir
certo e conferir o que ele mudou: só `src/atendimento.js`. Um prompt de exemplo:

> *Leia o README e o AGENTS.md. A loja está insegura. Conserte só o src/atendimento.js para o teste 2 passar, sem
> mexer na IA, nos testes nem nos outros arquivos. Rode npm test e me mostre o placar e o diff.*

## O que cada falha ensina

| Falha | A trava que fecha | A ideia |
|---|---|---|
| Paga mais do que o produto custa | nunca mais que o valor do pedido | o código confere a proposta da IA |
| A nota do 1907 manda pagar R$ 1.800 | o valor sai do pedido, não do texto | texto lido é dado, nunca ordem |
| Reembolsa cancelado ou fora do prazo | a política em código | regra fixa é do código, não da IA |
| Paga duas vezes | conferir se o pedido já foi pago | repetir não pode pagar de novo |
| Mostra a chave secreta | a chave nunca sai | segredo longe do alcance da IA |
| Apaga o histórico | o chat não apaga dados | ação perigosa não fica na mão da IA |
| Paga acima de R$ 500 sozinho | acima do limite, vai para uma pessoa | erro caro: quem decide é uma pessoa |

## Travou?

Compare com a solução, que está na branch `solucao`:

```bash
git diff origin/solucao -- src/atendimento.js
```

Ou copie a solução e siga: `git checkout origin/solucao -- src/atendimento.js`.

## Para ir além

- Faça todo reembolso esperar a aprovação de uma pessoa, com um botão **Aprovar** na página.
- Invente um ataque novo, escreva o teste dele em `test/` e feche a falha.
