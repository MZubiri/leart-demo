import json
import os
import re

with open('public/catalog-assets/manifest.json', 'r', encoding='utf-8') as f:
    manifest = json.load(f)

# Build a search index of images and text in manifest
page_texts = []
for entry in manifest:
    design = entry.get('design')
    page = entry.get('page')
    text = entry.get('text', '')
    assets = entry.get('assets', [])
    page_texts.append({
        'design': design,
        'page': page,
        'text': text,
        'assets': [a['path'] for a in assets]
    })

with open('excel_dump.json', 'r', encoding='utf-8') as f:
    excel_data = json.load(f)

sets_from_excel = []
for r in excel_data.get('SETS ARMABLES', []):
    cells = r.get('cells', {})
    row_num = r.get('row')
    if int(row_num) >= 6 and ('C' + row_num in cells or 'D' + row_num in cells):
        grupo = cells.get('A' + row_num, '').strip()
        cat = cells.get('B' + row_num, '').strip()
        codigo = cells.get('C' + row_num, '').strip()
        nombre = cells.get('D' + row_num, '').strip()
        p1 = cells.get('E' + row_num, '').strip()
        p2 = cells.get('F' + row_num, '').strip()
        if codigo or nombre:
            # find match in manifest
            matches = []
            for pt in page_texts:
                if (codigo and codigo.lower() in pt['text'].lower()) or (nombre and nombre.lower() in pt['text'].lower()):
                    matches.append((pt['design'], pt['page'], pt['assets']))
            sets_from_excel.append({
                'row': row_num,
                'grupo': grupo,
                'cat': cat,
                'codigo': codigo,
                'nombre': nombre,
                'p1': p1,
                'p2': p2,
                'matches': len(matches)
            })

print(f"Total sets: {len(sets_from_excel)}")
matched = [s for s in sets_from_excel if s['matches'] > 0]
print(f"Sets found in canva manifest: {len(matched)} / {len(sets_from_excel)}")
for s in sets_from_excel:
    print(f"{s['codigo']} - {s['nombre']} -> matches: {s['matches']}")
