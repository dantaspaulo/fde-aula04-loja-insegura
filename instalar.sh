#!/usr/bin/env bash
# Instala e abre a Loja Confia-Tudo (Mac e Linux).
# Não pede senha e não mexe no resto do computador: tudo fica na pasta ~/loja-confia-tudo.
# Se faltar o Node (ou ele for antigo), baixa uma cópia oficial do nodejs.org só para esta pasta.
set -euo pipefail

PASTA="${LOJA_PASTA:-$HOME/loja-confia-tudo}"
LOJA="https://github.com/dantaspaulo/fde-aula04-loja-insegura/archive/refs/heads/main.tar.gz"
NODE_VERSAO="v22.11.0"

echo "1/3 · Baixando a loja em $PASTA ..."
mkdir -p "$PASTA"
curl -fsSL "$LOJA" | tar -xz -C "$PASTA" --strip-components=1

NODE="$(command -v node || true)"
if [ -n "${LOJA_BAIXAR_NODE:-}" ] || [ -z "$NODE" ] || ! "$NODE" -e 'process.exit(+process.versions.node.split(".")[0] >= 18 ? 0 : 1)' 2>/dev/null; then
  SO="$(uname -s | tr 'A-Z' 'a-z')"
  ARQ="$(uname -m)"
  case "$ARQ" in x86_64) ARQ="x64" ;; aarch64|arm64) ARQ="arm64" ;; esac
  case "$SO" in darwin|linux) ;; *) echo "Sistema não suportado por este instalador: $SO"; exit 1 ;; esac
  echo "2/3 · Node não encontrado: baixando o Node $NODE_VERSAO só para a loja ..."
  curl -fsSL "https://nodejs.org/dist/$NODE_VERSAO/node-$NODE_VERSAO-$SO-$ARQ.tar.gz" | tar -xz -C "$PASTA"
  NODE="$PASTA/node-$NODE_VERSAO-$SO-$ARQ/bin/node"
else
  echo "2/3 · Node encontrado: $("$NODE" --version)"
fi

[ -n "${LOJA_SO_INSTALAR:-}" ] && { echo "Instalado (sem abrir). Node: $NODE"; exit 0; }

echo "3/3 · Abrindo a loja em http://localhost:3737 (para fechar: Ctrl+C)"
( sleep 1.5; open "http://localhost:3737" 2>/dev/null || xdg-open "http://localhost:3737" 2>/dev/null || true ) &
cd "$PASTA"
exec "$NODE" servidor.js
