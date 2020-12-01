// convert all geohashed comunidades autónomas back to geojson feature collection

const fs = require('fs');
const { stdout } = require('process');
const polygonToGeohash = require('geohash-poly');
const compressHash = require('geohash-compressor1');
const { geohashesToFeatureCollection } = require('geohash-to-geojson');

// const dataDir = './data/comunidades-autónomas';
// const destDir = './out/comunidades-autónomas';
// const minPrecision = 4;
// const maxPrecision = 7;
const dataDir = './data/provincias';
const destDir = './out/provincias';
const minPrecision = 4;
const maxPrecision = 8;

// const getName = properties => properties.comunidade_autonoma;
const getName = properties => `${properties.provincia} (${properties.ccaa})`;

// const getDirName = properties =>
//   `${properties.codigo}-`
//   + `${properties.comunidade_autonoma.split(' ').map(x => x[0].toUpperCase() + x.slice(1)).join('')}`;
const getDirName = properties =>
  `${properties.codigo}-`
  + `${properties.provincia.split(' ').map(x => x[0].toUpperCase() + x.slice(1)).join('')}`;

const mkdir = dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir);
  }
};

const convertToGeoHash = (geometry, precision) => new Promise((resolve, reject) => {
  polygonToGeohash({coords: geometry.coordinates, precision: precision}, (err, hashes) => {
    if (err) {
      reject(err); return;
    }
    resolve(hashes);
  });
});

const getFileSizeInKb = path => {
  const stats = fs.statSync(path);
  return stats.size / 1024;
};

(async() => {
  const dataPaths = fs.readdirSync(dataDir).map(p => `${dataDir}/${p}`);
  const statsPath = `${destDir}/stats.csv`;
  mkdir(destDir);
  fs.writeFileSync(statsPath,
    'PRECISION,CODIGO,NAME,FILESIZE_KB_GEOJSON,FILESIZE_KB_UGEOHASH,FILESIZE_KB_CGEOHASH,'
      + 'LENGTH_UGEOHASH,LENGTH_CGEOHASH,COMPRESSION_PERCENTAGE,'
      + 'TIME_SEC_HASH,TIME_SEC_COMPRESS\n');
  for (let precision = minPrecision; precision <= maxPrecision; precision++) {
    console.log(`# PRECISION = ${precision} #`);
    const precisionDir = `${destDir}/precision-${precision}`;
    mkdir(precisionDir);

    for (let p = 0; p < dataPaths.length; p++) {
      const dataPath = dataPaths[p];
      const featureCollection = JSON.parse(fs.readFileSync(dataPath));
      const properties = featureCollection.features[0].properties;
      console.log(`  ${dataPath}: ${getName(properties)}`);

      if (!featureCollection.features[0].geometry) {
        console.log('    SKIPPED');
        continue;
      }

      stdout.write('    > Convert to geohash...');
      let timer = new Date();
      const hashes = await convertToGeoHash(featureCollection.features[0].geometry, precision);
      let hashTime = ((new Date()).getTime() - timer.getTime()) / 1000;
      console.log(`OK (${hashes.length} hashes in ${hashTime} secs)`);

      stdout.write('    > Compressing geohashes...');
      timer = new Date();
      const compressedHashes = compressHash(hashes);
      let compressTime = ((new Date()).getTime() - timer.getTime()) / 1000;
      let percentage = 100 - (compressedHashes.length / hashes.length * 100);
      console.log(`OK (${hashes.length} to ${compressedHashes.length} hashes (${percentage}%) in ${compressTime} secs)`);

      console.log('    > Writing output...');
      let subDir = `${precisionDir}/${getDirName(properties)}`;
      mkdir(subDir);
      console.log('      > Original geojson...');
      const geojsonPath = `${subDir}/original.geojson`;
      fs.writeFileSync(geojsonPath, JSON.stringify(featureCollection));
      console.log('      > Uncompressed geohases json...');
      const ugeohashesPath = `${subDir}/geohashes.json`;
      fs.writeFileSync(ugeohashesPath, JSON.stringify(hashes));
      console.log('      > Compressed geohases json...');
      const cgeohashesPath = `${subDir}/geohashes-compressed.json`;
      fs.writeFileSync(cgeohashesPath, JSON.stringify(compressedHashes));
      console.log('      > Compressed geohases geojson...');
      fs.writeFileSync(`${subDir}/geohashes-compressed.geojson`, JSON.stringify(geohashesToFeatureCollection(compressedHashes)));
      console.log('    > OK');

      // PRECISION,CODIGO,FILESIZE_KB_GEOJSON,FILESIZE_KB_UGEOHASH,FILESIZE_KB_CGEOHASH,
      // LENGTH_UGEOHASH,LENGTH_CGEOHASH,COMPRESSION_PERCENTAGE,
      // TIME_SEC_HASH,TIME_SEC_COMPRESS
      fs.appendFileSync(statsPath, `${precision},${properties.codigo},"${getName(properties)}",`
        + `${getFileSizeInKb(geojsonPath)},${getFileSizeInKb(ugeohashesPath)},${getFileSizeInKb(cgeohashesPath)},`
        + `${hashes.length},${compressedHashes.length},${percentage},${hashTime},${compressTime}\n`);
    }
  }
})();
