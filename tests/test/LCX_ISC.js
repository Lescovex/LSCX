var Lescovex = artifacts.require("Lescovex_ISC");
var Lescovex2 = artifacts.require("Lescovex_ISC2");

contract('Lescovex Test ISC',  async (accounts) => {

    it("check constructor params", async () => {
      let instance = await Lescovex.deployed();
      let meta = instance;

      //expected values
      let expectedName = "Lescovex ISC";
      let expectedSymbol = "LCX";
      let expectedOwner = 0x627306090abaB3A6e1400e9345bC60c78a8BEf57;
      let expectedHoldTime = 5;
      let expectedAmount = 1000000000000000;

      let name = await meta.name();
      let symbol = await meta.symbol();
      let owner = await meta.owner();
      let totalSupply = await meta.totalSupply();
      let holdTime = await meta.holdTime();
      let balance = await meta.balanceOf(owner);
      balance = balance.toNumber();

      console.log("Contract owner: " + owner);
      console.log("Contract name: " + name);
      console.log("Tokem symbol: " + symbol);
      console.log("Hold time: " + holdTime);
      console.log("Total supply: " + totalSupply);
      console.log("Owner balance: " + balance);

      assert.equal(name, expectedName, "Name and expectedName must be equal");
      assert.equal(symbol, expectedSymbol, "Symbol and expectedSymbol must be equal");
      assert.equal(owner, expectedOwner, "Owner and expectedOwner must be equal");
      assert.equal(holdTime, expectedHoldTime, "Hold time and expectedHoldTime must be equal");
      assert.equal(totalSupply, expectedAmount, "totalSupply and expected amount must be equal");
      assert.equal(balance, expectedAmount, "Owner balance and expected amount must be equal");

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

      let tokenReward= await meta.tokenReward();

      let totalSupply= await meta.totalSupply();

      console.log("Contract ETH: "+ contractEth+" tokenReaward : "+tokenReward + " totalSupply : " + totalSupply);

      assert.notEqual(contractEthBefore, contractEth, "contractEth don't have to be equal before and after deposit");

      assert.equal(tokenReward , contractEth/totalSupply, "total supply must be total Ether * Token Reward");
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

      console.log("Sender Balance Start: " + balance_start);
      console.log("Receiver Balance Start: " + balance_start_2);
      console.log("Sender Balance End: " + balance_end);
      console.log("Receiver Balance End: " + balance_end_2);


      let holded_account_two = await meta.holdedOf(account_two, 1);

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

    it("should withdraw amount correctly", async () => {
      let account_one = accounts[0];

      let amount = 1000000000000000000;

      let instance = await Lescovex.deployed();
      let meta = instance;

      let tokenRewardBefore = await meta.tokenReward();
      tokenRewardBefore = tokenRewardBefore.toNumber();

      let contractEthBefore=await meta.contractBalance();
      contractEthBefore = contractEthBefore.toNumber();

      // await meta.deposit({value:amount});
      await meta.withdraw(amount);

      let contractEth=await meta.contractBalance();
      contractEth = contractEth.toNumber();

      let balance = await meta.balanceOf.call(account_one);
      balance = balance.toNumber();

      let totalSupply= await meta.totalSupply();
      totalSupply = totalSupply.toNumber();

      let tokenReward = await meta.tokenReward();
      tokenReward = tokenReward.toNumber();

      assert.notEqual(contractEthBefore, contractEth, "contractEth don't have to be equal before and after deposit");

      assert.equal(totalSupply * tokenRewardBefore , contractEthBefore, "total supply must be total (totalSupply-balance) * tokenReward");

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



    });

     it("should withdraw reward amount correctly", async () => {

      let account_one = accounts[0];
      let account_two = accounts[1];

      let amount = 1000000000000000000;

      let instance = await Lescovex.deployed();
      let meta = instance;


      let contractEthBefore = await meta.contractBalance();
      contractEthBefore = contractEthBefore.toNumber();

      let tokenRewardBefore= await meta.tokenReward();
      tokenRewardBefore = tokenRewardBefore.toNumber();

      await meta.deposit({value:amount});
      await meta.withdrawReward();

      let tokenReward= await meta.tokenReward();
      tokenReward = tokenReward.toNumber();

      let totalSupply= await meta.totalSupply();
      totalSupply = totalSupply.toNumber();

      let balance= await meta.balanceOf(account_one);
      balance = balance.toNumber();

      let holded = await meta.holdedOf(account_one, 0);
      holded = holded.toNumber();

      let contractEth=await meta.contractBalance();
      contractEth = contractEth.toNumber();

      console.log("balance: "+ balance+" tokenReward : "+tokenReward);

      assert.notEqual(tokenRewardBefore, tokenReward, "tokenReward before and after deposit don't have to be equal");
      assert.notEqual(contractEthBefore, contractEth, "contractEth don't have to be equal before and after deposit");

      assert.equal(totalSupply * tokenRewardBefore , contractEthBefore, "total supply must be total (totalSupply-balance) * tokenReward");

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

    it("should transfer and withdraw correctly", async () => {
      let account_one = accounts[0];
      let account_two = accounts[1];

      let transactions = 30;

      let instance = await Lescovex.deployed();
      let meta = instance;

      let balanceBefore_one = await meta.balanceOf(account_one);
      balanceBefore_one = balanceBefore_one.toNumber();
      let balanceBefore_two = await meta.balanceOf(account_two);
      balanceBefore_two = balanceBefore_two.toNumber();
      let amount = 1000;

      console.log(transactions + " * " + amount + " = " + (transactions*amount));

      let holded_account_two;
      let i =0;
      let x = 2;
      console.log("HoldedOf Account "+ account_two +" to on index: ");
      while(i<transactions){
        await meta.transfer(account_two, amount);
        holded_account_two = await meta.holdedOf(account_two, x);

        console.log(i + ": " + holded_account_two);
        i++;
        x++;
      }

      let balanceAfter_one = await meta.balanceOf(account_one);
      balanceAfter_one = balanceAfter_one.toNumber();
      let balanceAfter_two = await meta.balanceOf(account_two);
      balanceAfter_two = balanceAfter_two.toNumber();

      console.log("balanceBefore_one: " + balanceBefore_one + " balanceAfter_one: " + balanceAfter_one);
      console.log("balanceBefore_two: " + balanceBefore_two + " balanceAfter_two: " + balanceAfter_two);
      assert.equal(balanceBefore_one, (amount * transactions)+balanceAfter_one, "Balance before of the sender account have to be equal to balance after plus amount transferred");
      assert.equal(balanceAfter_two, (amount * transactions)+balanceBefore_two, "Balance after of the receiver account have to be equal than balance after plus amount transferred");


      let contractEthBefore=await meta.contractBalance();
      contractEthBefore = contractEthBefore.toNumber();

      let withdrawAmount = 500;
      let y=0;

      while(y<transactions){
        await meta.withdraw(withdrawAmount);
        y++;
      }

      let contractEth=await meta.contractBalance();
      contractEth = contractEth.toNumber();

      console.log("ContractBalanceBefore: " + contractEthBefore + " ContractBalanceAfter: " + contractEth);

      //holdedLength function created for testing reasons
       let holded_acc2 = await meta.holdedLength(account_two);
       holded_acc2 = holded_acc2.toNumber();
       console.log(holded_acc2);

       //We did 2 transactions before this test, then we've to + 2
       assert.equal(holded_acc2, transactions + 2, "transactions holded must to be equal than holded length");
       console.log("ContractBalanceBefore: " + contractEthBefore);
       console.log("contract balance after: " + contractEth);

       console.log((withdrawAmount*transactions)+contractEth);
       assert.equal(contractEthBefore,(withdrawAmount*transactions)+contractEth, "contract balance plus withdrawAmount must be equal than contract balance before withdraw");

    });

});
