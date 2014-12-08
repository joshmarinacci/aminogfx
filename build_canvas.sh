rm -rf build/canvas/bundle.js

node compile.js src/constraint-parser.ometajs  > parser_compiled.js

browserify \
    -d \
    --verbose \
    -r ./browser_main.js:aminogfx \
    -r ./parser_compiled.js:parser \
    -i './aminonative.node' \
    -u './aminonative.node' \
    -o build/canvas/bundle.js
echo "built!"
