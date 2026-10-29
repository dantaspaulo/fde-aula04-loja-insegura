// A ligação com a IA de verdade: OpenAI, Anthropic, Gemini, OpenRouter, Groq, Ollama ou outro no mesmo padrão.
// A chave do aluno fica só no computador dele, em config-ia.json (fora do git), e nunca volta para a página.
import { readFileSync, writeFileSync } from "node:fs";
import { pathToFileURL } from "node:url";

const ARQUIVO = process.env.LOJA_CONFIG_IA ? pathToFileURL(process.env.LOJA_CONFIG_IA) : new URL("../config-ia.json", import.meta.url);

export const PROVEDORES = {
  openai: { nome: "OpenAI", base: "https://api.openai.com/v1", criarChave: "https://platform.openai.com/api-keys" },
  anthropic: { nome: "Anthropic (Claude)", base: "https://api.anthropic.com/v1", criarChave: "https://console.anthropic.com/settings/keys" },
  gemini: { nome: "Google Gemini", base: "https://generativelanguage.googleapis.com/v1beta/openai", criarChave: "https://aistudio.google.com/apikey" },
  openrouter: { nome: "OpenRouter", base: "https://openrouter.ai/api/v1", criarChave: "https://openrouter.ai/settings/keys" },
  groq: { nome: "Groq", base: "https://api.groq.com/openai/v1", criarChave: "https://console.groq.com/keys" },
  ollama: { nome: "Ollama (no seu computador)", base: "http://localhost:11434/v1", criarChave: "https://ollama.com/download", semChave: true, baseEditavel: true },
  outro: { nome: "Outro (padrão OpenAI)", base: "", criarChave: "", semChave: true, baseEditavel: true },
};

// Modelos que não conversam (imagem, áudio, embeddings) ficam fora da lista.
const NAO_CONVERSA = /embed|whisper|tts|dall-e|image|audio|moderation|transcri|realtime|speech|guard|davinci|babbage|rerank/i;

let cfg = { provedor: "openai", base: "", chave: "", modelo: "" };
try { cfg = { ...cfg, ...JSON.parse(readFileSync(ARQUIVO, "utf8")) }; } catch {}

// Alguns modelos recusam parâmetros: os de raciocínio da OpenAI só aceitam ferramentas com
// reasoning_effort "none", e vários recusam temperature. A loja aprende com o erro 400 e se ajusta,
// guardando o ajuste por modelo, para o aluno não precisar saber disso.
const ajustesPorModelo = new Map();

const base = () => cfg.base || PROVEDORES[cfg.provedor]?.base || "";
const gravar = () => { try { writeFileSync(ARQUIVO, JSON.stringify(cfg, null, 2), { mode: 0o600 }); } catch {} };

const semChave = () => Boolean(PROVEDORES[cfg.provedor]?.semChave);

export function configIA() {
  return {
    provedor: cfg.provedor,
    base: base(),
    modelo: cfg.modelo,
    temChave: Boolean(cfg.chave),
    finalDaChave: cfg.chave ? cfg.chave.slice(-4) : "",
    real: Boolean(cfg.modelo && (cfg.chave || semChave())),
    ajustes: Object.keys(ajustesPorModelo.get(cfg.modelo) || {}),
  };
}

export function definirIA({ provedor, chave, modelo, base: outraBase } = {}) {
  if (provedor && provedor !== cfg.provedor && (PROVEDORES[provedor] || outraBase)) {
    cfg.provedor = provedor;
    cfg.base = "";
    cfg.chave = "";
  }
  if (outraBase !== undefined && outraBase !== "") cfg.base = String(outraBase).trim().replace(/\/+$/, "");
  if (chave) cfg.chave = String(chave).trim();
  if (modelo !== undefined) cfg.modelo = String(modelo);
  gravar();
  return configIA();
}

export function usarSimulada() {
  cfg.modelo = "";
  gravar();
  return configIA();
}

