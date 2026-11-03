"""Generate home-screen icons from the existing high-resolution INCH emblem.
Requires Pillow. No external graphics or restaurant data are fetched.
"""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
ROOT=Path(__file__).resolve().parents[1]
source=Image.open(ROOT/'public/inch/inch-logo.webp').convert('RGB')
emblem=source.crop((24,112,286,376))
font_path=Path('C:/Windows/Fonts/arialbd.ttf')
font=ImageFont.truetype(str(font_path),72)
for app in ['carta','admin']:
    canvas=Image.new('RGB',(512,512),'#f5f0e6')
    draw=ImageDraw.Draw(canvas)
    size=392 if app=='carta' else 320
    x=(512-size)//2
    y=60 if app=='carta' else 32
    draw.rectangle((x-10,y-10,x+size+9,y+size+9),fill='#20221e')
    draw.rectangle((x-6,y-6,x+size+5,y+size+5),fill='white')
    canvas.paste(emblem.resize((size,size),Image.Resampling.LANCZOS),(x,y))
    if app=='admin':
        draw.rectangle((0,380,511,511),fill='#20221e')
        draw.text((256,444),'ADMIN',font=font,fill='white',anchor='mm',stroke_width=1)
    for side in [32,180,192,512]:
        canvas.resize((side,side),Image.Resampling.LANCZOS).save(ROOT/f'public/inch/app-{app}-{side}.png')
print('Generated two distinct icon sets: 32, 180, 192, 512 px')
