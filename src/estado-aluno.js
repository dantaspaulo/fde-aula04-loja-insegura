// O que o aluno vai construindo na aula, guardado em disco para não se perder ao reiniciar a loja.
// São três coisas: as instruções que ele escreve para o agente (o system prompt), a guarda em
// texto que ele tenta escrever, e quais etapas ele já concluiu.
import { readFileSync, writeFileSync } from "node:fs";
import { pathToFileURL } from "node:url";

const ARQUIVO = process.env.LOJA_ESTADO
  ? pathToFileURL(process.env.LOJA_ESTADO)
  : new URL("../estado-aluno.json", import.meta.url);

// O aluno não escreve o prompt do zero: o agente já vem com o prompt da loja (escondido, em
// atendimento.js). O que o aluno escreve são AJUSTES, que entram depois dele. Começa vazio.
export const INSTRUCOES_PADRAO = "";
const PADRAO_ANTIGO = "Você é o atendente virtual da Loja Confia-Tudo.\nSeja prestativo e resolva o que o cliente pedir.";

export const ETAPAS = [
  { id: "conectar", titulo: "Conectar o modelo", meta: "Sua chave, qualquer provedor, validada." },
  { id: "instruir", titulo: "Ajustar o agente", meta: "Ache no chat o que ele faz errado e corrija com ajustes." },
  { id: "blindar", titulo: "Blindar no código", meta: "Veja o prompt ceder sob pressão e feche as 9 provas." },
  { id: "medir", titulo: "Medir com casos", meta: "Compare dois modelos: acerto, tokens e tempo." },
  { id: "decidir", titulo: "Registrar a decisão", meta: "As 4 perguntas do ADR." },
];

const vazio = () => ({
  instrucoes: INSTRUCOES_PADRAO,
  guarda: "",
  feitas: {},
  criterios: {},
  travas: {},
  resultados: {},
});

let estado = vazio();
try {
  estado = { ...vazio(), ...JSON.parse(readFileSync(ARQUIVO, "utf8")) };
  if (estado.instrucoes === PADRAO_ANTIGO) estado.instrucoes = "";
} catch {}

function gravar() {
  try {
    writeFileSync(ARQUIVO, JSON.stringify(estado, null, 2));
  } catch {}
}

export function lerEstadoAluno() {
  return {
    instrucoes: estado.instrucoes,
    guarda: estado.guarda,
    feitas: { ...estado.feitas },
    criterios: { ...estado.criterios },
    travas: { ...estado.travas },
    resultados: { ...estado.resultados },
  };
}

// Mudou as instruções: os critérios já testados deixam de valer e voltam a "testar de novo".
export function definirInstrucoes(texto) {
  const novo = String(texto ?? "").slice(0, 4000);
  if (novo !== estado.instrucoes) estado.criterios = {};
  estado.instrucoes = novo;
  gravar();
}

// O último resultado das provas e dos casos, para não sumir ao trocar de etapa ou recarregar.
export function guardarResultado(nome, valor) {
  estado.resultados[nome] = valor;
  gravar();
}

export function gravarTravas(ligadas) {
  estado.travas = { ...ligadas };
  gravar();
}

export function registrarCriterio(id, resultado) {
  estado.criterios[id] = resultado;
  gravar();
}

export function definirGuarda(texto) {
  estado.guarda = String(texto ?? "").slice(0, 4000);
  gravar();
}

// Para destravar uma dupla presa: o professor diz o código, e as etapas anteriores contam como feitas.
export const CODIGO_DO_PROFESSOR = "DELTA-FDE";

export function liberarAte(id, codigo) {
  if (String(codigo || "").trim().toUpperCase() !== CODIGO_DO_PROFESSOR) return false;
  for (const e of ETAPAS) {
    if (e.id === id) break;
    estado.feitas[e.id] = true;
  }
  gravar();
  return true;
}

export function marcarEtapa(id, feita = true) {
  estado.feitas[id] = Boolean(feita);
  gravar();
}

// Quais etapas estão liberadas: a primeira sempre; cada próxima só depois que a anterior foi concluída.
export function etapasComEstado() {
  let liberadaAteAqui = true;
  return ETAPAS.map((etapa) => {
    const feita = Boolean(estado.feitas[etapa.id]);
    const liberada = liberadaAteAqui;
    liberadaAteAqui = liberadaAteAqui && feita;
    return { ...etapa, feita, liberada };
  });
}
