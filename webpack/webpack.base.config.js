const path = require('path');
const fs = require('fs');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
// const CopyWebpackPlugin = require('copy-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const OptimizeCssAssetsWebpackPlugin = require('optimize-css-assets-webpack-plugin');
const TerserWebpackPlugin = require('terser-webpack-plugin');
const webpack = require('webpack');

const pages = [];

const cssLoaders = (extra) => {
  const basicLoader = [
    {
      loader: MiniCssExtractPlugin.loader,
      options: { publicPath: '../' },
    },
    {
      loader: 'css-loader',
    },
  ];

  if (extra)
    extra.forEach((element) => {
      basicLoader.push(element);
    });

  return basicLoader;
};

// Get pages
fs.readdirSync(path.resolve(__dirname, '..', 'src', 'pages'))
  .filter((file) => file.indexOf('base') !== 0)
  .forEach((file) => {
    pages.push(file.split('/', 2));
  });

const ENTRIES = {};
pages.forEach((page) => {
  console.log(page);
  ENTRIES[page] = `/pages/${page}/${page}.js`;
  console.log(ENTRIES[page]);
});

const PATHS = {
  src: path.resolve(__dirname, '..', 'src'),
  dist: path.resolve(__dirname, '..', 'dist'),
};

module.exports = {
  context: PATHS.src,
  entry: ENTRIES,
  optimization: {
    minimizer: [new TerserWebpackPlugin({}), new OptimizeCssAssetsWebpackPlugin({})],
    splitChunks: {
      cacheGroups: {
        commons: {
          name: 'commons',
          chunks: 'initial',
          minChunks: 2,
          minSize: 0,
        },
      },
    },
  },
  output: {
    path: PATHS.dist,
    filename: `[name]_[fullhash:8].min.js`,
  },
  resolve: {
    alias: {
      '@': PATHS.src,
    },
  },
  plugins: [
    new CleanWebpackPlugin(),
    new MiniCssExtractPlugin({
      filename: `[name]_[fullhash:8].css`,
    }),
    // new CopyWebpackPlugin({
    //   patterns: [
    //     { from: `${PATHS.src}/fonts`, to: `fonts` },
    //     { from: `${PATHS.src}/favicons`, to: 'favicons' },
    //     { from: `${PATHS.src}/img`, to: `img` },
    //   ],
    // }),
    new webpack.ProvidePlugin({
      $: 'jquery',
      jQuery: 'jquery',
    }),
    // Generate html-webpack-plugin for each page
    ...pages.map(
      (fileName) =>
        new HtmlWebpackPlugin({
          getData: () => {
            try {
              return JSON.parse(fs.readFileSync(`../src/pages/${fileName}/data.json`, 'utf8'));
            } catch (e) {
              console.warn(`data.json was not provided for page ${fileName}`);
              return {};
            }
          },
          filename: `${fileName}.html`,
          template: `./pages/${fileName}/${fileName}.pug`,
          chunks: fileName,
          inject: 'body',
          minify: false,
        }),
    ),
  ],
  module: {
    rules: [
      {
        test: /\.m?js$/,
        exclude: /(node_modules|bower_components)/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env'],
          },
        },
      },
      {
        test: /\.pug$/,
        loader: 'pug-loader',
        options: {
          pretty: true,
        },
      },
      {
        test: /\.css$/,
        use: cssLoaders(),
      },
      {
        test: /\.s[ac]ss$/,
        use: cssLoaders([
          {
            loader: 'resolve-url-loader',
            options: {},
          },
          {
            loader: 'sass-loader',
            options: {
              sourceMap: true,
            },
          },
        ]),
      },
      {
        test: /\.(png|jpeg|jpg|svg|gif)$/,
        loader: 'file-loader',
        options: {
          publicPath: './',
          name: 'images/[name].[ext]',
        },
      },
      {
        test: /\.(ttf|woff|woff2|eot)$/,
        loader: 'file-loader',
        options: {
          publicPath: './',
          name: 'fonts/[name].[ext]',
        },
      },
    ],
  },
};
