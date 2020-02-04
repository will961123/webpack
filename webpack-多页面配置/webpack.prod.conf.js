/**
 *    生产环境
 */

const webpack = require('webpack');//引入webpack
const path = require('path');//引入nodejs路径模块，处理路径用的
const glob = require('glob');//glob，这个是一个全局的模块，动态配置多页面会用得着
const HtmlWebpackPlugin = require('html-webpack-plugin'); //这个是通过html模板生成html页面的插件，动态配置多页面用得着
const MiniCssExtractPlugin = require("mini-css-extract-plugin");//分离css，webpack4推荐的分离css的插件
const TransferWebpackPlugin = require('transfer-webpack-plugin');//原封不动的把assets中的文件复制到dist文件夹中
const autoprefixer = require('autoprefixer');//给css自动加浏览器兼容性前缀的插件  
const { CleanWebpackPlugin } = require('clean-webpack-plugin');//自动清除dist
const OptimizeCSSPlugin = require('optimize-css-assets-webpack-plugin');//压缩合并css
const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');//可视化分析模块

//动态添加入口
function getEntry() {
    var entry = {};
    //读取src目录所有page入口
    glob.sync('./src/js/**/*.js').forEach(function (name) {
        var start = name.indexOf('src/') + 4;
        var end = name.length - 3;
        var eArr = [];
        var n = name.slice(start, end);
        n = n.split('/')[1];
        eArr.push(name);
        // 引入这个，是为了用async await，一些IE不支持的属性能够受支持，兼容IE浏览器用的
        eArr.push('babel-polyfill');
        entry[n] = eArr;
    })
    return entry;
}
//动态加时间戳
function stamp() {
    var date = new Date();
    date = Date.parse(date);
    return date;
}
//动态生成html
//获取html-webpack-plugin参数的方法
const getHtmlConfig = function (name, chunks) {
    return {
        template: `./src/pages/${name}.html`,
        filename: `pages/${name}.html`,
        inject: true,
        hash: false,
        // 引入公共模块
        chunks: [name, 'vendor'],
        minify: {
            removeComments: true, //移除HTML中的注释
            collapseWhitespace: true, //折叠空白区域 也就是压缩代码
            removeAttributeQuotes: true, //去除属性引用
        },
    }
}
module.exports = {
    entry: getEntry(),
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: `js/[name]-${stamp()}-bundle.js`,
    },
    module: {
        rules: [
            {
                test: /\.js$/,
                exclude: /(node_modules)/,
                include: /src/,
                use: [
                    {
                        loader: 'babel-loader',
                        options: {
                            presets: ['@babel/preset-env',],
                            plugins: ['@babel/transform-runtime']
                        }
                    }
                ]
            },
            {
                test: /\.css$/,
                //css不分离写法
                //use:['style-loader','css-loader','postcss-loader']
                //css分离写法
                use: [MiniCssExtractPlugin.loader, "css-loader", {
                    loader: "postcss-loader",
                    options: {
                        plugins: [
                            autoprefixer({
                                overrideBrowserslist: ['ie >= 8', 'Firefox >= 20', 'Safari >= 5', 'Android >= 4', 'Ios >= 6', 'last 4 version']
                            })
                        ]
                    }
                }]
            },
            {
                test: /\.scss$/,
                //use:['style-loader','css-loader','sass-loader','postcss-loader']//css不分离写法
                //css分离写法
                use: [MiniCssExtractPlugin.loader, "css-loader", {
                    loader: "postcss-loader",
                    options: {
                        plugins: [
                            // 要在package.json里面写 browserslist
                            autoprefixer({
                                // browsers: ['ie >= 8', 'Firefox >= 20', 'Safari >= 5', 'Android >= 4', 'Ios >= 6', 'last 4 version']
                                overrideBrowserslist: ['ie >= 8', 'Firefox >= 20', 'Safari >= 5', 'Android >= 4', 'Ios >= 6', 'last 4 version']
                            })
                        ]
                    }
                }, "sass-loader"]
            },
            {
                test: /\.(png|jpg|gif|jpeg)$/,
                use: [
                    {
                        loader: 'url-loader',
                        options: {
                            limit: 5000
                        }
                    }
                ]
            }
        ]
    },
    mode: "production",
    performance: {
        hints: false
    },
    //插件
    plugins: [
        new CleanWebpackPlugin({
            cleanOnceBeforeBuildPatterns: [
                path.resolve(__dirname, 'dist'),
            ]
        }),
        // 将css分离出去
        new MiniCssExtractPlugin({
            filename: `css/[name]-${stamp()}.css`
        }),
        // 压缩合并css
        new OptimizeCSSPlugin({
            cssProcessorOptions: {
                safe: true
            }
        }),
        // 全局引入jquery
        new webpack.ProvidePlugin({
            $: "jquery",
            jQuery: "jquery",
            jquery: "jquery",
            "window.jQuery": "jquery"
        }),
        // 作用相当于copy-webpack-plugin
        new TransferWebpackPlugin([
            {
                from: 'assets',
                to: 'assets'
            }
        ], path.resolve(__dirname, "src")),
        // 可视化分析模块
        new BundleAnalyzerPlugin()
    ],
    // webpack4里面移除了commonChunksPulgin插件 ， vendor名字可改
    optimization: {
        splitChunks: {
            cacheGroups: {
                vendor: {
                    // test: /\.js$/,
                    test: /[\\/]node_modules[\\/]/,
                    chunks: "initial", //表示显示块的范围，有三个可选值：initial(初始块)、async(按需加载块)、all(全部块)，默认为all;
                    name: "vendor", //拆分出来块的名字(Chunk Names)，默认由块名和hash值自动生成；
                    enforce: true,
                }
            }
        }
    },
}
//配置页面
const entryObj = getEntry();
const htmlArray = [];
Object.keys(entryObj).forEach(function (element) {
    htmlArray.push({
        _html: element,
        title: '',
        chunks: [element]
    })
})
//自动生成html模板
htmlArray.forEach(function (element) {
    module.exports.plugins.push(new HtmlWebpackPlugin(getHtmlConfig(element._html, element.chunks)));
})

