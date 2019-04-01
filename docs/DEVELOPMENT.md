# Development

## Prerequisites

-   Node >= 10
-   [Yarn](https://yarnpkg.com)

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

**The [commit message format](./COMMITS.md) must be followed for this process to work.**

Fortunately, I've got your back. Simply run

```
yarn run commit
```

To use `commitizen` to generate your commit message via friendly prompts. If your commit fails due
to the linter, etc. simply fix the errors then run the following to retry the commit:

```
yarn run commit --retry
```

Commit message format is enforced using [`commitlint`](https://conventional-changelog.github.io/commitlint).

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
