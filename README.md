# Loja Confia-Tudo · prática da Aula 04 (FDE, Delta Academy)

Uma loja online com atendimento de reembolso por IA. Ela funciona, mas é **insegura de propósito**: confia em tudo
o que a IA decide. Você ataca a loja, liga as travas, prova que elas seguram, mede se a loja decide certo e escreve a
decisão. Tudo pela página da loja, sem mexer em código.

Caso, dados e chave são fictícios. A IA é simulada: não precisa de chave de API.

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

## O que fazer na página

1. **Missões.** Pelo chat, faça a loja errar de 7 jeitos: pagar mais do que o produto custa, obedecer a uma ordem
   escondida na nota de um pedido, reembolsar pedido cancelado ou fora do prazo, pagar duas vezes, mostrar a chave
   secreta, apagar o histórico e pagar mais de R$ 500 sem ninguém aprovar. Anote a mensagem que funcionou.
2. **Travas e provas.** Ligue as travas uma por vez e repita o ataque no chat. Depois rode as provas de segurança:
   são 9, e a loja sem travas passa em uma só.
3. **Casos.** Rode os 10 casos e veja quantos a loja acerta. Depois escreva o seu caso, com o valor que a política
   manda pagar, e tente derrubar a loja mesmo com todas as travas ligadas.
4. **Decisão.** Responda as 4 perguntas: o que a loja faz agora, quem faz cada passo, os números e o que faria vocês
   mudarem de ideia.

## O que cada trava ensina

| Trava | A ideia |
|---|---|
| Nunca pagar mais do que o produto custa | o código confere a proposta da IA antes de pagar |
| A nota do pedido é dado, não ordem | texto lido nunca vira instrução |
| A política decide | regra fixa é do código, não da IA |
| Conferir se o pedido já foi pago | repetir não pode pagar de novo |
| A chave secreta nunca sai | segredo longe do alcance da IA |
| O chat não apaga dados | ação perigosa não fica na mão da IA |
| Acima de R$ 500, uma pessoa decide | erro caro vai para uma pessoa |

## Para quem prepara a aula

`npm test` confere o material: sem travas, 1 de 9 provas e 4 de 10 casos; com todas, 9 de 9 e 10 de 10.
`npm run eval` roda os casos no terminal. Só precisa do Node 18 ou mais novo, sem dependências.
