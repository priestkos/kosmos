"""Static checks on index.html. Run: python3 -m unittest discover -s tests"""
import re
import unittest
from html.parser import HTMLParser
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


class Page(HTMLParser):
    def __init__(self):
        super().__init__()
        self.tags = []  # (tag, attrs, parent gallery-tile attrs or None)
        self.tile = None

    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if 'gallery-tile' in (a.get('class') or '').split():
            self.tile = a
        self.tags.append((tag, a, self.tile))


def page():
    p = Page()
    p.feed((ROOT / 'index.html').read_text(encoding='utf-8'))
    return p


class SiteTest(unittest.TestCase):
    def test_gallery_tiles_point_at_existing_images(self):
        tags = page().tags
        tiles = [a for _, a, t in tags if a is t]
        self.assertGreater(len(tiles), 0)
        for a in tiles:
            self.assertRegex(a.get('data-img', ''), r'^assets/images/\d+\.jpg$')
            self.assertTrue((ROOT / a['data-img']).is_file(), a['data-img'])
        thumbs = [a['data-src'] for tag, a, t in tags if tag == 'img' and t and 'data-src' in a]
        self.assertEqual(len(thumbs), len(tiles))
        for src in thumbs:
            self.assertRegex(src, r'^assets/images/thumbs/\d+\.webp$')
            self.assertTrue((ROOT / src).is_file(), src)

    def test_every_data_shape_is_a_known_shape(self):
        js = (ROOT / 'assets/main.js').read_text(encoding='utf-8')
        keys = set(re.findall(r'^\s*(\w+): new Float32Array', js, re.M))
        shapes = {a['data-shape'] for _, a, _ in page().tags if 'data-shape' in a}
        self.assertTrue(shapes)
        self.assertLessEqual(shapes, keys)

    def test_nav_targets_exist(self):
        tags = page().tags
        ids = {a['id'] for _, a, _ in tags if 'id' in a}
        targets = [a['data-target'] for _, a, _ in tags if 'rail-dot' in (a.get('class') or '').split()]
        targets += [a['href'][1:] for tag, a, _ in tags
                    if tag == 'a' and (a.get('href') or '').startswith('#') and len(a['href']) > 1]
        self.assertGreater(len(targets), 5)
        for t in targets:
            self.assertIn(t, ids)


if __name__ == '__main__':
    unittest.main()
