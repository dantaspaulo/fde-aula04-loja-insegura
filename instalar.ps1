# Instala e abre a Loja Confia-Tudo (Windows, PowerShell).
# Não pede senha de administrador e não mexe no resto do computador: tudo fica em $HOME\loja-confia-tudo.
# Se faltar o Node (ou ele for antigo), baixa uma cópia oficial do nodejs.org só para esta pasta.
$ErrorActionPreference = "Stop"
$ProgressPreference = "SilentlyContinue"
$pasta = Join-Path $HOME "loja-confia-tudo"
$versao = "v22.11.0"

Write-Host "1/3 · Baixando a loja em $pasta ..."
New-Item -ItemType Directory -Force -Path $pasta | Out-Null
$zip = Join-Path $env:TEMP "loja-confia-tudo.zip"
Invoke-WebRequest "https://github.com/dantaspaulo/fde-aula04-loja-insegura/archive/refs/heads/main.zip" -OutFile $zip
$tmp = Join-Path $env:TEMP "loja-confia-tudo-zip"
if (Test-Path $tmp) { Remove-Item $tmp -Recurse -Force }
Expand-Archive $zip -DestinationPath $tmp -Force
Copy-Item (Join-Path $tmp "fde-aula04-loja-insegura-main\*") $pasta -Recurse -Force

$node = (Get-Command node -ErrorAction SilentlyContinue).Source
$precisa = $true
if ($node) { try { $precisa = [int]((& $node --version).TrimStart("v").Split(".")[0]) -lt 18 } catch { $precisa = $true } }
if ($precisa) {
  $arq = if ($env:PROCESSOR_ARCHITECTURE -eq "ARM64") { "arm64" } else { "x64" }
  Write-Host "2/3 · Node não encontrado: baixando o Node $versao só para a loja ..."
  $nodeZip = Join-Path $env:TEMP "node-loja.zip"
  Invoke-WebRequest "https://nodejs.org/dist/$versao/node-$versao-win-$arq.zip" -OutFile $nodeZip
  Expand-Archive $nodeZip -DestinationPath $pasta -Force
  $node = Join-Path $pasta "node-$versao-win-$arq\node.exe"
} else {
  Write-Host "2/3 · Node encontrado: $(& $node --version)"
}

Write-Host "3/3 · Abrindo a loja em http://localhost:3737 (para fechar: Ctrl+C)"
Start-Job { Start-Sleep -Seconds 2; Start-Process "http://localhost:3737" } | Out-Null
Set-Location $pasta
& $node servidor.js
