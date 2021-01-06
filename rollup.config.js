// ES native imports courtesy of using type module in 'package.json'
import path from 'path';
import fs from 'fs';
import { minify } from 'terser';
import babel from '@rollup/plugin-babel';

// Manually set default version here for easier
// diffing when comparing to original build script output
const { VERSION: version = '2020.2' } = process.env;

// Enabled in the original, even though
// source maps missing for sample provided
const sourcemap = false;

// Might be 'build' or similar
const destination = './dist';

// Could be 'src' or 'lib'
const source = './src';

// Start fresh
try {
	if (fs.existsSync(destination)) {
		// Clear out JS files before rebuilding
		const contents = fs.readdirSync(destination).filter(item => item.endsWith('js'));

		for (const item of contents) {
			const target = path.join(destination, item);
			const stat = fs.statSync(target);

			// Delete
			fs.unlinkSync(target);
		}
	} else {
		// Create 'dist' if missing
		fs.mkdirSync(destination);
	}
} catch (error) {
	console.error(error);
}

// For sorting legacy/IE11 bundle components
const orderOfAppearance = [ 'util', 'data', 'core', 'visual', 'sound' ];
const last = [ ...orderOfAppearance ].pop();
const footer = `
// Add a few top level variables for convenience, this makes it
// possible to eg. use "return Scheduler.Event.NEXT;" instead of "util.Scheduler.Event.NEXT;"
PsychoJS = core.PsychoJS;
TrialHandler = data.TrialHandler;
Scheduler = util.Scheduler;`;

const plugins = [
	babel({
		babelHelpers: 'bundled',
		exclude: 'node_modules/**',
		include: `${destination}/*.iife.js`
	}),
	minifier({
		compress: false,
		mangle: false,
		output: {
			beautify: true
		},
		sourceMap: false,
		toplevel: false
	})
];

// List source directory contents
const components = fs.readdirSync(source)
	// Need subdirectories only
	.filter((item) => {
		const target = path.join(source, item);
		const stat = fs.statSync(target);

		return stat.isDirectory();
	})
	// Put in order
	.sort((a, b) => orderOfAppearance.indexOf(a) - orderOfAppearance.indexOf(b))
	// Prepare an output object for each component module
	.map((component, _, contents) => ({
			// So I don't have to specify full paths
			external: (id) => {
				// Decompose current component path
				const segments = id.split('/');

				// Mark as external if contents within source
				// directory tree, excluding the current component
				return contents
					.filter(item => item !== component)
					.some(item => segments.includes(item));
			},
			input: `${source}/${component}/index.js`,
			// Disable circular dependency warnings
			onwarn,
			output: [
				{
					file: `${destination}/${component}-${version}.js`,
					format: 'module',
					globals: {
						performance: 'performance'
					},
					// Find which module the import points to
					// and fix path in place
					paths: (id) => {
						const name = findName(id, contents);

						return `./${name}-${version}.js`;
					},
					sourcemap,
				},
				{
					esModule: false,
					file: `${destination}/${component}-${version}.iife.js`,
					format: 'iife',
					globals: id => findName(id, contents),
					name: component,
					paths: (id) => {
						const name = findName(id, contents);

						return `./${name}-${version}.iife.js`;
					},
					sourcemap,
					plugins: [
						appender({
							target: `${destination}/psychojs-${version}.js`,
							// Mirrors rollup's 'outputOptions' hook
							outputOptions: (options) => {
								if (options.file.includes(last)) {
									options.footer = footer;
								}

								return options;
							}
						})
					]
				}
			],
			plugins
		})
	);

export default [
	...components,
	{
		// Add a UMD build for Thomas
		input: `${source}/index.js`,
		output: {
			file: `${destination}/psychojs-${version}.umd.js`,
			format: 'umd',
			name: 'psychojs'
		},
		plugins
	}
];

// https://rollupjs.org/guide/en/#onwarn
function onwarn(message, warn) {
	// Skip circular dependecy warnings
	if (message.code === 'CIRCULAR_DEPENDENCY') {
		return;
	}

	warn(warning);
}

// Helper for extracting module name from contents array by rollup id (path to file)
function findName(id, contents) {
	return id.split(path.sep).find(item => contents.includes(item));
}

// Minimal terser plugin
function minifier(options) {
	return {
		name: 'minifier',
		async renderChunk(code) {
			try {
				// Includes code and map keys
				const result = await minify(code, options);

				return result;
			} catch (error) {
				throw error;
			}
		}
	};
}

// Custom plugin for cancatenating IIFE's sans cat(1)
function appender({ target = '', outputOptions = () => {} } = {}) {
	return {
		name: 'appender',
		outputOptions: (options) => outputOptions(options),
		async generateBundle(options, bundle) {
			const { file } = options;
			const id = file.split('/').pop();
			const { code } = bundle[id];

			// Should be expected to throw if `target` missing
			fs.appendFile(target, code, (error) => {
				if (error) {
					throw error;
				}
			});

			// Prevent write out
			delete bundle[id];
		}
	};
}
