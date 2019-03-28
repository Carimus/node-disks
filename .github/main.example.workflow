workflow "Test and Release" {
  on = "push"
  resolves = ["Test", "Release"]
}

action "Install" {
  uses = "nuxt/actions-yarn@node-10"
  args = "install"
}

action "Test" {
  needs = "Install"
  uses = "nuxt/actions-yarn@node-10"
  args = "test"
}

action "Master" {
  needs = "Test"
  uses = "actions/bin/filter@master"
  args = "branch master"
}

action "Release" {
  needs = "Master"
  uses = "nuxt/actions-yarn@node-10"
  secrets = ["GH_TOKEN", "NPM_TOKEN"]
  args = "release"
}
