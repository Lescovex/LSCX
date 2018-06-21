var Lescovex = artifacts.require("Lescovex_ISC");
var Lescovex2 = artifacts.require("Lescovex_ISC2");


contract('Lescovex Test ISC',  async (accounts) => {

    it("check constructor params", async () => {
      let instance = await Lescovex.deployed();
      let meta = instance;

      //expected values
      let expectedAmount = 2000000000000000;
      let expectedName = "Lescovex ISC";
      let expectedSymbol = "LCX";
      let expectedHoldTime = 2;
      let expectedOwner = 0x627306090abaB3A6e1400e9345bC60c78a8BEf57;
      let expectedContractBalance = 0;
      let expectedStandard = "ERC20 Lescovex ISC Income Smart Contract";
      let expectedDecimals = 8;
      let expectedHoldMax = 100;

      let totalSupply = await meta.totalSupply();
      let name = await meta.name();
      let symbol = await meta.symbol();
      let holdTime = await meta.holdTime();
      let owner = await meta.owner();
      let balance = await meta.balanceOf(owner);
      balance = balance.toNumber();
      let contractBalance = await meta.contractBalance();
      let standard = await meta.standard();
      let decimals = await meta.decimals();
      let holdMax = await meta.holdMax();

      console.log("Contract owner: " + owner);
      console.log("Contract name: " + name);
      console.log("Tokem symbol: " + symbol);
      console.log("Hold time: " + holdTime);
      console.log("Total supply: " + totalSupply);
      console.log("Owner balance: " + balance);
      console.log("Contract balance: " + contractBalance);
      console.log("Standard: " + standard);
      console.log("Decimals: " + decimals);
      console.log("holdMax: " + holdMax);

      assert.equal(name, expectedName, "Name and expectedName must be equal");
      assert.equal(symbol, expectedSymbol, "Symbol and expectedSymbol must be equal");
      assert.equal(owner, expectedOwner, "Owner and expectedOwner must be equal");
      assert.equal(holdTime, expectedHoldTime, "Hold time and expectedHoldTime must be equal");
      assert.equal(totalSupply, expectedAmount, "totalSupply and expected amount must be equal");
      assert.equal(balance, expectedAmount, "Owner balance and expected amount must be equal");
      assert.equal(contractBalance, expectedContractBalance, "contractBalance must be equal to expectedContractBalance");
      assert.equal(standard, expectedStandard, "standard must be equal to expectedStandard");
      assert.equal(holdMax, expectedHoldMax, "holdMax must be equal to expectedHoldMax");

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

      console.log("Contract ETH Before: "+ contractEthBefore + " Contract ETH After: " + contractEth);

      assert.notEqual(contractEthBefore, contractEth, "contractEth don't have to be equal before and after deposit");

      assert.equal(contractEth, amount, "contractEth must be equal than amount deposited");

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

      let holded_account_one = await meta.holdedControl(account_one);
      holded_account_one = holded_account_one.toNumber();
      console.log(holded_account_one);

      let holded_account_two = await meta.holdedControl(account_two);
      holded_account_two = holded_account_two.toNumber();
      console.log(holded_account_two);

      balance = await meta.balanceOf.call(account_one);
      let account_one_ending_balance = balance.toNumber();

      balance = await meta.balanceOf.call(account_two);
      let account_two_ending_balance = balance.toNumber();

      console.log("Account Balances : " + account_one_ending_balance+" "+account_two_ending_balance);

      console.log("Holded : "+ holded_account_two);

      assert.notEqual(holded_account_one, holded_account_two, "holded amounts of account_one and account_two don't have to be equal");
      assert.notEqual(account_one, account_two, "account_one have to be different than account_two");
      assert.notEqual(account_one_starting_balance, account_one_ending_balance, "account_one starting balance and ending balance don't have to be equal");
      assert.notEqual(account_two_starting_balance, account_two_ending_balance, "account_two starting balance and ending balance don't have to be equal");


      assert.equal(account_one_ending_balance, account_one_starting_balance - amount, "Amount wasn't correctly taken from the sender");
      assert.equal(account_two_ending_balance, account_two_starting_balance + amount, "Amount wasn't correctly sent to the receiver");
      assert.equal(account_one_starting_balance, account_one_ending_balance + amount, "Amount wasn't correctly taken from the sender");
      assert.equal(account_two_starting_balance, account_two_ending_balance - amount, "Amount wasn't correctly sent to the receiver");
      assert.equal(account_one_starting_balance-amount, holded_account_one, "balance - amount of account one have to be equal to holded amount of account one");
      assert.equal(amount, holded_account_two, "Holded needs to be equal than amount");

    });


    it("should approve amount correctly", async () => {

      // Get initial balances of first and second account.
      let account_one = accounts[0];
      let account_two = accounts[1];

      let amount = 20000;


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

      let amount = 20000;

      let instance = await Lescovex.deployed();
      let meta = instance;

      let allowanceBefore = await meta.allowance(account_one, account_one);
      allowanceBefore = allowanceBefore.toNumber();

      let balance_start = await meta.balanceOf(account_one);
      balance_start = balance_start.toNumber();

      let holded_start = await meta.holdedControl(account_one);
      holded_start = holded_start.toNumber();

      let holded_start2 = await meta.holdedControl(account_two);
      holded_start2 = holded_start2.toNumber();

      let balance_start_2 = await meta.balanceOf(account_two);
      balance_start_2 = balance_start_2.toNumber();


      await meta.transferFrom(account_one, account_two, amount);

      let allowanceAfter = await meta.allowance(account_one, account_one);
      allowanceAfter = allowanceAfter.toNumber();

      let balance_end = await meta.balanceOf(account_one);
      balance_end = balance_end.toNumber();

      let holded_end = await meta.holdedControl(account_one);
      holded_end = holded_end.toNumber();

      let holded_end2 = await meta.holdedControl(account_two);
      holded_end2 = holded_end2.toNumber();

      let balance_end_2 = await meta.balanceOf(account_two);
      balance_end_2 = balance_end_2.toNumber();

      console.log("Sender Balance Start: " + balance_start);
      console.log("Receiver Balance Start: " + balance_start_2);
      console.log("Sender Balance End: " + balance_end);
      console.log("Receiver Balance End: " + balance_end_2);


      assert.notEqual(holded_start, holded_end, "Holded amount of owner account before and after transfer don't have to be equal");
      assert.notEqual(holded_start2, holded_end2, "holded amount of receiver account before and after transfer don't have to be equal");
      assert.notEqual(account_one, account_two, "account_one have to be different than account_two");
      assert.notEqual(balance_start, balance_end, "account_one starting balance and ending balance don't have to be equal");
      assert.notEqual(balance_start_2, balance_end_2, "account_two starting balance and ending balance don't have to be equal");
      assert.notEqual(allowanceBefore, allowanceAfter, "allowance before and after transfer don't have to be equal");


      assert.equal(balance_start_2 + amount, holded_end2, "Holded not is the final amount");
      assert.equal(balance_end, balance_start - amount, "Balance after transfer must to be equal than balance before transfer minus amount transferred");
      assert.equal(balance_start, balance_end + amount, "Balance before transfer must to be equal than balance after transfer plus amount transferred");
      assert.equal(balance_end_2, balance_start_2 + amount, "Balance after transfer must to be equal than balance before transfer minus amount transferred");
      assert.equal(balance_start_2, balance_end_2 - amount, "Balance before transfer must to be equal than balance after transfer plus amount transferred");


    });

    it("should withdraw amount correctly", async () => {
      let account_one = accounts[0];

      let amount = 1000000000000000000;

      let instance = await Lescovex.deployed();
      let meta = instance;

      let contractEthBefore=await meta.contractBalance();
      contractEthBefore = contractEthBefore.toNumber();

      await meta.withdraw(amount);

      let contractEth=await meta.contractBalance();
      contractEth = contractEth.toNumber();
      console.log("Contract ETH before: " + contractEthBefore + " Contract ETH after : "+contractEth);

      assert.notEqual(contractEthBefore, contractEth, "contractEth don't have to be equal before and after deposit");

    });

    it("wait block for withdraw", async () => {
      let instance = await Lescovex.deployed();
      let meta = instance;

      let amount = 1000000000000000;

      await meta.deposit({value:amount});
      await meta.deposit({value:amount});
      await meta.deposit({value:amount});
      await meta.deposit({value:amount});
      await meta.deposit({value:amount});
      await meta.deposit({value:amount});
      await meta.deposit({value:amount});
      await meta.deposit({value:amount});
      await meta.deposit({value:amount});
      await meta.deposit({value:amount});
      await meta.deposit({value:amount});
      await meta.deposit({value:amount});
      await meta.deposit({value:amount});
      await meta.deposit({value:amount});
      await meta.deposit({value:amount});
      await meta.deposit({value:amount});
      await meta.deposit({value:amount});
      await meta.deposit({value:amount});
      await meta.deposit({value:amount});
      await meta.deposit({value:amount});
      await meta.deposit({value:amount});
      await meta.deposit({value:amount});
      await meta.deposit({value:amount});
      await meta.deposit({value:amount});
      await meta.deposit({value:amount});
      await meta.deposit({value:amount});
      await meta.deposit({value:amount});
      await meta.deposit({value:amount});
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

      let accBalanceBefore = web3.eth.getBalance(account_one);
      accBalanceBefore = accBalanceBefore.toNumber();

      let instance = await Lescovex.deployed();
      let meta = instance;

      let holdedOf = await meta.holdedOf(account_one);
      holdedOf = holdedOf.toNumber();
      console.log("Holded Before:" + holdedOf);

      let balance = await meta.balanceOf(account_one);
      balance = balance.toNumber();

      await meta.withdrawReward();

      let holdedOfAter = await meta.holdedOf(account_one);
      holdedOfAter = holdedOfAter.toNumber();
      console.log("Holded after: " + holdedOfAter);

      let accBalanceAfter = web3.eth.getBalance(account_one);
      accBalanceAfter = accBalanceAfter.toNumber();

      console.log("Account Balance Before: " + accBalanceBefore);
      console.log("Account Balance After:  "+ accBalanceAfter);

      assert.notEqual(accBalanceBefore, accBalanceAfter, "account balance don't have to be equal before and after withdraw");
      assert.notEqual(holdedOf, holdedOfAter, "holded amount before withdraw don't have to be equal to the amount holded after");

      assert.equal(balance, holdedOf, "balance before withdraw and amount holded must to be equal");
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
      assert.notEqual(allowanceBefore, allowanceAfter, "balance allowed before don't have to be equal than balance allowed after");

      assert.equal(allowanceAfter, amount_two, "Allowance must be equal than amount");
      assert.equal(allowanceBefore, amount, "Allowance must be equal than amount");
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

    it("should set holdTime value correctly", async () => {
      let account_one = accounts[0];
      let account_two = accounts[1];

      let instance = await Lescovex.deployed();
      let meta = instance;


      let holdTimeBefore = await meta.holdTime();
      holdTimeBefore = holdTimeBefore.toNumber();

      console.log(holdTimeBefore);

      await meta.setHoldTime(10);

      let holdTimeAfter = await meta.holdTime();
      holdTimeAfter = holdTimeAfter.toNumber();

      console.log(holdTimeAfter);

      assert.notEqual(holdTimeBefore, holdTimeAfter, "hold time don't have to be equal before and after set hold time value");
    });

    it("should set holdMax value correctly", async () => {
      let account_one = accounts[0];
      let account_two = accounts[1];

      let instance = await Lescovex.deployed();
      let meta = instance;


      let holdTimeBefore = await meta.holdMax();
      holdTimeBefore = holdTimeBefore.toNumber();

      console.log(holdTimeBefore);

      await meta.setHoldMax(1000);

      let holdTimeAfter = await meta.holdMax();
      holdTimeAfter = holdTimeAfter.toNumber();

      console.log(holdTimeAfter);

      assert.notEqual(holdTimeBefore, holdTimeAfter, "hold time don't have to be equal before and after set hold time value");
    });

});
