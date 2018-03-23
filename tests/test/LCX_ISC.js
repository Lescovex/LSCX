var Lescovex = artifacts.require("Lescovex_ISC");
var Lescovex2 = artifacts.require("Lescovex_ISC2");

contract('Lescovex Test ISC',  async (accounts) => {

    it("should deposit amount correctly", async () => {

      let amount = 1000000000000000000;

      let instance = await Lescovex.deployed();
      let meta = instance;

      await meta.deposit({value:amount});

      let contractEth=await meta.contractBalance();

      let tokenReward= await meta.tokenReward();

      let totalSupply= await meta.totalSupply();

      console.log("Contract ETH: "+ contractEth+" tokenReaward : "+tokenReward + " totalSupply : " + totalSupply);

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

      assert.equal(account_one_ending_balance, account_one_starting_balance - amount, "Amount wasn't correctly taken from the sender");
      assert.equal(account_two_ending_balance, account_two_starting_balance + amount, "Amount wasn't correctly sent to the receiver");
      assert.equal(amount, holded_account_two, "Holded needs to be equal than amount");

    });


    it("should aprove amount correctly", async () => {

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


      let holded_account_two = await meta.holdedOf(account_two, 1);

      console.log("Holded : "+ holded_account_two);

      assert.equal(amount, holded_account_two, "Holded not is the final amount");
      assert.equal(balance_end, balance_start - (balance_end_2 - amount), "Amount wasn't correctly sent to the receiver");


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
    it("should withdraw amount correctly", async () => {
      let account_one = accounts[0];

      let amount = 5000;

      let instance = await Lescovex.deployed();
      let meta = instance;

      let contractEth=await meta.contractBalance();
      contractEth = contractEth.toNumber();

      await meta.withdraw(amount);

      let balance = await meta.balanceOf.call(account_one);
      balance = balance.toNumber();

      let totalSupply= await meta.totalSupply();
      totalSupply = totalSupply.toNumber();

      let tokenReward = await meta.tokenReward();
      tokenReward = tokenReward.toNumber();

      assert.equal(totalSupply*tokenReward , contractEth, "total supply must be total (totalSupply-balance) * tokenReward");

    });
     it("should withdraw reward amount correctly", async () => {

      let account_one = accounts[0];
      let account_two = accounts[1];

      let amount = 5000;

      let instance = await Lescovex.deployed();
      let meta = instance;


      let contractEth=await meta.contractBalance();
      contractEth = contractEth.toNumber();

      await meta.withdrawReward();

      let tokenReward= await meta.tokenReward();
      tokenReward = tokenReward.toNumber();

      let totalSupply= await meta.totalSupply();
      totalSupply = totalSupply.toNumber();

      let balance= await meta.balanceOf(account_one);
      balance = balance.toNumber();

      let holded = await meta.holdedOf(account_one, 0);
      holded = holded.toNumber();

      console.log("balance: "+ balance+" tokenReaward : "+tokenReward);
      assert.equal(totalSupply*tokenReward , contractEth, "total supply must be total (totalSupply-balance) * tokenReward");

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
