"""Build the public group site without publishing the protected teaser assets."""
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
(destination / 'beyond').mkdir()
shutil.copy2(root / 'deployment/beyond-redirect.html', destination / 'beyond/index.html')
(destination / '.nojekyll').touch()
assert list((destination / 'beyond').rglob('*')) == [destination / 'beyond/index.html']
print('Public group site prepared; /beyond/ contains only the protected-entry redirect.')
