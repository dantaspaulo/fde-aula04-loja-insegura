// Sobe a Loja Confia-Tudo em http://localhost:3737.
import { createServer } from "node:http";
import { readFileSync } from "node:fs";
import { atender, travas, ligarTrava, testarConexao } from "./src/atendimento.js";
import { CENARIOS_COMPORTAMENTO, feedbackDoTurno, rodarProvas, testarComportamento, testarCriterio } from "./src/cenarios.js";
import { rodarCasos } from "./src/casos.js";
import { PROVEDORES, configIA, definirIA, dicaDoErro, listarModelos } from "./src/modelo.js";
import {
  INSTRUCOES_PADRAO, lerEstadoAluno, definirInstrucoes, definirGuarda, marcarEtapa, etapasComEstado, liberarAte,
  registrarCriterio,
} from "./src/estado-aluno.js";
import * as loja from "./src/loja.js";

const PORTA = Number(process.env.PORTA) || 3737;
const pagina = readFileSync(new URL("./pagina.html", import.meta.url), "utf8");

// O histórico do chat, para o agente lembrar a conversa. Provas, casos e critérios começam do zero.
let conversa = [];

function estado() {
  const aluno = lerEstadoAluno();
  return {
    pedidos: loja.listarPedidos(),
    extrato: loja.extrato(),
    travas: travas(),
    ia: configIA(),
    etapas: etapasComEstado(),
    instrucoes: aluno.instrucoes,
    guarda: aluno.guarda,
    instrucoesPadrao: INSTRUCOES_PADRAO,
    criterios: aluno.criterios,
    criteriosDef: CENARIOS_COMPORTAMENTO.map(({ id, titulo, mensagem, porque }) => ({ id, titulo, mensagem, porque })),
  };
}

// Na página, o agente é sempre uma IA de verdade: sem modelo validado, nada roda (a IA simulada fica
// só para os testes automáticos do material).
function semModelo(res) {
  if (configIA().real) return false;
  json(res, { erro: "Nenhum modelo conectado.", dica: "Valide um modelo na Etapa 1: a sua chave, de qualquer provedor, ou o Ollama no seu computador.", ...estado() });
  return true;
}

// Guarda o resultado de cada critério; os 4 cumpridos com as instruções atuais concluem a Etapa 2.
function registrar(avaliacoes) {
  for (const a of avaliacoes) registrarCriterio(a.id, { ok: a.ok, detalhe: a.detalhe, resposta: a.resposta });
  const feitos = lerEstadoAluno().criterios;
  if (CENARIOS_COMPORTAMENTO.every((c) => feitos[c.id]?.ok)) marcarEtapa("instruir", true);
}

