import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';
import babel from 'rollup-plugin-babel';
import sucrase from 'rollup-plugin-sucrase';
import pkg from './package.json';

const config = {
    input: 'src/index.js',
    
    external: [
        'react',
        'react-dom',
        'lodash.get',
        'lodash.set',
        'lodash.has',
        'lodash.clone',
        'lodash.upperfirst',
    ],
    
    context: null,
    
    // Rollup will warn about mixing default exports with named exports.
    // I do not consider this a bad practice, so do React authors.
    onwarn: (warning, warn) => {
        if (warning.code === 'MIXED_EXPORTS') {
            return;
        }
        
        warn(warning);
    },
};

export default [{
    ...config,
    
    output: [{
        file: pkg.main,
        format: 'cjs',
        sourcemap: true,
    }, {
        file: pkg.module,
        format: 'es',
        sourcemap: true,
    }],
    
    plugins: [
        resolve({
            extensions: ['.js']
        }),
        babel({
            exclude: ['node_modules/**'],
            runtimeHelpers: true,
            presets: [
                "@babel/preset-env",
                "@babel/preset-react",
            ],
        }),
        commonjs(),
    ],
}, {
    ...config,
    
    output: [{
        file: pkg["module-es6+"],
        // No need for source maps here, Sucrase outputs native JavaScript
        format: 'es',
    }],
    
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
}];
