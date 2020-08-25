const Web3 = require("web3");
const Client = require("../anonymous.js/src/client.js");
const ZSC = require("../contract-artifacts/artifacts/ZSC.json");
const zv = require("../contract-artifacts/artifacts/ZetherVerifier.json");
const Deployer = require('./deployer.js');
const Provider = require('./provider.js');
const utils = require('../anonymous.js/src/utils/utils.js');

const run = async () => {
    var provider = new Provider("ws://127.0.0.1:8546");
    const web3 = new Web3(await provider.getProvider());
    const accounts = await web3.eth.getAccounts();
    const web3Http = new Web3(new Web3.providers.HttpProvider("http://127.0.0.1:8545"))
    await web3Http.eth.personal.unlockAccount(accounts[0], '123')
    await web3Http.eth.personal.unlockAccount(accounts[3], '123')
    await web3Http.eth.personal.unlockAccount(accounts[4], '123')
    await web3Http.eth.personal.unlockAccount(accounts[5], '123')
    var deployer = new Deployer(accounts);
    const [
        cash, [zether, burn]
    ] = await Promise.all([deployer.deployCashToken().then((result) => result.contractAddress), deployer.deployInnerProductVerifier().then((result) => {

        console.log('deployer', result)
        ip = result.contractAddress;
        return Promise.all([deployer.deployZetherVerifier(ip), deployer.deployBurnVerifier(ip)]).then((results) => results.map((result) => result.contractAddress));
    })]);

    const zsc = await Promise.all([deployer.deployZSC(cash, zether, burn, 10), deployer.mintCashToken(cash, 1000)]).then((results) => results[0].contractAddress);
    await deployer.approveCashToken(cash, zsc, 1000);
    const deployed = new web3.eth.Contract(ZSC.abi, zsc);
    const deployedZether = new web3.eth.Contract(zv.abi, zether);
    const alice = new Client(web3, deployed, accounts[0], deployedZether);
    await alice.register();
    await alice.deposit(100);
    const bob = new Client(web3, deployed, accounts[3]);
    await bob.register();
    alice.friends.add("Bob", bob.account.public());
    const Billy = new Client(web3, deployed, accounts[4]);
    const Jack = new Client(web3, deployed, accounts[5]);
    await Billy.register();
    await Jack.register();
    alice.friends.add("Billy", bob.account.public());
    alice.friends.add("Jack", bob.account.public());
    await alice.transfer('Bob', 11, ["Billy", "Jack"]);
  //  await alice.withdraw(10);
 //   await alice.transfer('Bob', 10);
};

run().catch(console.error);

