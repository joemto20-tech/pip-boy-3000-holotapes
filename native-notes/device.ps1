param(
  [string] $Port = 'COM3',
  [string] $Command,
  [switch] $Install,
  [switch] $Restore,
  [switch] $Screenshot,
  [string] $DownloadPath,
  [string] $Destination
)
$ErrorActionPreference = 'Stop'

function Invoke-PipReadEval([string] $Body) {
  $marker = '__PIP_' + [Guid]::NewGuid().ToString('N') + '__'
  $body64 = [Convert]::ToBase64String([Text.Encoding]::UTF8.GetBytes('(function(){' + $Body + '})()'))
  $request = [char]16 + "(function(){try{print('$marker'+JSON.stringify({ok:true,value:eval(atob('$body64'))})+'__END__');}catch(e){print('$marker'+JSON.stringify({ok:false,error:String(e)})+'__END__');}})();`r`n"
  if ($request.Length -gt 1900) { throw 'Serial command exceeds receive buffer' }
  $script:pipSerial.Write($request)
  $received = ''
  $deadline = [DateTime]::UtcNow.AddSeconds(12)
  while ([DateTime]::UtcNow -lt $deadline) {
    Start-Sleep -Milliseconds 20
    $received += $script:pipSerial.ReadExisting()
    $reply = [regex]::Match($received, [regex]::Escape($marker) + '(.*?)__END__', 'Singleline')
    if ($reply.Success) {
      $result = $reply.Groups[1].Value | ConvertFrom-Json
      if (!$result.ok) { throw ('Pip-Boy: ' + $result.error) }
      return $result.value
    }
  }
  throw ('Serial response timed out: ' + $received.Substring(0, [Math]::Min(500, $received.Length)))
}

function Read-PipFile([string] $Path) {
  $quoted = ConvertTo-Json -InputObject $Path -Compress
  $size = Invoke-PipReadEval "var s=fs.statSync($quoted);return s?s.size:-1;"
  if ($size -lt 0) { return $null }
  if ($size -eq 0) { return ,([byte[]]@()) }
  $encoded = Invoke-PipReadEval "return btoa(fs.readFileSync($quoted));"
  return ,([Convert]::FromBase64String($encoded))
}

function Write-PipStage([string] $Path, [byte[]] $Bytes) {
  $quoted = ConvertTo-Json -InputObject $Path -Compress
  if (!(Invoke-PipReadEval "fs.writeFileSync($quoted,'');var s=fs.statSync($quoted);return !!s&&s.size===0;")) { throw "Cannot create $Path" }
  for ($offset = 0; $offset -lt $Bytes.Length; $offset += 180) {
    $length = [Math]::Min(180, $Bytes.Length - $offset)
    $chunk = [Convert]::ToBase64String($Bytes, $offset, $length)
    if (!(Invoke-PipReadEval "return fs.appendFileSync($quoted,atob('$chunk'));")) { throw "Cannot append $Path" }
  }
  $readback = Read-PipFile $Path
  if ([Convert]::ToBase64String($readback) -cne [Convert]::ToBase64String($Bytes)) {
    throw "Readback differs for $Path; active firmware was not replaced"
  }
}

