var Migrations = artifacts.require("Lescovex_ISC");

module.exports = function(deployer) {
deployer.deploy(Migrations,"1000000000000000", "Lescovex ISC", "LCX", "5", "0x627306090abaB3A6e1400e9345bC60c78a8BEf57");
};
