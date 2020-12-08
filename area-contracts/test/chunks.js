const fs = require('fs');
const geohashTree = require('geohash-tree');
const Areas = artifacts.require('Areas');

const BYTE32_NUMBER = {
  0: 0, 1: 1, 2: 2, 3: 3, 4: 4, 5: 5, 6: 6, 7: 7,
  8: 8, 9: 9, b: 10, c: 11, d: 12, e: 13, f: 14, g: 15,
  h: 16, j: 17, k: 18, m: 19, n: 20, p: 21, q: 22, r: 23,
  s: 24, t: 25, u: 26, v: 27, w: 28, x: 29, y: 30, z: 31,
};

const metadata = JSON.parse(fs.readFileSync(`./areas/73.json`));
const hashTreeData = Array.from(fs.readFileSync(`./areas/73.geohashtree`));
const chunks = geohashTree.chunkbinary(hashTreeData, 256);

contract('Chunked Functions', () => {
  it('should create correct chunks', () => {
    const joinedChunks = chunks.reduce((joined, c) => { joined.push(...c); return joined; }, []);
    expect(geohashTree.encode(geohashTree.decodeBinary(joinedChunks)))
      .to.equal(
        geohashTree.encode(geohashTree.decodeBinary(hashTreeData))
      );
  });
});

contract('Chunked Areas', async() => {

  before(async() => {
    const areas = await Areas.deployed();
    for (let i = 0; i < chunks.length; i++) {
      console.log(`Adding chunk ${i + 1} from ${chunks.length} (chunk size: ${chunks[i].length})...`);
      await areas.add(
        metadata.id,
        Array.from(metadata.name).map(x => x.charCodeAt(0)),
        chunks[i]
      );
    }
  });
  
  it('should query correctly', async() => {
    const areas = await Areas.deployed();
    const testLists = [
      ['sp0589', 3],
      ['sp052em', 3]
    ].map(x => [Array.from(x[0]).map(c => BYTE32_NUMBER[c]), x[1]]);
    for (let i = 0; i < testLists.length; i++) {
      expect(
        (await areas.query(testLists[i][0])).toNumber()
      ).to.equal(testLists[i][1], `cannot query ${testLists[i][0]}`);
    }
  });

  // const toBinary = arr => arr.map(x => x.toString(2).padStart(8, '0')).join('\n');

  it('should contains all chunks correctly in the contract', async() => {
    const areas = await Areas.deployed();
    const dataLength = (await areas.getDataLength(metadata.id)).toNumber();
    expect(dataLength).to.equal(chunks.length, 'length is not equal');

    const dataFromContracts = [];
    for (let i = 0; i < dataLength; i++) {
      chunkFromContract = Array.from(await areas.getData(metadata.id, i)).map(x => x.toNumber());

      expect(chunkFromContract.length).to.equal(chunks[i].length, `chunk #${i} length is not equal`);

      expect(
        geohashTree.encode(geohashTree.decodeBinary(chunkFromContract))
      ).to.equal(
        geohashTree.encode(geohashTree.decodeBinary(chunks[i])),
        `encoded chunk #${i} is not equal`
      );
      
      dataFromContracts.push(...chunkFromContract);
    }

    const stringHash = geohashTree.encode(geohashTree.decodeBinary(dataFromContracts));
    expect(stringHash)
      .to.equal(
        geohashTree.encode(geohashTree.decodeBinary(hashTreeData)),
        'combined data are not equal'
      );
  });
});
