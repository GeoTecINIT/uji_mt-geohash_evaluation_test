// SPDX-License-Identifier: MIT
pragma solidity >=0.4.22 <0.8.0;

contract Areas {
  struct Area {
    uint8 id;
    address addedBy;
    uint8[] name;
  }

  struct Node {
    uint8 areaId;
    mapping(uint8 => Node) children;
  }

  mapping(uint8 => Node) private nodes;
  mapping(uint8 => Area) private areas;

  function calculateGeohashes(uint8 areaId, uint8[] memory geohashes) private {
    Node storage node = nodes[geohashes[0]];
    for (uint256 i = 1; i < geohashes.length; i++) {
      if (geohashes[i] == 10) {
        node.areaId = areaId;
        if (i < geohashes.length - 1) {
          node = nodes[geohashes[++i]];
        }
        continue;
      }
      node = node.children[geohashes[i]];
    }
  }

  function add(uint8 id, uint8[] memory name, uint8[] memory geohashes) public {
    Area storage area = areas[id];
    area.id = id;
    area.name = name;
    area.addedBy = msg.sender;
    calculateGeohashes(area.id, geohashes);
  }

  function getName(uint8 id) public view returns(uint8[] memory name) {
    Area storage area = areas[id];
    return area.name;
  }

  function getAdder(uint8 id) public view returns(address addr) {
    Area storage area = areas[id];
    return area.addedBy;
  }

  function query(uint8[] memory geohash) public view returns(uint8 areaId) {
    Node storage node = nodes[geohash[0]];
    for (uint256 i = 1; i < geohash.length; i++) {
      if (node.areaId > 0) {
        return node.areaId;
      }
      node = node.children[geohash[i]];
    }
    return node.areaId;
  }
}
