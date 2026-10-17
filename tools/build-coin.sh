#!/usr/bin/env bash
# Optional: rebuild js/vendor/starkcoin.js (three.js r186 + tools/src/coin.js). The site itself needs no build step.
# Usage: cd tools && npm i esbuild three@0.186.1 && ./build-coin.sh
set -e
NODE_PATH="$PWD/node_modules" npx esbuild src/coin.js --bundle --minify --format=iife --legal-comments=none --outfile=../js/vendor/starkcoin.js
