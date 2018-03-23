var Lescovex = artifacts.require("Lescovex_ABT");
var Lescovex2 = artifacts.require("Lescovex_ISC2");


contract('Lescovex Test ABT',  async (accounts) => {


    it("check contructor params", async () => {

      let instance = await Lescovex.deployed();
      let meta = instance;

      let name=await meta.name();
      let symbol=await meta.symbol();
      let owner=await meta.owner();
      let totalSupply= await meta.totalSupply();


      console.log("Contract owner: " + owner + " totalSupply : " + totalSupply + " symbol : " + symbol + " name: " + name) ;

    });



    it("should transfer coin correctly", async () => {

      // Get initial balances of first and second account.
      let account_one = accounts[0];
      let account_two = accounts[1];

      let amount = 10000;


      let instance = await Lescovex.deployed();
      let meta = instance;

      let balance = await meta.balanceOf.call(account_one);
      let account_one_starting_balance = balance.toNumber();

      balance = await meta.balanceOf.call(account_two);
      let account_two_starting_balance = balance.toNumber();
      
      await meta.transfer(account_two, amount);

      balance = await meta.balanceOf.call(account_one);
      let account_one_ending_balance = balance.toNumber();

      balance = await meta.balanceOf.call(account_two);
      let account_two_ending_balance = balance.toNumber();

      console.log("Account Balances : " + account_one_ending_balance+" "+account_two_ending_balance);


      assert.equal(account_one_ending_balance, account_one_starting_balance - amount, "Amount wasn't correctly taken from the sender");
      assert.equal(account_two_ending_balance, account_two_starting_balance + amount, "Amount wasn't correctly sent to the receiver");


    });


    it("should approve amount correctly", async () => {

      // Get initial balances of first and second account.
      let account_one = accounts[0];
      let account_two = accounts[1];

      let amount = 10000;


      let instance = await Lescovex.deployed();
      let meta = instance;


      await meta.approve(account_one, amount);

      let balance = await meta.allowance(account_one, account_one);
      let allowance = balance.toNumber();

      console.log("Allowance Balance : " + allowance);


      assert.equal(amount, allowance, "Allowance needs to be equal than amount");


    });


    it("should transferFrom amount correctly", async () => {

      // Get initial balances of first and second account.
      let account_one = accounts[0];
      let account_two = accounts[1];

      let amount = 10000;

      let instance = await Lescovex.deployed();
      let meta = instance;

      let balance_start = await meta.balanceOf(account_one);
      balance_start = balance_start.toNumber();

      let balance_start_2 = await meta.balanceOf(account_two);
      balance_start_2 = balance_start_2.toNumber();

      await meta.transferFrom(account_one, account_two, amount);

      let balance_end = await meta.balanceOf(account_one);
      balance_end = balance_end.toNumber();

      let balance_end_2 = await meta.balanceOf(account_two);
      balance_end_2 = balance_end_2.toNumber();

      console.log("Sender Balance Start: " + balance_start);
      console.log("Receiver Balance Start: " + balance_start_2);
      console.log("Sender Balance End: " + balance_end);
      console.log("Receiver Balance End: " + balance_end_2);


      assert.equal(balance_end, balance_start - (balance_end_2 - amount), "Amount wasn't correctly sent to the receiver");


    });

    it("should increase appproval amount correctly", async () => {
      let account_one = accounts[0];
      let account_two = accounts[1];

      let amount = 10000;

      let instance = await Lescovex.deployed();
      let meta = instance;

      await meta.approve(account_two, amount);

      let balanceBefore = await meta.allowance(account_one, account_two);
      let allowanceBefore = balanceBefore.toNumber();

      console.log("Balance before increaseApproval: " + allowanceBefore);

      assert.equal(allowanceBefore, amount, "Allowance must be equal than amount");

      await meta.increaseApproval(account_two, amount);

      amount = amount + amount;
      let balanceAfter = await meta.allowance(account_one, account_two);
      let allowanceAfter = balanceAfter.toNumber();

      console.log("Balance after increaseApproval: " + allowanceAfter);

      assert.equal(allowanceAfter, amount, "Allowance must be equal than amount");
    });

    it("should decrease appproval amount correctly", async () => {
      let account_one = accounts[0];
      let account_two = accounts[1];

      let amount = 20000;

      let instance = await Lescovex.deployed();
      let meta = instance;

      await meta.approve(account_two, amount);

      let balanceBefore = await meta.allowance(account_one, account_two);
      let allowanceBefore = balanceBefore.toNumber();

      console.log("Balance before decreaseApproval: " + allowanceBefore);

      assert.equal(allowanceBefore, amount, "Allowance must be equal than amount");

      amount = amount / 2;

      await meta.decreaseApproval(account_two, amount);

      let balanceAfter = await meta.allowance(account_one, account_two);
      let allowanceAfter = balanceAfter.toNumber();

      console.log("Balance after decreaseApproval: " + allowanceAfter);

      assert.equal(allowanceAfter, amount, "Allowance must be equal than amount");

    });


    it("should approve and communicate the approved correctly", async () => {
      let account_one = accounts[0];

      let amount = 20000;

      let instance = await Lescovex.deployed();
      let meta = instance;


      let instance2 = await Lescovex2.deployed();

      let addressContract = instance2.address;

      let _data = "";

      await meta.approveAndCall(addressContract, amount, _data);

      let balanceAfter = await meta.allowance(account_one, addressContract);
      let allowanceAfter = balanceAfter.toNumber();

      console.log("Balance allowed after approveAndCall: " + allowanceAfter);

      assert.equal(allowanceAfter, amount, "Allowance must be equal than amount after approveAndCall function");

    });
});
