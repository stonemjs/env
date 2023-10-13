const path = require('path')
const webpack = require('webpack')
const dotenv = require('dotenv')
const dotenvExpand = require('dotenv-expand')
const CopyPlugin = require("copy-webpack-plugin")
const { CleanWebpackPlugin } = require('clean-webpack-plugin')

let envPublic = {}
let envPrivate = {}

dotenv.config({ path: path.resolve(process.cwd(), '.env'), processEnv: envPrivate })
dotenv.config({ path: path.resolve(process.cwd(), '.env.public'), processEnv: envPublic })

if (envPrivate.error) { throw envPrivate.error }
if (envPublic.error) { throw envPublic.error }


envPrivate = dotenvExpand.expand({ ignoreProcessEnv: true, parsed: envPrivate }).parsed
envPublic = dotenvExpand.expand({ ignoreProcessEnv: true, parsed: envPublic }).parsed

envPublic = Object
  .entries(envPublic)
  .reduce((prev, [key, value]) => {
    if (!value) { value = envPrivate[key] }
    return Object.assign(prev, { [key]: value })
  }, {})

module.exports = {
  mode: 'development',
  entry: path.resolve(__dirname, './src/index.mjs'),
  devtool: 'inline-source-map',
  plugins: [
    new CleanWebpackPlugin(),
    new webpack.DefinePlugin({
      'process.__env__': JSON.stringify(envPublic)
    }),
    new CopyPlugin({
      patterns: [
        { from: './.env' },
        { from: './.env.public' },
      ],
    }),
  ],
  output: {
    libraryTarget: 'umd',
    filename: 'index.js',
    globalObject: 'this',
    library: 'StoneJSEnvExample',
    path: path.resolve(__dirname, 'dist'),
  },
  module: {
    rules: [
      {
        test: /\.m?js$/,
        exclude: /node_modules/,
        use: 'babel-loader',
      },
    ]
  }
}
