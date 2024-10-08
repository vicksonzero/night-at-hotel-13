import HtmlWebpackPlugin from 'html-webpack-plugin'
import MiniCssExtractPlugin from 'mini-css-extract-plugin'
import HtmlWebpackInlineSourcePlugin from '@effortlessmotion/html-webpack-inline-source-plugin'
import CssMinimizerPlugin from 'css-minimizer-webpack-plugin'

const isProduction = process.env.npm_lifecycle_event === 'build'

export default {
    entry: './src',
    devtool: !isProduction && 'source-map',
    module: {
        rules: [
            {
                test: /\.css$/,
                use: [
                    MiniCssExtractPlugin.loader,
                    {
                        loader: 'css-loader',
                    },
                ]
            },
            // {
            //     test: /\.(png|jpg|gif|svg)$/i,
            //     type: 'asset/inline',
            // },
            {
                test: /\.(jpe?g|png|ttf|eot|svg|woff(2)?)(\?[a-z0-9=&.]+)?$/,
                use: 'base64-inline-loader?limit=1000&name=[name].[ext]'
            },
            {
                test: isProduction ? /\.js$/ : /^\s+$/,
                enforce: 'pre',
                exclude: /(node_modules|bower_components|\.spec\.js)/,
                use: [
                    {
                        loader: 'webpack-strip-block',
                        options: {
                            start: '#IfDev',
                            end: '#EndIfDev'
                            /* #IfDev */
                            /* #EndIfDev */
                        }
                    },
                ]
            }
        ]
    },
    // optimization: {
    //     minimize: true,
    //     minimizer: [
    //         // For webpack@5 you can use the `...` syntax to extend existing minimizers (i.e. `terser-webpack-plugin`), uncomment the next line
    //         // `...`,
    //     ],
    // },
    plugins: [
        new HtmlWebpackPlugin({
            template: 'src/index.html',
            // minify: false,
            minify: isProduction && {
                collapseWhitespace: true,
                minifyJS: {
                    compress: {
                        module: true,
                        // unsafe: true,
                    },
                    mangle: {
                        properties: {
                            // debug: '_mangled', // uncomment to mark minified symbols with my tag
                            regex: /^(?!_)[\w]{4,}$/,
                            reserved: ['onDown', 'onUp', 'onOver', `onOut`],
                        },
                    },
                }
            },
            inlineSource: isProduction && '\.(js|css)$'
        }),
        new HtmlWebpackInlineSourcePlugin(),
        new MiniCssExtractPlugin({
            filename: '[name].css'
        }),
        new CssMinimizerPlugin(),
    ],
    stats: 'minimal',
    devServer: {
        client: {
            overlay: true
        }
    }
}
