// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.18;

import "@openzeppelin/contracts-upgradeable/utils/cryptography/ECDSAUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/utils/SafeERC20Upgradeable.sol";

import {PaycrestSettingManager} from "./PaycrestSettingManager.sol";
import {IPaycrest, IERC20} from "./interfaces/IPaycrest.sol";
import {SharedStructs} from "./libraries/SharedStructs.sol";

/**
 * @title Paycrest
 * @dev Paycrest contract for handling orders and settlements.
 */
contract Paycrest is IPaycrest, PaycrestSettingManager, PausableUpgradeable { 
    using SafeERC20Upgradeable for IERC20;
    using ECDSAUpgradeable for bytes32;

    struct fee {
        uint256 protocolFee;
        uint256 liquidityProviderAmount;
    }

    mapping(bytes32 => Order) private order;
    mapping(address => uint256) private _nonce;
    uint256[50] private __gap;

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    /**
     * @dev Initialize function.
     */
    function initialize() external initializer {
        MAX_BPS = 100_000;
        __Ownable_init();
        __Pausable_init();
    }

    /**
     * @dev Modifier that allows only the aggregator to call a function.
     */
    modifier onlyAggregator {
        require(msg.sender == _aggregatorAddress, "OnlyAggregator");
        _;
    }

    /* ##################################################################
                                OWNER FUNCTIONS
    ################################################################## */
    /**
     * @dev Pause the contract.
     */
    function pause() external onlyOwner {
        _pause();
    }

    /**
     * @dev Unpause the contract.
     */
    function unpause() external onlyOwner {
        _unpause();
    }
    
    /* ##################################################################
                                USER CALLS
    ################################################################## */
    /** @dev See {createOrder-IPaycrest}. */
    function createOrder(
        address _token, 
        uint256 _amount, 
        bytes32 _institutionCode,
        bytes32 _label,
        uint96 _rate, 
        address _senderFeeRecipient,
        uint256 _senderFee,
        address _refundAddress, 
        string calldata messageHash
    ) external whenNotPaused() returns(bytes32 orderId) {
        // checks that are required
        _handler(_token, _amount, _refundAddress, _senderFeeRecipient, _senderFee, _institutionCode);

        // validate messageHash
        require(bytes(messageHash).length > 0, "InvalidMessageHash");

        // transfer token from msg.sender to contract
        IERC20(_token).transferFrom(msg.sender, address(this), _amount);

        // increase users nonce to avoid replay attacks
        _nonce[msg.sender] ++;

        // generate transaction id for the transaction
        orderId = keccak256(abi.encode(msg.sender, _nonce[msg.sender]));

        // update transaction
        order[orderId] = Order({
            seller: msg.sender,
            token: _token,
            senderFeeRecipient: _senderFeeRecipient,
            senderFee: _senderFee,
            rate: _rate,
            isFulfilled: false,
            refundAddress: _refundAddress,
            currentBPS: uint64(MAX_BPS),
            amount: _amount
        });

        // emit deposit event
        emit OrderCreated(_token, _amount, orderId, _rate, _institutionCode, _label, messageHash);
    }

    /**
     * @dev Internal function to handle order creation.
     * @param _token The address of the token being traded.
     * @param _amount The amount of tokens being traded.
     * @param _refundAddress The address to refund the tokens in case of cancellation.
     * @param _senderFeeRecipient The address of the recipient for the sender fee.
     * @param _senderFee The amount of the sender fee.
     * @param _institutionCode The code of the institution associated with the order.
     */
    function _handler(address _token, uint256 _amount, address _refundAddress, address _senderFeeRecipient, uint256 _senderFee, bytes32 _institutionCode) internal view {
        require(_isTokenSupported[_token], "TokenNotSupported");
        require(_amount > 0, "AmountIsZero");
        require(_refundAddress != address(0), "ThrowZeroAddress");
        require(supportedInstitutionsByCode[_institutionCode].name != bytes32(0), "InvalidInstitutionCode");

        if (_senderFee > 0) {
            require(_senderFeeRecipient != address(0), "InvalidSenderFeeRecipient");
        }
        require(_senderFee <= (_amount * 500) / MAX_BPS, "SenderFeeTooHigh");
    }

    /* ##################################################################
                                AGGREGATOR FUNCTIONS
    ################################################################## */
    /** @dev See {settle-IPaycrest}. */
    function settle(
        bytes32 _splitOrderId,
        bytes32 _orderId, 
        bytes32 _label,
        address _liquidityProvider, 
        uint64 _settlePercent,
        bool _isPartner
    ) external onlyAggregator() returns(bytes32, address) {
        // ensure the transaction has not been fulfilled
        require(!order[_orderId].isFulfilled, "OrderFulfilled");

        // load the token into memory
        address token = order[_orderId].token;

        // subtract sum of amount based on the input _settlePercent
        order[_orderId].currentBPS -= _settlePercent;

        // if transaction amount is zero
        // load the fees and transfer associated protocol fees to the protocol fee recipient
        ( fee memory _feeParams  ) = _calculateFees(_orderId, _settlePercent, _isPartner);
        if(order[_orderId].currentBPS == 0) {
            // update the transaction to be fulfilled
            order[_orderId].isFulfilled = true;
            if (order[_orderId].senderFee > 0) {
                // transfer sender fee
                _transferSenderFee(_orderId);
            }
        }
        
        if (_feeParams.protocolFee > 0) {
            // transfer protocol fee
            IERC20(token).transfer(treasuryAddress, _feeParams.protocolFee);
        }

        // transfer to liquidity provider 
        IERC20(token).transfer(_liquidityProvider, _feeParams.liquidityProviderAmount);

        // emit event
        emit OrderSettled(_splitOrderId, _orderId, _label,  _liquidityProvider, _settlePercent);
        return (_orderId, token);
    }

    /**
     * @dev Internal function to transfer the sender fee.
     * @param _orderId The ID of the order.
     */
    function _transferSenderFee(bytes32 _orderId) internal {
        address recipient = order[_orderId].senderFeeRecipient;
        uint256 _fee = order[_orderId].senderFee;
        // transfer sender fee
        IERC20(order[_orderId].token).transfer(recipient, _fee);
        // emmit event
        emit SenderFeeTransferred(recipient, _fee);
    }

    /** @dev See {refund-IPaycrest}. */
    function refund(uint256 _fee, bytes32 _orderId, bytes32 _label) external onlyAggregator() returns(bool) {
        // ensure the transaction has not been fulfilled
        require(!order[_orderId].isFulfilled, "OrderFulfilled");

        // deduct fee from order amount
        uint256 refundAmount = order[_orderId].amount - _fee;
        IERC20(order[_orderId].token).transfer(treasuryAddress, _fee);

        // reset state values
        order[_orderId].isFulfilled = true;
        order[_orderId].currentBPS = 0;
    
        // transfer to sender and emit event
        IERC20(order[_orderId].token).transfer(order[_orderId].refundAddress, refundAmount);
        emit OrderRefunded(_fee, _orderId, _label);

        return true;
    }

    /**
     * @dev Calculates the fees for a given order.
     * @param _orderId The ID of the order.
     * @param _settlePercent The percentage of the order amount to settle.
     * @param _isPartner Flag indicating if the order is from a partner.
     * @return _feeParams The fee parameters including amount to settle the liquidity provider and the protocol fee.
     */
    function _calculateFees(bytes32 _orderId, uint96 _settlePercent, bool _isPartner) private view returns(fee memory _feeParams ) {
        // get the total amount associated with the orderId
        uint256 amount = order[_orderId].amount;

        // get sender fee from amount
        amount = amount - order[_orderId].senderFee;

        // get the settled percent that is scheduled for this amount
        _feeParams.liquidityProviderAmount = (amount * _settlePercent) / MAX_BPS;

        // deduct protocol fees from the new total amount
        _feeParams.protocolFee = (_feeParams.liquidityProviderAmount * protocolFeePercent) / MAX_BPS;
        
        // subtract total fees from the new amount after getting the scheduled amount
        _feeParams.liquidityProviderAmount = (_feeParams.liquidityProviderAmount - _feeParams.protocolFee);

        // if (_isPartner) protocol fee should be 0, and the whole protocol fee should be added to liquidity provider
        if (_isPartner) {
            _feeParams.liquidityProviderAmount += _feeParams.protocolFee;
            _feeParams.protocolFee = 0;
        }
    }
    
    /* ##################################################################
                                VIEW CALLS
    ################################################################## */
    /** @dev See {getOrderInfo-IPaycrest}. */
    function getOrderInfo(bytes32 _orderId) external view returns(Order memory) {
        return order[_orderId];
    }

    /** @dev See {isTokenSupported-IPaycrest}. */
    function isTokenSupported(address _token) external view returns(bool) {
        return _isTokenSupported[_token];
    }

    /** @dev See {getSupportedInstitutionByCode-IPaycrest}. */
    function getSupportedInstitutionByCode(bytes32 _code) external view returns(SharedStructs.InstitutionByCode memory) {
        return supportedInstitutionsByCode[_code];
    }

    /** @dev See {getSupportedInstitutions-IPaycrest}. */
    function getSupportedInstitutions(bytes32 _currency) external view returns(SharedStructs.Institution[] memory) {
        SharedStructs.Institution[] memory institutions = supportedInstitutions[_currency];
        uint256 length = institutions.length;
        SharedStructs.Institution[] memory result = new SharedStructs.Institution[](length);
        
        for (uint256 i = 0; i < length; ) {
            result[i] = institutions[i];
            unchecked {
                i++;
            }
        }
        
        return result;
    }

    /** @dev See {getFeeDetails-IPaycrest}. */
    function getFeeDetails() external view returns(
        uint64, 
        uint256
    ) {
        return(protocolFeePercent, MAX_BPS);
    }

    /** @dev See {getAggregator-IPaycrest}. */
    function getAggregator() external view returns(bytes memory) {
        return _aggregator;
    } 
}
