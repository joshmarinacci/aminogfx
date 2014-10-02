rm -rf build/canvas/bundle.js

browserify \
    -d \
    --verbose \
    -r ./src/canvasamino.js:canvasamino \
    -r ./src/amino.js:amino \
    -r ./src/primitives.js:primitives \
    -r ./src/aminoinput.js:aminoinput \
    -i './aminonative.node' \
    -u './aminonative.node' \
    --ignore-missing \
    -o build/canvas/bundle.js
echo "built!"
