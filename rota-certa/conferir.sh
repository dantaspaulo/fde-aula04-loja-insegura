#!/usr/bin/env bash
# Conferência final da prática da Rota Certa (Delta Academy · FDE · Aula 04).
# Só LÊ: não muda nada no seu computador nem no Hermes. Leia antes de rodar: é script de fora.
# Uso: bash conferir.sh [pasta da empresa]      (padrão: ~/rota-certa)
PASTA="${1:-$HOME/rota-certa}"
HASH_OFICIAL="1b5703b1ff001e0f534e6db877f003db480530c731d50eb15f8ec096e01c6fc2"
SKILLS="${HERMES_HOME:-$HOME/.hermes}/skills"
ok=0; total=0
marca(){ total=$((total+1)); if [ "$1" = 0 ]; then ok=$((ok+1)); echo "  ✓ $2"; else echo "  ✗ $2"; [ -n "$3" ] && echo "      → $3"; fi; }
cfg(){ hermes config get "$1" 2>/dev/null | tr -d '\r' | tail -1; }
vazio(){ [ -z "$1" ] || [ "$1" = "None" ] || [ "$1" = "null" ] || [ "$1" = "[]" ]; }

echo "Conferência da prática · Rota Certa (pasta: $PASTA)"
echo; echo "1 · Instalação"
command -v hermes >/dev/null 2>&1; marca $? "Hermes instalado" "Instale pelo site oficial e abra um terminal novo."
n=$(hermes doctor 2>&1 | grep -c "✗"); echo "  · hermes doctor apontou $n item(ns) com ✗ (não entra na nota; aviso de npm é comum). Leia com: hermes doctor"
echo; echo "2 · Modelo"
m=$(cfg model.default); ! vazio "$m"; marca $? "modelo principal: ${m:-nenhum}" "Configure o modelo e o provedor."
f=$(cfg fallback_providers); ! vazio "$f"; marca $? "modelo de reserva configurado" "Falta o modelo de reserva."
echo; echo "3 · Segurança"
a=$(cfg approvals.mode); [ "$a" != "off" ]; marca $? "aprovações ligadas (modo: ${a:-padrão})" "As aprovações não podem estar desligadas."
hermes config get approvals.deny 2>/dev/null | grep -qi "cobranc"; marca $? "regra de bloqueio protegendo a planilha" "Nenhuma regra do deny cita a planilha."
CSV="$PASTA/cobrancas-28-10.csv"
if [ -f "$CSV" ]; then
  h=$( (shasum -a 256 "$CSV" 2>/dev/null || sha256sum "$CSV") | cut -d' ' -f1)
  [ "$h" = "$HASH_OFICIAL" ]; marca $? "planilha original intacta (o hash confere)" "O hash mudou: a planilha foi alterada."
else marca 1 "planilha original intacta" "Não achei $CSV. Rode: bash conferir.sh /caminho/da/pasta"; fi
echo; echo "4 · Skills"
find "$SKILLS" -maxdepth 4 -name SKILL.md -path "*conferir-cobrancas*" 2>/dev/null | grep -q .; marca $? "skill conferir-cobrancas criada" "Não achei a skill em $SKILLS."
echo; echo "5 · O problema da Rota Certa"
S="$PASTA/saida"
ls "$S"/* >/dev/null 2>&1; marca $? "pasta saida/ com arquivos" "Nada em $S."
t=$(cat "$S"/* 2>/dev/null)
echo "$t" | grep -Eq "1[ .]?174"; marca $? "total a devolver: R\$ 1.174,00" "Confira o seu total contra o gabarito oficial."
echo "$t" | grep -qi "alicerce"; marca $? "Construtora Alicerce citada (R\$ 620,00 vai para o financeiro)" "O caso acima de R\$ 500 não apareceu."
echo; echo "Resultado: $ok de $total."
echo "O que o script não vê, confira à mão: as mensagens seguem a política? Quem não devia receber ficou de fora?"
