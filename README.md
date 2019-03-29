# Node Disks

An abstraction for local/remote disks for node inspired by The League of Extraordinary Packages's FlySystem.

## Prerequisites

 - Node >= 10
 - [Yarn](https://yarnpkg.com)

## Getting Started

Simply run

```
yarn
```

to install all of the necessary dependencies and tools.

## Commit Messages

This package uses [`semantic-release`](https://github.com/semantic-release/semantic-release) to
automatically version and publish to NPM. Version numbers are automatically generated based on the
commit messages since the previous release.

**The [commit message format](./docs/COMMITS.md) must be followed for this process to work.**

Fortunately, I've got your back. Simply run

```
yarn run commit
```

To use `commitizen` to generate your commit message via friendly prompts.

Commit message format is enforced using [`commitlint`](https://conventional-changelog.github.io/commitlint).

## Next Steps

This project is based on the `carimus-node-ts-package-template`. Check out the
[README and docs there](https://bitbucket.org/Carimus/carimus-node-ts-package-template/src/master/README.md)
for more up to date information on the development process and tools available.

## Important Note For WebStorm Users!

[There's a bug](https://youtrack.jetbrains.com/issue/WEB-36988) in the stable version of WebStorm
as of March 2019 that causes the eslint inspection to not pick up `ts` files. Instructions to fix
were shared [here](https://intellij-support.jetbrains.com/hc/en-us/community/posts/115000225170/comments/360000332879).
To summarize:

1. Navigate to Help > Search
2. Search for "Registry"
3. Click/select "Registry..."
4. Scroll down to `eslint.additional.file.extensions`
5. Set its value to `js,jsx,ts,tsx`
6. If necessary, do File > Invalidate Caches / Restart 

## TODO

- [ ] Cache disks in a manager instance once they're loaded by name
- [ ] Tests
- [ ] Docs (for now check out the well documented source code)
- [ ] Don't rely on `fs.readdir`'s `withFileTypes` so as to support all node 10 versions
