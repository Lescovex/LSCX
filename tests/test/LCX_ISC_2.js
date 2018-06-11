var Lescovex = artifacts.require("Lescovex_ISC");
var Lescovex2 = artifacts.require("Lescovex_ISC2");


contract('Lescovex Test ISC 2',  async (accounts) => {

    it("should deposit amount correctly", async () => {
      let account_one = accounts[0];

      let amount = 3000000000000000000;

      let instance = await Lescovex.deployed();
      let meta = instance;

      let contractEthBefore=await meta.contractBalance();
      contractEthBefore = contractEthBefore.toNumber();

      let balanceAccOne = await meta.balanceOf(account_one);
      balanceAccOne = balanceAccOne.toNumber();
      console.log("balanceAccOne: " + balanceAccOne);

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

      let amount = 1000000000000;


      let instance = await Lescovex.deployed();
      let meta = instance;

      let balance = await meta.balanceOf.call(account_one);
      let account_one_starting_balance = balance.toNumber();

      balance = await meta.balanceOf.call(account_two);
      let account_two_starting_balance = balance.toNumber();

      let holdedBefore = await meta.holdedLength(account_two);
      holdedBefore = holdedBefore.toNumber();

      let i = 0;
      while(i < 50){
          await meta.transfer(account_two, amount);
          i++;
      }

      let holded_account_one = await meta.holdedControl(account_one);
      holded_account_one = holded_account_one.toNumber();


      let holded_account_two = await meta.holdedControl(account_two);
      holded_account_two = holded_account_two.toNumber();


      let holdedAfter = await meta.holdedLength(account_two);
      holdedAfter = holdedAfter.toNumber();

      console.log("Holded Length Before: " + holdedBefore);
      console.log("Holded Length After:  " + holdedAfter);

      balance = await meta.balanceOf(account_one);
      let account_one_ending_balance = balance.toNumber();

      balance = await meta.balanceOf(account_two);
      let account_two_ending_balance = balance.toNumber();

      console.log("Account Balances : " + account_one_ending_balance+" "+account_two_ending_balance);

      console.log("Holded : "+ holded_account_two);

      assert.notEqual(holded_account_one, holded_account_two, "holded amounts of account_one and account_two don't have to be equal");
      assert.notEqual(account_one, account_two, "account_one have to be different than account_two");
      assert.notEqual(account_one_starting_balance, account_one_ending_balance, "account_one starting balance and ending balance don't have to be equal");
      assert.notEqual(account_two_starting_balance, account_two_ending_balance, "account_two starting balance and ending balance don't have to be equal");

      assert.equal(account_two_ending_balance, (holdedAfter * amount), "ending balance must be equal to holdedAfterLength * amount");
      assert.equal(holded_account_two, (holdedAfter * amount), "holded balance must be equal to holdedAfterLength * amount");

    });
    it("should transfer coin correctly", async () => {

      // Get initial balances of first and second account.
      let account_one = accounts[0];
      let account_two = accounts[1];

      let amount = 1000000000000;


      let instance = await Lescovex.deployed();
      let meta = instance;

      let balance = await meta.balanceOf.call(account_one);
      let account_one_starting_balance = balance.toNumber();

      balance = await meta.balanceOf.call(account_two);
      let account_two_starting_balance = balance.toNumber();

      let holdedBefore = await meta.holdedLength(account_two);
      holdedBefore = holdedBefore.toNumber();

      let i = 0;
      while(i < 50){
          await meta.transfer(account_two, amount);
          i++;
      }

      let holded_account_one = await meta.holdedControl(account_one);
      holded_account_one = holded_account_one.toNumber();


      let holded_account_two = await meta.holdedControl(account_two);
      holded_account_two = holded_account_two.toNumber();


      let holdedAfter = await meta.holdedLength(account_two);
      holdedAfter = holdedAfter.toNumber();
      console.log("Holded Length Before: " + holdedBefore);
      console.log("Holded Length After:  " + holdedAfter);

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


      assert.equal(account_two_ending_balance, (holdedAfter * amount), "ending balance must be equal to holdedAfterLength * amount");
      assert.equal(holded_account_two, (holdedAfter * amount), "holded balance must be equal to holdedAfterLength * amount");

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

      let accBalanceBefore = web3.eth.getBalance(account_two);
      accBalanceBefore = accBalanceBefore.toNumber();

      let instance = await Lescovex.deployed();
      let meta = instance;

      let holdedOf = await meta.holdedOf(account_two);
      holdedOf = holdedOf.toNumber();
      console.log("Holded Before:" + holdedOf);

      let balance = await meta.balanceOf(account_two);
      balanceBefore = balance.toNumber();
      console.log("balance: " + balanceBefore);

      await meta.withdrawReward({from:account_two});

      let holdedOfAter = await meta.holdedOf(account_two);
      holdedOfAter = holdedOfAter.toNumber();
      console.log("Holded after: " + holdedOfAter);

      let accBalanceAfter = web3.eth.getBalance(account_two);
      accBalanceAfter = accBalanceAfter.toNumber();

      balance = await meta.balanceOf(account_two);
      balanceAfter = balance.toNumber();
      console.log("balance: " + balanceAfter);

      console.log("Account Balance Before: " + accBalanceBefore);
      console.log("Account Balance After:  "+ accBalanceAfter);

      assert.notEqual(accBalanceBefore, accBalanceAfter, "account balance don't have to be equal before and after withdraw");
      assert.notEqual(holdedOf, holdedOfAter, "holded amount before withdraw don't have to be equal to the amount holded after");

      assert.equal(balanceBefore, holdedOf, "balance before withdraw and amount holded must to be equal");
    });

});
