// Sobe a Loja Confia-Tudo em http://localhost:3737. Não precisa editar.
// Com `npm start`, o servidor reinicia sozinho quando você salva um arquivo (e a loja volta ao começo).
import { createServer } from "node:http";
import { readFileSync } from "node:fs";
import { atender } from "./src/atendimento.js";
import * as loja from "./src/loja.js";

const PORTA = Number(process.env.PORTA) || 3737;
const pagina = readFileSync(new URL("./pagina.html", import.meta.url), "utf8");
const estado = () => ({ pedidos: loja.listarPedidos(), extrato: loja.extrato() });

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

createServer(async (req, res) => {
  if (req.method === "GET" && req.url === "/") {
    res.writeHead(200, { "content-type": "text/html; charset=utf-8" });
    return res.end(pagina);
  }
  if (req.method === "GET" && req.url === "/estado") return json(res, estado());
  if (req.method === "POST" && req.url === "/atender") {
    const { mensagem = "" } = await lerCorpo(req);
    let resposta;
    try { resposta = atender(String(mensagem)).resposta; } catch (erro) { resposta = `Erro no atendimento: ${erro.message}`; }
    return json(res, { resposta, ...estado() });
  }
  if (req.method === "POST" && req.url === "/zerar") {
    loja.zerar();
    return json(res, estado());
  }
  res.writeHead(404);
  res.end();
}).listen(PORTA, () => console.log(`Loja Confia-Tudo aberta em http://localhost:${PORTA}`));
