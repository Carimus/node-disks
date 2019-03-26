# Carimus TypeScript Node Package Template

This template repo is a starter for a typescript node package intended to be distributed as a
re-usable library on npm.

## Features

 - Jest for unit testing
 - Precommit linting
 - Precommit formatting via [Prettier](https://prettier.io)
 - Prepublish TypeScript build for distribution on npm

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
2. Update the `version` to start at `0.1.0` or whatever makes sense for the project
3. Update the description appropriately.

Then just commit those customizations and push the code up to the project repo:

```
git add -A
git commit -m 'inital setup for project'
git push -u origin master
``` 

## Documentation

 - Publishing the package **[TODO]**
 - Linting and Prettier **[TODO]**
 - WebStorm + Eslint + Prettier **[TODO]**

## TODOs

 - [ ] Write a script to automate README and package.json customizations
 - [ ] Introduce `semantic-versioning` tool
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
