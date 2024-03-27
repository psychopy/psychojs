import glsl from "vite-plugin-glsl"

const fileName = `psychojs-${process.env.npm_package_version}`;

export default {
    root: "./src/",
    base: "./",
    build:
    {
        outDir: "../out",
        emptyOutDir: true,
        sourcemap: true,
        minify: false,
        cssCodeSplit: true,
        lib:
        {
            name: "psychojs",
            fileName,
            entry: ["index.js", "index.css"]
        },
        // rollupOptions:
        // {
        //     // make sure to externalize deps that shouldn't be bundled
        //     // into your library
        //     external: ['vue'],
        //     output:
        //     {
        //         // Provide global variables to use in the UMD build
        //         // for externalized deps
        //         globals: {
        //             vue: 'Vue',
        //         },
        //     },
        // }
    },
    plugins:
    [
        glsl()
    ]
}
