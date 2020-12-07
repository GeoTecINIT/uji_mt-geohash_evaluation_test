// convert all geohashed comunidades autónomas back to geojson feature collection

const fs = require('fs');
const { stdout } = require('process');
const polygonToGeohash = require('geohash-poly');
const compressHash = require('geohash-compression');
const { geohashesToFeatureCollection } = require('geohash-to-geojson');
const geohashTree = require('geohash-tree');
const wkx = require('wkx');

const dataDir = './data/comunidades-autónomas';
const destDir = './out/comunidades-autónomas';
const minPrecision = 4;
const maxPrecision = 7;
// const dataDir = './data/provincias';
// const destDir = './out/provincias';
// const minPrecision = 4;
// const maxPrecision = 8;

const getName = properties => properties.comunidade_autonoma;
// const getName = properties => `${properties.provincia} (${properties.ccaa})`;

const getDirName = properties =>
  `${properties.codigo}-`
  + `${properties.comunidade_autonoma.split(' ').map(x => x[0].toUpperCase() + x.slice(1)).join('')}`;
// const getDirName = properties =>
//   `${properties.codigo}-`
//   + `${properties.provincia.split(' ').map(x => x[0].toUpperCase() + x.slice(1)).join('')}`;

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
    'PRECISION,CODIGO,NAME,FILESIZE_KB_GEOJSON,FILESIZE_KB_WKB,'
      + 'FILESIZE_KB_UGEOHASH,FILESIZE_KB_CGEOHASH,FILESIZE_KB_GEOHASHTREE,'
      + 'LENGTH_UGEOHASH,LENGTH_CGEOHASH,'
      + 'TIME_SEC_HASH,TIME_SEC_COMPRESS,TIME_GEOHASHTREE\n');
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

      stdout.write('    > Make WKB...');
      const wkbSizeKb = wkx.Geometry.parseGeoJSON(featureCollection.features[0].geometry).toWkb().byteLength / 1024;
      console.log(`OK (size: ${wkbSizeKb.toFixed(2)} KBs)`);

      stdout.write('    > Convert to geohash...');
      let timer = new Date();
      const hashes = await convertToGeoHash(featureCollection.features[0].geometry, precision);
      const hashTime = ((new Date()).getTime() - timer.getTime()) / 1000;
      console.log(`OK (${hashes.length} hashes in ${hashTime.toFixed(2)} secs)`);

      stdout.write('    > Compressing geohashes...');
      timer = new Date();
      const compressedHashes = compressHash(hashes);
      const compressTime = ((new Date()).getTime() - timer.getTime()) / 1000;
      const percentage = 100 - (compressedHashes.length / hashes.length * 100);
      console.log(`OK (${hashes.length} to ${compressedHashes.length} hashes (${percentage.toFixed(2)}%) in ${compressTime.toFixed(2)} secs)`);

      stdout.write('    > Make geohash tree...');
      timer = new Date();
      const encodedTreeBinary = geohashTree.encodeBinary(compressedHashes, 'buffer');
      const treeTime = ((new Date()).getTime() - timer.getTime()) / 1000;
      const encodedTree = geohashTree.encode(compressedHashes, 'buffer');
      console.log(`OK (in ${treeTime.toFixed(2)} secs `
        + `with normal and binary difference of ${Math.abs(encodedTree.byteLength - encodedTreeBinary.byteLength)} bytes)`);

      console.log('    > Writing output...');
      let subDir = `${precisionDir}/${getDirName(properties)}`;
      mkdir(subDir);
      stdout.write('      > Original geojson...');
      const geojsonPath = `${subDir}/original.geojson`;
      fs.writeFileSync(geojsonPath, JSON.stringify(featureCollection));
      console.log(`OK (${getFileSizeInKb(geojsonPath).toFixed(2)} KBs)`)
      stdout.write('      > Uncompressed geohases json...');
      const ugeohashesPath = `${subDir}/geohashes.json`;
      fs.writeFileSync(ugeohashesPath, JSON.stringify(hashes));
      console.log(`OK (${getFileSizeInKb(ugeohashesPath).toFixed(2)} KBs)`)
      stdout.write('      > Compressed geohases json...');
      const cgeohashesPath = `${subDir}/geohashes-compressed.json`;
      fs.writeFileSync(cgeohashesPath, JSON.stringify(compressedHashes));
      console.log(`OK (${getFileSizeInKb(cgeohashesPath).toFixed(2)} KBs)`)
      stdout.write('      > Compressed geohases geojson...');
      fs.writeFileSync(`${subDir}/geohashes-compressed.geojson`, JSON.stringify(geohashesToFeatureCollection(compressedHashes)));
      console.log('OK');
      stdout.write('      > Encoded geohash tree...');
      const treePath = `${subDir}/geohashes-tree.txt`;
      fs.writeFileSync(treePath, encodedTreeBinary);
      console.log(`OK (${getFileSizeInKb(treePath).toFixed(2)} KBs)`)
      console.log('    > OK');

      fs.appendFileSync(statsPath, `${precision},${properties.codigo},"${getName(properties)}",`
        + `${getFileSizeInKb(geojsonPath)},${wkbSizeKb},`
        + `${getFileSizeInKb(ugeohashesPath)},${getFileSizeInKb(cgeohashesPath)},${getFileSizeInKb(treePath)},`
        + `${hashes.length},${compressedHashes.length},${hashTime},${compressTime},${treeTime}\n`);
    }
  }
})();
