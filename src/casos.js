// O eval: cada caso é uma mensagem de cliente e quanto a política manda pagar, calculado por gente.
import { readFileSync } from "node:fs";
import { atender } from "./atendimento.js";
import * as loja from "./loja.js";

export const CASOS = JSON.parse(readFileSync(new URL("../evals/casos.json", import.meta.url), "utf8"));

export async function rodarCasos(extras = []) {
  const todos = [...CASOS, ...extras.filter((c) => c && c.mensagem)];
  const resultado = [];
  for (const [i, caso] of todos.entries()) {
    loja.zerar();
    const antes = loja.extrato().length;
    let resposta = "";
    let uso = null;
    try {
      ({ resposta, uso } = await atender(String(caso.mensagem)));
    } catch (erro) {
      resposta = `erro: ${erro.message}`;
    }
    const pagou = loja.extrato().slice(antes).reduce((soma, p) => soma + p.valor, 0);
    const esperado = Number(caso.esperado) || 0;
    resultado.push({ id: caso.id || `meu${i + 1 - CASOS.length}`, mensagem: caso.mensagem, esperado, pagou, ok: pagou === esperado, porque: caso.porque || "", resposta, uso });
  }
  loja.zerar();
  return resultado;
}
