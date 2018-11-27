pragma solidity ^0.5.0;

contract Token {

    event Approval(address indexed owner, address indexed spender, uint256 value);
    event Transfer(address indexed from, address indexed to, uint256 value);

    function totalSupply() public view returns (uint256) {
        return mTotalSupply;
    }

    function balanceOf(address who) public view returns (uint256) {
        return mBalances[who];
    }

    function transfer(address _to, uint256 _amount) public returns (bool success) {
        _transfer(msg.sender, _to, _amount);
        return true;
    }

    function transferFrom(address _from, address _to, uint256 _amount) public returns (bool success) {
        require(_amount <= mAllowed[_from][msg.sender], "Not enough funds allowed");
        mAllowed[_from][msg.sender] -= _amount;
        _transfer(_from, _to, _amount);
        return true;
    }

    function approve(address _spender, uint256 _amount) public returns (bool success) {
        mAllowed[msg.sender][_spender] = _amount;
        emit Approval(msg.sender, _spender, _amount);
        return true;
    }


    function allowance(address _owner, address _spender) public view returns (uint256 remaining) {
        return mAllowed[_owner][_spender];
    }



    /////////////////////////////////////////////////////////////////////////////////////////

    uint256 internal mTotalSupply;
    mapping(address => uint256) internal mBalances;
    mapping(address => mapping(address => uint256)) internal mAllowed;

    constructor(uint256 _amount) public {
        mTotalSupply = mTotalSupply = _amount;
        mBalances[msg.sender] = _amount;
        emit Transfer(address(0), msg.sender, _amount);
    }

    function _transfer(address _from, address _to, uint256 _amount) internal {
        require(_to != address(0), "Cannot send to 0x0");
        require(mBalances[_from] >= _amount, "Not enough funds");

        mBalances[_from] -= _amount;
        mBalances[_to] += _amount;

        emit Transfer(_from, _to, _amount);
    }
}
