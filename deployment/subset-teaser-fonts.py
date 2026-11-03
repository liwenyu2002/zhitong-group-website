"""Keep the approved font outlines while shipping only the teaser's character set.

Run in a Python environment with fonttools[woff] installed.
The full source fonts remain in the fixed, already-published source commit.
"""
from pathlib import Path
from fontTools import subset
from fontTools.ttLib import TTFont
from fontTools.pens.recordingPen import DecomposingRecordingPen
from html import unescape
from io import BytesIO
import subprocess

root = Path(__file__).resolve().parents[1]
source_commit = '9e53d6046fdbf3fcf6b33dc364e7d3bd0ed15000'
texts = [p.read_text() for p in (root/'beyond').iterdir() if p.suffix in {'.html','.css','.js'}]
characters = set(unescape(''.join(texts))) | set(chr(n) for n in range(32,127)) | set('\u00a0–—‘’“”…←↑→↓↗')

def outline(font, character):
    glyphs = font.getGlyphSet()
    pen = DecomposingRecordingPen(glyphs)
    glyphs[font.getBestCmap()[ord(character)]].draw(pen)
    return pen.value

for name in ('teaser-kai-light.woff2','teaser-kai-regular.woff2'):
    relative = 'beyond/assets/fonts/'+name
    source = subprocess.check_output(['git','show',source_commit+':'+relative],cwd=root)
    original = TTFont(BytesIO(source))
    keep = {character for character in characters if ord(character) in original.getBestCmap()}
    font = TTFont(BytesIO(source))
    options = subset.Options()
    options.flavor = 'woff2'
    subsetter = subset.Subsetter(options=options)
    subsetter.populate(text=''.join(sorted(keep)))
    subsetter.subset(font)
    target = root/relative
    font.save(target)
    output = TTFont(target)
    for character in keep:
        assert outline(original,character) == outline(output,character), repr(character)
    print(name, len(source),'->',target.stat().st_size,'bytes;',len(keep),'characters; all outlines unchanged.')
