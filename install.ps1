$ErrorActionPreference = 'Stop'
$app = Get-Command herdr-app.exe -CommandType Application -ErrorAction SilentlyContinue
if (-not $app) {
    throw 'Herdr App must be installed and herdr-app.exe must be on PATH.'
}
# A Herdr server started here keeps this environment for every terminal it opens:
# drop the markers of an agent session so agents launched later run as top-level sessions.
foreach ($marker in @('CLAUDECODE', 'CLAUDE_CODE_CHILD_SESSION', 'CLAUDE_CODE_ENTRYPOINT', 'CLAUDE_CODE_EXECPATH',
        'CLAUDE_CODE_SESSION_ID', 'CLAUDE_CODE_SESSION_ATTENDED', 'CLAUDE_CODE_MESSAGING_SOCKET',
        'CLAUDE_CODE_MESSAGING_TOKEN', 'CLAUDE_PID', 'CLAUDE_EFFORT', 'AI_AGENT')) {
    Remove-Item -LiteralPath "Env:$marker" -ErrorAction SilentlyContinue
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

# Optional notification sounds supplied by the person installing the theme.
# Some downloaded MP3s contain a large ID3 tag that Herdr falls back from.
$sourceSounds = Join-Path $PSScriptRoot 'sounds'
$targetSounds = Join-Path $config 'sounds'
if (Test-Path -LiteralPath $sourceSounds -PathType Container) {
    New-Item -ItemType Directory -Force -Path $targetSounds | Out-Null
    $doneSource = Join-Path $sourceSounds 'pokemon-item-received.mp3'
    if (Test-Path -LiteralPath $doneSource -PathType Leaf) {
        $bytes = [IO.File]::ReadAllBytes($doneSource)
        if ($bytes.Length -lt 14) { throw 'pokemon-item-received.mp3 is too short to be an MP3.' }
        $offset = 0
        if ($bytes[0] -eq 73 -and $bytes[1] -eq 68 -and $bytes[2] -eq 51) {
            $tagSize = (($bytes[6] -band 127) -shl 21) -bor (($bytes[7] -band 127) -shl 14) -bor
                (($bytes[8] -band 127) -shl 7) -bor ($bytes[9] -band 127)
            $offset = 10 + $tagSize + $(if ($bytes[5] -band 16) { 10 } else { 0 })
        }
        if ($offset + 1 -ge $bytes.Length -or $bytes[$offset] -ne 255 -or ($bytes[$offset + 1] -band 224) -ne 224) {
            throw 'pokemon-item-received.mp3 has no MP3 audio frame after its ID3 tag.'
        }
        [IO.File]::WriteAllBytes((Join-Path $targetSounds 'pokemon-item-received.mp3'), $bytes[$offset..($bytes.Length - 1)])
    }
    $blockedSource = Join-Path $sourceSounds 'chatot.mp3'
    if (Test-Path -LiteralPath $blockedSource -PathType Leaf) {
        Copy-Item -LiteralPath $blockedSource -Destination $targetSounds -Force
    }
}

foreach ($theme in @('Mewltiplex-Clair', 'Mewltiplex-Sombre')) {
    Copy-Item -LiteralPath (Join-Path $PSScriptRoot "themes/$theme.json") -Destination $themes -Force
}
foreach ($mod in @('oaklabs-brand', 'oaklabs-pane', 'oaklabs-companions', 'oaklabs-spaces', 'oaklabs-tabs')) {
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
