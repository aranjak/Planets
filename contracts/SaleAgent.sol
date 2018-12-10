pragma solidity ^0.4.24;

import "./Ownable.sol";
import "./interfaces/IERC721.sol";

contract SaleAgent is Ownable {
    address public planets;
    uint256 public percentageOfCommission;

    event OnChangeSaleToken(uint256 indexed tokenID, uint indexed price, bool isAvailable);
    event PlanetBought(address indexed from, address indexed to, uint256 indexed etherValue, uint256 tokenID);

    constructor(address _planets) public
    {
        setPlanetsAddress(_planets);
        percentageOfCommission = 0;
    }

    function setPlanetsAddress(address _planets) public onlyOwner 
    {
        planets = _planets;
    }

    function setPercentageOfCommission(uint256 commision) public onlyOwner
    {
        percentageOfCommission = commision;
    }

    function setPlanetSale(uint16 _tokenID, uint _price, bool _isAvailable) public 
    {
        require (IERC721(planets).isApprovedOrOwner(msg.sender,_tokenID), "Only owner can do it!");

        IERC721(planets).updateSellData(_tokenID, _price, _isAvailable);
        emit OnChangeSaleToken(_tokenID, _price, _isAvailable);
    }

    function buyPlanet (uint16 tokenId)  public payable
    {
        require(IERC721(planets).exists(tokenId), "Planet does not exists");
        require (IERC721(planets).isApprovedOrOwner(address(this), tokenId), "SaleAgent can not transfer this token!");

        bool isAvailable;
        uint256 price;
        (isAvailable, price) = IERC721(planets).getPlanetSaleData(tokenId);

        require(isAvailable == true, "Planet is not for Sale!");

        uint256 commission = price * percentageOfCommission / 100;
        uint256 transferAmount = price - commission;
        uint256 surrender = msg.value - transferAmount - commission;
            
        require(msg.value >= price, "Not enough funds!");

        address ownerOfPlanet = IERC721(planets).ownerOf(tokenId);

        ownerOfPlanet.transfer(transferAmount);

        if (commission > 0) {
            owner().transfer(commission);
        }
        if (surrender > 0) {
            msg.sender.transfer(surrender);
        }

        IERC721(planets).transferFrom(ownerOfPlanet, msg.sender, tokenId);

        emit PlanetBought(ownerOfPlanet, msg.sender, price, tokenId);
    }
}