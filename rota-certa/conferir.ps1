# Conferência final da prática da Rota Certa (Delta Academy · FDE · Aula 04), para Windows.
# Só LÊ: não muda nada no seu computador nem no Hermes. Leia antes de rodar: é script de fora.
# Uso: powershell -ExecutionPolicy Bypass -File .\conferir.ps1 [pasta]   (padrão: ~\rota-certa)
param([string]$Pasta = "$HOME\rota-certa")
$HashOficial = "1B5703B1FF001E0F534E6DB877F003DB480530C731D50EB15F8EC096E01C6FC2"
$ok = 0; $total = 0
function Marca($passou, $texto, $dica) { $script:total++; if ($passou) { $script:ok++; Write-Host "  OK  $texto" } else { Write-Host "  X   $texto"; if ($dica) { Write-Host "      -> $dica" } } }
function Cfg($k) { try { (hermes config get $k 2>$null | Select-Object -Last 1) } catch { "" } }
function Vazio($v) { -not $v -or $v -in @("None", "null", "[]") }
Write-Host "Conferencia da pratica - Rota Certa (pasta: $Pasta)"
Write-Host "`n1 - Instalacao"
Marca ([bool](Get-Command hermes -ErrorAction SilentlyContinue)) "Hermes instalado" "Instale pelo site oficial e abra um terminal novo."
$n = (hermes doctor 2>&1 | Out-String) -split "`n" | Where-Object { $_ -match "✗" } | Measure-Object | Select-Object -ExpandProperty Count; Write-Host "  .   hermes doctor apontou $n item(ns) com X (nao entra na nota; aviso de npm e comum). Leia com: hermes doctor"
Write-Host "`n2 - Modelo"
$m = Cfg "model.default"; Marca (-not (Vazio $m)) "modelo principal: $m" "Configure o modelo e o provedor."
$f = Cfg "fallback_providers"; Marca (-not (Vazio $f)) "modelo de reserva configurado" "Falta o modelo de reserva."
Write-Host "`n3 - Seguranca"
$a = Cfg "approvals.mode"; Marca ($a -ne "off") "aprovacoes ligadas (modo: $a)" "As aprovacoes nao podem estar desligadas."
$d = (hermes config get approvals.deny 2>$null) -join " "; Marca ($d -match "cobranc") "regra de bloqueio protegendo a planilha" "Nenhuma regra do deny cita a planilha."
$csv = Join-Path $Pasta "cobrancas-28-10.csv"
if (Test-Path $csv) { Marca ((Get-FileHash $csv -Algorithm SHA256).Hash -eq $HashOficial) "planilha original intacta (o hash confere)" "O hash mudou: a planilha foi alterada." }
else { Marca $false "planilha original intacta" "Nao achei $csv. Passe a pasta como parametro." }
Write-Host "`n4 - Skills"
$sk = if ($env:HERMES_HOME) { "$env:HERMES_HOME\skills" } elseif (Test-Path "$env:LOCALAPPDATA\hermes\skills") { "$env:LOCALAPPDATA\hermes\skills" } else { "$HOME\.hermes\skills" }
Marca ([bool](Get-ChildItem $sk -Recurse -Filter SKILL.md -ErrorAction SilentlyContinue | Where-Object { $_.FullName -match "conferir-cobrancas" })) "skill conferir-cobrancas criada" "Nao achei a skill em $sk."
Write-Host "`n5 - O problema da Rota Certa"
$s = Join-Path $Pasta "saida"
$arq = Get-ChildItem $s -File -ErrorAction SilentlyContinue
Marca ([bool]$arq) "pasta saida com arquivos" "Nada em $s."
$t = ($arq | Get-Content -Raw -ErrorAction SilentlyContinue) -join " "
Marca ($t -match "1[ .]?174") "total a devolver: R$ 1.174,00" "Confira o seu total contra o gabarito oficial."
Marca ($t -match "(?i)alicerce") "Construtora Alicerce citada (R$ 620,00 vai para o financeiro)" "O caso acima de R$ 500 nao apareceu."
Write-Host "`nResultado: $ok de $total."
Write-Host "O que o script nao ve, confira a mao: as mensagens seguem a politica? Quem nao devia receber ficou de fora?"
