import json
import sys
sys.stdout.reconfigure(encoding='utf-8')

with open('public/catalog-assets/manifest.json', 'r', encoding='utf-8') as f:
    manifest = json.load(f)

for m in manifest:
    if m['design'] == 'sets' and 2 <= m['page'] <= 7:
        print(f"\n================ PAGE {m['page']} ================")
        print("TEXT:")
        lines = [l.strip() for l in m['text'].split('\n') if l.strip()]
        for l in lines[:20]:
            print("  ", l)
        print("ASSETS:")
        for a in m.get('assets', []):
            print(f"   {a['path']} ({a.get('width')}x{a.get('height')})")

