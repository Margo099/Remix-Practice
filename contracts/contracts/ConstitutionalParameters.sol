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

contract ConstitutionalParameters {
    address public owner;
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    bool public paused = false;
    event Paused(address indexed by);
    event Unpaused(address indexed by);

    // Moderators 
    mapping(address => bool) public moderators;
    event ModeratorAdded(address indexed account);
    event ModeratorRemoved(address indexed account);

    modifier onlyOwner() { require(msg.sender == owner, "Only owner"); _; }
    modifier onlyModerator() { require(moderators[msg.sender] || msg.sender == owner, "Not moderator"); _; }
    modifier whenNotPaused() { require(!paused, "Paused"); _; }

    uint8 public constant CONSTITUTION_TYPE_COUNTRY = 0;
    uint8 public constant CONSTITUTION_TYPE_REGION = 1;
    uint8 public constant CONSTITUTION_TYPE_COMMUNE = 2;

    uint256 public petitionSignaturesThreshold = 100000;
    uint256 public petitionDurationSeconds = 365 days; 
    uint256 public votingDurationSeconds = 3 days;
    uint16 public minAgeToParticipate = 18;

    event PetitionThresholdUpdated(uint256 oldValue, uint256 newValue);
    event PetitionDurationUpdated(uint256 oldValue, uint256 newValue);
    event VotingDurationUpdated(uint256 oldValue, uint256 newValue);
    event MinAgeUpdated(uint16 oldValue, uint16 newValue);

    struct Position {
        uint256 id;
        string name;
        uint8 constitutionType;
        uint256 minNominationsToQualify;
        uint256 minVotesToElect;
        uint256 termDurationDays;
        bool isActive;
    }
    mapping(uint256 => Position) public positions;
    uint256 public nextPositionId = 1;
    event PositionAdded(uint256 indexed id, string name, uint8 constitutionType, uint256 minNom, uint256 minVotes, uint256 termDays);

    struct GeoEntity { uint32 id; string name; }
    mapping(uint32 => GeoEntity) public countries;
    uint32[] public countryIdsList;
    mapping(uint32 => mapping(uint32 => GeoEntity)) public regions;
    mapping(uint32 => uint32[]) public countryRegionIdsList;
    mapping(uint32 => mapping(uint32 => mapping(uint32 => GeoEntity))) public communes;
    mapping(uint32 => mapping(uint32 => uint32[])) public regionCommuneIdsList;

    event CountryAdded(uint32 indexed countryId, string name);
    event RegionAdded(uint32 indexed countryId, uint32 indexed regionId, string name);
    event CommuneAdded(uint32 indexed countryId, uint32 indexed regionId, uint32 indexed communeId, string name);

    constructor() {
        owner = msg.sender;
        moderators[msg.sender] = true;
        emit ModeratorAdded(msg.sender);
    }

    // Ownership & Moderation
    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "Zero address");
        emit OwnershipTransferred(owner, newOwner);
        owner = newOwner;
        if (!moderators[newOwner]) {
            moderators[newOwner] = true;
            emit ModeratorAdded(newOwner);
        }
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

    // Geo
    function addCountry(uint32 _id, string memory _name) external onlyModerator whenNotPaused {
        require(_id != 0, "Zero country ID");
        require(countries[_id].id == 0, "Exists");
        countries[_id] = GeoEntity(_id, _name);
        countryIdsList.push(_id);
        emit CountryAdded(_id, _name);
    }
    function addRegion(uint32 _countryId, uint32 _regionId, string memory _name) external onlyModerator whenNotPaused {
        require(countries[_countryId].id != 0, "No country");
        require(regions[_countryId][_regionId].id == 0, "Exists");
        regions[_countryId][_regionId] = GeoEntity(_regionId, _name);
        countryRegionIdsList[_countryId].push(_regionId);
        emit RegionAdded(_countryId, _regionId, _name);
    }
    function addCommune(uint32 _countryId, uint32 _regionId, uint32 _communeId, string memory _name) external onlyModerator whenNotPaused {
        require(regions[_countryId][_regionId].id != 0, "No region");
        require(communes[_countryId][_regionId][_communeId].id == 0, "Exists");
        communes[_countryId][_regionId][_communeId] = GeoEntity(_communeId, _name);
        regionCommuneIdsList[_countryId][_regionId].push(_communeId);
        emit CommuneAdded(_countryId, _regionId, _communeId, _name);
    }
    function isCountryValid(uint32 _countryId) external view returns (bool) { return countries[_countryId].id != 0; }
    function isRegionValid(uint32 _countryId, uint32 _regionId) external view returns (bool) { return regions[_countryId][_regionId].id != 0; }
    function isCommuneValid(uint32 _countryId, uint32 _regionId, uint32 _communeId) external view returns (bool) { return communes[_countryId][_regionId][_communeId].id != 0; }

    // Positions
    function addPosition(string memory _name, uint8 _type, uint256 _minNom, uint256 _minVotes, uint256 _termDays) external onlyModerator whenNotPaused {
        positions[nextPositionId] = Position(nextPositionId, _name, _type, _minNom, _minVotes, _termDays, true);
        emit PositionAdded(nextPositionId, _name, _type, _minNom, _minVotes, _termDays);
        nextPositionId++;
    }
    function getPosition(uint256 _posId) external view returns (Position memory) {
        return positions[_posId];
    }

    // Admin param updates
    function setPetitionSignaturesThreshold(uint256 x) external onlyModerator whenNotPaused {
        uint256 old = petitionSignaturesThreshold;
        petitionSignaturesThreshold = x;
        emit PetitionThresholdUpdated(old, x);
    }
    function setPetitionDurationSeconds(uint256 d) external onlyModerator whenNotPaused {
        uint256 old = petitionDurationSeconds;
        petitionDurationSeconds = d;
        emit PetitionDurationUpdated(old, d);
    }
    function setVotingDurationSeconds(uint256 d) external onlyModerator whenNotPaused {
        uint256 old = votingDurationSeconds;
        votingDurationSeconds = d;
        emit VotingDurationUpdated(old, d);
    }
    function setMinAgeToParticipate(uint16 a) external onlyModerator whenNotPaused {
        uint16 old = minAgeToParticipate;
        minAgeToParticipate = a;
        emit MinAgeUpdated(old, a);
    }

    // Getters
    function getCountryIds() external view returns (uint32[] memory) { return countryIdsList; }
    function getRegionIds(uint32 _countryId) external view returns (uint32[] memory) { return countryRegionIdsList[_countryId]; }
    function getCommuneIds(uint32 _countryId, uint32 _regionId) external view returns (uint32[] memory) { return regionCommuneIdsList[_countryId][_regionId]; }
}