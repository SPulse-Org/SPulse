$ErrorActionPreference = 'Stop'

$pitchDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$repoDir = Split-Path -Parent $pitchDir
$frontendDir = Join-Path $repoDir 'frontend'
$workDir = Join-Path $pitchDir '.render'
$outputPath = Join-Path $pitchDir 'SPulse-GrantFox-Pitch.mp4'
$captionPath = Join-Path $pitchDir 'captions.srt'
$edgePath = 'C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe'

if (-not (Test-Path $edgePath)) {
    $edgePath = 'C:\Program Files\Microsoft\Edge\Application\msedge.exe'
}
if (-not (Test-Path $edgePath)) { throw 'Microsoft Edge was not found.' }

$ffmpeg = (Get-Command ffmpeg -ErrorAction SilentlyContinue).Source
$ffprobe = (Get-Command ffprobe -ErrorAction SilentlyContinue).Source
if (-not $ffmpeg -or -not $ffprobe) {
    $links = Join-Path $env:LOCALAPPDATA 'Microsoft\WinGet\Links'
    $ffmpeg = Join-Path $links 'ffmpeg.exe'
    $ffprobe = Join-Path $links 'ffprobe.exe'
}
if (-not (Test-Path $ffmpeg) -or -not (Test-Path $ffprobe)) {
    $packages = Join-Path $env:LOCALAPPDATA 'Microsoft\WinGet\Packages'
    $ffmpeg = Get-ChildItem -Path $packages -Recurse -Filter ffmpeg.exe -ErrorAction SilentlyContinue | Select-Object -First 1 -ExpandProperty FullName
    $ffprobe = Get-ChildItem -Path $packages -Recurse -Filter ffprobe.exe -ErrorAction SilentlyContinue | Select-Object -First 1 -ExpandProperty FullName
}
if (-not (Test-Path $ffmpeg) -or -not (Test-Path $ffprobe)) {
    throw 'FFmpeg was not found. Install Gyan.FFmpeg.Shared with winget.'
}

if (Test-Path $workDir) { Remove-Item -LiteralPath $workDir -Recurse -Force }
New-Item -ItemType Directory -Path $workDir | Out-Null

$scenes = @(
    @{ Image='01-title.png'; Url=('file:///' + ((Join-Path $pitchDir 'title.html') -replace '\\','/')); Text='Prediction markets can be expensive, difficult to understand, and dependent on centralized platforms that control user funds and settlement.' },
    @{ Image='02-home.png'; Url='http://127.0.0.1:8765/index.html'; Text='SPulse is a non-custodial prediction-market platform built on Stellar, designed to make transparent markets fast, accessible, and easy to explore.' },
    @{ Image='03-markets.png'; Url='http://127.0.0.1:8765/markets.html'; Text='Users can discover clear questions, review probabilities and resolution criteria, preview positions in XLM, and follow community performance through a dedicated leaderboard.' },
    @{ Image='04-trade.png'; Url='http://127.0.0.1:8765/index.html#trade'; Text='The current static application connects to Freighter on Stellar Testnet and displays live public network information. Full browser-to-contract transaction submission is our next integration milestone.' },
    @{ Image='05-how.png'; Url='http://127.0.0.1:8765/index.html#how'; Text='Behind the product are four interconnected Soroban contracts managing prediction markets, referrals, leaderboard points, and PULSE rewards through transparent on-chain rules.' },
    @{ Image='06-leaderboard.png'; Url='http://127.0.0.1:8765/leaderboard.html'; Text='All four contracts are deployed on Testnet. We have completed eighty-nine contract tests and verified registration, positions, cancellation refunds, resolution, claims, points, and reward distribution.' },
    @{ Image='07-network.png'; Url='http://127.0.0.1:8765/index.html#network'; Text='With GrantFox support, we will complete direct contract integration, test SPulse with external users, strengthen protocol security, and prepare for a responsible mainnet launch.' },
    @{ Image='08-outro.png'; Url=('file:///' + ((Join-Path $pitchDir 'outro.html') -replace '\\','/')); Text='SPulse is building a faster, clearer, and community-driven prediction-market experience powered by Stellar.' }
)

