$ErrorActionPreference = 'Stop'
$app = Get-Command herdr-app.exe -CommandType Application -ErrorAction SilentlyContinue
if (-not $app) {
    throw 'Herdr App must be installed and herdr-app.exe must be on PATH.'
}

$config = $env:HERDR_APP_HOME
if (-not $config) {
    $configRoot = if ($env:XDG_CONFIG_HOME) { $env:XDG_CONFIG_HOME } else { Join-Path $HOME '.config' }
    $config = Join-Path $configRoot 'herdr-app'
}

# herdr-app.exe is a GUI-subsystem binary: PowerShell neither waits for it nor sets $LASTEXITCODE.
function Invoke-Herdr([string[]]$Arguments, [switch]$Quiet) {
    $options = @{ FilePath = $app.Source; ArgumentList = $Arguments; Wait = $true; PassThru = $true; NoNewWindow = $true }
    if ($Quiet) {
        $options.RedirectStandardOutput = [IO.Path]::GetTempFileName()
        $options.RedirectStandardError = [IO.Path]::GetTempFileName()
    }
    try {
        return (Start-Process @options).ExitCode
    } finally {
        if ($Quiet) { Remove-Item -LiteralPath $options.RedirectStandardOutput, $options.RedirectStandardError -Force -ErrorAction SilentlyContinue }
    }
}

$layouts = Join-Path $config 'layouts'
$themes = Join-Path $config 'themes'
$mods = Join-Path $config 'mods'
New-Item -ItemType Directory -Force -Path $layouts, $themes, $mods | Out-Null

foreach ($theme in @('Mewltiplex-Clair', 'Mewltiplex-Sombre')) {
    Copy-Item -LiteralPath (Join-Path $PSScriptRoot "themes/$theme.json") -Destination $themes -Force
}
foreach ($mod in @('oaklabs-brand', 'oaklabs-pane', 'oaklabs-companions')) {
    Copy-Item -LiteralPath (Join-Path $PSScriptRoot "mods/$mod") -Destination $mods -Recurse -Force
    if ((Invoke-Herdr @('check', (Join-Path $mods $mod))) -ne 0) {
        throw "Herdr could not load the $mod mod."
    }
}
Copy-Item -LiteralPath (Join-Path $PSScriptRoot 'preview.png') -Destination (Join-Path $layouts 'Mewltiplex.png') -Force
Copy-Item -LiteralPath (Join-Path $PSScriptRoot 'layouts/Mewltiplex.json') -Destination $layouts -Force

$legacy = Join-Path $layouts 'oaklabs.json'
$stateDirectory = Join-Path $layouts '.state'
$legacyState = Join-Path $stateDirectory 'oaklabs.json'
$state = Join-Path $stateDirectory 'Mewltiplex.json'
$hasLegacyLayout = (Test-Path -LiteralPath $legacy) -and
    (Select-String -LiteralPath $legacy -Pattern '"mod"\s*:\s*"oaklabs-brand"' -Quiet)
if ($hasLegacyLayout -and (Test-Path -LiteralPath $legacyState) -and -not (Test-Path -LiteralPath $state)) {
    $migrated = [IO.File]::ReadAllText($legacyState).Replace('"oaklabs-paper"', '"Mewltiplex-Clair"').Replace('"oaklabs-scanner"', '"Mewltiplex-Sombre"')
    [IO.File]::WriteAllText($state, $migrated)
}

$appIsOpen = (Invoke-Herdr @('status') -Quiet) -eq 0
if ($appIsOpen) {
    if ((Invoke-Herdr @('do', 'layout.switch', '--name', 'Mewltiplex')) -ne 0) {
        throw 'Herdr could not switch to the Mewltiplex layout.'
    }
} else {
    Write-Host 'Open Herdr and select Mewltiplex in Settings > Look > Layout.'
}

function Save-LegacyFile($path) {
    if ((Test-Path -LiteralPath $path -PathType Leaf) -and -not (Test-Path -LiteralPath "$path.bak")) {
        Move-Item -LiteralPath $path -Destination "$path.bak"
    }
}

if ($hasLegacyLayout) {
    Save-LegacyFile $legacy
    Save-LegacyFile $legacyState
    Save-LegacyFile (Join-Path $layouts 'oaklabs.png')
    $references = @(
        Get-ChildItem -LiteralPath $layouts, $stateDirectory -Filter '*.json' -File -ErrorAction SilentlyContinue
        Get-Item -LiteralPath (Join-Path $config 'settings.json') -ErrorAction SilentlyContinue
    )
    $legacyThemes = @{
        'oaklabs-paper' = 'Mewltiplex-Clair'
        'oaklabs-scanner' = 'Mewltiplex-Sombre'
    }
    foreach ($oldName in $legacyThemes.Keys) {
        $oldPalette = Join-Path $themes "$oldName.json"
        $newPalette = Join-Path $themes "$($legacyThemes[$oldName]).json"
        if ((Test-Path -LiteralPath $oldPalette -PathType Leaf) -and
            ([IO.File]::ReadAllText($oldPalette) -ceq [IO.File]::ReadAllText($newPalette)) -and
            -not (Select-String -LiteralPath $references.FullName -Pattern ('"' + $oldName + '"') -SimpleMatch -Quiet)) {
            Save-LegacyFile $oldPalette
        }
    }
}
