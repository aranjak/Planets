const ERC721 = artifacts.require("./ERC721");
const SaleAgent = artifacts.require("./SaleAgent");
const MigrationAgent = artifacts.require("./MigrationAgent");

const assert = require("chai").assert;
const truffleAssert = require('truffle-assertions');

contract('SaleAgent', function(accounts) {
    
    beforeEach(async function() {
        planets = await ERC721.deployed();
        saleAgent = await SaleAgent.deployed();
        migrationAgent = await MigrationAgent.deployed();
    });

    describe("Check initial values", function() {

        it("Check Planet contract address", async function() {
            let address = await saleAgent.planets();
            assert.equal(ERC721.address, address, "Wrong initial planet contract address");
        });

        it("Commission should be zero", async function() {
            let commission = await saleAgent.percentageOfCommission();
            assert.equal(commission.toNumber(), 0, "Wrong initial commission");
        });

    })

    describe("Check sale functions", function() {
     
        it("Check change of token sale data", async function() {
            await planets.mint(accounts[1], 'Z1', 125, 'Omega12', false, 'green');
            await planets.setSaleAgent(saleAgent.address);
            await saleAgent.setPlanetSale(0, 2e17, true, {from: accounts[1]});
            let planetSaleData = await planets.getPlanetSaleData(0);
            assert.isTrue(planetSaleData[0] == true, "Planet availability is wrong");
            assert.isTrue(planetSaleData[1].toNumber() == 2e17, "Planet price is wrong");
        });

        it("Check if Sale agent has approval to transfer token", async function() {
            let approve = await planets.getApproved(0);
            assert.equal(approve, saleAgent.address, "Sale agent does not get approvals");
        });


        it("Check buy token", async function() {
            
            var price_to_pay = 2e17; //0.2ETH
            let balance_before = await web3.eth.getBalance(accounts[1]);
            let planetSaleData = await planets.getPlanetSaleData(0);

            await saleAgent.buyPlanet(0, {from:accounts[3], value: price_to_pay});
            
            let owner = await planets.ownerOf(0);
            let balance_after = await web3.eth.getBalance(accounts[1]);

            assert.isTrue(owner == accounts[3], "Token owner was not changed");
            assert.isTrue(balance_after.toNumber() == balance_before.toNumber()+planetSaleData[1].toNumber(), "Owner does not get his money");
           
        });

        it("Check buy token with commission", async function() {

            await planets.mint(accounts[1], 'Z1', 125, 'Omega12', false, 'green');
            await saleAgent.setPlanetSale(1, 2e17, true, {from: accounts[1]})
            await saleAgent.setPercentageOfCommission(3);

            
            
            var price_to_pay = 2e17; //0.2ETH
            let balance_before = await web3.eth.getBalance(accounts[1]);
            let sale_owner_balance_before = await web3.eth.getBalance(accounts[0]);

            let planetSaleData = await planets.getPlanetSaleData(0);

            await saleAgent.buyPlanet(1, {from:accounts[3], value: price_to_pay});

            var price = planetSaleData[1].toNumber();

            var commission = price * 3 / 100;
            var transferAmount = price - commission;
            
            let owner = await planets.ownerOf(1);

            let balance_after = await web3.eth.getBalance(accounts[1]);
            let sale_owner_balance_after = await web3.eth.getBalance(accounts[0]);

            assert.isTrue(owner == accounts[3], "Token owner was not changed");
            assert.isTrue(balance_after.toNumber() == balance_before.toNumber()+transferAmount, "Owner did not get his money");
            assert.isTrue(sale_owner_balance_after.toNumber() ==sale_owner_balance_before.toNumber()+commission, "Sale agent owner did not get his money");
           
        });

    });        

    describe("Check set functions", function() {

        it("Setup correctry new commission", async function() {
            await saleAgent.setPercentageOfCommission(5);
            let commission = await saleAgent.percentageOfCommission();
            assert.equal(commission.toNumber(), 5, "Wrong setup commission");
        });

    });  
    
    describe("Check modifiers", function() {

        it("Only owner can setup address", async () => {
            await truffleAssert.reverts(
                saleAgent.setPlanetsAddress(ERC721.address, {from: accounts[1]})
            );
        });

        it("Only owner can setup commission", async () => {
            await truffleAssert.reverts(
                saleAgent.setPercentageOfCommission(5, {from: accounts[1]})
            );
        });       

    });  

    describe("Check requirements", function() {
        
        it("Only owner or approved can change sale data", async () => {
            await truffleAssert.reverts(
                saleAgent.setPlanetSale(0, 2e17, true, {from: accounts[2]})
            );
        });

        it("Not existing token can not be bought", async () => {
            await truffleAssert.reverts(
                saleAgent.buyPlanet(5, {from:accounts[2], value: 3e17})
            );
        });

        it("SaleAgent should have approval to trasfer token", async () => {
            await truffleAssert.reverts(
                saleAgent.buyPlanet(0, {from:accounts[2], value: 3e17})
            );
        });

        it("Token should be available to buy", async () => {
            await saleAgent.setPlanetSale(0, 2e17, false, {from: accounts[3]})
            await truffleAssert.reverts(
                saleAgent.buyPlanet(0, {from:accounts[2], value: 3e17})
            );
        });

        it("Buyer should send enough funds", async () => {
            await saleAgent.setPlanetSale(0, 3e17, true, {from: accounts[3]})
            await truffleAssert.reverts(
                saleAgent.buyPlanet(0, {from:accounts[2], value: 2e17})
            );
        });

    }); 
    
    describe("Check events", function() {
        
        it("Should emit OnChangeSaleToken event on change sale data", async () => {
            let tx = await saleAgent.setPlanetSale(0, 2e17, true, {from: accounts[3]})
            truffleAssert.eventEmitted(tx, 'OnChangeSaleToken');
        });

        it("Should emit PlanetBought event on buy", async () => {
            await saleAgent.setPlanetSale(0, 2e17, true, {from: accounts[3]})
            let tx = await saleAgent.buyPlanet(0, {from:accounts[2], value: 2e17})
            truffleAssert.eventEmitted(tx, 'PlanetBought');
        });

        it("Should emit PlanetBought event on buy with expected return values", async () => {
            await saleAgent.setPlanetSale(0, 3e17, true, {from: accounts[2]})
            let tx = await saleAgent.buyPlanet(0, {from:accounts[3], value: 3e17})
            truffleAssert.eventEmitted(tx, 'PlanetBought', (ev) => {
                return ev.from === accounts[2] && ev.to === accounts[3] && ev.etherValue.toNumber() === 3e17 && ev.tokenID == 0;
            });
        });

    });


});