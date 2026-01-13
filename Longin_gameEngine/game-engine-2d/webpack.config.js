const path = require('path');

module.exports = {
  entry: './src/main.ts',
  devtool: 'inline-source-map',
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        loader: 'ts-loader',
        options: {
          configFile: 'tsconfig.client.json'
        },
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
    fallback: {
      "fs": false,
      "path": false,
      "os": false,
      "http": false,
      "https": false,
      "util": false,
      "zlib": false,
      "buffer": false,
      "stream": false,
      "crypto": false,
      "url": false,
      "net": false,
      "tls": false,
      "assert": false
    },
    alias: {
      'winston': false,
      'dotenv': false
    }
  },
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'dist/public'),
  },
  mode: 'development', // Change to 'production' for prod builds
};
