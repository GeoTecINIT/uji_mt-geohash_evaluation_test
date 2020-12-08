const fs = require('fs');
const Areas = artifacts.require('Areas');

const byteArrToStr = bytes => Buffer.from(bytes).toString();
const strToByteArr = str => Array.from(str).map(s => s.charCodeAt(0));

const BYTE32_NUMBER = {
  0: 0, 1: 1, 2: 2, 3: 3, 4: 4, 5: 5, 6: 6, 7: 7,
  8: 8, 9: 9, b: 10, c: 11, d: 12, e: 13, f: 14, g: 15,
  h: 16, j: 17, k: 18, m: 19, n: 20, p: 21, q: 22, r: 23,
  s: 24, t: 25, u: 26, v: 27, w: 28, x: 29, y: 30, z: 31,
};

const toByte32Number = char => BYTE32_NUMBER[char];

contract('Areas (Empty)', async() => {
  const c = JSON.parse(fs.readFileSync('./areas/3.json'));
  const cData = Array.from(fs.readFileSync('./areas/3.geohashtree'));
  
  it('should add an area correctly', async() => {
    const areas = await Areas.deployed();

    await areas.add(c.id, strToByteArr(c.name), cData);
    expect(byteArrToStr(await areas.getName(c.id))).to.equal(c.name);
  });
});

contract('Areas', async(accounts) => {
  const a = JSON.parse(fs.readFileSync('./areas/1.json'));
  const b = JSON.parse(fs.readFileSync('./areas/2.json'));
  const c = JSON.parse(fs.readFileSync('./areas/3.json'));

  before(async() => {
    const areas = await Areas.deployed();

    const aData = Array.from(fs.readFileSync('./areas/1.geohashtree'));
    const bData = Array.from(fs.readFileSync('./areas/2.geohashtree'));
    const cData = Array.from(fs.readFileSync('./areas/3.geohashtree'));
  
    await areas.add(a.id, strToByteArr(a.name), aData, {from: accounts[1]});
    await areas.add(b.id, strToByteArr(b.name), bData, {from: accounts[2]});
    await areas.add(c.id, strToByteArr(c.name), cData, {from: accounts[2]});
  });

  it('should get correct name', async() => {
    const areas = await Areas.deployed();
    expect(byteArrToStr(await areas.getName(a.id))).to.equal(a.name);
    expect(byteArrToStr(await areas.getName(b.id))).to.equal(b.name);
    expect(byteArrToStr(await areas.getName(c.id))).to.equal(c.name);
  });

  it('should get a correct adder', async() => {
    const areas = await Areas.deployed();
    expect(await areas.getAdder(a.id)).to.equal(accounts[1]);
    expect(await areas.getAdder(b.id)).to.equal(accounts[2]);
    expect(await areas.getAdder(c.id)).to.equal(accounts[2]);
  });

  it('should query correctly', async() => {
    const areas = await Areas.deployed();

    const checkLists = [
      ['ezpgx37', 1],
      ['ezpgw2dkf', 2],
      ['sp0589', 3],
      ['sp052em', 3]
    ].map(c => [
      Array.from(c[0]).map(x => toByte32Number(x)),
      c[1]
    ]);

    for (let i = 0; i < checkLists.length; i++) {
      expect(
        (await areas.query(checkLists[i][0])).toNumber()
      ).to.equal(checkLists[i][1]);
    }
  });
});
