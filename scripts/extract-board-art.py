"""Extract the original special-square artwork without modifying the source board.
Development only: pip install Pillow
Usage: python scripts/extract-board-art.py --source "path/to/original-board.jpg"
Crop coordinates refer to the printed artwork, never to token movement.
"""
import argparse, json
from pathlib import Path
from PIL import Image
parser=argparse.ArgumentParser()
parser.add_argument('--source',type=Path,required=True)
parser.add_argument('--output',type=Path,default=Path(__file__).resolve().parents[1]/'public/assets/tablero')
args=parser.parse_args()
args.output.mkdir(parents=True,exist_ok=True)
original=Image.open(args.source).convert('RGB')
sx,sy=original.width/1375,original.height/1794
# Upright crops of the supplied print board. Labels stay in HTML for readability.
specs=[
 (0,'salida',(1107,846,1297,948),0,None),
 (10,'ayuda-solidaria',(649,1557,732,1728),0,None),
 (12,'fuga-capitales',(421,1555,503,1726),0,None),
 (18,'golpe-militar',(72,1072,264,1175),90,None),
 (20,'barrera',(70,874,268,923),0,None),
 (24,'industrializacion',(90,398,247,489),90,'Nacionalización'),
 (30,'ayuda-bid',(647,72,728,237),180,'Ayuda USA para el desarrollo'),
 (32,'12-octubre',(872,79,958,238),180,None),
 (38,'no-pagar',(1223,630,1288,710),-90,None),
 (39,'sede-fmi',(1117,739,1294,827),0,None),
 (21,'caramelos',(151,741,249,834),90,None),
 (22,'mermelada',(155,632,253,717),90,None),
 (23,'chocolate',(153,513,251,605),90,None),
 (25,'ropa',(153,296,246,375),90,None),
 (26,'cigarrillos',(205,218,310,277),180,None),
 (27,'cafe-elaborado',(322,147,391,219),180,None),
 (29,'enlatados',(525,151,615,241),180,None),
 (31,'zapatos',(755,150,849,239),180,None),
 (33,'cables',(985,157,1050,249),180,None),
 (34,'electronica',(1080,190,1149,286),180,None),
 (35,'tractores',(1125,295,1203,375),270,None),
 (37,'gasolina',(1123,515,1217,600),-90,None)
]
manifest={}
for id,slug,box,rotation,label in specs:
 x1,y1,x2,y2=box
 image=original.crop((round(x1*sx),round(y1*sy),round(x2*sx),round(y2*sy))).rotate(rotation,expand=True)
 image.thumbnail((480,480),Image.Resampling.LANCZOS)
 image.save(args.output/(slug+'.webp'),'WEBP',quality=94,method=6)
 manifest[str(id)]={'imagen':'/assets/tablero/'+slug+'.webp','rotuloOriginal':label,'fuente':args.source.name,'recorteReferencia':box,'giro':rotation}
# Use the illustrated G and military cap at icon size; retain the full original for details.
golpe=Image.open(args.output/'golpe-militar.webp')
golpe.crop((0,0,golpe.width,round(golpe.height*.50))).save(args.output/'golpe-militar-icono.webp','WEBP',quality=94,method=6)
manifest['18']['icono']='/assets/tablero/golpe-militar-icono.webp'
(args.output/'manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print('Extracted',len(manifest),'original special-square images.')
