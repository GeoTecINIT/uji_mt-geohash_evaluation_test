// SPDX-License-Identifier: MIT
pragma solidity >=0.4.22 <0.8.0;

contract Areas {
  struct Area {
    uint8 id;
    address addedBy;
    uint8[] name;
    uint8[] data;
  }

  mapping(uint256 => uint8) private NODES;
  mapping(uint8 => Area) private AREAS;

  uint8 constant OPEN_MARK = 91;
  uint8 constant CLOSE_MARK = 93;

  function getShiftAmount(uint level) private pure returns (uint amount) {
    return 256 - (8 * (level + 1));
  }

  function add(uint8 id, uint8[] memory name, uint8[] memory data) public {
    Area storage area = AREAS[id];
    area.id = id;
    area.name = name;
    area.addedBy = msg.sender;
    area.data = data;

    if (data.length == 1) {
      NODES[uint256(data[0]) << getShiftAmount(0)] = id;
      return;
    }

    uint256 nodesIndex = 0;
    uint level = 0;

    uint i = 0;
    while (i < data.length) {
      if (i + 1 >= data.length) {
        break;
      }
      uint8 currentChar = data[i];
      uint8 nextChar = data[i + 1];

      uint256 shiftAmount = getShiftAmount(level);

      nodesIndex &= ~(uint256(0xFF) << shiftAmount); // clear bits at current level
      nodesIndex |= (uint256(currentChar) << shiftAmount);

      if (nextChar == OPEN_MARK) {
        if (NODES[nodesIndex] != 0) {
          NODES[nodesIndex] = 0;
        }
        level++; i += 2; continue;
      }
      
      NODES[nodesIndex] = id;

      if (nextChar == CLOSE_MARK) {
        level--; i += 2; continue;
      }

      i++;
    }
  }

  function getName(uint8 id) public view returns(uint8[] memory name) {
    Area storage area = AREAS[id];
    return area.name;
  }

  function getAdder(uint8 id) public view returns(address addr) {
    Area storage area = AREAS[id];
    return area.addedBy;
  }

  function query(uint8[] memory geohash) public view returns(uint8 areaId) {
    uint index = 0;
    for (uint i = 0; i < geohash.length; i++) {
      index |= (uint256(geohash[i]) << getShiftAmount(i));
      if (NODES[index] > 0) {
        return NODES[index];
      }
    }
    return 0;
  }
}
