const Web3 = require("web3");
const Client = require("../anonymous.js/src/client.js");
const ZSC = require("../contract-artifacts/artifacts/ZSC.json");
const Deployer = require('./deployer.js');
const Provider = require('./provider.js');
const utils = require('../anonymous.js/src/utils/utils.js');

const run = async () => {
    var provider = new Provider("ws://localhost:23000");
    const web3 = new Web3(await provider.getProvider());
    const accounts = await web3.eth.getAccounts();

    var deployer = new Deployer(accounts);
    const [
        cash, [zether, burn]
    ] = await Promise.all([deployer.deployCashToken().then((result) => result.contractAddress), deployer.deployInnerProductVerifier().then((result) => {
        ip = result.contractAddress;
        return Promise.all([deployer.deployZetherVerifier(ip), deployer.deployBurnVerifier(ip)]).then((results) => results.map((result) => result.contractAddress));
    })]);

    const zsc = await Promise.all([deployer.deployZSC(cash, zether, burn, 6), deployer.mintCashToken(cash, 1000)]).then((results) => results[0].contractAddress);
    await deployer.approveCashToken(cash, zsc, 10000);
    const deployed = new web3.eth.Contract(ZSC.abi, zsc);

    const alice = new Client(web3, deployed, accounts[0]);
    await alice.register();
    await alice.deposit(1000);
    await alice.withdraw(10);
    const bob = new Client(web3, deployed, accounts[0]);
    await bob.register();
    alice.friends.add("Bob", bob.account.public());
    await alice.deposit(1000);

    for (var i = 0; i < 3; i ++){
        var j = i + 1;
        console.log("=================================第" + j +"次循环=========================================");
        //await alice.withdraw(3);
        //await alice.transfer('Bob', 1000000);
        await alice.transfer('Jack', 200, ["Billy", "Bob"]);
        //await alice.transfer('Billy2', 2, ["Billy", "Jack", "Billy1", "Jack1", "Bob", "Jack2"]);
        //await alice.transfer('Jack5', 4, ["Billy", "Jack", "Billy1", "Jack1", "Bob", "Billy2", "Jack2","Billy3", "Jack3","Billy4", "Jack4","Billy5", "Billy6", "Jack6"]);
    }
};

run().catch(console.error);