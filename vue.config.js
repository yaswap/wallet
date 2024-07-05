const path = require('path');
const AssetReplacePlugin = require('./plugins/AssetReplacePlugin');
const CopyPlugin = require('copy-webpack-plugin');
const webpack = require('webpack');

const isDevelopment = process.env.NODE_ENV === 'development';

module.exports = {
  lintOnSave: false,
  productionSourceMap: false,

  css: {
    loaderOptions: {
      sass: {
        prependData: '@import "@/assets/scss/_vars.scss";',
      },
    },
  },

  configureWebpack: (config) => {
    // config.entry.pageProvider = path.resolve('./src/pageProvider/index.js');
    // An entry point indicates which module webpack should use to begin building out its internal dependency graph.
    config.entry.background = path.resolve('./src/background.js')
    config.entry['content-script'] = path.resolve('./src/contentScript.js')
    config.entry['inject-script'] = path.resolve('./src/pageProvider/index.js');
    // config.entry['inject-script'] = path.resolve('./src/inject-script.js')
    config.plugins.push(
      new webpack.NormalModuleReplacementPlugin(
        /@ledgerhq\/cryptoassets\/data\/erc20-signatures/,
        '@ledgerhq/cryptoassets/lib/data/erc20-signatures'
      )
    );
    config.plugins.push(
      new webpack.NormalModuleReplacementPlugin(
        /@ledgerhq\/cryptoassets\/data\/eip712/,
        '@ledgerhq/cryptoassets/lib/data/eip712'
      )
    );
    config.plugins.push(
      new webpack.NormalModuleReplacementPlugin(/@ledgerhq\/devices\/hid-framing/, '@ledgerhq/devices/lib/hid-framing')
    );

    config.plugins.push(
      new AssetReplacePlugin({
        name: '#PAGEPROVIDER#',
        entry: 'pageProvider',
      })
    );

    config.plugins.push(
      new CopyPlugin({
        patterns: [
          {
            context: './src/locales',
            from: '**/messages.json',
            to({ context, absoluteFilename }) {
              return `_locales/${path.relative(context, absoluteFilename)}`;
            },
          },
          {
            context: './src',
            from: 'manifest.json',
            to({ context, absoluteFilename }) {
              return `./${path.relative(context, absoluteFilename)}`
            }
          }
        ],
      })
    );

    config.optimization.splitChunks = {
      cacheGroups: {
        default: false,
      },
    };
    if (isDevelopment) {
      config.devtool = 'cheap-source-map';
    }
    config.output.filename = 'js/[name].js'
  },

  chainWebpack: (config) => {
    config.resolve.alias.set('vue', path.resolve('./node_modules/vue'));
    config.resolve.alias.set('vuex', path.resolve('./node_modules/vuex'));
    config.resolve.alias.set(
      '@ledgerhq/devices/hid-framing',
      path.resolve('./node_modules/@ledgerhq/devices/lib-es/hid-framing')
    );

    const svgRule = config.module.rule('svg');

    svgRule.uses.clear();

    svgRule
      .oneOf('inline')
      .resourceQuery(/inline/)
      .use('svg-url-loader')
      .loader('svg-url-loader')
      .end()
      .end()
      .oneOf('external')
      .use('babel-loader')
      .loader('babel-loader')
      .end()
      .use('vue-svg-loader')
      .loader('vue-svg-loader')
      .options({
        svgo: {
          plugins: [{ removeViewBox: false }, { removeDimensions: true }],
        },
      });

    config.module
      .rule('html')
      .test(/\.html$/)
      .use('raw-loader')
      .loader('raw-loader');

    config.module
      .rule('supportChaining')
      .test(/\.js$/)
      .include.add(path.resolve('/home/chaunguyen/projects/yacoin/yaswap/wallet-core/node_modules/bitcoinselect'))
      .add(path.resolve('/home/chaunguyen/projects/yacoin/yaswap/wallet-core/node_modules/@yaswap/litecoinselect'))
      //.include.add(path.resolve('node_modules/bitcoinselect'))
      //.add(path.resolve('node_modules/@yaswap/litecoinselect'))
      .end()
      .use('babel-loader')
      .loader('babel-loader')
      .tap((options) => ({ ...options, plugins: ['@babel/plugin-proposal-optional-chaining'] }))
      .end();

    config.module
      .rule('supportClassProperties')
      .test(/\.js$/)
      .include.add(path.resolve('node_modules/ecpair'))
      .end()
      .use('babel-loader')
      .loader('babel-loader')
      .tap((options) => ({ ...options, plugins: ['@babel/plugin-proposal-class-properties'] }))
      .end();
  },

  pages: {
    popup: {
      template: 'public/index.html',
      entry: './src/main.js',
      title: 'Yaswap Wallet',
    },
    standalone: {
      template: 'public/index.html',
      entry: './src/main.js',
      title: 'Yaswap Wallet',
      filename: 'index.html',
    },
  },
};
