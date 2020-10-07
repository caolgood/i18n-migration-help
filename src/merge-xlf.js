const fs = require('fs');
const xml2js = require('xml2js');
const path = require('path');

(async function mergeTranslations() {
	const xlfPaths = [
			/** paths to folders containing translated xlf files */
	];
	const outputPath = /*Output directory*/ '';
	const srcPath = /*Path to source messages.xlf*/'';
	const localizeLangs = [/** language codes on xlf files to migrate*/]

	if (xlfPaths.length === 0 || localizeLangs.length === 0 || !outputPath || !srcPath) {
		console.log('Inputs not provided');
		return;
	}

	try {
		const srcFile = fs.readFileSync(srcPath, {encoding: "utf-8"});
		const srcXlf = await new xml2js.Parser().parseStringPromise(srcFile);
		const srcTranslations = getTranslations(srcXlf);
		for (let lang of localizeLangs) {
			let dest = 0
			let matches = 0;

			let targetLang= null;
			let destTransUnits = '';
			let header = '';
			let footer = '';
			for (let xlfPath of xlfPaths) {
				const destPath = path.join(xlfPath, `messages.${lang}.xlf`);
				let destFile = fs.readFileSync(destPath, {encoding: "utf-8"});
				if (!header) {
					header = destFile.match(/^.*<body>\s*/s)[0]
				}
				if (!footer) {
					footer = destFile.match(/\s*<\/body>.*$/s)[0]
				}
				let transUnits = destFile.match(/<body>\s*(.*?)\s*<\/body>/s)[1];
				const destXlf = await new xml2js.Parser().parseStringPromise(destFile);
				targetLang = destXlf.xliff.file[0].$['target-language'];
				traverseTranslations(destXlf, transUnit => {
					dest++;
					let destTranslation = parseTransUnit(transUnit);
					const filtered = srcTranslations.filter(src =>
						destTranslation.description === src.description &&
						destTranslation.meaning === src.meaning);
					let src;
					if (filtered.length === 1) {
						src = filtered[0];
						matches++;
						transUnits = transUnits.replace(transUnit.$.id, src.id);
					} else if (filtered.length > 1) {
						console.warn(`Multiple matches found for ${JSON.stringify({meaning: destTranslation.meaning, description: destTranslation.description})})}\n\
${filtered.map(transUnit => JSON.stringify(transUnit.source)).join('\n')}\n`)
					} else {
						console.warn(`No match found for ${JSON.stringify({meaning: destTranslation.meaning, description: destTranslation.description})}\n`)
					}
				});
				destTransUnits += transUnits;
			}

			console.log(`Processed ${srcTranslations.length} source translations, ${dest} ${lang} translations, found ${matches} matches`);
			let newXml = `${header}${destTransUnits}${footer}`
			fs.writeFileSync(path.join(outputPath, 'messages.' + lang + '.xlf'), newXml, {encoding: 'utf-8'});
		}
	} catch (err) {
		console.error(err);
	}
})()

function getTranslations(srcJson) {
	const translations = [];
	traverseTranslations(srcJson, transUnit =>
		translations.push(parseTransUnit(transUnit))
	);
	return translations;
}

function traverseTranslations(xlfJson, transUnitCallback) {
	const xliff = xlfJson.xliff;
	if (!xliff) return;
	if (xliff.$.xmlns.indexOf("urn:oasis:names:tc:xliff:document") < 0) {
		console.error('invalid XLF file')
		return;
	}
	for (let transUnit of xliff.file[0].body[0]['trans-unit']) {
		transUnitCallback(transUnit);
	}
}

function parseTransUnit(transUnitJson) {

	const translation = {
		id: transUnitJson.$.id,
		source: transUnitJson.source
	};
	for (let note of transUnitJson.note) {
		if (note.$.from === 'description') {
			translation.description = note._;
		} else if (note.$.from === 'meaning') {
			translation.meaning = note._;
		}

		const split = (text) => {
			let parts = text.split('|')
			if (parts.length === 2) {
				translation.meaning = parts[0];
				translation.description = parts[1];
			}
		}

		// normalize different formats of i18n descriptions
		if (translation.meaning && !translation.description && translation.meaning.indexOf('|' >= 0)) {
			split(translation.meaning);
		}

		if (translation.description && !translation.meaning && translation.description.indexOf('|' >= 0)) {
			split(translation.description);
		}
	}
	return translation;
}
