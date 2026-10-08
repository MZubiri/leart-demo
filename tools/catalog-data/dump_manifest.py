import json

with open('public/catalog-assets/manifest.json', 'r', encoding='utf-8') as f:
    manifest = json.load(f)

with open('manifest_sets_minibox.txt', 'w', encoding='utf-8') as out:
    for m in manifest:
        if m['design'] in ['sets', 'minibox']:
            out.write(f"=== {m['design']} Page {m['page']} ===\n")
            out.write(m['text'] + "\n")
            out.write("ASSETS:\n")
            for a in m.get('assets', []):
                out.write(f"  {a['path']} ({a.get('width')}x{a.get('height')})\n")
            out.write("\n" + "="*40 + "\n\n")

print("manifest_sets_minibox.txt created")
