const path = require('path');
const webpack = require('webpack');

module.exports = {
  entry: ['./src/Meta/client_entry.js','webpack-hot-middleware/client'],
  output: {
    path: path.resolve(__dirname, '../assets/bundle/'),
    publicPath: '/assets/bundle/',
    filename: 'client.js'
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
  plugins: [
    // OccurenceOrderPlugin is needed for webpack 1.x only
    new webpack.HotModuleReplacementPlugin(),
    // Use NoErrorsPlugin for webpack 1.x
    new webpack.NoEmitOnErrorsPlugin()
  ]
};
