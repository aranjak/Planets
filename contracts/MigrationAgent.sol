pragma solidity ^0.4.24;

import "./Ownable.sol";
import "./interfaces/IERC721.sol";

contract MigrationAgent is Ownable {
    address public source_contract;
    address public target_contract;

    IERC721 public sourceContract;
    IERC721 public targetContract;

    constructor(address _source) public {
        source_contract = _source;
    }

    function setTargetToken(address _new_ticket) public onlyOwner {
        require(target_contract == 0, "Target contract initialized already");
        sourceContract = IERC721(source_contract);
        targetContract = IERC721(_new_ticket);
        target_contract = _new_ticket;
    }

    function migrateToken(address _client, uint256 tokenId, string planet_name, uint256 age, string star_system,
        bool is_life, string color, bool isAvailable, uint256 price) public 
    {
        require(msg.sender == source_contract, "Only original contract can calls this method");
        targetContract.receiveMigratedData(_client, tokenId, planet_name, age, star_system, is_life, color, isAvailable, price);
    }

    function finalizeMigration() public onlyOwner {
        require(target_contract != 0, "There is no target contract!");
        sourceContract.finalizeMigration();
        source_contract = 0;
        target_contract = 0;
    }
}