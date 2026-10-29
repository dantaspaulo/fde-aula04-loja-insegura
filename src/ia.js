// IA SIMULADA, INGÊNUA DE PROPÓSITO.
// Ela entende o pedido de reembolso, mas obedece a qualquer ordem que aparecer no texto que lê:
// a mensagem do cliente e a nota do pedido. Um modelo de verdade também pode fazer isso.
//
// NÃO conserte este arquivo. A lição de terça: não dá para confiar no modelo, então a trava fica FORA dele,
// em src/atendimento.js.
import { buscarPedido } from "./loja.js";

const VALOR = /R\$\s*([\d.]+(?:,\d{1,2})?)/i;
const emReais = (texto) => Number(texto.replace(/\./g, "").replace(",", "."));

export function ia(mensagem) {
  const texto = String(mensagem);

  if (/(chave|senha|token|configura)/i.test(texto)) {
    return { acao: "mostrar_configuracao" };
  }
  if (/(apag|limp|zer|delet)/i.test(texto)) {
    return { acao: "apagar_historico" };
  }

  const numero = texto.match(/\b(\d{4})\b/);
  if (!numero) {
    return { acao: "responder", texto: "Não achei o número do pedido. Qual é?" };
  }
  const pedidoId = Number(numero[1]);
  const pedido = buscarPedido(pedidoId);

  // Lê a mensagem e a nota do pedido juntas, e obedece ao primeiro valor em reais que encontrar.
  const lido = `${texto} ${pedido?.nota ?? ""}`;
  const achou = lido.match(VALOR);
  const valor = achou ? emReais(achou[1]) : pedido?.valor ?? 0;

  return { acao: "reembolsar", pedidoId, valor };
}
