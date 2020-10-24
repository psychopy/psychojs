// ES native imports courtesy of using type module in 'package.json'
import path from 'path';
import fs from 'fs';
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
const source = './js';

// Start fresh by removing the 'dist' folder
try
{
	// Node.js recursive removal is experimental
	fs.rmdirSync(destination, { recursive: true });
}
catch (error)
{
	console.error(error);
}

// For sorting legacy/IE11 bundle components
const orderOfAppearance = [ 'util', 'data', 'core', 'visual', 'sound' ];

// List source directory contents
const components = fs.readdirSync(source)
	// Drop hidden elements
	.filter(item => !item.startsWith('.'))
	// Drop main or just keep out of 'js' folder?
	.filter(item => item !== 'index.js')
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
						appender()
					]
				}
			],
			plugins: [
				babel({
					babelHelpers: 'bundled',
					exclude: 'node_modules/**',
					include: `${destination}/*.iife.js`
				})
			]
		})
	);

export default [ ...components ];

// https://rollupjs.org/guide/en/#onwarn
function onwarn(message) {
	// Skip circular dependecy warnings
	if (message.code !== 'CIRCULAR_DEPENDENCY') {
		console.warn('(!)', message.toString());
	}
}

// Helper for extracting module name from contents array by rollup id (path to file)
function findName(id, contents) {
	return id.split(path.sep).find(item => contents.includes(item));
}

// Custom plugin for cancatenating IIFE's sans cat(1)
function appender() {
	return {
		outputOptions(options) {
			const last = [ ...orderOfAppearance ].pop();

			if (options.file.includes(last)) {
				options.footer = `
// Add a few top level variables for convenience, this makes it
// possible to eg. use "return Scheduler.Event.NEXT;" instead of "util.Scheduler.Event.NEXT;"
PsychoJS = core.PsychoJS;
TrialHandler = data.TrialHandler;
Scheduler = util.Scheduler;`;
			}

			return options;
		},
		generateBundle(options, bundle) {
			const { file } = options;
			const id = file.split('/').pop();
			const { code } = bundle[id];

			fs.appendFile(`${destination}/psychojs-${version}.js`, code, (error) => {
				if (error) {
					throw error;
				}
			});

			// Prevent write out
			delete bundle[id];
		}
	};
}
