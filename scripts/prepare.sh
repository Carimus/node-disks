#!/usr/bin/env bash

set -e

# Update the package.json to remove prepack command.
json -I -f package.json -e 'delete this.scripts.prepack;'

# Pretty up the package.json so it's still consistent with the codebase's code style
prettier --write package.json

# Run the build to get ./dist output
yarn run build
