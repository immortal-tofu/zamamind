// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {FHE, ebool, euint8, euint16, externalEuint16} from "@fhevm/solidity/lib/FHE.sol";
import {SepoliaConfig} from "@fhevm/solidity/config/ZamaConfig.sol";

/// @title A simple FHE counter contract
contract Zamamind is SepoliaConfig {
    uint8 private constant MAX_COLOR = 8;
    uint8 private constant BITS_PER_COLOR = 3;

    uint8 private constant MASK_3BITS = 0x07;
    uint16 private constant MASK_12BITS = 0x0FFF;

    struct Game {
        euint16 game;
        ebool[8] colors;
    }
    mapping(uint256 => address) public requests;

    mapping(address => Game) public currentGames;
    mapping(address => uint256) public scores;
    mapping(address => euint8) public gameResults;

    mapping(address => uint256) public counter;
    mapping(address => uint256) public limit;

    function startGame() public {
        require(!FHE.isInitialized(currentGames[msg.sender].game), "No need to create a game");
        euint16 game = FHE.and(FHE.randEuint16(), MASK_12BITS);
        ebool[8] memory colors;
        for (uint8 i; i < 4; i += 1) {
            euint8 currentColor = FHE.and(
                FHE.asEuint8(i > 0 ? FHE.shr(game, uint8(i * BITS_PER_COLOR)) : game),
                MASK_3BITS
            ); // 28000 + 26000
            for (uint8 j; j < MAX_COLOR; j += 1) {
                ebool isColor = FHE.eq(currentColor, uint8(j)); // 52000
                colors[j] = FHE.isInitialized(colors[j]) ? FHE.or(colors[j], isColor) : isColor; // 28000
            }
        }
        for (uint8 i; i < MAX_COLOR; i += 1) {
            FHE.allowThis(colors[i]);
        }
        FHE.allowThis(game);
        currentGames[msg.sender] = Game(game, colors);
        delete counter[msg.sender];
    }

    function play(externalEuint16 combinaison, bytes calldata input) public {
        require(FHE.isInitialized(currentGames[msg.sender].game), "No game");
        counter[msg.sender] += 1;
        Game storage currentGame = currentGames[msg.sender];
        euint16 played = FHE.fromExternal(combinaison, input);
        euint8 results = FHE.asEuint8(0);
        for (uint8 i = 0; i < 4; i += 1) {
            euint8 currentColor = FHE.and(
                FHE.asEuint8(i > 0 ? FHE.shr(currentGame.game, uint8(i * BITS_PER_COLOR)) : currentGame.game),
                MASK_3BITS
            );
            euint8 currentPlayedColor = FHE.and(
                FHE.asEuint8(i > 0 ? FHE.shr(played, uint8(i * BITS_PER_COLOR)) : played),
                MASK_3BITS
            );
            ebool exist = FHE.asEbool(false);
            for (uint8 j; j < MAX_COLOR; j += 1) {
                exist = FHE.or(exist, FHE.and(FHE.eq(currentPlayedColor, FHE.asEuint8(j)), currentGame.colors[j]));
            }
            euint8 status = FHE.select(
                FHE.eq(currentColor, currentPlayedColor),
                FHE.asEuint8(1),
                FHE.select(exist, FHE.asEuint8(2), FHE.asEuint8(0))
            ); // 0 invalid, 1 valid, 2 wrong position
            results = FHE.rotr(results, 2);
            results = FHE.or(results, status);
        }
        results = FHE.rotr(results, 2);
        gameResults[msg.sender] = results;
        FHE.allowThis(results);
        FHE.allow(results, msg.sender);
    }

    function claim(externalEuint16 combinaison, bytes calldata input) public {
        euint16 played = FHE.fromExternal(combinaison, input);
        ebool won = FHE.eq(played, currentGames[msg.sender].game);
        FHE.allowThis(won);
        bytes32[] memory ciphertexts = new bytes32[](1);
        ciphertexts[0] = FHE.toBytes32(won);
        uint256 requestId = FHE.requestDecryption(ciphertexts, this.verifyVictory.selector);
        requests[requestId] = msg.sender;
    }

    function verifyVictory(uint256 requestId, bool victory, bytes[] memory signatures) public {
        FHE.checkSignatures(requestId, signatures);
        address player = requests[requestId];
        if (victory) {
            uint bonus = counter[player] >= 8 ? 0 : 8 - counter[player];
            uint bonusPoint = ((bonus * (bonus + 1)) / 2) * 100;
            scores[player] += 100 + bonusPoint;
        }
        delete currentGames[player];
    }

    function getGame() public view returns (euint16) {
        return currentGames[msg.sender].game;
    }

    function getScore(address user) public view returns (uint) {
        return scores[user];
    }

    function gameStarted() public view returns (bool) {
        return FHE.isInitialized(currentGames[msg.sender].game);
    }
}
