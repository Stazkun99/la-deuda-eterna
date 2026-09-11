"""Extract original card artwork. Dev-only: pip install pypdfium2 Pillow.
Usage: python scripts/extract-card-art.py --source "path/to/tarjetas"
The source PDFs are not modified. Coordinates below are PDF crop bounds, not board positions.
"""
import argparse
import json
from pathlib import Path
import pypdfium2 as pdf
from PIL import Image, ImageDraw

parser = argparse.ArgumentParser()
parser.add_argument('--source', type=Path, required=True)
parser.add_argument('--output', type=Path, default=Path(__file__).resolve().parents[1] / 'public/assets/cartas')
args = parser.parse_args()
args.output.mkdir(parents=True, exist_ok=True)
scale = 3
cache = {}
manifest = {'propiedades': {}, 'solidaridad': {}, 'condiciones': {}, 'reversos': {}}
sources = []
def crop(stem, page, bbox, relative):
    key = (stem, page)
    if key not in cache:
        doc = pdf.PdfDocument(str(args.source / (stem + '.pdf')))
        cache[key] = doc[page - 1].render(scale=scale).to_pil().convert('RGB')
    image = cache[key].crop(tuple(round(x * scale) for x in bbox))
    target = args.output / relative
    target.parent.mkdir(parents=True, exist_ok=True)
    image.save(target, 'WEBP', quality=90, method=6)
    sources.append({'archivo': relative, 'pdf': stem + '.pdf', 'pagina': page, 'recorte': bbox})
    return image, '/assets/cartas/' + relative

props = [
 ('Petróleo','petroleo',1,(22.8,22.8,187.2,269.4)),
 ('Tabaco','tabaco',1,(215.2,22.8,379.6,269.4)),
 ('Algodón','algodon',1,(407.6,22.8,572.0,269.4)),
 ('Estaño','estano',1,(22.8,298,187.2,544.6)),
 ('Azúcar','azucar',1,(215.2,298,379.6,544.6)),
 ('Cobre','cobre',1,(407.6,298,572.0,544.6)),
 ('Pesca','pesca',1,(22.8,573.1,187.2,819.7)),
 ('Cacao','cacao',1,(215.2,573.1,379.6,819.7)),
 ('Banano','banano',1,(407.6,573.1,572.0,819.7)),
 ('Café','cafe',3,(215.2,22.8,379.6,269.4)),
 ('Ganado','ganado',3,(407.6,22.8,572.0,269.4)),
 ('Hierro','hierro',3,(215.2,298,379.6,544.6)),
]
for name, slug, page, bbox in props:
    image, url = crop('PROPIEDADES',page,bbox,'propiedades/'+slug+'.webp')
    w,h=image.size
    icon=image.crop((round(w*.30),round(h*.025),round(w*.715),round(h*.222)))
    icon.thumbnail((192,128))
    target=args.output/'iconos'/(slug+'.webp');target.parent.mkdir(exist_ok=True)
    icon.save(target,'WEBP',quality=92,method=6)
    manifest['propiedades'][name]={'imagen':url,'icono':'/assets/cartas/iconos/'+slug+'.webp'}

# Match by country/meaning, not the printed number (the PDFs use a different numbering).
solid = [
 (3,1,(18.9,19.5,183.3,266.1)),(16,1,(224.4,17.9,386,264.5)),(14,1,(398.4,17.9,562.8,264.5)),
 (1,2,(18,17.9,182.4,264.5)),(8,2,(221.1,17.9,385.5,264.5)),(4,2,(412.8,17.9,577.2,264.5)),
 (2,2,(17.9,284.5,182.4,531.1)),(13,2,(412.8,284.5,577.2,531.1)),
 (9,2,(18.9,542.6,183.3,802.5)),(12,2,(221.1,555.9,385.5,802.5)),(10,2,(412.8,555.9,577.2,802.5)),
 (5,3,(18.8,17.9,183.2,264.5)),(17,3,(223.9,17.9,388.3,264.5)),(7,3,(412.8,17.9,577.2,264.5)),
 (11,3,(18.4,276.6,182.9,523.2)),(20,3,(223.5,276.6,387.9,523.2)),(6,3,(412.8,276.6,577.2,523.2)),
 (15,3,(18.4,540.7,182.9,787.3)),(19,3,(223.9,540.7,388.3,787.3)),(18,3,(412.8,540.7,577.2,787.3))]
for id,page,bbox in solid:
    _,url=crop('SOLIDARIDAD2',page,bbox,f'solidaridad/{id:02}.webp');manifest['solidaridad'][str(id)]=url

conditions=[
 (1,1,(22.6,23.3,187,269.9)),(2,1,(209.5,24.5,373.9,271.1)),(3,1,(391.4,24.6,555.8,271.2)),
 (4,1,(23.2,300.2,187.6,546.8)),(16,1,(212,301,376.4,547.6)),(17,1,(391.3,300.2,555.7,546.8)),
 (5,1,(22.8,573.1,187.2,819.7)),(6,1,(213.6,573.1,378,819.7)),(7,1,(395.8,573.1,560.2,819.7)),
 (8,2,(22.4,22.8,186.8,269.4)),(9,2,(203.3,22.8,367.7,269.4)),(10,2,(407.6,22.8,572,269.4)),
 (11,2,(22.4,285.4,186.8,532)),(12,2,(203.3,286.4,367.7,533)),(13,2,(407.6,287.6,572,534.2)),
 (14,2,(22.8,573.1,187.2,819.7)),(15,2,(206,573.1,370.4,819.7))]
for id,page,bbox in conditions:
    _,url=crop('CONDICIONES',page,bbox,f'condiciones/{id:02}.webp');manifest['condiciones'][str(id)]=url
for type,stem,page,bbox in [('solidaridad','SOLIDARIDAD2',1,(25.5,293.3,189.9,539.9)),('condiciones','CONDICIONES 2',1,(22,22,187,269))]:
    _,url=crop(stem,page,bbox,'reversos/'+type+'.webp');manifest['reversos'][type]=url
(args.output/'manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
(args.output/'fuentes.json').write_text(json.dumps(sources,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
print(f'Extracted {len(props)} property cards/icons, {len(solid)} Solidaridad, {len(conditions)} Condiciones and 2 backs.')
