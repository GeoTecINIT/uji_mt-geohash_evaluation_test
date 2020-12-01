const fs = require('fs');
const Areas = artifacts.require('Areas');

const byteArrToStr = bytes => Buffer.from(bytes).toString();
const strToByteArr = str => Array.from(Buffer.from(str, 'utf8'));

contract('Areas', async(accounts) => {
  
  const a = JSON.parse(fs.readFileSync('./areas/1.json'));
  const b = JSON.parse(fs.readFileSync('./areas/2.json'));
  const c = JSON.parse(fs.readFileSync('./areas/3.json'));

  before(async() => {
    const areas = await Areas.deployed();
  
    await areas.add(a.id, strToByteArr(a.name), strToByteArr(a.hashes), {from: accounts[1]});
    await areas.add(b.id, strToByteArr(b.name), strToByteArr(b.hashes), {from: accounts[2]});
  });
  
  it('should add an area correctly', async() => {
    const areas = await Areas.deployed();

    await areas.add(c.id, strToByteArr(c.name), strToByteArr(c.hashes));
    expect(byteArrToStr(await areas.getName(c.id))).to.equal(c.name);
  });

  it('should get correct name', async() => {
    const areas = await Areas.deployed();
    expect(byteArrToStr(await areas.getName(a.id))).to.equal(a.name);
    expect(byteArrToStr(await areas.getName(b.id))).to.equal(b.name);
  });

  it('should get a correct adder', async() => {
    const areas = await Areas.deployed();
    expect(await areas.getAdder(a.id)).to.equal(accounts[1]);
    expect(await areas.getAdder(b.id)).to.equal(accounts[2]);
  });

  it('should query correctly', async() => {
    const areas = await Areas.deployed();
    await areas.add(c.id, strToByteArr(c.name), strToByteArr(c.hashes));

    const checkLists = [
      ['ezpgx37', 1],
      ['ezpgw2dkf', 2],
      ['sp0589', 3],
      ['sp052em', 3]
    ].map(x => Array.from(Buffer.from(x[0], 'utf8')));

    for (let i = 0; i < checkLists.length; i++) {
      expect(await areas.query(checkLists[i][0])).to.equal(checkLists[i][1]);
    }
  });
});
