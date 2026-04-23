const Module = require('node:module');

const originalLoad = Module._load;

Module._load = function patchedLoad(request, parent) {
  if (request === 'webpackbar' && parent?.filename) {
    const requireFromParent = Module.createRequire(parent.filename);
    const webpack = requireFromParent('webpack');

    return class WebpackBarCompat extends webpack.ProgressPlugin {
      constructor() {
        super({ activeModules: true });
      }
    };
  }

  return originalLoad.apply(this, arguments);
};

void import('@docusaurus/core/bin/docusaurus.mjs');
