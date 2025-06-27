// const slsw = require('serverless-webpack');
// const nodeExternals = require('webpack-node-externals');

// module.exports = {
//   entry: slsw.lib.entries,
//   target: 'node',
//   // Don’t bundle node_modules except allowlisted ones
//   externals: [nodeExternals({ allowlist: ['serverless-http'] })],
//   mode: slsw.lib.webpack.isLocal ? 'development' : 'production',
//   module: {
//     rules: [
//       {
//         test: /\.js$/,
//         use: 'babel-loader',
//         exclude: /node_modules/,
//       },
//     ],
//   },
//   resolve: {
//     extensions: ['.js', '.json'],
//   },
//   optimization: {
//     // Optional: keeps handler names readable
//     minimize: false,
//   },
// };



const slsw = require('serverless-webpack');
const nodeExternals = require('webpack-node-externals');

module.exports = {
  entry: slsw.lib.entries,
  target: 'node',
   externals: [nodeExternals({ allowlist: ['serverless-http'] })],
  module: {
    rules: [],
  },
  resolve: {
    extensions: ['.js', '.json'],
  },
};
