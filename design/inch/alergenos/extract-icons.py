"""Crop only coloured icon squares; preserve original artwork and omit text."""
from pathlib import Path
from PIL import Image
root=Path(__file__).resolve().parents[3]
image=Image.open(root/'design/inch/alergenos/referencia-propietario.jpg')
assert image.size==(1582,230)
icons=[('milk',36),('gluten',146),('fish',257),('molluscs',368),('crustaceans',479),('sesame',589),('peanuts',700),('eggs',810),('sulphites',921),('mustard',1032),('soya',1142),('lupins',1253),('celery',1364),('nuts',1475)]
for name,x in icons:
    image.crop((x,119,x+55,174)).save(root/f'public/inch/allergen-{name}.webp',lossless=True)
print(f'{len(icons)} original icons extracted without labels or notices')
