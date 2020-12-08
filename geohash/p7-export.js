// send all data for contracts

const fs = require('fs');
const { stdout } = require('process');
const compressHash = require('geohash-compression');
const polygonToGeohash = require('./polygon-to-geohash');;
const geohashTree = require('geohash-tree');

const precision = 7;
const data = './data.json';
const destination = '../area-contracts/areas';

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
        await polygonToGeohash(feature.geometry, precision)
      )
    , 'buffer');
    fs.writeFileSync(`${destination}/7${feature.properties.id}.json`, JSON.stringify(metadata));
    fs.writeFileSync(`${destination}/7${feature.properties.id}.geohashtree`, data);
    console.log('OK');
  }
  console.log('FINISH');
})();
