# Carimus TypeScript Node Package Template

This template repo is a starter for a typescript node package intended to be distributed as a
re-usable library on npm.

## Features

 - Jest for unit testing
 - Precommit linting
 - Precommit formatting via [Prettier](https://prettier.io)
 - Prepublish TypeScript build for distribution on npm
 - Ready-to-use GitHub Actions workflow for releasing on push to `master`

## Using this Template

First, create a new repo for your project on GitHub (public) or BitBucket (private). Take note
of its remote URI.

Then clone this template repo to a directory named after your project (using `upstream` as the
name of the remote for this repo):

```
git clone --origin upstream git@bitbucket.org:Carimus/carimus-node-ts-package-template.git your-project-name
cd your-project-name
```

Customize the `README.md` for this project:

1. Remove the horizontal rule below
2. Update the `PROJECT NAME` and `PROJECT DESCRIPTION` appropriately
3. (Optional, Recommended), update the README repo URI below under "Next Steps" and replace
   `/master/` in the URI with `/<commit-sha>/` where `<commit-sha>` is the most recent commit
   of the template repo. This locks that link into a specific version of the docs.

Customize the `package.json` for this project:

1. Update the `name` to be the final published name of this package, i.e. `@carimus/node-foo-package`
2. Update the `description` appropriately.
3. Update the `repository` to point the project repository.

**Note:** Don't change the `version`, it's automatically managed by `semantic-release`.

Other cleanup:

1. Delete the `./docs` directory. These docs are maintained in the template. The README links to
   them below.

Then just commit those customizations and push the code up to the project repo:

```
git add -A
git commit -m 'inital setup for project'
git push -u origin master
``` 

## Documentation

 - [Publishing to NPM](./docs/PUBLISHING.md)
 - [Commit Message Format](./docs/COMMITS.md)
 - Linting and Prettier **[TODO]**
 - Usage with WebStorm **[TODO]**
 - Pulling upstream changes from template **[TODO]**

## TODOs

 - [ ] Write a script to automate README and package.json customizations
 - [ ] More documentation

----------------------------------------

# PROJECT NAME

PROJECT DESCRIPTION

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
