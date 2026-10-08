import json
import sys
sys.stdout.reconfigure(encoding='utf-8')

with open('public/catalog-assets/manifest.json', 'r', encoding='utf-8') as f:
    manifest = json.load(f)

first_seen = {}
for entry in manifest:
    if entry.get('design') == 'sets':
        page = entry.get('page')
        for a in entry.get('assets', []):
            path = a['path'].split('/')[-1]
            if path not in first_seen:
                first_seen[path] = (page, a['width'], a['height'])

for path, (page, w, h) in sorted(first_seen.items(), key=lambda x: (x[1][0], x[0])):
    print(f"Page {page}: {path} ({w}x{h})")

