const fs = require('fs');
const libxmljs = require('libxmljs');
const path = require('path');

const ns = 'urn:oasis:names:tc:xliff:document:1.2';

const xlfPaths = [
  /** paths to folders containing translated xlf files */
  'C:\\workspace\\SEPlatform\\simpleengagement-PR\\client\\src\\i18n-ts',
  'C:\\workspace\\SEPlatform\\simpleengagement-PR\\client\\src\\i18n-html'
];
const outputPath = 'C:\\workspace\\SEPlatform\\simpleengagement\\client\\src\\i18n'/*Output directory*/;
const srcPath = 'C:\\workspace\\SEPlatform\\simpleengagement\\client\\src\\i18n\\messages.xlf'/*Path to source messages.xlf*/;
const localizeLangs = ['fr', 'da', 'de', 'nl', 'es', 'hr'/** language codes on xlf files to migrate*/];

if (xlfPaths.length === 0 || localizeLangs.length === 0 || !outputPath || !srcPath) {
  console.log('Inputs not provided');
  return;
}

try {
  for (let lang of localizeLangs) {
    let targetLang = null;
    const destPath = path.join(outputPath, `messages.${lang}.xlf`);
    let destFile = fs.readFileSync(destPath, {encoding: 'utf-8'});
    const destXlf = libxmljs.parseXml(destFile);
    const destTransUnits = destXlf.find('//ns:trans-unit', {ns});
    targetLang = destXlf.get('//ns:file', {ns}).attr('target-language').value();
    const srcXlfDocs = [];
    for (let xlfPath of xlfPaths) {
      const oldPath = path.join(xlfPath, `messages.${lang}.xlf`);
      let oldFile = fs.readFileSync(oldPath, {encoding: 'utf-8'});
      const oldXlf = libxmljs.parseXml(oldFile);
      srcXlfDocs.push(oldXlf);
    }

    for (let transUnit of destTransUnits) {
      const id = transUnit.attr('id').value();
      const notes = [];
      const description = transUnit.get(`ns:note[@from='description']`, {ns});
      if (description) {
        notes.push(...description.text().split('|'));
      }
      const meaning = transUnit.get(`ns:note[@from='meaning']`, {ns});
      if (meaning) {
        notes.push(...meaning.text().split('|'));
      }
      let match;
      for (let srcDoc of srcXlfDocs) {
        if (!match) {
          match = srcDoc.get(`//ns:trans-unit[@id='${id}']`, {ns});
          if (!match) {
            const predicate = notes.map(note => `ns:note="${note}"`).join(' and ');
            match = srcDoc.get(`//ns:trans-unit[${predicate}]`, {ns});
          }
          if (!match) {
            match = srcDoc.get(`//ns:trans-unit[ns:note="${notes.join('|')}" or ns:note="${notes.reverse().join('|')}"]`, {ns});
          }
        }
      }
      if (match) {
        const destText = transUnit.get('ns:source', {ns}).toString();
        const matchText = match.get('ns:source', {ns}).toString();

        if (destText.indexOf('<x') >= 0 || matchText.indexOf('<x') >= 0) {
          console.warn(lang, `Cannot migrate text that changed interpolations`, notes, `dest:'${destText}', src: '${matchText}'`);

        } else {
          transUnit.get('ns:target', {ns}).replace(match.get('ns:target', {ns}));
        }
      }
    }

    fs.writeFileSync(path.join(outputPath, 'messages.' + lang + '.xlf'), destXlf.toString(), {encoding: 'utf-8'});
  }
} catch (err) {
  console.error(err);
}
