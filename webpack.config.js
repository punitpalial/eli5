import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import CopyPlugin from 'copy-webpack-plugin';
// 
// // Get the filename and directory name in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// export default {
//   entry: {
//     background: './test2.js'
//   },
//   output: {
//     filename: './bundle.js',
//     path: path.resolve(__dirname, 'dist'),
//   },
//   mode: 'production',
//   plugins: [
//     new CopyPlugin({
//       patterns: [
//         { from: "./popup.html", to: "./popup.html" },
//         { from: "./manifest.json", to: "./manifest.json" },
//       ],
//     }),
//   ],
//   mode: 'development',
// };


//import { watch } from 'fs/promises';

// const path = require('path');

export default {
  entry: {
    ServiceWorker: './test3.js'
  },
  output: {
    filename: '[name].bundle.js',
    path: path.resolve(__dirname, 'dist')
  },
  mode: 'development',
  watch: true,
  plugins: [
    new CopyPlugin({
      patterns: [
        { from: "./popup.html", to: "./popup.html" },
        { from: "./manifest.json", to: "./manifest.json" },
      ],
    }),
  ],

};