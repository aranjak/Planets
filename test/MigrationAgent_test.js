const ERC721 = artifacts.require("./ERC721");
const ERC721_NEW = artifacts.require("./ERC721_NEW");
const SaleAgent = artifacts.require("./SaleAgent");
const MigrationAgent = artifacts.require("./MigrationAgent");

const assert = require("chai").assert;
const truffleAssert = require('truffle-assertions');

contract('MigrationAgent', function(accounts) {
    
    beforeEach(async function() {
        planets = await ERC721.deployed();
        saleAgent = await SaleAgent.deployed();
        migrationAgent = await MigrationAgent.deployed();
        planets2 = await ERC721_NEW.deployed();
    });

    describe("Check initial values", function() {

        it("Source contract address should not be zero", async function() {
            let source_address = await migrationAgent.source_contract();
            assert.isTrue(source_address != 0x0, "Wrong initial total supply");
        });

        it("Target contract address should be zero", async function() {
            let target_address = await migrationAgent.target_contract();
            assert.isTrue(target_address == 0x0, "Wrong initial total supply");
        });       

    })

    describe("Check set functions", function() {

        it("Setup correctly target address", async function() {
            await migrationAgent.setTargetToken(ERC721_NEW.address, {from: accounts[0]});
            let target_address = await migrationAgent.target_contract();
            assert.isTrue(ERC721_NEW.address == target_address, "Target address is wrong");
        });

    });  
    
    describe("Check modifiers", function() {

        it("Only owner can setup target contract", async () => {
            await truffleAssert.reverts(
                migrationAgent.setTargetToken(ERC721_NEW.address, {from: accounts[1]})
            );
        });

        it("Only owner can finalize migration", async () => {
            await truffleAssert.reverts(
                migrationAgent.finalizeMigration({from: accounts[1]})
            );
        });
    });  
    
    describe("Check requirements", function() {
       
        it("Target contract should not be set", async () => {
            await truffleAssert.reverts(
                migrationAgent.setTargetToken(ERC721_NEW.address ,{from: accounts[0]})
            );
        });

        it("Only source contract can call migrate", async () => {
            await truffleAssert.reverts(
                migrationAgent.migrateToken( accounts[0], 0, 'Z1', 125, 'Omega12', false, 'green', false, 2e17, {from: accounts[0]})
            );
        });

        
    });   

    describe("Check migration", function() {
        
        it("Check setup Migration agent", async () => {
            await planets.setMigrationAgent(migrationAgent.address, {from: accounts[0]});
            await planets2.setMigrationAgent(migrationAgent.address, {from: accounts[0]});
            let migration_agent = await planets.MigrationAgent();
            let migration_agent2 = await planets2.MigrationAgent();

            assert.isTrue(migrationAgent.address == migration_agent, "Migration agent address is wrong");
            assert.isTrue(migrationAgent.address == migration_agent2, "Migration agent address is wrong");
        });

        it("Check migration process", async () => {
            await planets.mint(accounts[1], 'Z1', 125, 'Omega12', false, 'green');
            await planets.mint(accounts[1], 'Z2', 145, 'Omega12', true, 'blue');
            await planets.mint(accounts[1], 'Z3', 145, 'Omega12', true, 'blue');

            await planets.migrate(0, {from: accounts[1]});
            let owner = await planets2.ownerOf(0);
            assert.isTrue( accounts[1] == owner, "Target owner is wrong");

            let planetData = await planets2.getPlanetData(0);
            assert.isTrue(planetData[0] == 'Z1', "Planet name is wrong");
            assert.isTrue(planetData[1].toNumber() == 125, "Planet age is wrong");
            assert.isTrue(planetData[2] == 'Omega12', "Planet star system is wrong");
            assert.isTrue(planetData[3] == false, "Planet life status is wrong");
            assert.isTrue(planetData[4] == 'green', "Planet color is wrong");

        });

        it("Should emit Migrate event on migration", async () => {
            let tx = await planets.migrate(2, {from: accounts[1]})
            truffleAssert.eventEmitted(tx, 'Migrate');
        });

        it("Check finalize migration", async () => {
            await migrationAgent.finalizeMigration({from: accounts[0]});
            await truffleAssert.reverts(
                planets.migrate(1, {from: accounts[1]})
            );
        });      

    });
});


