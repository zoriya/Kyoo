nix-channel --update
# Make C++ runtime libraries visible to sharp at runtime
export LD_LIBRARY_PATH=$(dirname $(find /nix/store -name libstdc++.so.6 | head -n1)):$LD_LIBRARY_PATH
nix-shell
bun install --production
bash --norc

## commands to build & start
# bun build --compile --minify-whitespace --minify-syntax --target bun --outfile server ./src/index.ts
# ./server

## OR
# bun dev