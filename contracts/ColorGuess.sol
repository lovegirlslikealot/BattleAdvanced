// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "hardhat/console.sol";

import {FHE, euint8, euint32, ebool, externalEuint8} from "@fhevm/solidity/lib/FHE.sol";
import {SepoliaConfig} from "@fhevm/solidity/config/ZamaConfig.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

/// @title ColorGuess - 使用 FHEVM 的链上猜颜色小游戏（单合约实现）
/// @notice 与 Zama 官方用法一致：外部加密输入 + FHE 同态运算 + ACL 授权 + 用户解密
contract ColorGuess is SepoliaConfig, Ownable {
    // -------------------------------
    // 配置与经济参数
    // -------------------------------
    uint8 public numColors;            // 颜色个数（前端固定调色板，索引为 [0, numColors)）
    uint256 public participationFee;   // 参与费用（wei）
    uint256 public rewardOnWin;        // 猜中时奖励（wei）
    uint16 public protocolFeeBps;      // 手续费，基点（1% = 100 bps）
    address public treasury;           // 手续费接收地址

    // -------------------------------
    // 游戏状态
    // -------------------------------
    struct GameSession {
        euint8 secret;     // 密文目标颜色索引（FHE 随机生成）
        uint256 stake;     // 本局玩家投入的费用（一般等于 participationFee）
        bool exists;       // 是否存在进行中的局
        bool settled;      // 是否已结算
    }

    // 用户最近一次结果句柄（便于前端“用户解密”展示 win/lose）
    mapping(address => ebool) private _lastResult;

    // 每个玩家的当前局
    mapping(address => GameSession) private _games;

    // oracle 解密回调 requestID => player
    mapping(uint256 => address) private _requestToPlayer;

    // 统计/排行榜所需的最小数据
    struct Stat { uint256 plays; uint256 wins; }
    mapping(address => Stat) public stats;

    // -------------------------------
    // 事件
    // -------------------------------
    event GameStarted(address indexed player, uint256 stake, uint8 numColors);
    event GuessSubmitted(address indexed player);
    event GameSettled(address indexed player, bool win, uint256 payout, uint256 fee);

    constructor() Ownable(msg.sender) {
        numColors = 6;
        participationFee = 0.001 ether;
        rewardOnWin = 0.0015 ether;
        protocolFeeBps = 100; // 1%
        treasury = msg.sender;
    }

    // -------------------------------
    // 管理员：参数配置
    // -------------------------------
    function setConfig(
        uint8 _numColors,
        uint256 _participationFee,
        uint256 _rewardOnWin,
        uint16 _protocolFeeBps,
        address _treasury
    ) external onlyOwner {
        require(_numColors >= 2 && _numColors <= 32, "numColors out of range");
        require(_treasury != address(0), "treasury=0");
        numColors = _numColors;
        participationFee = _participationFee;
        rewardOnWin = _rewardOnWin;
        protocolFeeBps = _protocolFeeBps;
        treasury = _treasury;
    }

    receive() external payable {}

    // -------------------------------
    // 视图：查询配置与玩家统计
    // -------------------------------
    function getParams() external view returns (
        uint8 _numColors,
        uint256 _participationFee,
        uint256 _rewardOnWin,
        uint16 _protocolFeeBps,
        address _treasury
    ) {
        return (numColors, participationFee, rewardOnWin, protocolFeeBps, treasury);
    }

    function getStats(address user) external view returns (uint256 plays, uint256 wins) {
        Stat memory s = stats[user];
        return (s.plays, s.wins);
    }

    /// @notice 返回玩家最近一次猜测结果的密文句柄（ebool）。前端可用 FHEVM 用户解密。
    function getMyLastResultHandle() external view returns (ebool) {
        return _lastResult[msg.sender];
    }

    // -------------------------------
    // 核心流程：开始与猜测
    // -------------------------------
    /// @notice 开始新的一局（支付参与费）。合约用 FHE 生成密文目标颜色索引。
    function startGame() external payable {
        console.log("startGame(): sender=%s value=%s fee=%s", msg.sender, msg.value, participationFee);
        require(msg.value == participationFee, "invalid fee");

        // 使用 FHE 生成 [0, numColors) 的目标索引：
        // 通过 randEuint32() 再取模，避免 upperBound 必须为 2 的幂的限制
        euint32 r = FHE.randEuint32();
        console.log("startGame(): randEuint32 OK");
        euint8 secret = FHE.asEuint8(
            FHE.rem(r, uint32(numColors))
        );
        console.log("startGame(): secret computed");

        // 保存当前局数据
        GameSession storage g = _games[msg.sender];
        g.secret = secret;
        g.stake = msg.value;
        g.exists = true;
        g.settled = false;
        console.log("startGame(): game stored");

        // 授权本合约可继续使用该密文（非必须，但显式更清晰）
        FHE.allowThis(secret);
        console.log("startGame(): allowThis(secret) OK");

        emit GameStarted(msg.sender, msg.value, numColors);
    }

    /// @notice 提交加密的猜测值（颜色索引）。同时：
    /// - 保存 ebool 结果句柄并授权给用户（便于前端“用户解密”展示）
    /// - 触发 Oracle 解密请求，回调中进行清算（ETH 奖励/手续费）
    function guess(externalEuint8 encGuess, bytes calldata inputProof) external {
        GameSession storage g = _games[msg.sender];
        require(g.exists && !g.settled, "no active game");

        // 验证并转换外部密文输入
        euint8 guessVal = FHE.fromExternal(encGuess, inputProof);

        // 同态比较
        ebool isCorrect = FHE.eq(g.secret, guessVal);

        // 缓存最近一次密文结果，并授权给本合约与用户
        _lastResult[msg.sender] = isCorrect;
        FHE.allowThis(isCorrect);
        FHE.allow(isCorrect, msg.sender);

        // 请求解密（异步），在回调中进行清算
        bytes32[] memory handles = new bytes32[](1);
        handles[0] = FHE.toBytes32(isCorrect);
        uint256 requestID = FHE.requestDecryption(handles, this.onDecrypt.selector);
        _requestToPlayer[requestID] = msg.sender;

        emit GuessSubmitted(msg.sender);
    }

    /// @notice Oracle 回调：解密结果校验 + 结算
    /// @dev 回调签名固定：(uint256 requestID, bytes cleartexts, bytes decryptionProof)
    function onDecrypt(uint256 requestID, bytes calldata cleartexts, bytes calldata decryptionProof) external {
        // 1) 验证 KMS 签名（必须在回调里直接调用）
        FHE.checkSignatures(requestID, cleartexts, decryptionProof);

        address player = _requestToPlayer[requestID];
        require(player != address(0), "unknown requestID");
        GameSession storage g = _games[player];
        require(g.exists && !g.settled, "already settled");

        // 2) 解析明文结果：cleartexts 为紧凑的 n*32 字节，本例 n=1
        //    读取第 0 个 32 字节作为 uint256（0/1）
        require(cleartexts.length >= 32, "invalid cleartexts");
        uint256 v;
        assembly {
            v := calldataload(cleartexts.offset)
        }
        bool win = (v != 0);

        // 3) 结算：扣手续费 + 发奖励（或不发）
        uint256 fee = (g.stake * protocolFeeBps) / 10000;
        uint256 payout = win ? rewardOnWin : 0;

        g.settled = true;
        g.exists = false;

        // 更新统计
        stats[player].plays += 1;
        if (win) {
            stats[player].wins += 1;
        }

        // 4) 转账（尽量在最后）
        if (fee > 0 && treasury != address(0)) {
            (bool okFee, ) = treasury.call{value: fee}("");
            okFee; // ignore
        }
        if (payout > 0) {
            (bool okPayout, ) = player.call{value: payout}("");
            okPayout; // ignore
        }

        emit GameSettled(player, win, payout, fee);
    }
}


