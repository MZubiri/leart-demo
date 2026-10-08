import json

with open('excel_dump.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

with open('excel_readable.txt', 'w', encoding='utf-8') as out:
    for sheet_name, rows in data.items():
        out.write(f'==============================\nSHEET: {sheet_name}\n==============================\n')
        for r in rows:
            r_num = r.get('row')
            cells_str = ', '.join([f'{k}: {v}' for k, v in r['cells'].items() if str(v).strip()])
            if cells_str:
                out.write(f'Row {r_num}: {cells_str}\n')
        out.write('\n')

print('excel_readable.txt written')
