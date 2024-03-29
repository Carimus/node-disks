const os = require('os');
const exec = require('child_process').exec;
const fs = require('fs');

function puts(error, stdout, stderr) {
    if (stdout || error || stderr) {
        console.log(stdout, error, stderr);
    }
}

console.log('Start build [' + os.type() + ']...');

// Run command depending on the OS
if (os.type() === 'Linux') {
    exec(
        "echo 'unsafe-perm = true' > ./.npmrc && yarn run semantic-release && rm -rf ./.npmrc",
        puts,
    );
} else if (os.type() === 'Darwin') {
    exec(
        "echo 'unsafe-perm = true' > ./.npmrc && yarn run semantic-release && rm -rf ./.npmrc",
        puts,
    );
} else if (os.type() === 'Windows_NT') {
    exec(
        "echo 'unsafe-perm = true' > npmrc && yarn run semantic-release && del npmrc",
        puts,
    );
} else {
    throw new Error('Unsupported OS found: ' + os.type());
}
