const fs = require('fs');
const Areas = artifacts.require('Areas');

const byteArrToStr = bytes => Buffer.from(bytes).toString();
const strToByteArr = str => Array.from(str).map(s => s.charCodeAt(0));

contract('Areas (Empty)', async() => {
  const c = JSON.parse(fs.readFileSync('./areas/3.json'));
  
  it('should add an area correctly', async() => {
    const areas = await Areas.deployed();

    await areas.add(c.id, strToByteArr(c.name), strToByteArr(c.data));
    expect(byteArrToStr(await areas.getName(c.id))).to.equal(c.name);
  });
});

contract('Areas', async(accounts) => {
  const a = JSON.parse(fs.readFileSync('./areas/1.json'));
  const b = JSON.parse(fs.readFileSync('./areas/2.json'));
  const c = JSON.parse(fs.readFileSync('./areas/3.json'));

  before(async() => {
    const areas = await Areas.deployed();
  
    await areas.add(a.id, strToByteArr(a.name), strToByteArr(a.data), {from: accounts[1]});
    await areas.add(b.id, strToByteArr(b.name), strToByteArr(b.data), {from: accounts[2]});
    await areas.add(c.id, strToByteArr(c.name), strToByteArr(c.data), {from: accounts[2]});
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
    ];

    for (let i = 0; i < checkLists.length; i++) {
      const result = (await areas.query(strToByteArr(checkLists[i][0]))).toNumber();
      expect(result).to.equal(checkLists[i][1]);
    }
  });
});
