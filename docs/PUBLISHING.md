# Publishing to NPM

This template includes [`semantic-release`](https://github.com/semantic-release/semantic-release)
to automate the release of builds.

## Manually

You can release manually if you're github user has push access to the repository and your npm
user has publish access to the package.

### Setup

1. Run `npm login` to ensure you're logged in
2. Generate [a personal access token](https://help.github.com/articles/creating-a-personal-access-token-for-the-command-line)
   and run `export GH_TOKEN="your-personal-access-token"`, replacing `your-personal-access-token`
   with the token you generated. Not that you can place this command in your `.bashrc` or `.zshrc`
   to you don't have to run it each time you want to publish.

### Publish

Simply run:

```
yarn run release
```

## Automated (CI)

It's recommended to setup a CI system to handle automatically pushing out builds.

### Option A: Using GitHub Actions

1. Obtain the `carimus-deploy-bot` GitHub Personal Access Token and NPM Token and make note of
   these.
2. Ensure the repository exists on GitHub
3. Navigate to the repository on GitHub and update the settings:
    1. Under Settings > Secrets add the following secrets:
        - `GH_TOKEN`: the `carimus-deploy-bot` GitHub Personal Access Token
        - `NPM_TOKEN`: the `carimus-deploy-bot` NPM Token
    2. Under Settings > Collaborators & teams add `carimus-deploy-bot` as a collaborator with "Write" access.
4. Rename `.github/main.example.workflow` to `.github/main.workflow`

That's it! Pushes to `master` will trigger your build and release (only releasing if there were
any applicable changes according to the commit analysis). Pushes to all other branches should just
run tests.

### Option B: Using BitBucket Pipelines

**TODO**
