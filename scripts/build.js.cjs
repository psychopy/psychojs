const { buildSync } = require('esbuild');
const pkg = require('psychojs/package.json');

const versionMaybe = process.env.npm_config_outver;
const dirMaybe = process.env.npm_config_outdir;
const [,,, dir = dirMaybe || 'out', version = versionMaybe || pkg.version] = process.argv;

buildSync({
	banner: {
		js: `/*! For license information please see psychojs-${version}.js.LEGAL.txt */`,
	},
	bundle: true,
	entryPoints: ['src/index.js'],
	format: 'esm',
	legalComments: 'external',
	minify: true,
	outfile: `./${dir}/psychojs-${version}.js`
});
