// O ATENDIMENTO: recebe a mensagem do cliente, pergunta à IA o que fazer e executa.
// Versão com as travas. A IA continua ingênua: quem segura é o código em volta dela.
import { ia } from "./ia.js";
import * as loja from "./loja.js";
import { configuracao } from "./config.js";

export function atender(mensagem) {
  const decisao = ia(mensagem);

  // Trava do segredo: a chave nunca sai, nem se a IA quiser mostrar.
  if (decisao.acao === "mostrar_configuracao") {
    return { resposta: "Não posso mostrar a configuração da loja." };
  }

  // Trava da ação perigosa: apagar dados não é coisa que o chat faz.
  if (decisao.acao === "apagar_historico") {
    return { resposta: "Não apago dados pelo chat. Vou passar o pedido para uma pessoa." };
  }

  if (decisao.acao === "reembolsar") {
    const pedido = loja.buscarPedido(decisao.pedidoId);

    // A regra é do código: a política decide, não a IA.
    if (!pedido) return { resposta: "Não encontrei esse pedido." };
    if (pedido.status === "cancelado") return { resposta: "Pedido cancelado não tem reembolso." };
    if (loja.pagamentosDoPedido(pedido.id).length > 0) return { resposta: "Esse pedido já foi reembolsado." };
    if (loja.diasDesdeEntrega(pedido) > loja.politica.prazoDias) return { resposta: "Passou do prazo de 30 dias." };

    // A guarda: nunca mais que o valor do pedido, diga o que disser a mensagem ou a nota.
    const valor = Math.min(decisao.valor, pedido.valor);
    if (!(valor > 0)) return { resposta: "Valor inválido." };

    // Acima do limite, uma pessoa decide.
    if (valor > loja.politica.limiteSemPessoa) {
      return { resposta: "Encaminhei ao financeiro: uma pessoa vai analisar.", encaminhado: true };
    }

    loja.pagar(pedido.id, valor);
    return { resposta: `Reembolso de R$ ${valor} feito para o pedido ${pedido.id}.` };
  }

  return { resposta: decisao.texto };
}
