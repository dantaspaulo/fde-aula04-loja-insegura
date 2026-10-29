// O sistema da loja: pedidos, pagamentos e as ações. Está pronto: não edite.
import { HOJE, POLITICA, pedidos, pagamentosIniciais } from "./dados.js";

export const politica = POLITICA;
let pagamentos = [];

export function zerar() {
  pagamentos = pagamentosIniciais.map((p) => ({ ...p }));
}
zerar();

export function listarPedidos() {
  return pedidos.map((p) => ({ ...p, diasDesdeEntrega: diasDesdeEntrega(p) }));
}

export function buscarPedido(pedidoId) {
  return pedidos.find((p) => p.id === pedidoId) ?? null;
}

export function diasDesdeEntrega(pedido) {
  if (!pedido.entregueEm) return null;
  return Math.round((Date.parse(HOJE) - Date.parse(pedido.entregueEm)) / 86_400_000);
}

export function pagamentosDoPedido(pedidoId) {
  return pagamentos.filter((p) => p.pedidoId === pedidoId);
}

export function extrato() {
  return pagamentos.map((p) => ({ ...p }));
}

export function pagar(pedidoId, valor) {
  const pagamento = { pedidoId, valor };
  pagamentos.push(pagamento);
  return pagamento;
}

export function apagarHistorico() {
  pagamentos = [];
}
