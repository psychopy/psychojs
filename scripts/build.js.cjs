const { buildSync } = require('esbuild');
const pkg = require('psychojs/package');

const versionMaybe = process.env.npm_config_outver;
const dirMaybe = process.env.npm_config_outdir;
const [,,, dir = dirMaybe || 'out', version = versionMaybe || pkg.version] = process.argv;

buildSync({
	bundle: true,
	entryPoints: ['src/index.js'],
	format: 'esm',
	minify: true,
	outfile: `./${dir}/psychojs-${version}.js`
});
