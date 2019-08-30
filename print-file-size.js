const fs = require("fs").promises;
const fileSize = require("file-size");
const gzipSize = require("gzip-size");
const globWithCallbacks = require("glob");
const { promisify } = require("util");
const glob = promisify(globWithCallbacks);
var UglifyJS = require("uglify-es");

const run = async folder => {
  const files = await glob(`${folder}/**.js`);
  const fileStats = await Promise.all(
    files.map(async fileName => {
      const fileStats = await fs.stat(fileName);
      const fileContent = await fs.readFile(fileName, "utf8");
      const minifyResult = UglifyJS.minify(fileContent);
      const minifiedContent = minifyResult.code;
      return {
        fileSize: fileStats.size,
        minifiedSize: minifiedContent.length,
        gzipSize: await gzipSize(minifiedContent),
      };
    })
  );
  const printTotal = async (f, key) =>
    (await fileSize(
      fileStats.map(stats => stats[key]).reduce((a, b) => a + b)
    )).human();
  console.log(folder, {
    files,
    fileSizeTotal: await printTotal(fileStats, "fileSize"),
    minifiedSizeTotal: await printTotal(fileStats, "minifiedSize"),
    gzipSizeTotal: await printTotal(fileStats, "gzipSize"),
  });
};

run("es6");
run("es5");
