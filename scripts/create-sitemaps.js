const https = require('https');
const fs = require('fs');
const zlib = require('zlib');
const msgpack = require('msgpack5')();
const os = require('os');
const path = require('path');

// Setup
const fileUrl = 'https://swami.wustl.edu/~jswami/chebi.msgpack.gz';
const tempDir = os.tmpdir();
const downloadPath = path.join(tempDir, 'chebi.msgpack.gz');
const unzipPath = path.join(tempDir, 'chebi.msgpack');
const parentDir = path.dirname(__dirname);
const targetDir = path.join(parentDir, "public", "sitemap");
const models = ["epoxidation", "quinone", "reactivity", "phase1", "ndealk", "ugt", "_"];
const sitemapUrlLimit = 50000;

// Functions
function downloadUnzipAndLoad(url) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(downloadPath);
    https.get(url, function(response) {
      response.pipe(file).on('finish', () => {
        console.log(`Unzipping ${downloadPath} to ${unzipPath}`);
        const gzip = zlib.createGunzip();
        const inp = fs.createReadStream(downloadPath);
        const out = fs.createWriteStream(unzipPath);
        inp.pipe(gzip).pipe(out).on('finish', () => {
          const data = fs.readFileSync(unzipPath);
          const decode = msgpack.decode;
          const loadedData = decode(data);
          resolve(loadedData);
        }).on('error', (err) => reject(err));
      });
    }).on('error', (err) => reject(err));
  });
}

function removeFile(filePath) {
  return new Promise((resolve, reject) => {
    fs.unlink(filePath, (err) => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
}

function getParamValues(data) {
  let smilesArray = [];

  // Get all smiles from lookup
  if (data["lookup"]) {
    Object.keys(data["lookup"]).forEach((key) => {
      smilesArray.push(key);
    });
  }

  // Get only unique values
  smilesArray = [...new Set(smilesArray)];

  return smilesArray;
}

function createSitemaps(smilesArray, modelsArray) {
  console.log(
    `Creating sitemaps: ` +
    `${smilesArray.length} param values, ` +
    `${modelsArray.length} models, ` +
    `${smilesArray.length * modelsArray.length} urls ` +
    `(${Math.ceil(smilesArray.length * modelsArray.length / sitemapUrlLimit)} files)`);
  let urlCount = 0;
  let fileCount = 0;
  let sitemap = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
  let sitemapFiles = [];
  let today = new Date().toISOString().split('T')[0];

  for (let smiles of smilesArray) {
    for (let model of modelsArray) {
      if (urlCount >= sitemapUrlLimit) {
        sitemap += '</urlset>\n';
        const fileName = `sitemap${fileCount+1}.xml`;
        const sitemapPath = path.join(targetDir, fileName);
        console.log("Writing sitemap: " + sitemapPath);
        fs.writeFileSync(sitemapPath, sitemap);
        sitemapFiles.push(fileName);
        fileCount++;
        urlCount = 0;
        sitemap = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
      }

      // Encode URI
      let url = `https://xenosite.org/${model}/${encodeURIComponent(smiles)}`;
      sitemap += `  <url>\n    <loc>${url}</loc>\n    <lastmod>${today}</lastmod>\n  </url>\n`;      urlCount++;
    }
  }

  sitemap += '</urlset>\n';
  const fileName = `sitemap${fileCount+1}.xml`;
  const sitemapPath = path.join(targetDir, fileName);
  console.log("Writing sitemap: " + sitemapPath);
  fs.writeFileSync(sitemapPath, sitemap);
  sitemapFiles.push(fileName);

  return sitemapFiles;
}

function createSitemapIndex(sitemapFiles) {
  console.log("Creating sitemap index");
  let sitemapIndex = '<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

  for (let sitemapFile of sitemapFiles) {
    let url = `https://xenosite.org/sitemap/${sitemapFile}`;
    sitemapIndex += `  <sitemap>\n    <loc>${url}</loc>\n  </sitemap>\n`;
  }

  sitemapIndex += '</sitemapindex>\n';
  
  let sitemapIndexPath = path.join(targetDir, 'sitemap_index.xml');
  fs.writeFileSync(sitemapIndexPath, sitemapIndex);

  return sitemapIndexPath;
}

function clearDirectory() {
  console.log(`Clearing ${targetDir}`);

  fs.readdir(targetDir, (err, files) => {
    if (err) throw err;

    for (const file of files) {
      fs.unlink(path.join(targetDir, file), err => {
        if (err) throw err;
      });
    }
  });
}

// Main
downloadUnzipAndLoad(fileUrl)
  .then((data) => {
    console.log(`Loaded records`);
    
    
    // Clear sitemap dir
    clearDirectory();
    
    // Get lookup values
    const smilesArray = getParamValues(data);

    // Create sitemap files
    const sitemapFiles = createSitemaps(smilesArray, models);

    // Create sitemap index
    const sitemapIndexPath = createSitemapIndex(sitemapFiles);
    console.log("Sitemap index created: " + sitemapIndexPath);

    removeFile(unzipPath)
      .then(() => console.log("File removed: " + unzipPath))
      .catch((error) => console.error('Error removing file:', error));

    removeFile(downloadPath)
      .then(() => console.log("File removed: " + downloadPath))
      .catch((error) => console.error('Error removing file:', error));
  })
  .catch((error) => console.error(error));

