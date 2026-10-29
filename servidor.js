// Sobe a Loja Confia-Tudo em http://localhost:3737.
import { createServer } from "node:http";
import { readFileSync } from "node:fs";
import { atender, travas, ligarTrava } from "./src/atendimento.js";
import { rodarProvas } from "./src/provas.js";
import { rodarCasos } from "./src/casos.js";
import * as loja from "./src/loja.js";
import { PROVEDORES, configIA, definirIA, listarModelos, usarSimulada } from "./src/modelo.js";

const PORTA = Number(process.env.PORTA) || 3737;
const pagina = readFileSync(new URL("./pagina.html", import.meta.url), "utf8");
const estado = () => ({ pedidos: loja.listarPedidos(), extrato: loja.extrato(), travas: travas(), ia: configIA() });

function lerCorpo(req) {
  return new Promise((ok) => {
    let corpo = "";
    req.on("data", (parte) => (corpo += parte));
    req.on("end", () => {
      try { ok(JSON.parse(corpo || "{}")); } catch { ok({}); }
    });
  });
}

function json(res, dados) {
  res.writeHead(200, { "content-type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(dados));
}

const servidor = createServer(async (req, res) => {
  if (req.method === "GET" && req.url === "/") {
    res.writeHead(200, { "content-type": "text/html; charset=utf-8" });
    return res.end(pagina);
  }
  if (req.method === "GET" && req.url === "/estado") return json(res, estado());
  if (req.method === "POST" && req.url === "/atender") {
    const { mensagem = "" } = await lerCorpo(req);
    let resposta, uso = null;
    try { ({ resposta, uso } = await atender(String(mensagem))); } catch (erro) { resposta = `Erro no atendimento: ${erro.message}`; }
    return json(res, { resposta, uso, ...estado() });
  }
  if (req.method === "POST" && req.url === "/zerar") {
    loja.zerar();
    return json(res, estado());
  }
  if (req.method === "POST" && req.url === "/trava") {
    const { id, ligada } = await lerCorpo(req);
    ligarTrava(id, ligada);
    return json(res, estado());
  }
  if (req.method === "POST" && req.url === "/provas") return json(res, { provas: await rodarProvas(), ...estado() });
  if (req.method === "POST" && req.url === "/casos") {
    const { extras = [] } = await lerCorpo(req);
    return json(res, { casos: await rodarCasos(Array.isArray(extras) ? extras : []), ...estado() });
  }
  if (req.method === "GET" && req.url === "/ia") {
    const provedores = Object.fromEntries(Object.entries(PROVEDORES).map(([id, p]) => [id, { nome: p.nome, criarChave: p.criarChave, base: p.base, semChave: Boolean(p.semChave), baseEditavel: Boolean(p.baseEditavel) }]));
    return json(res, { ...configIA(), provedores });
  }
  if (req.method === "POST" && req.url === "/ia/conectar") {
    const { provedor, chave, base } = await lerCorpo(req);
    definirIA({ provedor, chave, base, modelo: "" });
    try { return json(res, { modelos: await listarModelos(), ...estado() }); }
    catch (erro) { return json(res, { erro: erro.message, ...estado() }); }
  }
  if (req.method === "POST" && req.url === "/ia/modelo") {
    const { modelo = "" } = await lerCorpo(req);
    definirIA({ modelo });
    return json(res, estado());
  }
  if (req.method === "POST" && req.url === "/ia/simulada") {
    usarSimulada();
    return json(res, estado());
  }
  res.writeHead(404);
  res.end();
});

servidor.on("error", (erro) => {
  if (erro.code === "EADDRINUSE") {
    console.log(`A loja já está aberta em http://localhost:${PORTA}`);
    process.exit(0);
  }
  throw erro;
});
servidor.listen(PORTA, () => console.log(`Loja Confia-Tudo aberta em http://localhost:${PORTA}  (para fechar: Ctrl+C)`));