$server = Start-Process -FilePath python -ArgumentList @('-m','http.server','8765','--bind','127.0.0.1','--directory',$frontendDir) -WindowStyle Hidden -PassThru
try {
    Start-Sleep -Seconds 2
    foreach ($scene in $scenes) {
        $imagePath = Join-Path $workDir $scene.Image
        $profilePath = Join-Path $workDir ('edge-' + [IO.Path]::GetFileNameWithoutExtension($scene.Image))
        $arguments = @('--headless=new','--disable-gpu','--hide-scrollbars','--window-size=1920,1080','--virtual-time-budget=6000',("--user-data-dir=$profilePath"),("--screenshot=$imagePath"),$scene.Url)
        $process = Start-Process -FilePath $edgePath -ArgumentList $arguments -Wait -PassThru -WindowStyle Hidden
        if ($process.ExitCode -ne 0 -or -not (Test-Path $imagePath)) { throw "Failed to capture $($scene.Url)" }
    }
} finally {
    if ($server -and -not $server.HasExited) { Stop-Process -Id $server.Id -Force }
}

for ($index = 0; $index -lt $scenes.Count; $index++) {
    $audioPath = Join-Path $workDir ('{0:D2}.mp3' -f ($index + 1))
    & python -m edge_tts --voice en-NG-EzinneNeural --rate=-6% --text $scenes[$index].Text --write-media $audioPath
    if ($LASTEXITCODE -ne 0 -or -not (Test-Path $audioPath)) { throw "Failed generating neural narration for scene $($index + 1)" }
    $scenes[$index].Audio = $audioPath
    $duration = & $ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 $audioPath
    $scenes[$index].Duration = [Math]::Ceiling(([double]$duration + 0.8) * 1000) / 1000
}

function Format-SrtTime([double]$seconds) {
    $span = [TimeSpan]::FromSeconds($seconds)
    return '{0:00}:{1:00}:{2:00},{3:000}' -f [Math]::Floor($span.TotalHours), $span.Minutes, $span.Seconds, $span.Milliseconds
}

$cursor = 0.0
$captions = New-Object System.Collections.Generic.List[string]
for ($index = 0; $index -lt $scenes.Count; $index++) {
    $start = $cursor + 0.2
    $end = $cursor + $scenes[$index].Duration - 0.2
    $captions.Add([string]($index + 1))
    $captions.Add("$(Format-SrtTime $start) --> $(Format-SrtTime $end)")
    $captions.Add($scenes[$index].Text)
    $captions.Add('')
    $cursor += $scenes[$index].Duration
}
[IO.File]::WriteAllLines($captionPath, $captions, (New-Object Text.UTF8Encoding($false)))

$segmentList = New-Object System.Collections.Generic.List[string]
for ($index = 0; $index -lt $scenes.Count; $index++) {
    $scene = $scenes[$index]
    $imagePath = Join-Path $workDir $scene.Image
    $segmentPath = Join-Path $workDir ('segment-{0:D2}.mp4' -f ($index + 1))
    $frames = [Math]::Ceiling($scene.Duration * 30)
    $filter = "scale=1920:1080,zoompan=z='min(zoom+0.00018,1.025)':d=${frames}:s=1920x1080:fps=30,format=yuv420p"
    & $ffmpeg -y -loglevel error -loop 1 -i $imagePath -i $scene.Audio -vf $filter -t $scene.Duration -c:v libx264 -preset medium -crf 19 -c:a aac -b:a 192k -shortest $segmentPath
    if ($LASTEXITCODE -ne 0) { throw "Failed rendering segment $($index + 1)" }
    $segmentList.Add("file '$($segmentPath -replace "'", "''")'")
}

$listPath = Join-Path $workDir 'segments.txt'
[IO.File]::WriteAllLines($listPath, $segmentList, (New-Object Text.UTF8Encoding($false)))
$combinedPath = Join-Path $workDir 'combined.mp4'
& $ffmpeg -y -loglevel error -f concat -safe 0 -i $listPath -c copy $combinedPath
if ($LASTEXITCODE -ne 0) { throw 'Failed concatenating video segments.' }

Push-Location $pitchDir
try {
    & $ffmpeg -y -loglevel error -i $combinedPath -vf "subtitles=captions.srt:force_style='FontName=Arial,FontSize=13,PrimaryColour=&H00FFFFFF,OutlineColour=&H00101814,BorderStyle=1,Outline=2,Shadow=1,MarginV=34,Alignment=2'" -c:v libx264 -preset medium -crf 19 -c:a copy $outputPath
    if ($LASTEXITCODE -ne 0) { throw 'Failed burning captions into the final video.' }
} finally {
    Pop-Location
}

$details = Get-Item $outputPath
Write-Output "Created $($details.FullName)"
Write-Output "Size: $([Math]::Round($details.Length / 1MB, 2)) MB"
Write-Output "Duration: $([Math]::Round($cursor, 1)) seconds"
