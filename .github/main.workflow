workflow "Test and Release" {
  on = "push"
  resolves = ["Install", "Test", "Release"]
}

action "Install" {
  uses = "nuxt/actions-yarn@97f98f200b7fd42a001f88e7bdfc14d64d695ab2"
  args = "install"
}

action "Test" {
  needs = "Install"
  uses = "nuxt/actions-yarn@97f98f200b7fd42a001f88e7bdfc14d64d695ab2"
  args = "test"
}

action "Release" {
  needs = "Test"
  uses = "nuxt/actions-yarn@97f98f200b7fd42a001f88e7bdfc14d64d695ab2"
  secrets = ["GITHUB_TOKEN", "NPM_TOKEN"]
  args = "release"
}
