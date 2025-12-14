const HtmlWebpackPlugin = require('html-webpack-plugin');
const path = require('path');

module.exports = {
    entry: {
        polyfill: '@babel/polyfill',
        taskpane: './src/index.tsx'
    },
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: '[name].bundle.js'
    },
    resolve: {
        extensions: ['.ts', '.tsx', '.html', '.js']
    },
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                use: 'ts-loader',
                exclude: /node_modules/
            },
            {
                test: /\.css$/,
                use: ['style-loader', 'css-loader'] // For Tailwind if added locally, otherwise CDN in index.html works
            }
        ]
    },
    plugins: [
        new HtmlWebpackPlugin({
            filename: 'taskpane.html',
            template: './src/index.html',
            chunks: ['polyfill', 'taskpane']
        })
    ],
    devServer: {
        port: 3000,
        https: true, // Office Add-ins require HTTPS
        static: './dist'
    }
};
