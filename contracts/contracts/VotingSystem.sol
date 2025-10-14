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

import "./UserRegistry.sol";
import "./ConstitutionalParameters.sol";

contract VotingSystem {
    address public owner;
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    bool public paused = false;
    event Paused(address indexed by);
    event Unpaused(address indexed by);

    // Moderators 
    mapping(address => bool) public moderators;
    event ModeratorAdded(address indexed account);
    event ModeratorRemoved(address indexed account);

    UserRegistry public userRegistry;
    ConstitutionalParameters public constitutionalParameters;

    enum Stage { Petition, Voting, Accepted, Rejected, Expired }

    struct Initiative {
        uint256 id;
        string description;
        Stage stage;
        uint32 countryId;
        uint256 petitionStartTime;
        uint256 petitionEndTime;
        uint256 votingStartTime;
        uint256 votingEndTime;
        uint256 petitionSignatures;
        mapping(address => bool) hasSignedPetition;
        mapping(address => bool) hasVoted;
        uint256 yesVotesCountry;
        uint256 noVotesCountry;
        mapping(uint32 => uint256) yesVotesByRegion;
        mapping(uint32 => uint256) noVotesByRegion;
        mapping(uint32 => uint256) votersByRegion;
        uint32[] regionIds;
        address creator;
    }

    mapping(uint256 => Initiative) public initiatives;
    uint256 public nextInitiativeId = 1;
    uint256[] public allInitiativeIds;

    event InitiativeCreated(uint256 indexed id, string description, address indexed creator, uint256 petitionStart, uint256 petitionEnd);
    event PetitionSigned(uint256 indexed id, address indexed signer, uint256 totalSignatures);
    event PetitionToVoting(uint256 indexed id, uint256 votingStart, uint256 votingEnd);
    event Voted(uint256 indexed id, address indexed voter, bool support, uint256 yesCountry, uint256 noCountry);
    event InitiativeFinalized(uint256 indexed id, Stage finalStage);
    event InitiativeStageForced(uint256 indexed id, Stage oldStage, Stage newStage, address indexed by);

    modifier onlyOwner() { require(msg.sender == owner, "Only owner"); _; }
    modifier onlyModerator() { require(moderators[msg.sender] || msg.sender == owner, "Not moderator"); _; }
    modifier whenNotPaused() { require(!paused, "Paused"); _; }
    modifier onlyCitizen() {
        require(userRegistry.isRegisteredCitizen(msg.sender), "Not registered");
        require(userRegistry.isCitizenApproved(msg.sender), "Not approved");
        _;
    }

    constructor(address _userRegistry, address _constitutionalParameters) {
        owner = msg.sender;
        require(_userRegistry != address(0) && _constitutionalParameters != address(0), "Zero addr");
        userRegistry = UserRegistry(_userRegistry);
        constitutionalParameters = ConstitutionalParameters(_constitutionalParameters);
        moderators[msg.sender] = true;
        emit ModeratorAdded(msg.sender);
    }

    // Ownership / Mods / Pause
    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "Zero");
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

    function createInitiative(string memory _description, uint32 _countryId) external onlyCitizen whenNotPaused returns (uint256) {
        require(bytes(_description).length > 0, "No desc");
        require(constitutionalParameters.isCountryValid(_countryId), "Bad country");
        uint256 id = nextInitiativeId++;
        Initiative storage i = initiatives[id];
        i.id = id;
        i.description = _description;
        i.stage = Stage.Petition;
        i.countryId = _countryId;
        i.petitionStartTime = block.timestamp;
        i.petitionEndTime = block.timestamp + constitutionalParameters.petitionDurationSeconds();
        i.creator = msg.sender;
        allInitiativeIds.push(id);
        emit InitiativeCreated(id, _description, msg.sender, i.petitionStartTime, i.petitionEndTime);
        return id;
    }

    function signPetition(uint256 _id) external onlyCitizen whenNotPaused {
        Initiative storage i = initiatives[_id];
        require(i.stage == Stage.Petition, "Not petition");
        require(block.timestamp <= i.petitionEndTime, "Petition expired");
        require(!i.hasSignedPetition[msg.sender], "Already signed");
        i.hasSignedPetition[msg.sender] = true;
        i.petitionSignatures += 1;
        emit PetitionSigned(_id, msg.sender, i.petitionSignatures);

        if (i.petitionSignatures >= constitutionalParameters.petitionSignaturesThreshold()) {
            _startVoting(_id);
        }
    }

    function _startVoting(uint256 _id) internal {
        Initiative storage i = initiatives[_id];
        require(i.stage == Stage.Petition, "Not petition");
        i.stage = Stage.Voting;
        i.votingStartTime = block.timestamp;
        i.votingEndTime = block.timestamp + constitutionalParameters.votingDurationSeconds();
        i.regionIds = constitutionalParameters.getRegionIds(i.countryId);
        emit PetitionToVoting(_id, i.votingStartTime, i.votingEndTime);
    }

    function vote(uint256 _id, bool support) external onlyCitizen whenNotPaused {
        Initiative storage i = initiatives[_id];
        require(i.stage == Stage.Voting, "Not voting");
        require(block.timestamp <= i.votingEndTime, "Voting expired");
        require(!i.hasVoted[msg.sender], "Already voted");
        (uint32 countryId, uint32 regionId, ) = userRegistry.getCitizenLocationIds(msg.sender);
        require(countryId == i.countryId, "Foreign country");

        i.hasVoted[msg.sender] = true;
        i.votersByRegion[regionId] += 1;
        if (support) {
            i.yesVotesCountry += 1;
            i.yesVotesByRegion[regionId] += 1;
        } else {
            i.noVotesCountry += 1;
            i.noVotesByRegion[regionId] += 1;
        }
        emit Voted(_id, msg.sender, support, i.yesVotesCountry, i.noVotesCountry);
    }

    function finalizeInitiative(uint256 _id) external whenNotPaused {
        Initiative storage i = initiatives[_id];
        require(i.stage == Stage.Voting, "Not voting");
        require(block.timestamp > i.votingEndTime, "Voting ongoing");
        bool countryMajority = i.yesVotesCountry > i.noVotesCountry;
        uint256 regionsSupporting = 0;
        for (uint k = 0; k < i.regionIds.length; k++) {
            uint32 reg = i.regionIds[k];
            if (i.yesVotesByRegion[reg] > i.noVotesByRegion[reg]) {
                regionsSupporting++;
            }
        }
        bool regionMajority = (regionsSupporting > i.regionIds.length / 2);

        if (countryMajority && regionMajority) {
            i.stage = Stage.Accepted;
        } else {
            i.stage = Stage.Rejected;
        }
        emit InitiativeFinalized(_id, i.stage);
    }

    // Emergency (owner только - сознательное ограничение)
    function emergencySetStage(uint256 _id, Stage newStage) external onlyOwner {
        Initiative storage i = initiatives[_id];
        Stage old = i.stage;
        i.stage = newStage;
        emit InitiativeStageForced(_id, old, newStage, msg.sender);
    }

    // Views
    function getInitiative(uint256 _id) external view returns (
        uint256 id, string memory description, Stage stage, uint32 countryId,
        uint256 petitionStart, uint256 petitionEnd, uint256 votingStart, uint256 votingEnd,
        uint256 petitionSignatures, uint256 yesVotesCountry, uint256 noVotesCountry, uint256[] memory yesByRegion, uint256[] memory noByRegion
    ) {
        Initiative storage i = initiatives[_id];
        uint256[] memory yes = new uint256[](i.regionIds.length);
        uint256[] memory no = new uint256[](i.regionIds.length);
        for (uint k = 0; k < i.regionIds.length; k++) {
            uint32 reg = i.regionIds[k];
            yes[k] = i.yesVotesByRegion[reg];
            no[k] = i.noVotesByRegion[reg];
        }
        return (
            i.id, i.description, i.stage, i.countryId,
            i.petitionStartTime, i.petitionEndTime, i.votingStartTime, i.votingEndTime,
            i.petitionSignatures, i.yesVotesCountry, i.noVotesCountry, yes, no
        );
    }
    function getAllInitiativeIds() external view returns (uint256[] memory) {
        return allInitiativeIds;
    }
}