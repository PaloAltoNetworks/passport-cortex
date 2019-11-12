import typescript from 'rollup-plugin-typescript2'

import pkg from './package.json'

export default [
  // // Browser-friendly UMD build (not needed)
  // {
  //   input: 'src/index.ts',
  //   output: {
  //     name: pkg.name,
  //     file: pkg.browser,
  //     format: 'umd',
  //     globals: {},
  //   },
  //   plugins: [
  //     resolve(), // so Rollup can find dependencies
  //     commonjs(), // so Rollup can convert dependencies to an ES module
  //     typescript(),
  //   ],
  // },

  // CommonJS (for Node) and ES module (for bundlers) build.
  // (We could have three entries in the configuration array
  // instead of two, but it's quicker to generate multiple
  // builds from a single configuration where possible, using
  // an array for the `output` option, where we can specify
  // `file` and `format` for each target)
  {
    input: 'src/index.ts',
    output: [
      { file: pkg.main, format: 'cjs' },
      { file: pkg.module, format: 'esm' },
    ],
    external: [
      ...Object.keys(pkg.dependencies || {}),
      ...Object.keys(pkg.peerDependencies || {}),
    ],
    plugins: [typescript()],
  },
]
