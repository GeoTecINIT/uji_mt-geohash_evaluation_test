const fs = require('fs');
const { stdout } = require('process');
const geohashTree = require('geohash-tree');
const Areas = artifacts.require('Areas');

module.exports = async(callback) => {
  const areas = await Areas.deployed();
  
  const metadata = JSON.parse(fs.readFileSync('./areas/71.json'));
  metadata.name = Array.from(metadata.name).map(x => x.charCodeAt(0));
  
  const data = Array.from(fs.readFileSync('./areas/71.geohashtree'));
  
  try {
    for (let size = 256; size < data.length; size += 64) {
      console.log(`Chunk size = ${size}`);

      const chunks = geohashTree.chunkbinary(data, size);
      const chunk = chunks[0];
      stdout.write(`  chunk size = ${chunk.length}...`);
      await areas.add(metadata.id, metadata.name, chunk);
      console.log('OK');
    }

    stdout.write(`Full data (size = ${data.length})...`);
    await areas.add(metadata.id, metadata.name, data);
    console.log('OK');
  } catch (e) {
    callback(e); return;
  }

  callback();
};
