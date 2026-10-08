import json
import re

with open('excel_dump.json', 'r', encoding='utf-8') as f:
    excel_data = json.load(f)

with open('public/catalog-assets/manifest.json', 'r', encoding='utf-8') as f:
    manifest = json.load(f)

# Collect all asset images associated with text in manifest
asset_map = {}
for entry in manifest:
    text = entry.get('text', '')
    assets = [a['path'] for a in entry.get('assets', []) if a.get('path', '').endswith(('.png', '.jpg', '.jpeg'))]
    if assets:
        for line in text.split('\n'):
            line = line.strip()
            if line:
                for asset in assets:
                    if line not in asset_map:
                        asset_map[line] = []
                    if asset not in asset_map[line]:
                        asset_map[line].append(asset)

# Map known sets in products.ts
known_products_images = {
    'Cita en el café': '/catalog-assets/sets/243775c4-7b83-46fe-9189-bcb9c7126e19.png',
    'Cita en otoño': '/catalog-assets/sets/0012f611-7622-45c5-bc55-fef41e6442dc.png',
    'Set fotografía': '/catalog-assets/sets/003c24d6-8918-4aec-8583-c4f59a045131.png',
    'Mini parque': '/catalog-assets/sets/0ea7c0ee-26b7-4829-a278-1f271e68a988.png',
    'Puesto de mercado': '/catalog-assets/sets/18f2f123-6c81-4c34-9c59-fb4d7074492d.png',
    'Cancha de fútbol': '/catalog-assets/sets/1a75b290-9657-4c33-915c-76bd83113eb9.png',
    'Cancha Futbol': '/catalog-assets/sets/1a75b290-9657-4c33-915c-76bd83113eb9.png',
    'Set consultorio': '/catalog-assets/sets/21c21329-083f-488c-8674-b193e95c1f2a.png',
    'Set laboratorio': '/catalog-assets/sets/28c7a5b5-6118-4db4-a29c-1fd288c86351.png',
    'Barbacoa': '/catalog-assets/sets/28fb4712-de07-4428-b711-ac1fdc81068a.png',
    'Rayo rojo': '/catalog-assets/sets/39883bba-ec0b-4a97-b51d-a867041ed255.png',
    'Hot dog': '/catalog-assets/sets/4158bd8a-a71e-4033-baaa-15fc1bccc947.png',
    'Cita en el HotDog': '/catalog-assets/sets/4158bd8a-a71e-4033-baaa-15fc1bccc947.png',
    'Rayo blanco': '/catalog-assets/sets/46ad66c4-1926-4dbf-b79c-6577283e2596.png',
    'Jardín secreto': '/catalog-assets/sets/48499fd1-79fc-4291-ad14-776a32ed285b.png',
    'Mini hockey': '/catalog-assets/sets/50dad80b-49a5-400e-aced-d22c7b4530c7.png',
    'Batería': '/catalog-assets/sets/55596977-1ab7-4b2b-9d96-282363e33081.png',
    'Bateria': '/catalog-assets/sets/55596977-1ab7-4b2b-9d96-282363e33081.png',
    'Set astronauta': '/catalog-assets/sets/6fdb0ac4-426f-4e27-bac0-6ddaf70a4bd2.png',
    'Mini billar': '/catalog-assets/sets/7bbb7996-777e-4368-8997-b600e6455116.png',
    'Minibillar': '/catalog-assets/sets/7bbb7996-777e-4368-8997-b600e6455116.png',
    'Pisci Encanto': '/catalog-assets/sets/7ee002c8-dcd0-452b-afb3-c023d94cc4e6.png',
    'Pisciencanto': '/catalog-assets/sets/7ee002c8-dcd0-452b-afb3-c023d94cc4e6.png',
}

results = []
for r in excel_data.get('SETS ARMABLES', []):
    cells = r.get('cells', {})
    row_num = r.get('row')
    if int(row_num) >= 6:
        codigo = cells.get('C' + row_num, '').strip()
        nombre = cells.get('D' + row_num, '').strip()
        grupo = cells.get('A' + row_num, '').strip()
        cat = cells.get('B' + row_num, '').strip()
        p1 = cells.get('E' + row_num, '').strip()
        p2 = cells.get('F' + row_num, '').strip()
        if codigo or nombre:
            img = known_products_images.get(nombre)
            results.append({
                'row': row_num, 'codigo': codigo, 'nombre': nombre, 'grupo': grupo, 'cat': cat, 'p1': p1, 'p2': p2, 'img': img
            })

with open('sets_mapped.json', 'w', encoding='utf-8') as f:
    json.dump(results, f, ensure_ascii=False, indent=2)

print(f"Total mapped: {len([r for r in results if r['img']])} / {len(results)}")
