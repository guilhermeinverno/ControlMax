from pathlib import Path
import csv
import re
from bs4 import BeautifulSoup

source = Path('/home/ubuntu/browser_html/trycontroller_co_Index_1783902864626.html')
out_csv = Path('/home/ubuntu/controller_reverse/rotas_observadas.csv')
out_md = Path('/home/ubuntu/controller_reverse/rotas_observadas.md')

html = source.read_text(encoding='utf-8', errors='ignore')
soup = BeautifulSoup(html, 'html.parser')
rows = []
seen = set()

for a in soup.find_all('a'):
    onclick = a.get('onclick', '')
    match = re.search(r'CargarBody\((?:&quot;|")([^"&]+(?:&amp;[^"&]+)*)', onclick)
    if not match:
        match = re.search(r'CargarBody\(\\?"([^"\)]*)', onclick)
    if not match:
        continue
    route = match.group(1).replace('&amp;', '&').strip()
    label = ' '.join(a.get_text(' ', strip=True).split())
    key = (label, route)
    if key in seen:
        continue
    seen.add(key)
    rows.append({'label': label, 'route': route})

rows.sort(key=lambda r: (r['label'].lower(), r['route']))

with out_csv.open('w', encoding='utf-8', newline='') as f:
    writer = csv.DictWriter(f, fieldnames=['label', 'route'])
    writer.writeheader()
    writer.writerows(rows)

with out_md.open('w', encoding='utf-8') as f:
    f.write('# Inventário de rotas observadas\n\n')
    f.write('Rotas coletadas passivamente do HTML autenticado, sem chamadas adicionais aos endpoints.\n\n')
    f.write('| Rótulo visível | Rota dinâmica |\n|---|---|\n')
    for row in rows:
        f.write(f"| {row['label'].replace('|', '\\|')} | `{row['route'].replace('|', '\\|')}` |\n")

print(f'{len(rows)} rotas extraídas')
print(out_csv)
print(out_md)
