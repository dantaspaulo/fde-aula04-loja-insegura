// Roda o eval no terminal (o mesmo da aba "Casos" da página). Uso: npm run eval
import { rodarCasos } from "../src/casos.js";
const brl = (v) => "R$ " + v.toLocaleString("pt-BR");
const r = await rodarCasos();
console.log("caso  esperado   a loja pagou   resultado");
for (const c of r) console.log(`${c.id.padEnd(5)} ${brl(c.esperado).padEnd(10)} ${brl(c.pagou).padEnd(14)} ${c.ok ? "ok" : "ERROU: " + c.porque}`);
console.log(`\nAcertos: ${r.filter((c) => c.ok).length} de ${r.length}`);
