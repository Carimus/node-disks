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
    exec('rm -rf ./dist && tsc', puts);
} else if (os.type() === 'Darwin') {
    exec('rm -rf ./dist && tsc', puts);
} else if (os.type() === 'Windows_NT') {
    if (fs.existsSync('dist')) {
        exec('rd /s /q dist && tsc', puts);
    } else {
        exec('tsc', puts);
    }
} else {
    throw new Error('Unsupported OS found: ' + os.type());
}
