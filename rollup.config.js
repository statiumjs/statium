import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';
import sucrase from 'rollup-plugin-sucrase';
import pkg from './package.json';

export default {
    input: 'src/ViewModel.js',
    output: [{
        file: pkg.main,
        format: 'cjs',
    }, {
        file: pkg.module,
        format: 'es',
    }],
    
    // self-serve-ui project already includes React and Lodash as dependencies,
    // no reason to bundle these with Statium
    external: ['react', 'lodash.get', 'lodash.set', 'lodash.has', 'lodash.clone'],
    context: null,
    
    // Rollup will warn about mixing default exports with named exports.
    // I do not consider this a bad practice, so do React authors.
    onwarn: (warning, warn) => {
        if (warning.code === 'MIXED_EXPORTS') {
            return;
        }
        
        warn(warning);
    },
    plugins: [
        resolve({
            extensions: ['.js']
        }),
        sucrase({
            exclude: ['node_modules/**'],
            transforms: ['jsx']
        }),
        commonjs(),
    ],
}
