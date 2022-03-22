const { buildSync, build } = require("esbuild");
const { glsl } = require("esbuild-plugin-glsl");
const pkg = require("../package.json");

const versionMaybe = process.env.npm_config_outver;
const dirMaybe = process.env.npm_config_outdir;
const [, , , dir = dirMaybe || "out", version = versionMaybe || pkg.version] = process.argv;
let shouldWatchDir = false;

for (var i = 0; i < process.argv.length; i++) {
	if (process.argv[i] === '-w') {
		shouldWatchDir = true;
		break;
	}
}

[
	// The ESM bundle
	{
		format: "esm",
		legalComments: "external",
		outfile: `./${dir}/psychojs-${version}.js`,
	},
	// The IIFE
	{
		globalName: "PsychoJS",
		legalComments: "none",
		outfile: `./${dir}/psychojs-${version}.iife.js`,
	},
].forEach(function(options)
{
	build({ ...this, ...options })
	.then(()=> {
		if (shouldWatchDir) {
			console.log('watching...')
		}
	});
}, {
	// Shared options
	banner: {
		js: `/*! For license information please see psychojs-${version}.js.LEGAL.txt */`,
	},
	bundle: true,
	watch: shouldWatchDir,
	sourcemap: true,
	entryPoints: ["src/index.js"],
	minifySyntax: true,
	minifyWhitespace: true,
	target: [
		// https://github.com/evanw/esbuild/issues/121#issuecomment-646956379
		"es2017",
		"node14",
	],
	plugins: [
		glsl({
			minify: true
		})
	]
});
