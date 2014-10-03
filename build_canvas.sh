rm -rf build/canvas/bundle.js

browserify \
    -d \
    --verbose \
    -r ./browser_main.js:aminogfx \
    -i './aminonative.node' \
    -u './aminonative.node' \
    --ignore-missing \
    -o build/canvas/bundle.js
echo "built!"
