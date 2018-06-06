var Migrations = artifacts.require("Lescovex_ABT");
var Migrations1 = artifacts.require("Lescovex_ISC2");

module.exports = function(deployer) {
  deployer.deploy(Migrations,"1000000000000","Lescovex ABT","LCX","0x627306090abaB3A6e1400e9345bC60c78a8BEf57", "0x2191eF87E392377ec08E7c08Eb105Ef5448eCED5");
  deployer.deploy(Migrations1,"1000000000000000", "Lescovex ISC", "LCX", "5", "0x0d1d4e623D10F9FBA5Db95830F7d3839406C6AF2");

};
