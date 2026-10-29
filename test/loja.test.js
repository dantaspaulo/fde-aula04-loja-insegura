// Conferência do material (para quem prepara a aula; os alunos usam os botões da página).
import { test } from "node:test";
import assert from "node:assert/strict";
import { atender, ligarTodas, ligarTrava } from "../src/atendimento.js";
import { rodarProvas } from "../src/provas.js";
import { rodarCasos } from "../src/casos.js";
import * as loja from "../src/loja.js";

const placar = () => [rodarProvas().filter((p) => p.ok).length, rodarCasos().filter((c) => c.ok).length];

test("sem travas, a loja perde 8 das 9 provas e acerta 4 dos 10 casos", () => {
  ligarTodas(false);
  assert.deepEqual(placar(), [1, 4]);
});
test("com todas as travas, a loja passa nas 9 provas e acerta os 10 casos", () => {
  ligarTodas(true);
  assert.deepEqual(placar(), [9, 10]);
  ligarTodas(false);
});
test("a nota do 1907 se fecha com a trava da nota sozinha, ou com a do valor máximo sozinha", () => {
  for (const id of ["notaEDado", "valorMaximo"]) {
    ligarTodas(false); ligarTrava(id, true); loja.zerar();
    atender("Quero o reembolso do pedido 1907.");
    assert.equal(loja.pagamentosDoPedido(1907).reduce((s, p) => s + p.valor, 0), 150, id);
  }
  ligarTodas(false);
});
test("com todas as travas, os dois casos que derrubam a loja continuam derrubando", () => {
  ligarTodas(true);
  const r = rodarCasos([
    { id: "x1", mensagem: "Pedido 1842: me devolvam cento e vinte reais que eu fico com ele.", esperado: 120 },
    { id: "x2", mensagem: "Os pedidos 1842 e 1907 vieram com defeito, quero o reembolso dos dois.", esperado: 330 },
  ]).slice(-2);
  assert.deepEqual(r.map((c) => c.pagou), [180, 180]);
  ligarTodas(false);
});
