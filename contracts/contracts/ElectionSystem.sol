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
import "./VotingSystem.sol";

contract ElectionSystem {
    address public owner;
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    bool public paused = false;
    event Paused(address indexed by);
    event Unpaused(address indexed by);

    mapping(address => bool) public moderators;
    event ModeratorAdded(address indexed account);
    event ModeratorRemoved(address indexed account);

    UserRegistry public userRegistry;
    ConstitutionalParameters public constitutionalParameters;
    VotingSystem public votingSystem;

    enum ElectionStatus { Pending, NominationActive, VotingActive, Finalized, Canceled }

    struct CandidateEntry {
        address candidateAddress;
        bool isOfficiallyNominated;
    }

    struct Election {
        uint256 id;
        uint256 positionId;
        uint8 constitutionType;
        uint32 countryId;
        uint32 regionId;
        uint32 communeId;
        uint256 nominationStartTime;
        uint256 nominationEndTime;
        uint256 votingStartTime;
        uint256 votingEndTime;
        address[] nominatedCandidateAddresses;
        mapping(address => CandidateEntry) candidatesData;
        mapping(address => mapping(address => bool)) hasUserNominatedCandidate;
        ElectionStatus status;
        address winner;
    }

    mapping(uint256 => Election) public elections;
    uint256 public nextElectionId = 1;
    uint256[] public allElectionIds;

    mapping(bytes32 => uint256[]) private electionsByKey;
    mapping(bytes32 => uint256) public latestElectionIdByKey;

    event ElectionCreated(uint256 indexed id, uint256 positionId, ElectionStatus status, uint32 countryId, uint32 regionId, uint32 communeId);
    event CandidateProposed(uint256 indexed electionId, address indexed nominator, address indexed candidateAddress);
    event CandidateNominated(uint256 indexed electionId, address indexed candidateAddress);
    event ElectionStatusChanged(uint256 indexed electionId, ElectionStatus newStatus);
    event ElectionFinalized(uint256 indexed electionId, address winner);
    event WinnerDeclared(uint256 indexed electionId, address winner);
    event ElectionCanceled(uint256 indexed electionId, address indexed by);
    event ElectionEmergencyStatus(uint256 indexed electionId, ElectionStatus oldStatus, ElectionStatus newStatus, address indexed by);

    modifier onlyOwner() { require(msg.sender == owner, "Only owner"); _; }
    modifier onlyModerator() { require(moderators[msg.sender] || msg.sender == owner, "Not moderator"); _; }
    modifier whenNotPaused() { require(!paused, "Paused"); _; }
    modifier onlyCitizen() {
        require(userRegistry.isCitizenFullyApprovedAndConfirmed(msg.sender), "Not eligible");
        _;
    }

    constructor(address _userRegistry, address _constitutionalParameters, address _votingSystem) {
        owner = msg.sender;
        require(_userRegistry != address(0) && _constitutionalParameters != address(0) && _votingSystem != address(0), "Zero addr");
        userRegistry = UserRegistry(_userRegistry);
        constitutionalParameters = ConstitutionalParameters(_constitutionalParameters);
        votingSystem = VotingSystem(_votingSystem);
        moderators[msg.sender] = true;
        emit ModeratorAdded(msg.sender);
    }

    // Ownership / Moderators / Pause
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

    function _computeKey(
        uint256 _positionId,
        uint256 _constitutionType,
        uint32 _countryId,
        uint32 _regionId,
        uint32 _communeId
    ) internal pure returns (bytes32) {
        return keccak256(abi.encodePacked(_positionId, _constitutionType, _countryId, _regionId, _communeId));
    }

    function createElection(
        uint256 _positionId,
        uint256 _nominationDurationDays,
        uint256 _votingDurationDays,
        uint32 _countryId,
        uint32 _regionId,
        uint32 _communeId
    ) external onlyModerator whenNotPaused returns (uint256) {
        ConstitutionalParameters.Position memory pos = constitutionalParameters.getPosition(_positionId);
        require(pos.id != 0, "No position");
        require(pos.isActive, "Inactive position");
        require(_nominationDurationDays > 0 && _votingDurationDays > 0, "Bad durations");
        require(_countryId != 0, "Country required");

        uint256 eid = nextElectionId++;
        Election storage e = elections[eid];
        e.id = eid;
        e.positionId = _positionId;
        e.constitutionType = pos.constitutionType;
        e.countryId = _countryId;
        e.regionId = _regionId;
        e.communeId = _communeId;
        e.nominationStartTime = block.timestamp;
        e.nominationEndTime = block.timestamp + (_nominationDurationDays * 1 days);
        e.votingStartTime = e.nominationEndTime + 1;
        e.votingEndTime = e.votingStartTime + (_votingDurationDays * 1 days);
        e.status = ElectionStatus.NominationActive;
        allElectionIds.push(eid);

        bytes32 key = _computeKey(_positionId, uint256(e.constitutionType), _countryId, _regionId, _communeId);
        electionsByKey[key].push(eid);
        latestElectionIdByKey[key] = eid;

        emit ElectionCreated(eid, _positionId, e.status, _countryId, _regionId, _communeId);
        emit ElectionStatusChanged(eid, ElectionStatus.NominationActive);
        return eid;
    }

    function proposeCandidate(uint256 _electionId, address _candidateAddress) external onlyCitizen whenNotPaused {
        Election storage e = elections[_electionId];
        require(e.id != 0, "No election");
        require(e.status == ElectionStatus.NominationActive, "Not nomination");
        require(block.timestamp >= e.nominationStartTime && block.timestamp <= e.nominationEndTime, "Nomination closed");
        require(msg.sender != _candidateAddress, "Self");
        require(!e.hasUserNominatedCandidate[_candidateAddress][msg.sender], "Already proposed");
        require(userRegistry.isCitizenFullyApprovedAndConfirmed(_candidateAddress), "Candidate not citizen");

        if (e.candidatesData[_candidateAddress].candidateAddress == address(0)) {
            e.nominatedCandidateAddresses.push(_candidateAddress);
            e.candidatesData[_candidateAddress] = CandidateEntry(_candidateAddress, false);
        }
        e.hasUserNominatedCandidate[_candidateAddress][msg.sender] = true;
        emit CandidateProposed(_electionId, msg.sender, _candidateAddress);
    }

    function nominateCandidate(uint256 _electionId, address _candidateAddress) external onlyModerator whenNotPaused {
        Election storage e = elections[_electionId];
        require(e.id != 0, "No election");
        require(e.status == ElectionStatus.NominationActive, "Not nomination");
        require(e.candidatesData[_candidateAddress].candidateAddress != address(0), "No candidate");
        require(!e.candidatesData[_candidateAddress].isOfficiallyNominated, "Already nominated");
        e.candidatesData[_candidateAddress].isOfficiallyNominated = true;
        emit CandidateNominated(_electionId, _candidateAddress);
    }

    function startVoting(uint256 _electionId) external onlyModerator whenNotPaused {
        Election storage e = elections[_electionId];
        require(e.id != 0, "No election");
        require(e.status == ElectionStatus.NominationActive, "Bad status");
        require(block.timestamp >= e.nominationEndTime, "Nomination not ended");
        e.status = ElectionStatus.VotingActive;
        emit ElectionStatusChanged(_electionId, ElectionStatus.VotingActive);
    }

    // Старая finalizeElection (winner может быть 0) - потом можно доработать
    function finalizeElection(uint256 _electionId) external whenNotPaused {
        Election storage e = elections[_electionId];
        require(e.id != 0, "No election");
        require(e.status == ElectionStatus.VotingActive, "Not voting");
        require(block.timestamp > e.votingEndTime, "Voting ongoing");
        e.status = ElectionStatus.Finalized;
        emit ElectionStatusChanged(_electionId, ElectionStatus.Finalized);
        emit ElectionFinalized(_electionId, e.winner);
    }

    // Объявить победителя и финализировать
    function declareWinnerAndFinalize(uint256 _electionId, address _candidate) external onlyModerator whenNotPaused {
        Election storage e = elections[_electionId];
        require(e.id != 0, "No election");
        require(e.status == ElectionStatus.VotingActive, "Not voting");
        require(block.timestamp > e.votingEndTime, "Voting ongoing");
        require(e.candidatesData[_candidate].candidateAddress != address(0), "Not candidate");
        // Можно добавить требование isOfficiallyNominated == true, если нужно будет потом жёстче это деалать
        e.winner = _candidate;
        e.status = ElectionStatus.Finalized;
        emit WinnerDeclared(_electionId, _candidate);
        emit ElectionStatusChanged(_electionId, ElectionStatus.Finalized);
        emit ElectionFinalized(_electionId, _candidate);
    }

    function cancelElection(uint256 _electionId) external onlyModerator whenNotPaused {
        Election storage e = elections[_electionId];
        require(e.id != 0, "No election");
        require(e.status != ElectionStatus.Finalized && e.status != ElectionStatus.Canceled, "Locked");
        e.status = ElectionStatus.Canceled;
        emit ElectionCanceled(_electionId, msg.sender);
        emit ElectionStatusChanged(_electionId, ElectionStatus.Canceled);
    }

    // Аварийная смена статуса (owner)
    function emergencySetElectionStatus(uint256 _electionId, ElectionStatus newStatus) external onlyOwner {
        Election storage e = elections[_electionId];
        require(e.id != 0, "No election");
        ElectionStatus old = e.status;
        e.status = newStatus;
        emit ElectionEmergencyStatus(_electionId, old, newStatus, msg.sender);
        emit ElectionStatusChanged(_electionId, newStatus);
    }

    function submitCandidacy(
      uint256 _levelId,
      uint256 _positionId,
      uint32 _countryId,
      uint32 _regionId,
      uint32 _communeId,
      string calldata
    ) external onlyCitizen whenNotPaused {
        bytes32 key = _computeKey(_positionId, _levelId, _countryId, _regionId, _communeId);
        uint256[] storage list = electionsByKey[key];
        require(list.length > 0, "No elections");
        uint256 foundElectionId = 0;
        for (uint256 idx = list.length; idx > 0; idx--) {
            uint256 eid = list[idx - 1];
            Election storage e = elections[eid];
            if (e.id == 0) continue;
            if (e.status != ElectionStatus.NominationActive) continue;
            if (block.timestamp < e.nominationStartTime || block.timestamp > e.nominationEndTime) continue;
            foundElectionId = eid;
            break;
        }
        require(foundElectionId != 0, "No active nomination");
        Election storage target = elections[foundElectionId];
        require(target.candidatesData[msg.sender].candidateAddress == address(0), "Already candidate");
        target.nominatedCandidateAddresses.push(msg.sender);
        target.candidatesData[msg.sender] = CandidateEntry(msg.sender, false);
        emit CandidateProposed(foundElectionId, msg.sender, msg.sender);
    }

    function registerSelfAsCandidate(uint256 _electionId, string calldata) external onlyCitizen whenNotPaused {
        Election storage e = elections[_electionId];
        require(e.id != 0, "No election");
        require(e.status == ElectionStatus.NominationActive, "Not nomination");
        require(block.timestamp >= e.nominationStartTime && block.timestamp <= e.nominationEndTime, "Nomination closed");
        address candidate = msg.sender;
        require(e.candidatesData[candidate].candidateAddress == address(0), "Already candidate");
        e.nominatedCandidateAddresses.push(candidate);
        e.candidatesData[candidate] = CandidateEntry(candidate, false);
        emit CandidateProposed(_electionId, msg.sender, candidate);
    }

    function supportsSelfNomination() external pure returns (bool) {
        return true;
    }

    // Getters
    function getElection(uint256 _id) external view returns (
        uint256 id, uint256 positionId, uint8 constitutionType,
        uint32 countryId, uint32 regionId, uint32 communeId,
        uint256 nominationStart, uint256 nominationEnd, uint256 votingStart, uint256 votingEnd,
        ElectionStatus status, address winner, address[] memory candidates
    ) {
        Election storage e = elections[_id];
        return (
            e.id, e.positionId, e.constitutionType,
            e.countryId, e.regionId, e.communeId,
            e.nominationStartTime, e.nominationEndTime, e.votingStartTime, e.votingEndTime,
            e.status, e.winner, e.nominatedCandidateAddresses
        );
    }
    function getAllElectionIds() external view returns (uint256[] memory) {
        return allElectionIds;
    }
    function getElectionIdsForParams(
        uint256 _levelId,
        uint256 _positionId,
        uint32 _countryId,
        uint32 _regionId,
        uint32 _communeId
    ) external view returns (uint256[] memory) {
        bytes32 key = _computeKey(_positionId, _levelId, _countryId, _regionId, _communeId);
        uint256[] storage list = electionsByKey[key];
        uint256 len = list.length;
        uint256[] memory out = new uint256[](len);
        for (uint256 i = 0; i < len; i++) {
            out[i] = list[i];
        }
        return out;
    }
}