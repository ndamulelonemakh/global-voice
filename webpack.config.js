const path = require('node:path');

module.exports = {
  entry: './background.js',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'background.bundle.js',
  },
  mode: 'production',
};
