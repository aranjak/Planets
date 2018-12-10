pragma solidity ^0.4.24;

import "./SafeMath.sol";
import "./Ownable.sol";
import "./interfaces/IMigrationAgent.sol";

contract ERC721_NEW is Ownable {

    using SafeMath for uint256;

    struct planet {
        string planet_name;
        uint256 age;
        string star_system;
        bool is_life;
        string color;
        bool isAvailable;
        uint256 price;
    }

    string public tokenName;
    string public tokenSymbol;
    uint256 public totalSupply;

    uint public defaultPlanetPrice = 0.1 ether;
    address public SaleAgent;
    address public MigrationAgent;
    bool private is_migrated;
    uint private totalMigrated;

    mapping (uint256 => planet) private _planets;
    mapping (uint256 => address) private _tokenOwner;
    mapping (uint256 => address) private _tokenApprovals;
    mapping (address => uint256) private _ownedTokensCount;
    mapping (address => mapping (address => bool)) private _operatorApprovals;

    event Transfer(address indexed _from, address indexed _to, uint256 indexed _tokenId);
    event Approval(address indexed _owner, address indexed _approved, uint256 indexed _tokenId);
    event ApprovalForAll(address indexed _owner, address indexed _operator, bool _approved);
    event Migrate(address indexed from, address indexed agent, uint256 indexed tokenId);

    function init(string _tokenName, string _tokenSymbol) public onlyOwner  
    {
        tokenName = _tokenName;
        tokenSymbol = _tokenSymbol;
        totalSupply = 0;
        is_migrated = false;
        totalMigrated = 0;
    }

    function totalSupply() public view returns (uint256) 
    {
        return totalSupply;
    }

    function balanceOf(address owner) public view returns (uint256)
    {
        require(owner != address(0), "Invalid address.");
        return _ownedTokensCount[owner];
    }

    function ownerOf(uint256 tokenId) public view returns (address)
    {
        address planet_owner = _tokenOwner[tokenId];
        require(planet_owner != address(0), "Invalid address.");
        return planet_owner;
    }

    function approve(address to, uint256 tokenId) public
    {
        address owner = ownerOf(tokenId);
        require(to != owner, "Invalid address.");
        require(msg.sender == owner, "Function can be called only from account-owner of the specified token.");

        _tokenApprovals[tokenId] = to;
        emit Approval(owner, to, tokenId);
    }

    function getApproved(uint256 tokenId) public view returns (address)
    {
        require(exists(tokenId), "Specified token doesn't exist.");
        return _tokenApprovals[tokenId];
    }

    function transfer(address to, uint256 tokenId) public
    {
        require(isApprovedOrOwner(msg.sender, tokenId), "Calling address is not an owner and not allowed to transfer the specified token.");
        require(to != address(0), "Invalid address.");
        require(msg.sender != to, "Invalid address.");

        clearApproval(msg.sender, tokenId);
        removeTokenFrom(msg.sender, tokenId);
        addTokenTo(to, tokenId);

        _planets[tokenId].isAvailable = false;

        emit Transfer(msg.sender, to, tokenId);
    }

    function transferFrom(address from, address to, uint256 tokenId) public
    {
        require(isApprovedOrOwner(msg.sender, tokenId), "Calling address is not an owner and not allowed to transfer the specified token.");
        require(ownerOf(tokenId) == from, "Specified from address is not the owner of the specified token.");
        require(to != address(0), "Invalid address.");

        clearApproval(from, tokenId);
        removeTokenFrom(from, tokenId);
        addTokenTo(to, tokenId);

        _planets[tokenId].isAvailable = false;

        emit Transfer(from, to, tokenId);
    }

    function exists(uint256 tokenId) public view returns (bool)
    {
        address owner = _tokenOwner[tokenId];
        return owner != address(0);
    }

    function setApprovalForAll(address to, bool approved) public 
    {
        require(to != msg.sender, "Invalid address!");
        _operatorApprovals[msg.sender][to] = approved;
        emit ApprovalForAll(msg.sender, to, approved);
    }

    function isApprovedOrOwner(address spender, uint256 tokenId) public view returns (bool)
    {
        address owner = ownerOf(tokenId);
        return (spender == owner || getApproved(tokenId) == spender || isApprovedForAll(owner, spender));
    }

    function isApprovedForAll(address owner, address operator) public view returns (bool) 
    {
        return _operatorApprovals[owner][operator];
    }

    function mint(address to, string planet_name, uint256 age, string star_system, bool is_life, string color) public onlyOwner
    {
        require(to != address(0), "Invalid address!");

        uint256 createdTokenId = totalSupply;
        _planets[createdTokenId] = planet(planet_name, age, star_system, is_life, color, false, defaultPlanetPrice);

        addTokenTo(to, createdTokenId);
        emit Transfer(address(0), to, createdTokenId);

        totalSupply = totalSupply.add(1);
    }

    function addTokenTo(address to, uint256 tokenId) internal
    {
        require(_tokenOwner[tokenId] == address(0), "Invalid address.");

        _tokenOwner[tokenId] = to;
        _ownedTokensCount[to] = _ownedTokensCount[to].add(1);
    }

    function removeTokenFrom(address from, uint256 tokenId) internal
    {
        require(ownerOf(tokenId) == from, "Provided address is not owner of token!");
        _ownedTokensCount[from] = _ownedTokensCount[from].sub(1);
        _tokenOwner[tokenId] = address(0);
    }

    function clearApproval(address owner, uint256 tokenId) private
    {
        require(ownerOf(tokenId) == owner, "Provided address is not owner of token!");
        if (_tokenApprovals[tokenId] != address(0)) {
            _tokenApprovals[tokenId] = address(0);
        }
    }

    function changeDefaultPlanetPrice(uint256 newPrice) public onlyOwner 
    {
        defaultPlanetPrice = newPrice;
    }

    function setSaleAgent(address agent) public onlyOwner 
    {
        SaleAgent = agent;
    }

    function setMigrationAgent(address agent) public onlyOwner
    {
        require(MigrationAgent == 0, "Migration agent is specified already");
        require(is_migrated == false, "Contract was migrated already!");
        MigrationAgent = agent;
    }

    function updateSellData(uint256 tokenId, uint256 price, bool isAvailable) public onlySaleAgent
    {
        _planets[tokenId].price = price;
        _planets[tokenId].isAvailable = isAvailable;

        _tokenApprovals[tokenId] = SaleAgent;
        emit Approval(ownerOf(tokenId), SaleAgent, tokenId);
    }

    function getPlanetData(uint256 tokenId) public view returns (string planet_name,
                                                                    uint256 age,
                                                                    string star_system,
                                                                    bool is_life,
                                                                    string color)
    {
        return (_planets[tokenId].planet_name, _planets[tokenId].age, _planets[tokenId].star_system, _planets[tokenId].is_life, _planets[tokenId].color);
    }

    function getPlanetSaleData(uint256 tokenId) public view returns (bool isAvailable, uint256 price)
    {
        return (_planets[tokenId].isAvailable, _planets[tokenId].price);
    }

    function migrate(uint256 tokenId) external {
        require(exists(tokenId) == true, "Planet does not exists");
        require(ownerOf(tokenId) == msg.sender, "You are not owner of Planet!");
        require(MigrationAgent != 0, "Migration agent is not specified!");
        require(is_migrated == false, "Contract was migrated already!");
        

        removeTokenFrom(msg.sender, tokenId);
        IMigrationAgent(MigrationAgent).migrateToken(msg.sender, tokenId, 
        _planets[tokenId].planet_name,
        _planets[tokenId].age,
        _planets[tokenId].star_system,
        _planets[tokenId].is_life,
        _planets[tokenId].color,
        _planets[tokenId].isAvailable,
        _planets[tokenId].price);
        
        totalMigrated += 1;

        emit Migrate(msg.sender, MigrationAgent, tokenId);
    }

    function receiveMigratedData(address _client, uint256 tokenId, string planet_name, uint256 age, string star_system,
        bool is_life, string color, bool isAvailable, uint256 price) public onlyMigrationAgent
    {
        _planets[tokenId] = planet(planet_name, age, star_system, is_life, color, isAvailable, price);

        addTokenTo(_client, tokenId);

        totalSupply = totalSupply.add(1);
    }

    function finalizeMigration() public onlyMigrationAgent
    {
        is_migrated = true;
    }

    modifier onlySaleAgent() {
        require(msg.sender == SaleAgent, "Only SaleAgent can do this action!");
        _;
    }

    modifier onlyMigrationAgent() {
        require(msg.sender == MigrationAgent, "Only MigrationAgent can do this action!");
        _;
    }

    function () public payable {
        revert("This contact should not accept ETH");
    }
} 