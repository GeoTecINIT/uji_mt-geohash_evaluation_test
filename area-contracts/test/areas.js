const fs = require('fs');
const Areas = artifacts.require('Areas');

const byteArrToStr = bytes => Buffer.from(bytes).toString();
const strToByteArr = str => Array.from(Buffer.from(str, 'utf8'));

contract('Areas', async(accounts) => {
  
  const catalunya = JSON.parse(fs.readFileSync('./areas/09.json'));
  const valencia = JSON.parse(fs.readFileSync('./areas/10.json'));

  before(async() => {
    const areas = await Areas.deployed();
  
    console.log('adding Catalunya...');
    await areas.add(catalunya.id, strToByteArr(catalunya.name), strToByteArr(catalunya.hashes), {from: accounts[1]});
  
    console.log('adding Valencia...');
    await areas.add(valencia.id, strToByteArr(valencia.name), strToByteArr(valencia.hashes), {from: accounts[2]});
  });
  
  it('should add an area correctly', async() => {
    const laRioja = JSON.parse(fs.readFileSync('./areas/17.json'));
    const areas = await Areas.deployed();

    await areas.add(laRioja.id, strToByteArr(laRioja.name), strToByteArr(laRioja.hashes));
    expect(byteArrToStr(await areas.getName(laRioja.id))).to.equal(laRioja.name);
  });

  it('should get correct name', async() => {
    const areas = await Areas.deployed();
    expect(byteArrToStr(await areas.getName(9))).to.equal(catalunya.name);
    expect(byteArrToStr(await areas.getName(10))).to.equal(valencia.name);
  });

  it('should get a correct adder', async() => {
    const areas = await Areas.deployed();
    expect(await areas.getAdder(9)).to.equal(accounts[1]);
    expect(await areas.getAdder(10)).to.equal(accounts[2]);
  });

  it('should query correctly', async() => {
    const areas = await Areas.deployed();

    const checkLists = [
      ['sp3e3mv', 9],
      ['sp3e3mv47mj', 9],
      ['ezpgw2dk', 10]
    ].map(x => Array.from(Buffer.from(x[0], 'utf8')));

    for (let i = 0; i < checkLists.length; i++) {
      expect(await areas.query(checkLists[i][0])).to.equal(checkLists[i][1]);
    }
  });
});
