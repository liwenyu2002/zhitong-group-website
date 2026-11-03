"""Recover a release's public source assets and verify each against its manifest."""
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
from urllib.parse import quote
import hashlib
import json
import subprocess
import sys

release = Path(sys.argv[1]).resolve()
origin = sys.argv[2].rstrip('/') + '/'
manifest = json.loads((release/'production-manifest.json').read_text())

def matches(target, entry):
    return target.is_file() and target.stat().st_size == entry['size'] and hashlib.sha256(target.read_bytes()).hexdigest() == entry['sha256']

def fetch(entry):
    target = release/entry['path']
    if matches(target,entry):
        return
    target.parent.mkdir(parents=True,exist_ok=True)
    temporary = target.with_name('.'+target.name+'.pmsg-download')
    relative = entry['path'].removeprefix('site/')
    subprocess.run(['/usr/bin/curl','--fail','--location','--silent','--show-error',
                    '--connect-timeout','10','--max-time','180','--retry','1',
                    '--output',str(temporary),origin+quote(relative,safe='/')],check=True)
    if not matches(temporary,entry):
        raise RuntimeError('Downloaded content differs from the approved source: '+relative)
    temporary.replace(target)
    print('Verified',relative,flush=True)

with ThreadPoolExecutor(max_workers=4) as pool:
    list(pool.map(fetch,[entry for entry in manifest['files'] if entry['path'].startswith('site/')]))
print('All protected-site source files match the approved release.')
