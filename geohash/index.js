// send all data for contracts
// format {id: number, name: string, hashes: byte[]}[]

const fs = require('fs');
const { stdout, features } = require('process');
const geohashPoly = require('geohash-poly');
const compressHash = require('geohash-compressor1');

const precision = 5;
const data = './data/comunidades-autonomas.geojson';
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
    stdout.write(`${feature.properties.codigo} - ${feature.properties.comunidade_autonoma}...`);
    const data = {
      id: feature.properties.codigo,
      name: feature.properties.comunidade_autonoma,
      hashes: compressHash(await polygonToGeohash(feature.geometry)).join('\n')
    };
    fs.writeFileSync(`${destination}/${feature.properties.codigo}.json`, JSON.stringify(data));
    console.log('OK');
  }
  console.log('FINISH');
})();
