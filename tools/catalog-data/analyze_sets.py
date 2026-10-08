import json
import re

with open('excel_dump.json', 'r', encoding='utf-8') as f:
    excel_data = json.load(f)

with open('public/catalog-assets/manifest.json', 'r', encoding='utf-8') as f:
    manifest = json.load(f)

print("=== SETS ARMABLES FROM EXCEL ===")
sets_armables = []
for r in excel_data.get('SETS ARMABLES', []):
    cells = r.get('cells', {})
    row_num = r.get('row')
    if int(row_num) >= 6 and ('C' + row_num in cells or 'D' + row_num in cells):
        grupo = cells.get('A' + row_num, '')
        cat = cells.get('B' + row_num, '')
        codigo = cells.get('C' + row_num, '')
        nombre = cells.get('D' + row_num, '')
        p1 = cells.get('E' + row_num, '')
        p2 = cells.get('F' + row_num, '')
        p3 = cells.get('G' + row_num, '')
        if codigo or nombre:
            sets_armables.append({
                'row': row_num,
                'grupo': grupo,
                'cat': cat,
                'codigo': codigo,
                'nombre': nombre,
                'p1': p1,
                'p2': p2,
                'p3': p3
            })

print(f"Total sets extracted: {len(sets_armables)}")
for s in sets_armables:
    print(f"Row {s['row']}: Grupo={s['grupo']} | Cat={s['cat']} | Codigo={s['codigo']} | Nombre={s['nombre']} | P1={s['p1']} | P2={s['p2']}")

