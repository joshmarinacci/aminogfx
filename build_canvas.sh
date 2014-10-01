rm -rf build/canvas/bundle.js

browserify \
    -d \
    --verbose \
    --exclude aminonative.node \
    -r ./src/canvasamino.js:canvasamino \
    -r ./src/amino.js:amino \
    -o build/canvas/bundle.js
echo "built!"
