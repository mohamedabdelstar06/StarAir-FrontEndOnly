Add-Type -AssemblyName System.Drawing

$src = "C:\Users\MK\.gemini\antigravity\brain\d481687c-a2c3-4c77-99ef-7f2e9019f9b4\star_air_logo_1775510250335.png"
$img = [System.Drawing.Image]::FromFile($src)

function SaveIcon($path, $size, $format) {
    if (Test-Path $path) { Remove-Item $path -Force }
    $bmp = New-Object System.Drawing.Bitmap($size, $size)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.DrawImage($img, 0, 0, $size, $size)
    $g.Dispose()
    
    if ($format -eq "ICO") {
        # Simple hack: save as PNG and rename to ICO works for modern browsers, or we save as PNG everywhere.
        # Actually Vite's favicon.ico is explicitly loaded.
        $bmp.Save($path, [System.Drawing.Imaging.ImageFormat]::Png)
    } else {
        $bmp.Save($path, [System.Drawing.Imaging.ImageFormat]::Png)
    }
    $bmp.Dispose()
}

SaveIcon "c:\Users\MK\Downloads\STAR Air ADM\FrontEnd\public\icons\icon-512.png" 512 "PNG"
SaveIcon "c:\Users\MK\Downloads\STAR Air ADM\FrontEnd\public\icons\icon-192.png" 192 "PNG"
SaveIcon "c:\Users\MK\Downloads\STAR Air ADM\FrontEnd\public\apple-touch-icon.png" 180 "PNG"
SaveIcon "c:\Users\MK\Downloads\STAR Air ADM\FrontEnd\public\favicon.ico" 32 "ICO"

$img.Dispose()
Write-Host "Icons generated!"
