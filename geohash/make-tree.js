const travel = (geohash, tree) => {
  const char = geohash[0];
  if (!tree[char]) {
    tree[char] = {};
  }
  if (geohash.length === 1) {
    tree[char] = 1;
    return;
  }
  travel(geohash.slice(1), tree[char]);
};

module.exports = geohashes => {
  const tree = {};
  for (let i = 0; i < geohashes.length; i++) {
    const geohash = geohashes[i];
    travel(geohash, tree);
  }
  return tree;
};
