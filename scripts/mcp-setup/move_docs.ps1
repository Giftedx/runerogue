# Move all documentation files to docs directory
$mdFiles = Get-ChildItem -Name "*.md" | Where-Object { 
    $_ -ne "README.md" -and 
    $_ -ne "CONTRIBUTING.md" -and
    $_ -ne "MONOREPO_STRUCTURE_ANALYSIS.md" -and
    $_ -ne "RESTRUCTURE_PLAN.md" -and
    $_ -ne "NPM_ISSUE_RESOLUTION_REPORT.md"
}

Write-Host "Moving documentation files to docs directory..."
foreach ($file in $mdFiles) {
    if (Test-Path $file) {
        Write-Host "Moving $file"
        Move-Item -Path $file -Destination "docs\" -Force
    }
}
Write-Host "Documentation move complete!"
