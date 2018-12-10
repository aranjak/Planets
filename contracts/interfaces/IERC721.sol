pragma solidity ^0.4.24;

contract IERC721 {
  function balanceOf(address owner) public view returns (uint256 balance);
  function ownerOf(uint256 tokenId) public view returns (address owner);

  function approve(address to, uint256 tokenId) public;
  function getApproved(uint256 tokenId) public view returns (address operator);
  function isApprovedOrOwner(address spender, uint256 tokenId) external view returns (bool);

  function transferFrom(address from, address to, uint256 tokenId) public;

  function setMigrationAgent(address _agent) external;
  function migrate(uint256 _value) external;
  function finalizeMigration() external;
  function receiveMigratedData(address _client, uint256 tokenId, string planet_name, uint256 age, string star_system,
        bool is_life, string color, bool isAvailable, uint256 price) external;

  function getPlanetSaleData(uint256 tokenId) public view returns (bool isAvailable, uint256 price);
  function exists(uint256 tokenId) public view returns (bool);
  function updateSellData(uint256 tokenId, uint256 _price, bool _isAvailable) external;
}