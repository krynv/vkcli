#!/usr/bin/env node
const chalk = require("chalk");
const figlet = require("figlet");
const exec = require("child_process").exec;
const ora = require("ora");
const fs = require("fs");
const https = require("https");

// create an input interface
const readline = require("readline").createInterface({
  input: process.stdin,
  output: process.stdout
});

const spinner = ora();

function execShellCommand(cmd) {
  return new Promise((resolve, reject) => {
    exec(cmd, (error, stdout, stderr) => {
      if (error) {
        console.warn(error);
        console.warn(stdout);
        console.warn(stderr);
      }
      resolve(stdout ? stdout : stderr);
    });
  });
}

// 1. clear the console
process.stdout.write("\x1Bc");

// 2. print some fancy text
console.log(
  chalk.green(figlet.textSync("VKs CLI Tool", { horizontalLayout: "full" }))
);

// 3. ask user for a project name
readline.question(`What is your project name? `, name => {
  console.log(`\nCreating a React project named: ${name} ...`);

  spinner.start();
  // 4. Create a create-react-app project
  execShellCommand(`npx create-react-app ${name}`).then(() => {
    spinner.stop();
    console.log(`\nProject ${name} created...`);

    // 5. Remove the existing .gitignore file from that project folder
    console.log(`\nRemoving old ${name}/.gitignore file...`);
    spinner.start();
    fs.unlink(`./${name}/.gitignore`, err => {
      if (err) {
        console.error(err);
        return;
      }

      //file removed
      spinner.stop();

      // 6. Place new .gitignore file in that project directory
      console.log(`\nPlacing new gitignore file...`);
      spinner.start();

      let newGitignore = fs.createWriteStream(`./${name}/.gitignore`); // cannot declare anywhere else as the folder has not been created before this point
      https
        .get(
          `https://raw.githubusercontent.com/github/gitignore/master/Node.gitignore`,
          res => {
            res.pipe(newGitignore);
            newGitignore.on("finish", () => {
              newGitignore.close();
              spinner.stop();
              console.log(`\nNew ${name}/.gitignore created...`);
              readline.close();
              process.exit();
            });
          }
        )
        .on("error", err => {
          fs.unlink(newGitignore);
          console.error(err);
          process.exit();
        });
    });
  });

  readline.close();
});
