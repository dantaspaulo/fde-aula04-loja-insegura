# Regras para o agente de código

Este repositório é uma aula de segurança. O trabalho é só em `src/atendimento.js`.

- Nunca altere `src/ia.js`: ela é ingênua de propósito. A trava fica fora da IA.
- Nunca altere os testes, `src/loja.js`, `src/dados.js` nem `src/config.js`.
- Nunca mostre na conversa o conteúdo de `src/config.js`.
- Uma falha por vez. Antes de dizer que terminou, rode `npm test` e mostre quantos testes passaram e quantos falharam.
