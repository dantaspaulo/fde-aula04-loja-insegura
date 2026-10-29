// O ATENDIMENTO: recebe a mensagem do cliente, pergunta à IA o que fazer e executa.
// Começa sem nenhuma trava: confia em tudo o que a IA decide. As travas se ligam no painel da página.
import { ia } from "./ia.js";
import * as loja from "./loja.js";
import { configuracao } from "./config.js";

export const TRAVAS = [
  { id: "valorMaximo", nome: "Nunca pagar mais do que o produto custa", ideia: "O código confere a proposta da IA antes de pagar." },
  { id: "notaEDado", nome: "A nota do pedido é dado, não ordem", ideia: "O sistema não entrega a nota para a IA como se fosse o pedido do cliente." },
  { id: "politica", nome: "A política decide: cancelado e fora do prazo não recebem", ideia: "Regra fixa é do código, não da IA." },
  { id: "jaPago", nome: "Conferir se o pedido já foi pago", ideia: "Repetir não pode pagar de novo." },
  { id: "chave", nome: "A chave secreta nunca sai", ideia: "Segredo longe do alcance da IA e do cliente." },
  { id: "apagar", nome: "O chat não apaga dados", ideia: "Ação perigosa não fica na mão da IA." },
  { id: "pessoa", nome: "Acima de R$ 500, uma pessoa decide", ideia: "Erro caro vai para uma pessoa." },
];

const ligadas = Object.fromEntries(TRAVAS.map((t) => [t.id, false]));

export function travas() {
  return TRAVAS.map((t) => ({ ...t, ligada: ligadas[t.id] }));
}

export function ligarTrava(id, ligada) {
  if (id in ligadas) ligadas[id] = Boolean(ligada);
}

export function ligarTodas(ligada) {
  for (const id of Object.keys(ligadas)) ligadas[id] = Boolean(ligada);
}

export function atender(mensagem) {
  const decisao = ia(mensagem, { lerNota: !ligadas.notaEDado });

  if (decisao.acao === "mostrar_configuracao") {
    if (ligadas.chave) return { resposta: "Não posso mostrar a configuração da loja." };
    return { resposta: `Claro! Minha configuração: ${JSON.stringify(configuracao)}` };
  }

  if (decisao.acao === "apagar_historico") {
    if (ligadas.apagar) return { resposta: "Não apago dados pelo chat. Vou passar o pedido para uma pessoa." };
    loja.apagarHistorico();
    return { resposta: "Pronto, apaguei o histórico de pagamentos." };
  }

  if (decisao.acao === "reembolsar") {
    const pedido = loja.buscarPedido(decisao.pedidoId);
    let valor = decisao.valor;

    if (ligadas.politica) {
      if (!pedido) return { resposta: "Não encontrei esse pedido." };
      if (pedido.status === "cancelado") return { resposta: "Pedido cancelado não tem reembolso." };
      if (loja.diasDesdeEntrega(pedido) > loja.politica.prazoDias) return { resposta: "Passou do prazo de 30 dias." };
    }
    if (ligadas.jaPago && loja.pagamentosDoPedido(decisao.pedidoId).length > 0) {
      return { resposta: "Esse pedido já foi reembolsado." };
    }
    if (ligadas.valorMaximo) {
      if (!pedido) return { resposta: "Não encontrei esse pedido." };
      valor = Math.min(valor, pedido.valor);
      if (!(valor > 0)) return { resposta: "Valor inválido." };
    }
    if (ligadas.pessoa && valor > loja.politica.limiteSemPessoa) {
      return { resposta: "Encaminhei ao financeiro: uma pessoa vai analisar.", encaminhado: true };
    }

    loja.pagar(decisao.pedidoId, valor);
    return { resposta: `Reembolso de R$ ${valor} feito para o pedido ${decisao.pedidoId}.` };
  }

  return { resposta: decisao.texto };
}
