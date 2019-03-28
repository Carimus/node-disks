workflow "Release" {
  on = "push"
  resolves = ["semantic-release"]
}

action "semantic-release" {
  uses = "actions/npm@59b64a598378f31e49cb76f27d6f3312b582f680"
  secrets = ["GITHUB_TOKEN", "NPM_TOKEN"]
  args = "run release"
}