async function pedir(caminho, opcoes = {}) {
  const fator = Number(process.env.LOJA_ESPERA_429_FATOR ?? 1);
  const tentativas = [0, 3000, 8000, 15000].map((ms) => ms * fator);
  for (let i = 0; i < tentativas.length; i++) {
    if (tentativas[i]) await new Promise((r) => setTimeout(r, tentativas[i]));
    const res = await fetch(base() + caminho, {
      ...opcoes,
      headers: {
        "content-type": "application/json",
        ...(cfg.chave ? { authorization: `Bearer ${cfg.chave}` } : {}),
        ...(cfg.provedor === "anthropic" ? { "x-api-key": cfg.chave, "anthropic-version": "2023-06-01" } : {}),
        ...(opcoes.headers || {}),
      },
    });
    if (res.status === 429 && i < tentativas.length - 1) continue; // limite do plano grátis: espera e tenta de novo
    const texto = await res.text();
    if (!res.ok) {
      let detalhe = texto;
      try { const j = JSON.parse(texto); detalhe = j.error?.message || j.message || (typeof j.error === "string" ? j.error : texto); } catch {}
      throw new Error(`a IA respondeu ${res.status}: ${String(detalhe).slice(0, 300)}`);
    }
    return JSON.parse(texto);
  }
}

export async function listarModelos() {
  const dados = await pedir("/models");
  const lista = (dados.data || dados.models || [])
    .filter((m) => !Array.isArray(m.supported_parameters) || m.supported_parameters.includes("tools"))
    .map((m) => String(m.id || m.name || "").replace(/^models\//, ""))
    .filter((id) => id && !NAO_CONVERSA.test(id))
    .sort();
  return lista;
}

export async function chamarModelo(mensagens, ferramentas) {
  const inicio = Date.now();
  const aj = ajustesPorModelo.get(cfg.modelo) || {};
  for (let tentativa = 0; tentativa < 3; tentativa++) {
    const corpo = { model: cfg.modelo, messages: mensagens, tools: ferramentas, tool_choice: "auto" };
    if (!aj.semTemperatura) corpo.temperature = 0.5;
    if (aj.esforcoNenhum) corpo.reasoning_effort = "none";
    try {
      const dados = await pedir("/chat/completions", { method: "POST", body: JSON.stringify(corpo) });
      const escolha = dados.choices?.[0];
      if (!escolha) throw new Error("a IA não devolveu resposta");
      return { mensagem: escolha.message || {}, uso: dados.usage || {}, ms: Date.now() - inicio };
    } catch (erro) {
      const m = String(erro.message);
      if (/ 400:/.test(m) && /reasoning_effort/i.test(m) && !aj.esforcoNenhum) { aj.esforcoNenhum = true; ajustesPorModelo.set(cfg.modelo, aj); continue; }
      if (/ 400:/.test(m) && /temperature/i.test(m) && !aj.semTemperatura) { aj.semTemperatura = true; ajustesPorModelo.set(cfg.modelo, aj); continue; }
      throw erro;
    }
  }
  throw new Error("o modelo recusou os parâmetros mesmo depois dos ajustes");
}

// O que dizer ao aluno quando a IA falha: o erro do provedor vem em inglês e cru.
export function dicaDoErro(mensagem) {
  const m = String(mensagem);
  if (/ 40[13]:/.test(m)) return "O provedor recusou a chave. Confira a chave e o provedor na Etapa 1.";
  if (/ 404:/.test(m)) return "O provedor não achou esse modelo. Escolha outro na Etapa 1.";
  if (/ 429:/.test(m)) return "Limite do seu plano no provedor. Espere um pouco ou troque de modelo na Etapa 1.";
  if (/ 400:/.test(m) && /tool|function/i.test(m)) return "Este modelo não aceita ferramentas (function calling) por aqui. Escolha outro na Etapa 1.";
  if (/ 400:/.test(m)) return "O provedor recusou a chamada. Leia a mensagem acima e, se precisar, troque de modelo na Etapa 1.";
  if (/fetch failed|ECONNREFUSED|ENOTFOUND|ETIMEDOUT/i.test(m)) return "Não alcançou o provedor. No Ollama, confira se ele está aberto; nos outros, a internet.";
  return "";
}
