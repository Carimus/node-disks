#!/usr/bin/env bash

# Update the package.json to place the build command in prepublishOnly instead of in postinstall
json -I -f package.json -e 'this.scripts.prepublishOnly = "yarn run build"; delete this.scripts.postinstall;'

# Pretty up the package.json so it's still consistent with the codebase's code style
pretty --write package.json