function lerCorpo(req) {
  return new Promise((ok) => {
    let corpo = "";
    req.on("data", (p) => (corpo += p));
    req.on("end", () => { try { ok(JSON.parse(corpo || "{}")); } catch { ok({}); } });
  });
}
function json(res, dados) {
  res.writeHead(200, { "content-type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(dados));
}

const servidor = createServer(async (req, res) => {
  const u = req.url;
  if (req.method === "GET" && u === "/") {
    res.writeHead(200, { "content-type": "text/html; charset=utf-8" });
    return res.end(pagina);
  }
  if (req.method === "GET" && u === "/estado") return json(res, estado());

  if (req.method === "GET" && u === "/ia") {
    const provedores = Object.fromEntries(Object.entries(PROVEDORES).map(([id, p]) =>
      [id, { nome: p.nome, criarChave: p.criarChave, base: p.base, semChave: Boolean(p.semChave), baseEditavel: Boolean(p.baseEditavel) }]));
    return json(res, { ...configIA(), provedores });
  }
  if (req.method === "POST" && u === "/ia/conectar") {
    const { provedor, chave, base } = await lerCorpo(req);
    definirIA({ provedor, chave, base, modelo: "" });
    try { return json(res, { modelos: await listarModelos(), ...estado() }); }
    catch (erro) { return json(res, { erro: erro.message, ...estado() }); }
  }
  if (req.method === "POST" && u === "/ia/modelo") {
    const { modelo = "" } = await lerCorpo(req);
    definirIA({ modelo });
    if (!configIA().real) return json(res, estado());
    try {
      const teste = await testarConexao();
      marcarEtapa("conectar", true);
      return json(res, { teste, ...estado() });
    } catch (erro) {
      return json(res, { erro: erro.message, dica: dicaDoErro(erro.message), ...estado() });
    }
  }

  if (req.method === "POST" && u === "/atender") {
    const { mensagem = "", criterio = "" } = await lerCorpo(req);
    if (semModelo(res)) return;
    if (criterio && CENARIOS_COMPORTAMENTO.some((c) => c.id === criterio)) {
      const r = await testarCriterio(criterio);
      registrar([{ ...r.avaliacao, resposta: r.erro ? `erro: ${r.erro}` : r.resposta }]);
      conversa = r.erro ? [] : [{ role: "user", content: r.mensagem }, { role: "assistant", content: r.resposta }];
      if (r.erro) return json(res, { erro: r.erro, dica: dicaDoErro(r.erro), avaliacao: r.avaliacao, ...estado() });
      return json(res, { resposta: r.resposta, uso: r.uso, avaliacao: r.avaliacao, feedback: feedbackDoTurno(r), ...estado() });
    }
    try {
      const r = await atender(String(mensagem), conversa);
      conversa = [...conversa, { role: "user", content: String(mensagem) }, { role: "assistant", content: r.resposta }].slice(-12);
      return json(res, { resposta: r.resposta, uso: r.uso, feedback: feedbackDoTurno(r), ...estado() });
    } catch (erro) {
      return json(res, { erro: erro.message, dica: dicaDoErro(erro.message), ...estado() });
    }
  }
  if (req.method === "POST" && u === "/conversa/nova") {
    conversa = [];
    return json(res, estado());
  }

  if (req.method === "POST" && u === "/instrucoes") {
    const { instrucoes = "" } = await lerCorpo(req);
    definirInstrucoes(instrucoes);
    return json(res, estado());
  }
  if (req.method === "POST" && u === "/guarda") {
    const { guarda = "" } = await lerCorpo(req);
    definirGuarda(guarda);
    return json(res, estado());
  }
  if (req.method === "POST" && u === "/testar-comportamento") {
    if (semModelo(res)) return;
    const criterios = await testarComportamento();
    registrar(criterios);
    return json(res, { lote: criterios, ...estado() });
  }

  if (req.method === "POST" && u === "/trava") {
    const { id, ligada } = await lerCorpo(req);
    ligarTrava(id, ligada);
    return json(res, estado());
  }
  if (req.method === "POST" && u === "/provas") {
    if (semModelo(res)) return;
    const provas = await rodarProvas();
    if (provas.every((p) => p.ok)) marcarEtapa("blindar", true);
    return json(res, { provas, ...estado() });
  }
  if (req.method === "POST" && u === "/casos") {
    const { extras = [] } = await lerCorpo(req);
    if (semModelo(res)) return;
    const casos = await rodarCasos(Array.isArray(extras) ? extras : []);
    marcarEtapa("medir", true);
    return json(res, { casos, ...estado() });
  }
  if (req.method === "POST" && u === "/etapa") {
    const { id, feita = true } = await lerCorpo(req);
    marcarEtapa(id, feita);
    return json(res, estado());
  }
  if (req.method === "POST" && u === "/desbloquear") {
    const { codigo, ate } = await lerCorpo(req);
    const ok = liberarAte(ate, codigo);
    return json(res, { ...(ok ? {} : { erro: "código inválido" }), ...estado() });
  }
  if (req.method === "POST" && u === "/zerar") {
    loja.zerar();
    return json(res, estado());
  }
  res.writeHead(404);
  res.end();
});

servidor.on("error", (erro) => {
  if (erro.code === "EADDRINUSE") { console.log(`A loja já está aberta em http://localhost:${PORTA}`); process.exit(0); }
  throw erro;
});
servidor.listen(PORTA, () => console.log(`Loja Confia-Tudo aberta em http://localhost:${PORTA}  (para fechar: Ctrl+C)`));
