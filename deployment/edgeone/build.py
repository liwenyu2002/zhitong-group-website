"""Prepare the public homepage and server-side teaser gateway for EdgeOne Makers."""
from base64 import b64encode
import json
from pathlib import Path
import shutil
import sys
import zipfile

root = Path(__file__).resolve().parents[2]
output = Path(sys.argv[1]).resolve()
if output == root or root in output.parents:
    raise SystemExit('Build output must be outside the source repository.')
if output.exists() and any(output.iterdir()):
    raise SystemExit('Build output must be empty.')
output.mkdir(parents=True, exist_ok=True)

for name in ('index.html', 'favicon.ico', 'favicon.png', 'favicon-32.png', 'apple-touch-icon.png'):
    shutil.copy2(root / name, output / name)
for name in ('css', 'js', 'img'):
    shutil.copytree(root / name, output / name)

entry = root / 'deployment/gate/public'
public_entry = output / '_entry'
public_entry.mkdir()
for name in ('entry.css', 'entry.js', 'eye-cloud.js', 'eye-sculpture-v2.png', 'portal-particles.js'):
    shutil.copy2(entry / name, public_entry / name)
for name in ('language.css', 'language.js'):
    shutil.copy2(root / 'beyond' / name, public_entry / name)

source = (root / 'deployment/site-worker/worker/index.js').read_text()
placeholder = 'const ENTRY_ASSETS = /* ENTRY_ASSETS */ null;'
assert placeholder in source
asset = {'entry.html': b64encode((entry / 'entry.html').read_bytes()).decode()}
source = source.replace(placeholder, 'const ENTRY_ASSETS = ' + json.dumps(asset) + ';')
source = source.replace("request.headers.get('CF-Connecting-IP') || 'unknown'",
                        "request.headers.get('EO-Connecting-IP') || request.headers.get('x-forwarded-for')?.split(',')[0].trim() || 'unknown'")
source = source.replace(',cf:{cacheEverything:true,cacheTtl:300}', '')
source = source.replace('export default {\n  async fetch(request, env)',
                        'const worker = {\n  async fetch(request, env)')
start = source.index('async function smallBody(request) {')
end = source.index('\nasync function login(', start)
source = source[:start] + '''async function smallBody(request) {
  if (Number(request.headers.get('Content-Length') || 0) > 1024) return null;
  try {
    const text = await request.text();
    if (encoder.encode(text).length > 1024) return null;
    return JSON.parse(text);
  } catch { return null; }
}''' + source[end:]
source += '\nexport default function onRequest(context) { return worker.fetch(context.request, context.env); }\n'
functions = output / 'edge-functions'
functions.mkdir()
(functions / '[[default]].js').write_text(source)

if len(sys.argv) > 2:
    archive = Path(sys.argv[2]).resolve()
    with zipfile.ZipFile(archive, 'w', zipfile.ZIP_DEFLATED, compresslevel=7) as bundle:
        for path in output.rglob('*'):
            if path.is_file():
                bundle.write(path, path.relative_to(output))
    print(f'Prepared {archive}')
else:
    print(f'Prepared {output}')
