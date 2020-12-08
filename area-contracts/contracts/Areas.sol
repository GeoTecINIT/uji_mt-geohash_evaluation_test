// SPDX-License-Identifier: MIT
pragma solidity >=0.4.22 <0.8.0;

contract Areas {
  struct Area {
    uint8 id;
    address addedBy;
    uint8[] name;
    mapping(uint => uint8[]) data;
    uint dataLength;
  }

  mapping(uint64 => uint8) private NODES;
  mapping(uint8 => Area) private AREAS;

  function getShiftAmount(uint8 level) private pure returns (uint8 amount) {
    return 64 - (8 * (level)); // 64 = uint64 (bit amounts of NODES indices); base 1
  }

  function add(uint8 id, uint8[] memory name, uint8[] memory data) public {
    Area storage area = AREAS[id];
    area.id = id;
    area.name = name;
    area.addedBy = msg.sender;

    if (data.length == 1) {
      NODES[uint64(data[0]) << getShiftAmount(1)] = id;
      return;
    }

    uint64 index = 0;
    uint8 level = 1;

    for (uint i = 0; i < data.length; i++) {
      if (data[i] == 0x40) { // close mark = 010 00000
        level--; continue;
      }

      uint64 shiftAmount = getShiftAmount(level);

      index = (index & ~(uint64(0xFF) << shiftAmount)) | (uint64(data[i] & 0x1F) << shiftAmount);
        // & ~(uint64(0xFF) << shiftAmount) => clear bits at current level
        // | (uint64(data[i] & 01F) << shiftAmount) => assign current level
        // 0x1F => char mark = 000 11111

      if (data[i] & 0x20 == 0x20) { // open mark = 001 00000
        level++;
      } else if (level < 9) {
        NODES[index] = id;
      }
    }

    area.data[area.dataLength] = data;
    area.dataLength++;
  }

  function getName(uint8 id) public view returns(uint8[] memory name) {
    Area storage area = AREAS[id];
    return area.name;
  }

  function getAdder(uint8 id) public view returns(address addr) {
    Area storage area = AREAS[id];
    return area.addedBy;
  }

  function getDataLength(uint8 id) public view returns(uint length) {
    Area storage area = AREAS[id];
    return area.dataLength;
  }

  function getData(uint8 areaId, uint dataIndex) public view returns(uint8[] memory data) {
    Area storage area = AREAS[areaId];
    return area.data[dataIndex];
  }

  function query(uint8[] memory geohash) public view returns(uint8 areaId) {
    uint64 index = 0;
    uint8 length = geohash.length > 8 ? 8 : uint8(geohash.length);
    for (uint8 i = 0; i < length; i++) {
      index |= (uint64(geohash[i]) << getShiftAmount(i + 1));
    }

    for (uint8 i = length; i > 0; i--) {
      if (NODES[index] > 0) {
        return NODES[index];
      }
      index &= ~(uint64(0xFF) << getShiftAmount(i));
    }
    return NODES[index];
  }
}
