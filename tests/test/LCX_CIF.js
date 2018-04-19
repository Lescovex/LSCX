var Lescovex = artifacts.require("Lescovex_CIF");
var Lescovex2 = artifacts.require("Lescovex_ISC2");

contract('Lescovex Test CIF',  async (accounts) => {

    it("check constructor params", async () => {

      let instance = await Lescovex.deployed();
      let meta = instance;

      //expected values
      let expectedName = "Lescovex CIF";
      let expectedSymbol = "LCX";
      let expectedOwner = 0x627306090abaB3A6e1400e9345bC60c78a8BEf57;
      let expectedHoldTime = 2;
      let expectedHoldMax = 50;
      let expectedMaxSupply = 10001;
      let expectedAmount = 0;

      let totalSupply = await meta.totalSupply();
      let name=await meta.name();
      let symbol=await meta.symbol();
      let holdTime=await meta.holdTime();
      let holdMax=await meta.holdMax();
      let maxSupply = await meta.maxSupply();
      let owner=await meta.owner();
      let balance = await meta.balanceOf(owner);
      balance = balance.toNumber();
      let initialPrice= 1000000000000000;
      await meta.setPrice(initialPrice);

      console.log("Contract name: " + name);
      console.log("Contract owner: " + owner);
      console.log("Token symbol: " + symbol);
      console.log("Hold time: " + holdTime);
      console.log("Hold max: " + holdMax);
      console.log("Max supply: " + maxSupply);
      console.log("Total supply: " + totalSupply);
      console.log("Owner balance: " + balance);

      assert.equal(name, expectedName, "Name and expectedName must be equal");
      assert.equal(symbol, expectedSymbol, "Symbol and expectedSymbol must be equal");
      assert.equal(owner, expectedOwner, "Owner and expected owner must be equal");
      assert.equal(holdTime, expectedHoldTime, "Hold time and expectedHoldTime must be equal");
      assert.equal(holdMax, expectedHoldMax, "Hold max and expectedHoldMax must be equal");
      assert.equal(maxSupply, expectedMaxSupply, "maxSupply and expectedMaxSupply must be equal");
      assert.equal(totalSupply, expectedAmount, "totalSupply must be equal than expected amount");
      assert.equal(balance, expectedAmount, "Owner balance and expected amount must be equal");
    });



    it("should buy amount correctly", async () => {
      let account_one = accounts[0];

      let amount = 1000000000000000000;

      let instance = await Lescovex.deployed();
      let meta = instance;

      let owner = await meta.owner();

      let ownerBalanceBefore = await meta.balanceOf.call(owner);
      ownerBalanceBefore = ownerBalanceBefore.toNumber();

      await meta.buy({value:amount});

      let contractEth=await meta.contractBalance();
      contractEth = contractEth.toNumber();

      let ownerBalance = await meta.balanceOf.call(owner);
      ownerBalance = ownerBalance.toNumber();

      let tokenReward= await meta.tokenPrice();
      tokenReward = tokenReward.toNumber();

      let totalSupply= await meta.totalSupply();
      totalSupply = totalSupply.toNumber();

      let tokenUnit = await meta.tokenUnit();
      tokenUnit = tokenUnit.toNumber();

      let tokenPrice = await meta.tokenPrice();
      tokenPrice = tokenPrice.toNumber();

      console.log("Contract ETH: " + contractEth + " Owner Balance: "+ ownerBalance+" tokenReaward : "+tokenReward);

      assert.notEqual(ownerBalanceBefore, ownerBalance, "ownerBalance before and after don't have to be equal after buy");

      assert.equal(totalSupply , (amount*tokenUnit)/tokenPrice , "total supply must be equal (amount*tokenUnit)/tokenPrice");
      assert.equal(ownerBalance, (amount*tokenUnit)/tokenPrice, "ownerBalance must be equal than (amount*tokenUnit)/tokenPrice")
      assert.equal(ownerBalance, totalSupply, "ownerBalance must to be equal than totalSupply");

    });


    it("should deposit amount correctly", async () => {

      let amount = 1000000000000000000;

      let instance = await Lescovex.deployed();
      let meta = instance;

      let contractEthBefore=await meta.contractBalance();
      contractEthBefore = contractEthBefore.toNumber();

      await meta.deposit({value:amount});

      let contractEth=await meta.contractBalance();
      contractEth = contractEth.toNumber();

      let tokenReward= await meta.tokenPrice();

      let totalSupply= await meta.totalSupply();

      console.log("Contract ETH: "+ contractEth+" tokenReaward : " + tokenReward + " totalSupply : " + totalSupply);

      assert.notEqual(contractEthBefore, contractEth, "contractEth don't have to be equal before and after deposit");

      assert.equal(contractEth , amount, "contractEth must be equal than amount deposited");

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

      let holded_account_two = await meta.holdedOf(account_two, 0);

      console.log("Holded : "+ holded_account_two);

      assert.notEqual(account_one, account_two, "account_one have to be different than account_two");
      assert.notEqual(account_one_starting_balance, account_one_ending_balance, "account_one starting balance and ending balance don't have to be equal");
      assert.notEqual(account_two_starting_balance, account_two_ending_balance, "account_two starting balance and ending balance don't have to be equal");

      assert.equal(account_one_ending_balance, account_one_starting_balance - amount, "Amount wasn't correctly taken from the sender");
      assert.equal(account_two_ending_balance, account_two_starting_balance + amount, "Amount wasn't correctly sent to the receiver");
      assert.equal(account_one_starting_balance, account_one_ending_balance + amount, "Amount wasn't correctly taken from the sender");
      assert.equal(account_two_starting_balance, account_two_ending_balance - amount, "Amount wasn't correctly sent to the receiver");
      assert.equal(amount, holded_account_two, "Holded needs to be equal than amount");

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

      let holded_start = await meta.holdedOf(account_one, 0);
      holded_start = holded_start.toNumber();

      let balance_start_2 = await meta.balanceOf(account_two);
      balance_start_2 = balance_start_2.toNumber();

      await meta.transferFrom(account_one, account_two, amount);

      let allowanceAfter = await meta.allowance(account_one, account_one);
      allowanceAfter = allowanceAfter.toNumber();

      let balance_end = await meta.balanceOf(account_one);
      balance_end = balance_end.toNumber();

      let holded_end = await meta.holdedOf(account_one, 0);
      holded_end = holded_end.toNumber();

      let balance_end_2 = await meta.balanceOf(account_two);
      balance_end_2 = balance_end_2.toNumber();

      let holded_account_two = await meta.holdedOf(account_two, 1);

      console.log("Allowance before transfer: " + allowanceBefore);
      console.log("Allowance after transfer: " + allowanceAfter);
      console.log("Sender Balance Start: " + balance_start);
      console.log("Receiver Balance Start: " + balance_start_2);
      console.log("Sender Balance End: " + balance_end);
      console.log("Receiver Balance End: " + balance_end_2);
      console.log("Holded : "+ holded_account_two);


      assert.notEqual(holded_start, holded_end, "Holded amount of owner account before and after transfer don't have to be equal");
      assert.notEqual(account_one, account_two, "account_one have to be different than account_two");
      assert.notEqual(balance_start, balance_end, "account_one starting balance and ending balance don't have to be equal");
      assert.notEqual(balance_start_2, balance_end_2, "account_two starting balance and ending balance don't have to be equal");
      assert.notEqual(allowanceBefore, allowanceAfter, "allowance before and after transfer don't have to be equal");


      assert.equal(amount, holded_account_two, "Holded not is the final amount");
      assert.equal(balance_end, balance_start - (balance_end_2 - amount), "Amount wasn't correctly sent to the receiver");
      assert.equal(balance_end, balance_start - amount, "Balance after transfer must to be equal than balance before transfer minus amount transferred");
      assert.equal(balance_start, balance_end + amount, "Balance before transfer must to be equal than balance after transfer plus amount transferred");
      assert.equal(balance_end_2, balance_start_2 + amount, "Balance after transfer must to be equal than balance before transfer minus amount transferred");
      assert.equal(balance_start_2, balance_end_2 - amount, "Balance before transfer must to be equal than balance after transfer plus amount transferred");


    });


    it("should request withdraw reward amount correctly", async () => {

      let account_one = accounts[0];

      let instance = await Lescovex.deployed();
      let meta = instance;
      let amount = 10000000000;

      await meta.requestWithdraw(amount);

      let holded = await meta.holdedOf(account_one, 0);
      holded = holded.toNumber();

      assert.notEqual(amount , 0, "amount can't be 0");

      assert.equal(amount, holded, "amount holded must be equal than the amount that we've requested to withdraw");

    });

    it("wait block for withdraw", async () => {
      let instance = await Lescovex.deployed();
      let meta = instance;
      let amount = 1000000000000000000;

      await meta.deposit({value:amount});
      await meta.deposit({value:amount});
      await meta.deposit({value:amount});
      await meta.deposit({value:amount});
      await meta.deposit({value:amount});
      await meta.deposit({value:amount});
      await meta.deposit({value:amount});
      await meta.deposit({value:amount});

    });

     it("should withdraw reward amount correctly", async () => {

      let account_one = accounts[0];
      let account_two = accounts[1];

      let instance = await Lescovex.deployed();
      let meta = instance;

      let balanceBefore= await meta.balanceOf(account_one);
      balanceBefore = balanceBefore.toNumber();

      let contractEth=await meta.contractBalance();

      let tokenPrice= await meta.tokenPrice();
      tokenPrice = tokenPrice.toNumber();

      let totalSupply= await meta.totalSupply();
      totalSupply = totalSupply.toNumber();

      let holdedBefore = await meta.holdedOf(account_one, 0);
      holdedBefore = holdedBefore.toNumber();

      await meta.withdrawReward();

      let balanceAfter = await meta.balanceOf(account_one);
      balanceAfter = balanceAfter.toNumber();

      let holdedAfter = await meta.holdedOf(account_one, 0);
      holdedAfter = holdedAfter.toNumber();

      let amount = 10000000000;

      assert.notEqual(balanceBefore, balanceAfter, "balance before and after don't have to be equal");
      assert.notEqual(holdedBefore, holdedAfter, "holded amount before and after don't have to be equal");

      assert.equal(amount, holdedBefore, "holded amount must be equal than the last amount that we've requested to withdraw");
      assert.equal(balanceAfter, holdedAfter, "holded amount must be equal than the balance after withdraw");
      assert.equal((balanceBefore - balanceAfter), amount, "the difference between balanceBefore and balanceAfter must be equal than amount requested to withdraw");

    });

    it("should increasse approval amount correctly", async () => {
      let account_one = accounts[0];
      let account_two = accounts[1];

      let amount = 50000;

      let instance = await Lescovex.deployed();
      let meta = instance;

      await meta.approve(account_two, amount);

      let allowanceBefore = await meta.allowance(account_one, account_two);
      allowanceBefore = allowanceBefore.toNumber();

      await meta.increaseApproval(account_two, amount);

      let amount_two = amount + amount;

      let allowanceAfter = await meta.allowance(account_one, account_two);
      allowanceAfter = allowanceAfter.toNumber();

      console.log("Balance allowed before increaseApproval: " + allowanceBefore);
      console.log("Balance allowed after increaseApproval: " + allowanceAfter);

      assert.notEqual(account_one, account_two, "account_one have to be different than account_two");
      assert.notEqual(allowanceBefore, allowanceAfter, "balance allowed before don't have to be equal than balance allowed after");

      assert.equal(allowanceBefore, amount, "Allowance must be equal than amount approved.");
      assert.equal(allowanceAfter, amount_two, "Allowance must be equal than amount multiplied by two.");

    });

    it("should decrease approval amount correctly", async () => {
      let account_one = accounts[0];
      let account_two = accounts[1];

      let amount = 100000;

      let instance = await Lescovex.deployed();
      let meta = instance;

      let allowanceBefore = await meta.allowance(account_one, account_two);
      allowanceBefore = allowanceBefore.toNumber();

      let amount_two = amount / 2;

      await meta.decreaseApproval(account_two, amount_two);

      let allowanceAfter = await meta.allowance(account_one, account_two);
      allowanceAfter = allowanceAfter.toNumber();

      console.log("Balance allowed before decreaseApproval: " + allowanceBefore);
      console.log("Balance allowed after decreaseApproval: " + allowanceAfter);

      assert.notEqual(account_one, account_two, "account_one have to be different than account_two");
      assert.notEqual(allowanceBefore, allowanceAfter, "balance allowed before don't have to be equal than balance allowed after");

      assert.equal(allowanceBefore, amount, "Allowance must be equal than the last amount approved");
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

      let balanceAfter = await meta.allowance(account_one, contractAddress);
      let allowanceAfter = balanceAfter.toNumber();

      console.log("Balance allowed after approveAndCall: " + allowanceAfter);

      assert.notEqual(account_one, contractAddress, "account_one don't have to be equal than addressContract");
      assert.notEqual(allowanceBefore, allowanceAfter, "allowanceBefore approveAndCall don't have to be equal than allowanceAfter");

      assert.equal(allowanceAfter, amount, "Allowance must be equal than amount after approveAndCall function");

    });
});
