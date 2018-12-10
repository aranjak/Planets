const ERC721 = artifacts.require("./ERC721");
const SaleAgent = artifacts.require("./SaleAgent");
const MigrationAgent = artifacts.require("./MigrationAgent");

//npm install --save-dev chai truffle-assertions
const assert = require("chai").assert;
const truffleAssert = require('truffle-assertions');

contract('ERC721', function(accounts) {
    
    beforeEach(async function() {
        planets = await ERC721.deployed();
        saleAgent = await SaleAgent.deployed();
        migrationAgent = await MigrationAgent.deployed();
    });

    describe("Check initial values", function() {

        it("Total supply should be zero", async function() {
            let count = await planets.totalSupply();
            assert.isTrue(count.toNumber() == 0, "Wrong initial total supply");
        });

        it("Default planet price should be 0.1 Ether", async function() {
            let defaultPlanetPrice = await planets.defaultPlanetPrice();
            assert.isTrue(defaultPlanetPrice.toNumber() == 1e17, "Wrong initial default planet price");
        });

        it("Sale agent should not be set", async function() {
            let SaleAgent = await planets.SaleAgent();
            assert.isTrue(SaleAgent == 0x0, "Sale agent is set");
        });

        it("Migration agent should not be set", async function() {
            let MigrationAgent = await planets.MigrationAgent();
            assert.isTrue(MigrationAgent == 0x0, "Migration agent is set");
        });

        it("Check owner", async function() {
            let owner = await planets.owner();
            assert.isTrue(owner == accounts[0], "Owner is wrong");
            assert.isTrue(owner != accounts[1], "Owner is wrong");
        });

    })

    describe("Check manage token functions", function() {

        it("Mint token to account 1", async function() {
            await planets.mint(accounts[1], 'Z1', 125, 'Omega12', false, 'green');
            let balance = await planets.balanceOf(accounts[1]);
            let owner = await planets.ownerOf(0);
            assert.isTrue(balance.toNumber() == 1, "Account balance is wrong");
            assert.isTrue(owner == accounts[1], "Token owner is wrong");
        });

        it("First token should exists but second not", async function() {
            let exists = await planets.exists(0);
            let not_exists = await planets.exists(1);
            assert.isTrue(exists == true, "Token does not exist");
            assert.isTrue(not_exists == false, "Token exist");
        });

        it("Check token data", async function() {
            let planetData = await planets.getPlanetData(0);
            assert.isTrue(planetData[0] == 'Z1', "Planet name is wrong");
            assert.isTrue(planetData[1].toNumber() == 125, "Planet age is wrong");
            assert.isTrue(planetData[2] == 'Omega12', "Planet star system is wrong");
            assert.isTrue(planetData[3] == false, "Planet life status is wrong");
            assert.isTrue(planetData[4] == 'green', "Planet color is wrong");
        });

        it("Check token sale data", async function() {
            let planetSaleData = await planets.getPlanetSaleData(0);
            assert.isTrue(planetSaleData[0] == false, "Planet availability is wrong");
            assert.isTrue(planetSaleData[1].toNumber() == 1e17, "Planet price is wrong");
        });

        it("Should transfer token correctly", async function() {

            var source_starting_balance;
            var target_starting_balance;
            var source_ending_balance;
            var target_ending_balance;

            source_starting_balance = await planets.balanceOf(accounts[1]);
            target_starting_balance = await planets.balanceOf(accounts[0]);
            await planets.transfer(accounts[0], 0, {from: accounts[1]});
            source_ending_balance = await planets.balanceOf(accounts[1]);
            target_ending_balance = await planets.balanceOf(accounts[0]);

            let owner = await planets.ownerOf(0);
        
            assert.equal(source_ending_balance.toNumber(), source_starting_balance.toNumber() - 1, "Token wasn't correctly taken from the sender");
            assert.equal(target_ending_balance.toNumber(), target_starting_balance.toNumber() + 1, "Token wasn't correctly sent to the target");
            assert.isTrue(owner == accounts[0], "Token owner was not changed");

        });

        it("Should transfer from token correctly", async function() {

            var source_starting_balance;
            var target_starting_balance;
            var source_ending_balance;
            var target_ending_balance;

            source_starting_balance = await planets.balanceOf(accounts[0]);
            target_starting_balance = await planets.balanceOf(accounts[1]);
            await planets.transferFrom(accounts[0],accounts[1], 0, {from: accounts[0]});
            source_ending_balance = await planets.balanceOf(accounts[0]);
            target_ending_balance = await planets.balanceOf(accounts[1]);

            let owner = await planets.ownerOf(0);
        
            assert.equal(source_ending_balance.toNumber(), source_starting_balance.toNumber() - 1, "Token wasn't correctly taken from the sender");
            assert.equal(target_ending_balance.toNumber(), target_starting_balance.toNumber() + 1, "Token wasn't correctly sent to the target");
            assert.isTrue(owner == accounts[1], "Token owner was not changed");

        });

        it("Let approve access to transfer token", async function() {

            let approve_before = await planets.getApproved(0);
            assert.equal(approve_before, 0x0, "Token has approvals before set approve");

            await planets.approve(accounts[0], 0, {from: accounts[1]});

            let approve_after = await planets.getApproved(0);
            assert.equal(approve_after, accounts[0], "Account does not get approvals");

        });

        it("Let approve access to all tokens", async function() {

            let approve_before = await planets.isApprovedForAll(accounts[1], accounts[0]);
            assert.equal(approve_before, false, "Operator has access before approve");

            await planets.setApprovalForAll(accounts[0], true, {from: accounts[1]});

            let approve_after = await planets.isApprovedForAll(accounts[1], accounts[0]);
            assert.equal(approve_after, true, "Account does not get approvals for all");

        });

    });        

    describe("Check set functions", function() {

        it("Setup correctry new default planet price", async function() {
            await planets.changeDefaultPlanetPrice(2*1e17);
            let new_price = await planets.defaultPlanetPrice();
            assert.isTrue(new_price == 2e17, "New default price is wrong");
        });

        it("Sale agent setup", async function() {
            await planets.setSaleAgent(saleAgent.address);
            let sale_Agent = await planets.SaleAgent();
            assert.isTrue(sale_Agent !== 0x0, "Sale agent is not set");
            assert.isTrue(sale_Agent == saleAgent.address, "Sale agent is wrong");
        });

        it("Migration agent setup", async function() {
            await planets.setMigrationAgent(migrationAgent.address);
            let migration_Agent = await planets.MigrationAgent();
            assert.isTrue(migration_Agent !== 0x0, "Migration agent is not set");
            assert.isTrue(migration_Agent == migrationAgent.address, "Migration agent is wrong");
        });

    });  
    
    describe("Check modifiers", function() {

        it("Only owner can call init function", async () => {
            await truffleAssert.reverts(
                planets.init('Planets', 'PLN', {from: accounts[1]})
            );
        });

        it("Only owner can set Sale agent", async () => {
            await truffleAssert.reverts(
                planets.setSaleAgent(saleAgent.address, {from: accounts[1]})
            );
        });

        it("Only owner can set Migration agent", async () => {
            await truffleAssert.reverts(
                planets.setMigrationAgent(migrationAgent.address, {from: accounts[1]})
            );
        });

        it("Only owner can change default planet price", async () => {
            await truffleAssert.reverts(
                planets.changeDefaultPlanetPrice(2e17, {from: accounts[1]})
            );
        });

        it("Only Sale agent can change sale data", async () => {
            await truffleAssert.reverts(
                planets.updateSellData(0,2e17,true, {from: accounts[1]})
            );
        });

        it("Only Migration agent can migrate token", async () => {
            await truffleAssert.reverts(
                planets.receiveMigratedData(accounts[1], 1, 'Z1', 123, 'Omega1', false, 'green', false, 2e17, {from: accounts[1]})
            );
        });

        it("Only Migration agent can finalize migration", async () => {
            await truffleAssert.reverts(
                planets.finalizeMigration({from: accounts[1]})
            );
        });

    });  
    
    describe("Check requirements", function() {
        
        it("Should not get balance of zero address", async () => {
            await truffleAssert.reverts(
                planets.balanceOf(0)
            );
        });

        it("Should not return owner of not existing token", async () => {
            await truffleAssert.reverts(
                planets.ownerOf(5) //5 was not minted
            );
        });

        it("Should not let approve to itself", async () => {
            await truffleAssert.reverts(
                planets.approve(accounts[1], 0, {from: accounts[1]})
            );
        });

        it("Should be owner to let approve", async () => {
            await truffleAssert.reverts(
                planets.approve(accounts[0], 0, {from: accounts[0]})
            );
        });

        it("Can not call getApproved on not existing token", async () => {
            await truffleAssert.reverts(
                planets.getApproved(5)
            );
        });

        it("Should be owner or approved to transfer", async () => {
            await truffleAssert.reverts(
                planets.transfer(accounts[0], 0, {from: accounts[2]})
            );
        });

        it("Can not transfer to zero address", async () => {
            await truffleAssert.reverts(
                planets.transfer(0, 0, {from: accounts[1]})
            );
        });

        it("Can not transfer to itself", async () => {
            await truffleAssert.reverts(
                planets.transfer(accounts[1], 0, {from: accounts[1]})
            );
        });

        it("Should be owner or approved to transfer from", async () => {
            await truffleAssert.reverts(
                planets.transferFrom(accounts[1], accounts[0], 0, {from: accounts[2]})
            );
        });

        it("From param should be owner to transfer from", async () => {
            await truffleAssert.reverts(
                planets.transferFrom(accounts[0], accounts[2], 0, {from: accounts[1]})
            );
        });

        it("Can not transfer from to zero address", async () => {
            await truffleAssert.reverts(
                planets.transferFrom(accounts[1], 0, 0, {from: accounts[1]})
            );
        });

        it("Can not set approval for all to itself", async () => {
            await truffleAssert.reverts(
                planets.setApprovalForAll(accounts[1], true, {from: accounts[1]})
            );
        });

        it("Can not mint to zero address", async () => {
            await truffleAssert.reverts(
                planets.mint(0, 'Z1', 125, 'Omega12', false, 'green', {from: accounts[1]})
            );
        });

        it("Migration agent should not be set", async () => {
            await truffleAssert.reverts(
                planets.setMigrationAgent(migrationAgent.address, {from: accounts[0]})
            );
        });

        it("Token should exist to migrate", async () => {
            await truffleAssert.reverts(
                planets.migrate(5, {from: accounts[1]})
            );
        });

        it("Only owner can migrate", async () => {
            await truffleAssert.reverts(
                planets.migrate(0, {from: accounts[0]})
            );
        });

    });    

    describe("Check events", function() {
        
        it("Should emit Approval event on approval", async () => {
            let tx = await planets.approve(accounts[0], 0, {from: accounts[1]});
            truffleAssert.eventEmitted(tx, 'Approval');
        });

        it("Should emit Transfer event on transfer", async () => {
            let tx = await planets.transfer(accounts[0], 0, {from: accounts[1]});
            truffleAssert.eventEmitted(tx, 'Transfer');
        });

        it("Should emit Transfer event on transfer from", async () => {
            let tx = await planets.transferFrom(accounts[0],accounts[1], 0, {from: accounts[0]});
            truffleAssert.eventEmitted(tx, 'Transfer');
        });

        it("Should emit ApprovalForAll event on setApprovalForAll", async () => {
            let tx = await planets.setApprovalForAll(accounts[0], true, {from: accounts[1]});
            truffleAssert.eventEmitted(tx, 'ApprovalForAll');
        });

        it("Should emit Transfer event on mint", async () => {
            let tx = await planets.mint(accounts[1], 'Z1', 125, 'Omega12', false, 'green');
            truffleAssert.eventEmitted(tx, 'Transfer');
        });      

    });

});
