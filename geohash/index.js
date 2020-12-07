// send all data for contracts

const fs = require('fs');
const { stdout, features } = require('process');
const geohashPoly = require('geohash-poly');
const compressHash = require('geohash-compression');
const geohashTree = require('geohash-tree');

const precision = 6;
const data = './data.json';
const destination = '../area-contracts/areas'

const polygonToGeohash = geometry => new Promise((resolve, reject) => {
  geohashPoly({coords: geometry.coordinates, precision: precision}, (err, hashes) => {
    if (err) {
      reject(err); return;
    }
    resolve(hashes);
  });
});

(async() => {
  if (!fs.existsSync(destination)) {
    fs.mkdirSync(destination);
  }

  const geojson = JSON.parse(fs.readFileSync(data));
  for (let i = 0; i < geojson.features.length; i++) {
    const feature = geojson.features[i];
    stdout.write(`${feature.properties.id} - ${feature.properties.name}...`);
    const metadata = {
      id: feature.properties.id,
      name: feature.properties.name
    };
    const data = geohashTree.encodeBinary(
      compressHash(
        await polygonToGeohash(feature.geometry)
      )
    , 'buffer');
    fs.writeFileSync(`${destination}/${feature.properties.id}.json`, JSON.stringify(metadata));
    fs.writeFileSync(`${destination}/${feature.properties.id}.geohashtree`, data);
    console.log('OK');
  }
  console.log('FINISH');
})();
