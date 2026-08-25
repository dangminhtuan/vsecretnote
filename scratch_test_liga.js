import opentype from 'opentype.js';
import fs from 'fs';

const notdefGlyph = new opentype.Glyph({
    name: '.notdef', unicode: 0, advanceWidth: 650, path: new opentype.Path()
});

const aGlyph = new opentype.Glyph({
    name: 'a', unicode: 97, advanceWidth: 650, path: new opentype.Path()
});

const bGlyph = new opentype.Glyph({
    name: 'b', unicode: 98, advanceWidth: 650, path: new opentype.Path()
});

const ligaGlyph = new opentype.Glyph({
    name: 'a_b', advanceWidth: 650, path: new opentype.Path()
});

const font = new opentype.Font({
    familyName: 'LigaTest',
    styleName: 'Medium',
    unitsPerEm: 1000,
    ascender: 800,
    descender: -200,
    glyphs: [notdefGlyph, aGlyph, bGlyph, ligaGlyph]
});

// Opentype.js substitution API
console.log("Substitution API available?", !!font.substitution);
try {
  // If font.substitution is available, we can add ligatures.
  if (font.substitution) {
    font.substitution.add('liga', { sub: [1, 2], by: 3 }); // Using glyph indices
    console.log("Added liga");
  }
} catch (e) {
  console.log("Error adding liga:", e);
}
