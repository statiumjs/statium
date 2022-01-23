import { getBabelOutputPlugin } from '@rollup/plugin-babel';
import cleanup from 'rollup-plugin-cleanup';
import { terser } from "rollup-plugin-terser";
import pkg from './package.json';

const terserConfig = {
  mangle: {
    reserved: [
      'Store', 'StoreUnmountedError', 'Bind', 'bind', 'useStore', 'useState'
    ],
  },
};

export default [{
  input: 'src/index.js',

  external: [
    'react',
    'react-dom',
  ],

  context: null,

  output: [{
    file: pkg.main,
    format: 'cjs',
    sourcemap: true,
    exports: 'named',
    plugins: [
      // getBabelOutputPlugin does not load .babelrc config,
      // all configuration needs to be passed explicitly
      getBabelOutputPlugin({
        runtimeHelpers: true,
        presets: [
          "@babel/preset-env",
        ],
      }),
      terser(terserConfig),
    ],
  }, {
    file: pkg.module,
    format: 'es',
    sourcemap: true,
    plugins: [terser(terserConfig)],
  }, {
    file: pkg.module_unminified,
    format: 'es',
    sourcemap: true,
  }],

  plugins: [cleanup()],
}];
