// Sobe a Loja Confia-Tudo em http://localhost:3737.
import { createServer } from "node:http";
import { readFileSync } from "node:fs";
import { atender, travas, ligarTrava } from "./src/atendimento.js";
import { rodarProvas, testarComportamento } from "./src/cenarios.js";
import { rodarCasos } from "./src/casos.js";
import { PROVEDORES, configIA, definirIA, listarModelos, usarSimulada } from "./src/modelo.js";
import {
  INSTRUCOES_PADRAO, lerEstadoAluno, definirInstrucoes, definirGuarda, marcarEtapa, etapasComEstado, liberarAte,
} from "./src/estado-aluno.js";
import * as loja from "./src/loja.js";

const PORTA = Number(process.env.PORTA) || 3737;
const pagina = readFileSync(new URL("./pagina.html", import.meta.url), "utf8");

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
  };
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
    if (configIA().real) marcarEtapa("conectar", true);
    return json(res, estado());
  }
  if (req.method === "POST" && u === "/ia/simulada") {
    usarSimulada();
    marcarEtapa("conectar", true);
    return json(res, estado());
  }

  if (req.method === "POST" && u === "/atender") {
    const { mensagem = "" } = await lerCorpo(req);
    let resposta, uso = null;
    try { ({ resposta, uso } = await atender(String(mensagem))); }
    catch (erro) { resposta = `Erro no atendimento: ${erro.message}`; }
    return json(res, { resposta, uso, ...estado() });
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
    const criterios = await testarComportamento();
    if (criterios.every((c) => c.ok)) marcarEtapa("instruir", true);
    return json(res, { criterios, ...estado() });
  }

  if (req.method === "POST" && u === "/trava") {
    const { id, ligada } = await lerCorpo(req);
    ligarTrava(id, ligada);
    return json(res, estado());
  }
  if (req.method === "POST" && u === "/provas") {
    const provas = await rodarProvas();
    if (provas.every((p) => p.ok)) marcarEtapa("blindar", true);
    return json(res, { provas, ...estado() });
  }
  if (req.method === "POST" && u === "/casos") {
    const { extras = [] } = await lerCorpo(req);
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
