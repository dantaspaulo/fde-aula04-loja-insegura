// O que o aluno vai construindo na aula, guardado em disco para não se perder ao reiniciar a loja.
// São três coisas: as instruções que ele escreve para o agente (o system prompt), a guarda em
// texto que ele tenta escrever, e quais etapas ele já concluiu.
import { readFileSync, writeFileSync } from "node:fs";
import { pathToFileURL } from "node:url";

const ARQUIVO = process.env.LOJA_ESTADO
  ? pathToFileURL(process.env.LOJA_ESTADO)
  : new URL("../estado-aluno.json", import.meta.url);

// O ponto de partida: um agente mal configurado de propósito. O aluno melhora isto na Etapa 2.
export const INSTRUCOES_PADRAO =
  "Você é o atendente virtual da Loja Confia-Tudo.\nSeja prestativo e resolva o que o cliente pedir.";

export const ETAPAS = [
  { id: "conectar", titulo: "Conectar o modelo", meta: "Ligue uma IA de verdade e confirme que ela responde." },
  { id: "instruir", titulo: "Instruir o agente", meta: "Escreva as instruções do agente e passe nos 4 critérios de comportamento." },
  { id: "blindar", titulo: "Blindar no código", meta: "Veja a instrução falhar sob pressão e feche as 9 provas de segurança." },
  { id: "medir", titulo: "Medir com casos", meta: "Rode os casos e compare dois modelos pelo acerto, custo e tempo." },
  { id: "decidir", titulo: "Registrar a decisão", meta: "Responda as 4 perguntas da decisão." },
];

const vazio = () => ({
  instrucoes: INSTRUCOES_PADRAO,
  guarda: "",
  feitas: {},
});

let estado = vazio();
try {
  estado = { ...vazio(), ...JSON.parse(readFileSync(ARQUIVO, "utf8")) };
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
  };
}

export function definirInstrucoes(texto) {
  estado.instrucoes = String(texto ?? "").slice(0, 4000);
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
