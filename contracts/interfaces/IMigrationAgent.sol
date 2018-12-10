pragma solidity ^0.4.24;

contract IMigrationAgent {
    function finalizeMigration() external;
    function migrateToken(address _client, uint256 tokenId, string planet_name, uint256 age, string star_system,
        bool is_life, string color, bool isAvailable, uint256 price) public;
}