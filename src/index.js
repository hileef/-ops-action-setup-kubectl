const http = require("http");
const fs = require("fs");
const util = require("util");
const request = require('request');

const core = require('@actions/core');
// const github = require('@actions/github');

function download(url, dest) {
    return new Promise((resolve, reject) => {
        const file = fs.createWriteStream(dest, { flags: "wx" });

        const req = request.get(url, resp => {
            if (resp.statusCode === 200) {
                resp.pipe(file);
            } else {
                file.close();
                fs.unlink(dest, () => {}); // Delete temp file
                reject(`Server responded with ${resp.statusCode}: ${resp.statusMessage}`);
            }
        });

        req.on("error", err => {
            file.close();
            fs.unlink(dest, () => {}); // Delete temp file
            reject(err.message);
        });

        file.on("finish", () => {
            resolve();
        });

        file.on("error", err => {
            file.close();

            if (err.code === "EEXIST") {
                reject("File already exists");
            } else {
                fs.unlink(dest, () => {}); // Delete temp file
                reject(err.message);
            }
        });
    });
}

try {
    const kubeVersion = core.getInput('version');
    console.log(`Selected kubectl version is : ${kubeVersion}`);

    const kubeURL = "https://storage.googleapis.com/kubernetes-release/release/%s/bin/linux/amd64/kubectl"
    const destPath = "/usr/local/bin/kubectl"
    const finalURL = util.format(kubeURL, kubeVersion)
    const p = download(finalURL, destPath)
    p.then(function (_) {
        fs.chmodSync(destPath, '777');
        console.log(`Downloaded kubectl version ${kubeVersion} !`);

    }).catch(err => {
        core.setFailed(err.message);
    })

} catch (error) {
    core.setFailed(error.message);
}