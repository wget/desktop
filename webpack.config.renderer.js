// Copyright (c) 2015-2016 Yuya Ochiai
// Copyright (c) 2016-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

/* eslint-disable import/no-commonjs */
'use strict';

const path = require('path');

const merge = require('webpack-merge');

const base = require('./webpack.config.base');

module.exports = merge(base, {
  entry: {
    index: './src/browser/index.jsx',
    settings: './src/browser/settings.jsx',
    updater: './src/browser/updater.jsx',
    'webview/mattermost': './src/browser/webview/mattermost.js',
  },
  output: {
    path: path.join(__dirname, 'src/browser'),
    publicPath: 'browser',
    filename: '[name]_bundle.js',
  },
  module: {
    rules: [{
      test: /\.(js|jsx)?$/,
      use: {
        loader: 'babel-loader',
      },
    }, {
      test: /\.css$/,
      use: [
        {loader: 'style-loader'},
        {loader: 'css-loader'},
      ],
    }, {
      test: /\.mp3$/,
      use: {
        loader: 'url-loader',
      },
    }],
  },
  node: {
    __filename: true,
    __dirname: true,
  },
  target: 'electron-renderer',
  devServer: {
    contentBase: path.join(__dirname, 'src'),
    inline: true,
    publicPath: '/browser/',
  },
});