$script:pipSerial = [System.IO.Ports.SerialPort]::new($Port, 115200, [System.IO.Ports.Parity]::None, 8, [System.IO.Ports.StopBits]::One)
$script:pipSerial.WriteTimeout = 3000
try {
  $script:pipSerial.Open()
  Start-Sleep -Milliseconds 300
  if ($Install) {
    $buildDirectory = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '../dist/native-notes'))
    $notesBytes = [IO.File]::ReadAllBytes((Join-Path $buildDirectory 'NOTES.JS'))
    $editorBytes = [IO.File]::ReadAllBytes((Join-Path $buildDirectory 'NOTES_EDIT.JS'))
    $backupDirectory = Join-Path $PSScriptRoot ('backups/' + (Get-Date -Format 'yyyyMMdd-HHmmss'))
    [void][IO.Directory]::CreateDirectory($backupDirectory)
    foreach ($devicePath in @('JS/NOTES.JS', 'JS/NOTES_EDIT.JS', 'JS/NOTES.STOCK')) {
      $original = Read-PipFile $devicePath
      if ($null -ne $original) {
        [IO.File]::WriteAllBytes((Join-Path $backupDirectory ([IO.Path]::GetFileName($devicePath))), $original)
      }
    }
    $stockBytes = Read-PipFile 'JS/NOTES.STOCK'
    $activeBytes = Read-PipFile 'JS/NOTES.JS'
    $activeIsExtension = $null -ne $activeBytes -and [Text.Encoding]::GetEncoding(28591).GetString($activeBytes).Contains('MYNOTES.JSON')
    if (!$activeIsExtension -or $null -eq $stockBytes -or $stockBytes.Length -eq 0) {
      if ($null -eq $activeBytes -or $activeIsExtension) {
        throw 'Cannot identify original Notes firmware; install stopped'
      }
      $stockBytes = $activeBytes
      Write-PipStage 'JS/NOTES.STOCK' $stockBytes
    }
    Write-PipStage 'JS/NOTES_EDIT.NEW' $editorBytes
    Write-PipStage 'JS/NOTES.NEW' $notesBytes
    $parsed = Invoke-PipReadEval "return typeof eval(fs.readFileSync('JS/NOTES.NEW'))==='function'&&typeof eval(fs.readFileSync('JS/NOTES_EDIT.NEW'))==='function';"
    if (!$parsed) { throw 'Device rejected staged Notes code' }
    # Replace the entry point last, after both files passed device readback.
    $installed = Invoke-PipReadEval "if(fs.statSync('JS/NOTES_EDIT.PREV')&&!fs.unlink('JS/NOTES_EDIT.PREV'))throw 'Cannot rotate editor backup';if(fs.statSync('JS/NOTES_EDIT.JS')&&!fs.rename('JS/NOTES_EDIT.JS','JS/NOTES_EDIT.PREV'))throw 'Cannot back up editor';if(!fs.rename('JS/NOTES_EDIT.NEW','JS/NOTES_EDIT.JS'))throw 'Cannot install editor';if(fs.statSync('JS/NOTES.PREV')&&!fs.unlink('JS/NOTES.PREV'))throw 'Cannot rotate Notes backup';if(!fs.rename('JS/NOTES.JS','JS/NOTES.PREV'))throw 'Cannot back up Notes';if(!fs.rename('JS/NOTES.NEW','JS/NOTES.JS')){fs.rename('JS/NOTES.PREV','JS/NOTES.JS');throw 'Cannot install Notes';}return true;"
    Write-Output "Installed: $installed. Original firmware: JS/NOTES.STOCK. PC backup: $backupDirectory"
  } elseif ($Restore) {
    $stockBytes = Read-PipFile 'JS/NOTES.STOCK'
    if ($null -eq $stockBytes -or $stockBytes.Length -eq 0) { throw 'Original Notes backup is missing' }
    Write-PipStage 'JS/NOTES.RESTORE' $stockBytes
    $restored = Invoke-PipReadEval "if(fs.statSync('JS/NOTES.PATCH')&&!fs.unlink('JS/NOTES.PATCH'))throw 'Cannot rotate patch';if(!fs.rename('JS/NOTES.JS','JS/NOTES.PATCH'))throw 'Cannot preserve patch';if(!fs.rename('JS/NOTES.RESTORE','JS/NOTES.JS')){fs.rename('JS/NOTES.PATCH','JS/NOTES.JS');throw 'Restore failed';}return true;"
    Write-Output "Restored original Notes: $restored. Custom SD-card notes were preserved."
  } elseif ($Screenshot) {
    if (!$Destination) { throw 'Destination is required for a screenshot' }
    $frame = Invoke-PipReadEval 'return {width:h.getWidth(),height:h.getHeight(),bpp:h.getBPP(),length:h.buffer.byteLength};'
    $pixels = [Collections.Generic.List[byte]]::new()
    for ($offset = 0; $offset -lt $frame.length; $offset += 512) {
      $length = [Math]::Min(512, $frame.length - $offset)
      $part = Invoke-PipReadEval "return btoa(new Uint8Array(h.buffer,$offset,$length));"
      $pixels.AddRange([Convert]::FromBase64String($part))
    }
    [IO.File]::WriteAllBytes([IO.Path]::GetFullPath($Destination), $pixels.ToArray())
    $frame | ConvertTo-Json | Set-Content -LiteralPath ($Destination + '.json')
    Write-Output "Captured frame to $Destination"
  } elseif ($DownloadPath) {
    if (!$Destination) { throw 'Destination is required for a download' }
    $bytes = Read-PipFile $DownloadPath
    if ($null -eq $bytes) { throw "File not found: $DownloadPath" }
    [IO.File]::WriteAllBytes([IO.Path]::GetFullPath($Destination), $bytes)
    Write-Output "Downloaded $DownloadPath to $Destination"
  } elseif ($Command) {
    Invoke-PipReadEval $Command | ConvertTo-Json -Depth 15
  } else {
    throw 'Specify Command, Install, Restore, or DownloadPath'
  }
} finally {
  if ($script:pipSerial.IsOpen) { $script:pipSerial.Close() }
  $script:pipSerial.Dispose()
}
