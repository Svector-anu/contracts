//SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.18;
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";

contract PaycrestSettingManager is OwnableUpgradeable { 
    struct Institution {
        bytes32 code; // usually not more than 8 letters
        bytes32 name; // 
    }
    struct InstitutionByCode {
        bytes32 name;
        bytes32 currency;
    }
    uint256 internal MAX_BPS;
    uint128 internal protocolFeePercent; // 5%
    uint128 internal validatorFeePercent; // 0.5%
    address internal feeRecipient;
    address internal _aggregatorAddress;
    bytes internal _aggregator;
    
    // this should decrease if more slots are needed on this contract to avoid collisions with base contract
    uint256[50] private __gap;

    mapping(address => bool) internal _isTokenSupported;
    mapping(address => bool) internal _isWhitelisted;

    mapping(bytes32 => Institution[]) internal supportedInstitutions;
    mapping(bytes32 => InstitutionByCode) internal supportedInstitutionsByCode;

    event SettingManagerBool(bytes32 what, address value, bool status);
    event PaycrestFees(uint128 protocolFee, uint128 validatorFeePercent);
    event SetAggregator(bytes aggregator);
    event SetFeeRecipient(address feeRecipient);

    
    /* ##################################################################
                                OWNER FUNCTIONS
    ################################################################## */
    function settingManagerBool(bytes32 what, address value, bool status) external onlyOwner {
        require(value != address(0), "Paycrest: zero address");
        if (what == "token") _isTokenSupported[value] = status;
        if (what == "whitelist") _isWhitelisted[value] = status;

        emit SettingManagerBool(what, value, status);
    }

    function setSupportedInstitutions(bytes32 currency, Institution[] memory institutions) external onlyOwner { 
        uint256 length = institutions.length;
        for (uint i = 0; i < length; ) {
            supportedInstitutions[currency].push(institutions[i]);
            supportedInstitutionsByCode[institutions[i].code] = InstitutionByCode({
                name: institutions[i].name, currency: currency
            });
            unchecked {
                i++;
            }
        }
    }

    function updateProtocolFees(uint128 _protocolFeePercent, uint128 _validatorFeePercent) external onlyOwner {
        protocolFeePercent = _protocolFeePercent;
        validatorFeePercent = _validatorFeePercent;
        emit PaycrestFees(_protocolFeePercent, _validatorFeePercent);
    }

    function updateProtocolAddresses(bytes32 what, address value) external onlyOwner {
        require(value != address(0), "Paycrest: zero address");
        if (what == "fee") feeRecipient = value;
        if (what == "aggregator") _aggregatorAddress = value;
    }

    function updateProtocolAggregator(bytes calldata aggregator) external onlyOwner {
        _aggregator = aggregator;
        emit SetAggregator(aggregator);
    }

}
