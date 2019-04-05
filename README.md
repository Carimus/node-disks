# Carimus TypeScript Node Package Template

This template repo is a starter for a typescript node package intended to be distributed as a
re-usable library on npm.

## Features

-   Jest for unit testing
-   Precommit linting
-   Precommit formatting via [Prettier](https://prettier.io)
-   Prepublish TypeScript build for distribution on npm
-   Watch script for rebuilding on file changes (useful with `yarn link`; see development instructions)
-   Ready-to-use GitHub Actions workflow for releasing on push to `master`

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
3. Update the install command appropriately
4. Add additional docs about runtime prereqs, usage, examples, etc.

Customize the `package.json` for this project:

1. Update the `name` to be the final published name of this package, i.e. `@carimus/node-foo-package`
2. Update the `description` appropriately.
3. Update the `repository` to point the project repository.

**Note:** Don't change the `version`, it's automatically managed by `semantic-release`.

Additionally the following customization steps are optional but recommended:

1. Delete the `docs/` directory. The developer looking for more information should find their way
   here.

Then just commit those customizations and push the code up to the project repo:

```
git add -A
git commit -m 'inital setup for project'
git push -u origin master
```

## Documentation

-   [Development](./docs/DEVELOPMENT.md)
-   [Publishing to NPM](./docs/PUBLISHING.md)
-   [Commit Message Format](./docs/COMMITS.md)
-   Linting and Prettier **[TODO]**
-   Usage with WebStorm **[TODO]**
-   Pulling upstream changes from template **[TODO]**

## TODOs

-   [ ] Write a script to automate README and package.json customizations
-   [ ] More documentation

---

# PROJECT NAME

PROJECT DESCRIPTION

## Getting Started

Install the package in your project:

```
yarn add @carimus/PROJECT-PACKAGE-NAME-HERE
```

Or if you're using `npm`:

```
npm install --save @carimus/PROJECT-PACKAGE-NAME-HERE
```

## Usage

TODO

## Development

This project is based on the `carimus-node-ts-package-template`. Check out the
[README and docs there](https://bitbucket.org/Carimus/carimus-node-ts-package-template/src/master/README.md)
for more up to date information on the development process and tools available.
