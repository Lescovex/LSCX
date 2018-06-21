var Lescovex = artifacts.require("Lescovex_CYC");
var Lescovex2 = artifacts.require("Lescovex_ISC2");


contract('Lescovex Test CYC',  async (accounts) => {


    it("check constructor params", async () => {

      let instance = await Lescovex.deployed();
      let meta = instance;

      //expected values
      let expectedName = "Lescovex CYC";
      let expectedSymbol = "LCX";
      let expectedOwner = 0x627306090abaB3A6e1400e9345bC60c78a8BEf57;
      let expectedAmount = 1000000000000;
      let expectedStandard = "ERC20 Lescovex CYC";
      let expectedDecimals = 18;

      let name=await meta.name();
      let symbol=await meta.symbol();
      let owner=await meta.owner();
      let totalSupply= await meta.totalSupply();
      let balance = await meta.balanceOf(owner);
      balance = balance.toNumber();
      let standard = await meta.standard();
      let decimals = await meta.decimals();
      decimals = decimals.toNumber();

      console.log("Contract owner: " + owner);
      console.log("Contract name: " + name);
      console.log("Token symbol: " + symbol);
      console.log("Total supply: " + totalSupply);
      console.log("Owner balance: " + balance);
      console.log("Standard: " + standard);
      console.log("Decimals: " + decimals);

      assert.equal(name, expectedName, "Name must be equal than expectedName");
      assert.equal(symbol, expectedSymbol, "Symbol must be equal than expectedSymbol");
      assert.equal(owner, expectedOwner, "Owner must be equal than expectedOwner");
      assert.equal(totalSupply, expectedAmount, "Total Supply must be equal than expectedAmount");
      assert.equal(balance, expectedAmount, "Owner balance must be equal than expectedAmount");
      assert.equal(standard, expectedStandard, "Standard must be equal to expectedStandard");
      assert.equal(decimals, expectedDecimals, "Decimals must be equal to expectedDecimals");
      
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

      assert.notEqual(account_one, account_two, "account_one have to be different than account_two");
      assert.notEqual(account_one_starting_balance, account_one_ending_balance, "account_one starting balance and ending balance don't have to be equal");
      assert.notEqual(account_two_starting_balance, account_two_ending_balance, "account_two starting balance and ending balance don't have to be equal");

      assert.equal(account_one_ending_balance, account_one_starting_balance - amount, "Amount wasn't correctly taken from the sender");
      assert.equal(account_one_starting_balance, account_one_ending_balance + amount, "Amount wasn't correctly taken from the sender");
      assert.equal(account_two_ending_balance, account_two_starting_balance + amount, "Amount wasn't correctly sent to the receiver");
      assert.equal(account_two_starting_balance, account_two_ending_balance - amount, "Amount wasn't correctly sent to the receiver");

    });


    it("should approve amount correctly", async () => {

      // Get initial balances of first and second account.
      let account_one = accounts[0];
      let account_two = accounts[1];

      let amount = 10000;


      let instance = await Lescovex.deployed();
      let meta = instance;

      let allowanceBefore = await meta.allowance(account_one, account_one);
      allowanceBefore = allowanceBefore.toNumber();

      await meta.approve(account_one, amount);

      let allowanceAfter = await meta.allowance(account_one, account_one);
      allowanceAfter = allowanceAfter.toNumber();

      console.log("Allowance Before: " + allowanceBefore);
      console.log("Allowance After: " + allowanceAfter);

      assert.notEqual(account_one, account_two, "account_one have to be different than account_two");
      assert.notEqual(allowanceBefore, allowanceAfter, "approved amount before and after allowance don't have to be equal");

      assert.equal(amount, allowanceAfter, "Allowance needs to be equal than amount");


    });


    it("should transferFrom amount correctly", async () => {

      // Get initial balances of first and second account.
      let account_one = accounts[0];
      let account_two = accounts[1];

      let amount = 10000;

      let instance = await Lescovex.deployed();
      let meta = instance;

      let allowanceBefore = await meta.allowance(account_one, account_one);
      allowanceBefore = allowanceBefore.toNumber();

      let balance_start = await meta.balanceOf(account_one);
      balance_start = balance_start.toNumber();

      let balance_start_2 = await meta.balanceOf(account_two);
      balance_start_2 = balance_start_2.toNumber();

      await meta.transferFrom(account_one, account_two, amount);

      let allowanceAfter = await meta.allowance(account_one, account_one);
      allowanceAfter = allowanceAfter.toNumber();

      let balance_end = await meta.balanceOf(account_one);
      balance_end = balance_end.toNumber();

      let balance_end_2 = await meta.balanceOf(account_two);
      balance_end_2 = balance_end_2.toNumber();

      console.log("Allowance before transfer: " + allowanceBefore);
      console.log("Allowance after transfer: " + allowanceAfter);
      console.log("Sender Balance Start: " + balance_start);
      console.log("Receiver Balance Start: " + balance_start_2);
      console.log("Sender Balance End: " + balance_end);
      console.log("Receiver Balance End: " + balance_end_2);

      assert.notEqual(account_one, account_two, "account_one have to be different than account_two");
      assert.notEqual(balance_start, balance_end, "account_one starting balance and ending balance don't have to be equal");
      assert.notEqual(balance_start_2, balance_end_2, "account_two starting balance and ending balance don't have to be equal");
      assert.notEqual(allowanceBefore, allowanceAfter, "allowance before and after transfer don't have to be equal");

      assert.equal(balance_end, balance_start - (balance_end_2 - amount), "Amount wasn't correctly sent to the receiver");
      assert.equal(balance_end, balance_start - amount, "Balance after transfer must to be equal than balance before transfer minus amount transferred");
      assert.equal(balance_start, balance_end + amount, "Balance before transfer must to be equal than balance after transfer plus amount transferred");
      assert.equal(balance_end_2, balance_start_2 + amount, "Balance after transfer must to be equal than balance before transfer minus amount transferred");
      assert.equal(balance_start_2, balance_end_2 - amount, "Balance before transfer must to be equal than balance after transfer plus amount transferred");

    });


    it("should increase appproval amount correctly", async () => {
      let account_one = accounts[0];
      let account_two = accounts[1];

      let amount = 10000;

      let instance = await Lescovex.deployed();
      let meta = instance;

      await meta.approve(account_two, amount);

      let allowanceBefore = await meta.allowance(account_one, account_two);
      allowanceBefore = allowanceBefore.toNumber();

      await meta.increaseApproval(account_two, amount);

      let amount_two = amount + amount;

      let allowanceAfter = await meta.allowance(account_one, account_two);
      allowanceAfter = allowanceAfter.toNumber();

      console.log("Balance before increaseApproval: " + allowanceBefore);
      console.log("Balance after increaseApproval: " + allowanceAfter);

      assert.notEqual(account_one, account_two, "account_one have to be different than account_two");
      assert.notEqual(allowanceBefore, allowanceAfter, "balance allowed before don't have to be equal than balance allowed after");

      assert.equal(allowanceBefore, amount, "Allowance must be equal than amount");
      assert.equal(allowanceAfter, amount_two, "Allowance must be equal than amount");
    });

    it("should decrease appproval amount correctly", async () => {
      let account_one = accounts[0];
      let account_two = accounts[1];

      let amount = 20000;

      let instance = await Lescovex.deployed();
      let meta = instance;

      await meta.approve(account_two, amount);

      let allowanceBefore = await meta.allowance(account_one, account_two);
      allowanceBefore = allowanceBefore.toNumber();

      let amount_two = amount / 2;

      await meta.decreaseApproval(account_two, amount_two);

      let allowanceAfter = await meta.allowance(account_one, account_two);
      allowanceAfter = allowanceAfter.toNumber();

      console.log("Balance before decreaseApproval: " + allowanceBefore);
      console.log("Balance after decreaseApproval: " + allowanceAfter);

      assert.notEqual(account_one, account_two, "account_one have to be different than account_two");
      assert.notEqual(allowanceBefore, allowanceAfter, "balance allowed before don't have to be equal than balance allowed after")

      assert.equal(allowanceBefore, amount, "Allowance must be equal than amount");
      assert.equal(allowanceAfter, amount_two, "Allowance must be equal than amount");

    });


    it("should approve and communicate the approved correctly", async () => {
      let account_one = accounts[0];

      let amount = 20000;

      let instance = await Lescovex.deployed();
      let meta = instance;


      let instance_two = await Lescovex2.deployed();

      let contractAddress = instance_two.address;

      let allowanceBefore = await meta.allowance(account_one, contractAddress);
      allowanceBefore = allowanceBefore.toNumber();

      let _data = "";

      await meta.approveAndCall(contractAddress, amount, _data);

      let allowanceAfter = await meta.allowance(account_one, contractAddress);
      allowanceAfter = allowanceAfter.toNumber();

      console.log("Balance allowed after approveAndCall: " + allowanceAfter);

      assert.notEqual(account_one, contractAddress, "account_one don't have to be equal than addressContract");
      assert.notEqual(allowanceBefore, allowanceAfter, "allowanceBefore approveAndCall don't have to be equal than allowanceAfter");

      assert.equal(allowanceAfter, amount, "Allowance must be equal than amount after approveAndCall function");
    });
});
