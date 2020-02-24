#!/usr/bin/env node
const chalk = require("chalk");
const figlet = require("figlet");
const exec = require("child_process").exec;
const Ora = require("ora");
const fs = require("fs");
const https = require("https");

// create an input interface
const readline = require("readline").createInterface({
  input: process.stdin,
  output: process.stdout
});

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
  console.log(`\n`); // add a space
  let firstSpinner = new Ora(
    `Creating a new React project named: ${name} ... this may take a while\n`
  );
  firstSpinner.start();
  // 4. Create a create-react-app project
  execShellCommand(`npx create-react-app ${name}`).then(() => {
    firstSpinner.succeed();
    console.log(`Project ${name} created!\n\n`);

    // 5. Remove the existing .gitignore file from that project folder
    let secondSpinner = new Ora(
      `Removing the original ${name}/.gitignore file...\n`
    );

    secondSpinner.start();

    fs.unlink(`./${name}/.gitignore`, err => {
      if (err) {
        console.error(err);
        return;
      }

      //file removed
      secondSpinner.succeed();
      console.log(`Original ${name}/.gitignore file removed!\n\n`);

      // 6. Place new .gitignore file in that project directory
      let thirdSpinner = new Ora(`Placing new .gitignore file...\n`);
      thirdSpinner.start();

      let newGitignore = fs.createWriteStream(`./${name}/.gitignore`); // cannot declare anywhere else as the folder has not been created before this point

      https
        .get(
          `https://raw.githubusercontent.com/github/gitignore/master/Node.gitignore`,
          res => {
            res.pipe(newGitignore);
            newGitignore.on("finish", () => {
              newGitignore.close();
              thirdSpinner.succeed();
              console.log(
                `New ${name}/.gitignore created!\n\n\nClosing CLI tool\n`
              );
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
