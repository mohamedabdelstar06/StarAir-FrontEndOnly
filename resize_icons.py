from PIL import Image
import sys
import shutil

src_img = r"C:\Users\MK\.gemini\antigravity\brain\d481687c-a2c3-4c77-99ef-7f2e9019f9b4\star_air_logo_1775510250335.png"

# Read image
try:
    img = Image.open(src_img).convert("RGBA")
    
    # Save 512
    img.resize((512, 512)).save(r"c:\Users\MK\Downloads\STAR Air ADM\FrontEnd\public\icons\icon-512.png")
    
    # Save 192
    img.resize((192, 192)).save(r"c:\Users\MK\Downloads\STAR Air ADM\FrontEnd\public\icons\icon-192.png")
    
    # Save apple-touch-icon
    img.resize((180, 180)).save(r"c:\Users\MK\Downloads\STAR Air ADM\FrontEnd\public\apple-touch-icon.png")
    
    # Save favicon
    img.resize((32, 32)).save(r"c:\Users\MK\Downloads\STAR Air ADM\FrontEnd\public\favicon.ico", format="ICO")
    print("Icons successfully generated!")
except Exception as e:
    print(f"Error: {e}")
    sys.exit(1)
