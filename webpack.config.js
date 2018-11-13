
// . o ( js module decisions ) o .
// 
// 1) legacy "put me in a global" modules
//
//    generally undesirable
//
// 2) es modules (2018 november)
//
//    es module support in chrome 70 often results in crashed tabs
//    the dev tools immediately detach and there is no error message
//    the syntax is also more limited and quirky than the same syntax with webpack
//
// 3) webpack modules 
//
//    cannot support --allow-natives-syntax due to acorn js parser not allowing %-prefixed functions (standard js parse)
//    but webpack modules are still what i should use if i don't want in-browser (read:buggy) modules
//    
//    best design is to probably just use a separate legacy (global namespace) module to put %IsSmi into like v8.IsSmi or whatever
//
// 4) other
//
//    maybe rollup or something, but webpack is the king so I should try to make it work
//
// conclusion: use webpack and non-bundled global library for v8 native calls (m_v8.js)

// . o ( should i use babel ) o .
//
// i do not need it for language features! (webpack gives me modules)
// i DO need it for performance, IF THERE IS ANY
// some people say babel makes it harder for the jit
// other people say it makes it easier
//   https://codemix.com/blog/why-babel-matters/
// 
// i can probably switch it on/off from time to time to compare
//
// conclusion: currently unknown, hopefully some interesting babel plugins for me, but we'll see

const path = require('path');

module.exports = {
  // mode default is "production"
  mode: 'development',
  entry: "./src/index.js",
  output: {
    path: path.resolve(__dirname, "dist"),
    filename: "bundle.js",
    libraryTarget: 'window'
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /(node_modules)/,
        loader: "babel-loader",
      }
    ]
  }
};