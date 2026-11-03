"""Build the group website with its temporary client-side teaser gate."""
from pathlib import Path
import shutil
import sys

root = Path(__file__).resolve().parents[1]
destination = Path(sys.argv[1]).resolve()
if destination == root or root in destination.parents:
    raise SystemExit('Build output must be outside the source repository.')
if destination.exists() and any(destination.iterdir()):
    raise SystemExit('Build output must be empty.')
destination.mkdir(parents=True, exist_ok=True)
for name in ('index.html', 'CNAME', 'favicon.png', 'favicon-32.png', 'favicon.ico', 'apple-touch-icon.png'):
    shutil.copy2(root / name, destination / name)
for name in ('css', 'js', 'img'):
    shutil.copytree(root / name, destination / name)
certificate_challenge = root / 'deployment/cert-validation/fileauth.txt'
if certificate_challenge.is_file():
    challenge_directory = destination / '.well-known/pki-validation'
    challenge_directory.mkdir(parents=True, exist_ok=True)
    shutil.copy2(certificate_challenge, challenge_directory / 'fileauth.txt')
shutil.copytree(root / 'beyond', destination / 'beyond')
(destination / 'beyond/index.html').rename(destination / 'beyond/site.html')
entry = root / 'deployment/gate/public'
shutil.copytree(entry, destination / '_entry')
shutil.copy2(root / 'deployment/gate/static-auth.js', destination / '_entry/static-auth.js')
gate = (entry / 'entry.html').read_text()
script = '  <script src="/_entry/entry.js?v=flow5" defer></script>'
if script not in gate:
    raise SystemExit('Entry script insertion point was not found.')
gate = gate.replace(script, '  <script src="/_entry/static-auth.js?v=20261104" defer></script>\n' + script)
(destination / 'beyond/index.html').write_text(gate)
(destination / '.nojekyll').touch()
print('Public group site prepared with the temporary client-side teaser gate.')
