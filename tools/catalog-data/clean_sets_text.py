with open('manifest_sets_minibox.txt', 'r', encoding='utf-8') as f:
    pages = f.read().split('========================================')

with open('sets_text_clean.txt', 'w', encoding='utf-8') as out:
    for p in pages:
        for i in range(1, 11):
            if f'sets Page {i}' in p or 'minibox Page 1' in p:
                out.write(f"---------------- PAGE {i} ----------------\n")
                lines = [l.strip() for l in p.split('\n') if l.strip()]
                for l in lines:
                    if not l.startswith('ASSETS:') and not l.startswith('/catalog-assets') and not l.startswith('Canva') and not l.startswith('Share') and not l.startswith('Create with Canva') and not l.startswith('Toolbar') and not l.startswith('Previous page') and not l.startswith('Go to page') and not l.startswith('Next page') and not l.startswith('Zoom') and not l.startswith('More') and not l.startswith('Enter full'):
                        out.write(l + '\n')
                out.write('\n')

print('sets_text_clean.txt written')
