// modules
const fs = require("fs");
// constants
const basePath = "./target/idl";
const frontendIdlDir = "../Ratio-new-frontend/src/idl";

// create the IDL directory if it doesnt exist
!fs.existsSync(frontendIdlDir) &&
  fs.mkdirSync(frontendIdlDir, { recursive: true });

// get the array of IDL files
const idl_files = fs.readdirSync(basePath);

// iterate and write these files to the react app
idl_files.forEach((filename) => {
  const origFilePath = `${basePath}/${filename}`;
  const file = require(origFilePath);
  const fileNoExtn = filename.split(".json")[0];

  const destFilePath = `${frontendIdlDir}/${fileNoExtn}_idl.json`;
  const outputFile = JSON.stringify(file, null, 2);
  fs.writeFileSync(destFilePath, outputFile);
});
