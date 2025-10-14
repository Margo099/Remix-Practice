// SPDX-License-Identifier: MIT
/*
DISCLAIMER
------------------------
Данный смарт-контракт предоставляется «КАК ЕСТЬ», без каких-либо гарантий,
явных или подразумеваемых, включая, но не ограничиваясь гарантиями
работоспособности, пригодности для определённых целей или отсутствия нарушений.

Автор данного контракта является исключительно техническим разработчиком.
Ответственность за развертывание, настройку, администрирование и любое
правовое или коммерческое использование данного контракта полностью лежит на
стороне, осуществляющей его развертывание (далее — «Оператор»).

Автор НЕ несёт ответственности за:
- то, каким образом контракт используется после развертывания;
- соответствие использования применимым законам или нормативным актам;
- любые убытки, ущерб, неправомерные или мошеннические действия, связанные с использованием.

Используя, развертывая или взаимодействуя с данным контрактом, вы подтверждаете
и соглашаетесь, что автор не несёт никакой ответственности за любые прямые или
косвенные последствия. Полная ответственность за соблюдение всех применимых
правовых, регуляторных и технических требований лежит на Операторе и Пользователях.
*/
pragma solidity ^0.8.20;

import "./ConstitutionalParameters.sol";

contract UserRegistry {
    address public owner;
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    bool public paused = false;
    event Paused(address indexed by);
    event Unpaused(address indexed by);

    // Moderators (совпадает с моделью: владелец + дополнительные)
    mapping(address => bool) public moderators;
    event ModeratorAdded(address indexed account);
    event ModeratorRemoved(address indexed account);

    ConstitutionalParameters public constitutionalParameters;

    struct Citizen {
        bytes32 personalDataHash;
        uint32 countryId;
        uint32 regionId;
        uint32 communeId;
        uint16 birthYear;
        bool isApprovedByModerator;
        uint256 registrationTime;
    }

    mapping(address => Citizen) public citizens;
    mapping(address => bool) public isRegisteredCitizen;
    mapping(address => mapping(uint8 => bool)) public hasConfirmedConstitution;
    mapping(address => bool) public authorizedRegistrars;

    // Активность (деактивация без удаления данных)
    mapping(address => bool) public citizenActive;

    event CitizenRegistered(address indexed wallet, uint32 country, uint32 region, uint32 commune, uint16 birthYear);
    event CitizenApproved(address indexed wallet, bool status);
    event ConstitutionConfirmed(address indexed wallet, uint8 constitutionType);
    event CitizenLocationUpdated(address indexed wallet, uint32 country, uint32 region, uint32 commune);
    event CitizenDeactivated(address indexed wallet);
    event CitizenReactivated(address indexed wallet);

    modifier onlyOwner() { require(msg.sender == owner, "Only owner"); _; }
    modifier onlyModerator() { require(moderators[msg.sender] || msg.sender == owner, "Not moderator"); _; }
    modifier whenNotPaused() { require(!paused, "Paused"); _; }
    modifier onlyAuthorizedRegistrar() { require(authorizedRegistrars[msg.sender], "Not registrar"); _; }
    modifier onlyActiveCitizen(address _addr) {
        require(isRegisteredCitizen[_addr], "Not registered");
        require(citizenActive[_addr], "Inactive");
        _;
    }

    constructor(address _authorizedRegistrar, address _constitutionalParametersAddress) {
        owner = msg.sender;
        moderators[msg.sender] = true;
        emit ModeratorAdded(msg.sender);
        authorizedRegistrars[owner] = true;
        if (_authorizedRegistrar != address(0) && _authorizedRegistrar != owner) {
            authorizedRegistrars[_authorizedRegistrar] = true;
        }
        require(_constitutionalParametersAddress != address(0), "Params address zero");
        constitutionalParameters = ConstitutionalParameters(_constitutionalParametersAddress);
    }

    // Ownership / Moderators
    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "Zero address");
        emit OwnershipTransferred(owner, newOwner);
        owner = newOwner;
        if (!moderators[newOwner]) {
            moderators[newOwner] = true;
            emit ModeratorAdded(newOwner);
        }
        authorizedRegistrars[newOwner] = true;
    }
    function addModerator(address account) external onlyOwner {
        require(account != address(0), "Zero");
        require(!moderators[account], "Already");
        moderators[account] = true;
        emit ModeratorAdded(account);
    }
    function removeModerator(address account) external onlyOwner {
        require(account != owner, "Cannot remove owner");
        require(moderators[account], "Not mod");
        moderators[account] = false;
        emit ModeratorRemoved(account);
    }

    function pause() external onlyOwner { paused = true; emit Paused(msg.sender); }
    function unpause() external onlyOwner { paused = false; emit Unpaused(msg.sender); }

    // Registrars
    function addAuthorizedRegistrar(address _newRegistrar) external onlyOwner whenNotPaused {
        require(_newRegistrar != address(0), "Zero addr");
        authorizedRegistrars[_newRegistrar] = true;
    }
    function removeAuthorizedRegistrar(address _registrar) external onlyOwner whenNotPaused {
        authorizedRegistrars[_registrar] = false;
    }

    // Register
    function registerCitizen(
        address _walletAddress,
        bytes32 _personalDataHash,
        uint32 _countryId,
        uint32 _regionId,
        uint32 _communeId,
        uint16 _birthYear
    ) external onlyAuthorizedRegistrar whenNotPaused {
        require(_walletAddress != address(0), "Zero wallet");
        require(!isRegisteredCitizen[_walletAddress], "Already registered");
        require(_personalDataHash != bytes32(0), "No hash");
        require(constitutionalParameters.isCountryValid(_countryId), "Invalid country");
        require(constitutionalParameters.isRegionValid(_countryId, _regionId), "Invalid region");
        require(constitutionalParameters.isCommuneValid(_countryId, _regionId, _communeId), "Invalid commune");
        uint16 minAge = constitutionalParameters.minAgeToParticipate();
        uint16 currentYear = uint16(block.timestamp / (365 days)) + 1970;
        require(currentYear >= _birthYear, "Future birth");
        require(currentYear - _birthYear >= minAge, "Too young");

        citizens[_walletAddress] = Citizen({
            personalDataHash: _personalDataHash,
            countryId: _countryId,
            regionId: _regionId,
            communeId: _communeId,
            birthYear: _birthYear,
            isApprovedByModerator: false,
            registrationTime: block.timestamp
        });
        isRegisteredCitizen[_walletAddress] = true;
        citizenActive[_walletAddress] = true;
        emit CitizenRegistered(_walletAddress, _countryId, _regionId, _communeId, _birthYear);
    }

    function approveCitizen(address _citizen, bool _status) external onlyAuthorizedRegistrar whenNotPaused onlyActiveCitizen(_citizen) {
        citizens[_citizen].isApprovedByModerator = _status;
        emit CitizenApproved(_citizen, _status);
    }

    function confirmConstitution(uint8 _constitutionType) external whenNotPaused onlyActiveCitizen(msg.sender) {
        require(citizens[msg.sender].isApprovedByModerator, "Not approved");
        require(
            _constitutionType >= constitutionalParameters.CONSTITUTION_TYPE_COUNTRY() &&
            _constitutionType <= constitutionalParameters.CONSTITUTION_TYPE_COMMUNE(),
            "Invalid type"
        );
        require(!hasConfirmedConstitution[msg.sender][_constitutionType], "Already confirmed");
        hasConfirmedConstitution[msg.sender][_constitutionType] = true;
        emit ConstitutionConfirmed(msg.sender, _constitutionType);
    }

    // Update location
    function updateCitizenLocation(
        address _citizen,
        uint32 _countryId,
        uint32 _regionId,
        uint32 _communeId
    ) external onlyAuthorizedRegistrar whenNotPaused onlyActiveCitizen(_citizen) {
        require(constitutionalParameters.isCountryValid(_countryId), "Bad country");
        require(constitutionalParameters.isRegionValid(_countryId, _regionId), "Bad region");
        require(constitutionalParameters.isCommuneValid(_countryId, _regionId, _communeId), "Bad commune");
        Citizen storage c = citizens[_citizen];
        c.countryId = _countryId;
        c.regionId = _regionId;
        c.communeId = _communeId;
        emit CitizenLocationUpdated(_citizen, _countryId, _regionId, _communeId);
    }

    // Deactivate / Reactivate
    function deactivateCitizen(address _citizen) external onlyAuthorizedRegistrar whenNotPaused onlyActiveCitizen(_citizen) {
        citizenActive[_citizen] = false;
        emit CitizenDeactivated(_citizen);
    }
    function reactivateCitizen(address _citizen) external onlyAuthorizedRegistrar whenNotPaused {
        require(isRegisteredCitizen[_citizen], "Not registered");
        require(!citizenActive[_citizen], "Already active");
        citizenActive[_citizen] = true;
        emit CitizenReactivated(_citizen);
    }

    // Views
    function isCitizenApproved(address _addr) external view returns (bool) {
        return citizens[_addr].isApprovedByModerator;
    }
    function isCitizenFullyApprovedAndConfirmed(address _addr) external view returns (bool) {
        return isRegisteredCitizen[_addr] &&
               citizenActive[_addr] &&
               citizens[_addr].isApprovedByModerator &&
               hasConfirmedConstitution[_addr][constitutionalParameters.CONSTITUTION_TYPE_COUNTRY()] &&
               hasConfirmedConstitution[_addr][constitutionalParameters.CONSTITUTION_TYPE_REGION()] &&
               hasConfirmedConstitution[_addr][constitutionalParameters.CONSTITUTION_TYPE_COMMUNE()];
    }
    function getCitizenBirthYear(address _addr) external view returns (uint16) {
        return citizens[_addr].birthYear;
    }
    function getCitizenLocationIds(address _addr) external view returns (uint32, uint32, uint32) {
        Citizen storage c = citizens[_addr];
        return (c.countryId, c.regionId, c.communeId);
    }
}