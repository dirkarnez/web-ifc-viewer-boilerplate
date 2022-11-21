const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
// const TerserPlugin = require('terser-webpack-plugin');
// var MiniCssExtractPlugin = require('mini-css-extract-plugin');

const isProduction = process.env.NODE_ENV === 'production';

// const theme = {
//   "primary-color": "#0F9096",
//   'tabs-card-height':'50px',
//   'border-radius-base': "2px",
//   'table-header-bg': '#eef2f9',
//   'table-header-color': '#0F9096',
//   'table-row-hover-bg': '#e7f9f6',
//   'btn-padding-base': '0 10px',
//   'font-size-base': '16px',
//   'tabs-horizontal-margin': '0',
//   'tabs-horizontal-padding': '13px 20px',
//   'border-color-base': '#ADB4C2',
//   'input-placeholder-color': '#7F8694',
//   'disabled-color': '#7F8694'
// };

const config = {
    mode: isProduction ? 'production' : 'development',
    entry: './src/index.js',
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: '[name].js',
        clean: true
    },
    module: {
        exprContextCritical: false,
        rules: [
            {
                test: /\.?js$/,
                exclude: /node_modules/,
                use: {
                    loader: 'babel-loader'
                }
            },
            {
                test: /\.wasm$/,
                use: {
                    loader: 'wasm-loader'
                }
            }
        ]
    },
    plugins: [
        new HtmlWebpackPlugin({
            template: 'src/index.html',
        })
    ],
    // resolve: {
    //     extensions: ['.js', '.jsx']
    // },
    devServer: {
        static: {
            directory: path.join(__dirname, 'dist'),
        },
        // compress: true
    }
};

module.exports = config;