/**
 * Split data file to separated files
 */

const fs = require('fs');
const { stdout } = require('process');

const path = './data/provincias.geojson';
const destination = './data/provincias';

// const getName = properties => `${properties.codigo} (${properties.comunidade_autonoma})`;
const getName = properties => `${properties.codigo} - ${properties.provincia} (${properties.ccaa})`;

if (!fs.existsSync(destination)) {
  fs.mkdirSync(destination);
}

const geojson = JSON.parse(fs.readFileSync(path));

for (let i = 0; i < geojson.features.length; i++) {
  const codigo = geojson.features[i].properties.codigo;
  stdout.write(`Reading ${getName(geojson.features[i].properties)}...`);
  if (!geojson.features[i].geometry) {
    console.log('SKIPPED');
    continue;
  }
  fs.writeFileSync(`${destination}/${codigo}.json`, JSON.stringify({
    type: 'FeatureCollection',
    features: [geojson.features[i]]
  }));
  console.log('OK');
}
console.log('Finish');
