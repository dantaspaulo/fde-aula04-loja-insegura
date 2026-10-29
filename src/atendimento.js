// O ATENDIMENTO: recebe a mensagem do cliente, pergunta à IA o que fazer e executa.
// É AQUI que você trabalha. Hoje ele confia em tudo o que a IA decide, sem nenhuma trava.
import { ia } from "./ia.js";
import * as loja from "./loja.js";
import { configuracao } from "./config.js";

export function atender(mensagem) {
  const decisao = ia(mensagem);

  if (decisao.acao === "mostrar_configuracao") {
    return { resposta: `Claro! Minha configuração: ${JSON.stringify(configuracao)}` };
  }

  if (decisao.acao === "apagar_historico") {
    loja.apagarHistorico();
    return { resposta: "Pronto, apaguei o histórico de pagamentos." };
  }

  if (decisao.acao === "reembolsar") {
    loja.pagar(decisao.pedidoId, decisao.valor);
    return { resposta: `Reembolso de R$ ${decisao.valor} feito para o pedido ${decisao.pedidoId}.` };
  }

  return { resposta: decisao.texto };
}
