# Commit Message Format

The format used is the Angular format, also referred to as the "Conventional Changelog"
format.

It's described briefly by `semantic-release` [here](https://github.com/semantic-release/semantic-release#commit-message-format)
and in more detail by the Angular docs [here](https://github.com/angular/angular.js/blob/master/DEVELOPERS.md#-git-commit-guidelines).

## Automated

Simply run

```
yarn run commit
```

To use `commitizen` to generate your commit message via friendly prompts.

## Summary

In brief, commits should use messages following the format:

```
<type>(<scope>): <subject>
<BLANK LINE>
<body>
<BLANK LINE>
<footer>
```

Where:

-   `<type>` is **required** and must be one of `feat`, `fix`, `docs`, `style`, `refactor`, `perf`,
    `test`, `chore`, or `revert`
-   `<scope>` is **optional** and is the service or component modified by the commit. `*` can be
    used to indicate more than one scope was modified.
-   `<subject>` is **required** and must be a (preferably less than 50 characters) summary of the
    commit changes and should be in the present, imperative tense: "change" not "changed" nor
    "changes"
-   `<body>` is **optional** and should describe the motivation for the changes and how the new
    behaviour is different from the previous behaviour if provided.
-   `<footer>` is **optional** and should include information about breaking changes if applicable.
    This is also where issue mentions and other trigger keywords / tags should be placed.

If a change introduces backwards-incompatible behaviour it must include `BREAKING CHANGE:` in the
footer and a description of what the breaking change was and why. This will cause a major version
bump.
