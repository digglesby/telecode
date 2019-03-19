const path = require('path');
const webpack = require('webpack');

module.exports = {
  entry: ['./src/Meta/server_entry.js'],
  output: {
    path: path.resolve(__dirname, '../bundle/'),
    filename: 'server.js',
    libraryTarget: "umd"
  },
  module: {
    rules: [
      { test: /\.txt$/, use: 'raw-loader' },
			{ test: /\.css$/, loader: "style!css" },
      { test: /\.json$/, loader: 'json-loader' },
      {
        test: /\.js$/,
        exclude: /node_modules/,
        loaders: ["babel-loader"],
      }
    ]
  },
  plugins: []
};
