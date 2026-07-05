$ErrorActionPreference = "Stop"

$repoRoot = Split-Path -Parent $PSScriptRoot
$skillsRoots = @(
    (Join-Path $repoRoot "agentic-system-telemetry\skills"),
    (Join-Path $repoRoot ".apm\skills")
)

$skillFiles = @()
foreach ($skillsRoot in $skillsRoots) {
    if (Test-Path -LiteralPath $skillsRoot) {
        $skillFiles += Get-ChildItem -LiteralPath $skillsRoot -Recurse -Filter "SKILL.md"
    }
}

if ($skillFiles.Count -eq 0) {
    throw "No SKILL.md files found under configured skill roots"
}

$failed = $false

foreach ($file in $skillFiles) {
    $text = Get-Content -LiteralPath $file.FullName -Raw
    $relative = Resolve-Path -LiteralPath $file.FullName -Relative
    $dirName = Split-Path -Leaf (Split-Path -Parent $file.FullName)

    if ($text -notmatch "(?s)^---\s*\r?\n(.*?)\r?\n---\s*\r?\n") {
        Write-Error "$relative missing YAML frontmatter"
        $failed = $true
        continue
    }

    $frontmatter = $Matches[1]
    $nameMatch = [regex]::Match($frontmatter, "(?m)^name:\s*(.+?)\s*$")
    $descriptionMatch = [regex]::Match($frontmatter, "(?m)^description:\s*(.+?)\s*$")

    if (-not $nameMatch.Success) {
        Write-Error "$relative missing frontmatter name"
        $failed = $true
        continue
    }

    if (-not $descriptionMatch.Success) {
        Write-Error "$relative missing frontmatter description"
        $failed = $true
        continue
    }

    $name = $nameMatch.Groups[1].Value.Trim().Trim('"').Trim("'")
    $description = $descriptionMatch.Groups[1].Value.Trim().Trim('"').Trim("'")

    if ($name -ne $dirName) {
        Write-Error "$relative frontmatter name '$name' does not match directory '$dirName'"
        $failed = $true
    }

    if ([string]::IsNullOrWhiteSpace($description)) {
        Write-Error "$relative has empty description"
        $failed = $true
    }
}

if ($failed) {
    exit 1
}

Write-Host "Skill packaging validation passed for $($skillFiles.Count) skill(s)."
