const { existsSync } = require("fs")
const { writeFile, mkdir } = require("fs").promises
const { join, resolve } = require("path")
const { rollup } = require("rollup")
const terser = require("terser")

const packagePath = resolve(__dirname, "..")
const distNpmPath = join(packagePath, "dist")

async function build() {
  if (!existsSync(distNpmPath))
    await mkdir(distNpmPath)
  await makeBundle(join(__dirname, "compiled-esm", "direct-vuex.js"), "direct-vuex.esm", "esm")
  await makeBundle(join(__dirname, "compiled-es5", "direct-vuex.js"), "direct-vuex.umd", "umd")
}

async function makeBundle(mainFile, bundleName, format) {
  const bundle = await rollup({
    input: mainFile,
    context: "this" // preserve 'this' in TS's ES5 helpers
  })
  const { output } = await bundle.generate({
    format,
    name: "DirectVuex",
    sourcemap: false,
    exports: "named",
    globals: {
      vuex: "Vuex" // global variable name for UMD and System
    },
  })
  const bundleCode = output[0].code
  const minified = terser.minify({
    bundle: bundleCode
  })
  if (minified.error)
    throw minified.error

  await writeFile(join(distNpmPath, `${bundleName}.min.js`), minified.code)
  await writeFile(join(distNpmPath, `${bundleName}.js`), bundleCode)
}

build().catch(err => console.log(err.message, err.stack))
