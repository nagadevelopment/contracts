pragma solidity 0.4.15;


import "zeppelin-solidity/contracts/token/MintableToken.sol";
import "zeppelin-solidity/contracts/ownership/NoOwner.sol";


contract NAGACoin is MintableToken, NoOwner {
    string public constant name = "NAGA Coin";
    string public constant symbol = "NGC";
    uint8 public constant decimals = 18;

    uint256 public constant totalSupplyLimit = 400000000 ether;

    uint public constant mintingAllowedFrom = 1512086400; // 1 Dec 2017
    uint public constant mintingAllowedTo = 1514678400; // 31 Dec 2017

    mapping (address => uint256) public releaseTimes;

    function mint(address _to, uint256 _amount)
    onlyOwner
    canMint
    public
    returns (bool)
    {
        // Mint in the allowed period only
        // We consider time-stamp dependency to be safe enough in this application
        require(mintingAllowedFrom <= block.timestamp && block.timestamp <= mintingAllowedTo);

        // Don’t mint more than allowed
        require(totalSupply.add(_amount) <= totalSupplyLimit);

        return super.mint(_to, _amount);
    }

    function mintWithTimeLock(address _to, uint256 _amount, uint256 _releaseTime)
    onlyOwner
    canMint
    public
    returns (bool)
    {
        if (_releaseTime > releaseTimes[_to]) {
            releaseTimes[_to] = _releaseTime;
        }

        return mint(_to, _amount);
    }

    function transfer(address _to, uint256 _value)
    public
    returns (bool)
    {
        // Transfer of time-locked funds is forbidden
        require(!timeLocked(msg.sender));

        return super.transfer(_to, _value);
    }

    function transferFrom(address _from, address _to, uint256 _value)
    public
    returns (bool)
    {
        // Transfer of time-locked funds is forbidden
        require(!timeLocked(_from));

        return super.transferFrom(_from, _to, _value);
    }

    // Checks if funds of a given address are time-locked
    function timeLocked(address _spender)
    public
    returns (bool)
    {
        if (releaseTimes[_spender] == 0) {
            return false;
        }

        // If time-lock is expired, delete it
        // We consider time-stamp dependency to be safe enough in this application
        if (releaseTimes[_spender] <= block.timestamp) {
            delete releaseTimes[_spender];
            return false;
        }

        return true;
    }
}
