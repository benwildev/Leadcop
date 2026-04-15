#!/bin/sh
export PATH="/nix/store/9cyx2v23dip6p9q98384k9v06c96qskb-nodejs-24.13.0/bin:/nix/store/61lr9izijvg30pcribjdxgjxvh3bysp4-pnpm-10.26.1/bin:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin"
PORT=8080 pnpm --filter @workspace/api-server dev &
PORT=5173 BASE_PATH=/ pnpm --filter @workspace/tempshield dev
