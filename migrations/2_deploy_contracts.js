const ERC721 = artifacts.require("ERC721");
const ERC721_NEW = artifacts.require("ERC721_NEW");
const SaleAgent = artifacts.require("SaleAgent");
const MigrationAgent = artifacts.require("MigrationAgent");

module.exports = async deployer => {
    return deployer.deploy(ERC721)
        .then((ERC721Instance) => {
            console.log('1 ERC721: ', ERC721.address);
            return deployer.deploy(SaleAgent, ERC721.address).then((SaleAgentInstance) => {
                console.log('2 SaleAgent: ', SaleAgent.address);
                return deployer.deploy(MigrationAgent, ERC721.address).then((MigrationAgentInstance) => {
                    console.log('3 MigrationAgent: ', MigrationAgent.address);
                    return deployer.deploy(ERC721_NEW).then((ERC721_NEWInstance) => {
                        console.log('4 ERC721_NEW: ', ERC721_NEWInstance.address);

                        ERC721Instance.init('Planets', 'PLN');
                        ERC721_NEWInstance.init('Planets2', 'PLN');
                        // ERC721Instance.setSaleAgent(SaleAgent.address);
                        // ERC721Instance.setMigrationAgent( MigrationAgent.address);

                        // ERC721Instance.mint('0xc0f6296785db11b38bee43c36505625dc53a4e74', 'Z1', '25', 'Omega25', false, 'blue');
                        // ERC721Instance.mint('0xc0f6296785db11b38bee43c36505625dc53a4e74', 'Z2', '48', 'Alfa25', false, 'green');
                    });
                });
            });
        });
};
