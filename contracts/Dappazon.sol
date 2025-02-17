// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

contract Dappazon {
    address public owner;

    struct Item {
        uint256 id; 
        string name; 
        string category;
        string image;
        uint256 cost;
        uint256 rating;
        uint256 stock;
    }

    struct Order {
        uint256 time;
        Item item;
    }

    mapping(uint256 => Item) public items;
    mapping(address => uint256) public orderCount;
    mapping(address => mapping(uint256 => Order)) public orders;

    event List(string name, uint256 cost, uint256 quantity);
    event Buy(address buyer, uint256 orderId, uint256 itemId);

    constructor () {
        owner = msg.sender; //person who using the blockchain or smart contract at the moment. 'msg' is a global variable in the blockchain.
    }

    //allows the function to call only by the owner
    modifier onlyOwner() {
        require(msg.sender == owner);
        _;
    }

    //List products by the owner
    function listItem(
        uint256 _id, 
        string memory _name,  //memory is the location of information
        string memory _category,
        string memory _image,
        uint256 _cost,
        uint256 _rating,
        uint256 _stock
    ) public onlyOwner {
        //create item
        Item memory item = Item(_id, _name, _category, _image, _cost, _rating, _stock );

        //save the item in the blockchain           
        items[_id] = item;

        //emit an event - it can make as push notifications when new items added
        emit List(_name, _cost, _stock);
    }

    //buy product item by the buyer - here funds will be transferred to the contract
    function purchaseItem(uint256 _id) public payable {
        //fetch item
        Item memory item = items[_id];

        //ensure buyer sent enough ETH
        require(msg.value >= item.cost, "Insufficient ETH sent");

        //ensure item is in stock
        require(item.stock > 0, "Item is out of stock");

        //create an order
        Order memory order = Order(block.timestamp, item);   

        //add order to the user
        orderCount[msg.sender]++; //increment the order count of the user
        orders[msg.sender][orderCount[msg.sender]] = order;

        //substract stock
        items[_id].stock = item.stock - 1;

        emit Buy(msg.sender, orderCount[msg.sender], item.id);
    }

    //withdraw funds - get funds to the sellers account from the contract
    function withdraw() public onlyOwner {
        (bool success, ) = owner.call{value: address(this).balance}("");
        require(success); 
    }
}
