const { expect } = require("chai");

// convert ETH into Wei (1 ETH = 1*10^18 Wei)
const tokens = (n) => {
  return ethers.utils.parseUnits(n.toString(), "ether");
};

//global constants for listing an item...
const ID = 1;
const NAME = "Shoes";
const CATEGORY = "Clothing";
const IMAGE =
  "https://ipfs.io/ipfs/QmTYEboq8raiBs7GTUg2yLXB3PMz6HuBNgNfSZBx5Msztg/shoes.jpg";
const COST = tokens(1);
const RATING = 4;
const STOCK = 5;

describe("Dappazon", () => {
  let dappazon;
  let deployer;
  let buyer;

  beforeEach(async () => {
    //setup accounts
    [deployer, buyer] = await ethers.getSigners();

    //get the contract
    const Dappazon = await ethers.getContractFactory("Dappazon");
    //deploy the contract on testing blockchain
    dappazon = await Dappazon.deploy();
  });

  //deployement test group
  describe("Deployment", () => {
    it("Sets the owner", async () => {
      expect(await dappazon.owner()).to.equal(deployer.address);
    });
  });

  //item listing test group
  describe("Item Listing", () => {
    let transaction;

    beforeEach(async () => {
      transaction = await dappazon
        .connect(deployer)
        .listItem(ID, NAME, CATEGORY, IMAGE, COST, RATING, STOCK);

      await transaction.wait();
    });

    it("Returns item attributes", async () => {
      const item = await dappazon.items(ID);
      expect(item.id).to.equal(ID);
      expect(item.name).to.equal(NAME);
      expect(item.category).to.equal(CATEGORY);
      expect(item.image).to.equal(IMAGE);
      expect(item.cost).to.equal(COST);
      expect(item.rating).to.equal(RATING);
      expect(item.stock).to.equal(STOCK);
    });

    it("Emits list event", async () => {
      expect(transaction).to.emit(dappazon, "List");
    });
  });

  //item buying test group
  describe("Item Buying", () => {
    let transaction;

    beforeEach(async () => {
      //list a item
      transaction = await dappazon
        .connect(deployer)
        .listItem(ID, NAME, CATEGORY, IMAGE, COST, RATING, STOCK);
      await transaction.wait();

      //buy a item
      transaction = await dappazon
        .connect(buyer)
        .purchaseItem(ID, { value: COST });
      await transaction.wait();
    });

    it("Updates the buyers order count", async () => {
      const result = await dappazon.orderCount(buyer.address);
      expect(result).to.equal(1);
    });

    it("Updates the contract balance", async () => {
      const result = await ethers.provider.getBalance(dappazon.address);
      expect(result).to.equal(COST);
    });

    it("Adds the order", async () => {
      const order = await dappazon.orders(buyer.address, 1);
      expect(order.time).to.be.greaterThan(0);
      expect(order.item.name).to.equal(NAME);
    });

    it("Emits buy event", async () => {
      expect(transaction).to.emit(dappazon, "Buy");
    });
  });

  describe("Withdrawing", () => {
    let balanceBefore;

    beforeEach(async () => {
      // List a item
      let transaction = await dappazon
        .connect(deployer)
        .listItem(ID, NAME, CATEGORY, IMAGE, COST, RATING, STOCK);
      await transaction.wait();

      // Buy a item
      transaction = await dappazon.connect(buyer).purchaseItem(ID, { value: COST });
      await transaction.wait();

      // Get Deployer balance before
      balanceBefore = await ethers.provider.getBalance(deployer.address);

      // Withdraw
      transaction = await dappazon.connect(deployer).withdraw();
      await transaction.wait();
    });

    it("Updates the owner balance", async () => {
      const balanceAfter = await ethers.provider.getBalance(deployer.address);
      expect(balanceAfter).to.be.greaterThan(balanceBefore);
    });

    it("Updates the contract balance", async () => {
      const result = await ethers.provider.getBalance(dappazon.address);
      expect(result).to.equal(0);
    });
  });
});
