const { buildSync } = require("esbuild");
const pkg = require("psychojs/package.json");

const versionMaybe = process.env.npm_config_outver;
const dirMaybe = process.env.npm_config_outdir;
const [, , , dir = dirMaybe || "out", version = versionMaybe || pkg.version] = process.argv;

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
	buildSync({ ...this, ...options });
}, {
	// Shared options
	banner: {
		js: `/*! For license information please see psychojs-${version}.js.LEGAL.txt */`,
	},
	bundle: true,
	sourcemap: true,
	entryPoints: ["src/index.js"],
	minifySyntax: true,
	minifyWhitespace: true,
	target: [
		// https://github.com/evanw/esbuild/issues/121#issuecomment-646956379
		"es2017",
		"node14",
	],
});
