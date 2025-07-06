import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { ethers, fhevm } from "hardhat";
import { Zamamind, Zamamind__factory } from "../types";
import { expect } from "chai";
import { FhevmType } from "@fhevm/hardhat-plugin";

type Signers = {
  deployer: HardhatEthersSigner;
  alice: HardhatEthersSigner;
  bob: HardhatEthersSigner;
};

async function deployFixture() {
  const factory = (await ethers.getContractFactory("Zamamind")) as Zamamind__factory;
  const zamamindContract = (await factory.deploy()) as Zamamind;
  const zamamindContractAddress = await zamamindContract.getAddress();

  return { zamamindContract, zamamindContractAddress };
}

const repeat3bits4 = (n: number) => {
  if (n & ~7) throw new RangeError("n doit être entre 0 et 7");
  return n * 0x249; // 0x249 = 0b0010_0100_1001
};

describe("Zamamind", function () {
  let signers: Signers;
  let zamamindContract: Zamamind;
  let zamamindContractAddress: string;

  before(async function () {
    const ethSigners: HardhatEthersSigner[] = await ethers.getSigners();
    signers = { deployer: ethSigners[0], alice: ethSigners[1], bob: ethSigners[2] };
  });

  beforeEach(async () => {
    // Check whether the tests are running against an FHEVM mock environment
    if (!fhevm.isMock) {
      throw new Error(`This hardhat test suite cannot run on Sepolia Testnet`);
    }
    ({ zamamindContract, zamamindContractAddress } = await deployFixture());
  });

  it("start a game", async function () {
    const gameStarted = await zamamindContract.gameStarted();
    expect(gameStarted).to.eq(false);
    const tx = await zamamindContract.connect(signers.deployer).start();
    await tx.wait();

    const gameStarted2 = await zamamindContract.gameStarted();
    expect(gameStarted2).to.eq(true);
  });

  it("solve a game", async function () {
    const tx = await zamamindContract.connect(signers.alice).start();
    await tx.wait();

    // solve the game;
    const correct = new Array(4).fill(null);
    let counter = 0;
    for (let i = 0; i < 8; i += 1) {
      counter += 1;
      const input = fhevm.createEncryptedInput(zamamindContractAddress, signers.alice.address);
      const { handles, inputProof } = await input.add16(repeat3bits4(i)).encrypt();
      const txGame = await zamamindContract.connect(signers.alice).play(handles[0], inputProof);
      await txGame.wait();

      const encryptedResults = await zamamindContract.gameResults(signers.alice.address);
      const decryptedResults = await fhevm.userDecryptEuint(
        FhevmType.euint8,
        encryptedResults,
        zamamindContractAddress,
        signers.alice,
      );
      const results = Number(decryptedResults.toString());
      const blocs = [];
      for (let j = 0; j < 4; j += 1) {
        const bloc = (Number(results.toString()) >> (2 * j)) & 0b11; // isole les 2 bits du bloc i
        if (bloc === 0b01) {
          // console.log("VALID COLOR", i, "IN", j);
          correct[j] = i;
          blocs[j] = 1;
        } else {
          blocs[j] = 0;
        }
      }
      // console.log(blocs);
      if (correct.length == 4 && correct.every((v) => typeof v == "number")) break;
    }

    const binCorrect = correct
      .slice()
      .reverse()
      .reduce((b, c) => b + c.toString(2).padStart(3, "0"), "0b");
    const input = fhevm.createEncryptedInput(zamamindContractAddress, signers.alice.address);
    const { handles, inputProof } = await input.add16(Number(binCorrect)).encrypt();

    counter += 1;
    const txGame = await zamamindContract.connect(signers.alice).play(handles[0], inputProof);
    await txGame.wait();
    const encryptedResults = await zamamindContract.gameResults(signers.alice.address);
    const decryptedResults = await fhevm.userDecryptEuint(
      FhevmType.euint8,
      encryptedResults,
      zamamindContractAddress,
      signers.alice,
    );
    expect(decryptedResults).to.eq(85); // 1010101

    const txVictory = await zamamindContract.connect(signers.alice).claim(handles[0], inputProof);
    await txVictory.wait();
    await fhevm.awaitDecryptionOracle();

    const score = await zamamindContract.connect(signers.alice).getScore(signers.alice.address);
    const bonus = Math.max(8 - counter, 0);
    expect(score).to.eq(100 + ((bonus * (bonus + 1)) / 2) * 100);

    const score2 = await zamamindContract.connect(signers.alice).getScore(signers.bob.address);
    expect(score2).to.eq(0);
  });

  const solve = async (signer: HardhatEthersSigner) => {
    const tx = await zamamindContract.connect(signer).start();
    await tx.wait();

    const correct = new Array(4).fill(null);
    for (let i = 0; i < 8; i += 1) {
      const input = fhevm.createEncryptedInput(zamamindContractAddress, signer.address);
      const { handles, inputProof } = await input.add16(repeat3bits4(i)).encrypt();
      const txGame = await zamamindContract.connect(signer).play(handles[0], inputProof);
      await txGame.wait();

      const encryptedResults = await zamamindContract.gameResults(signer.address);
      const decryptedResults = await fhevm.userDecryptEuint(
        FhevmType.euint8,
        encryptedResults,
        zamamindContractAddress,
        signer,
      );
      const results = Number(decryptedResults.toString());
      const blocs = [];
      for (let j = 0; j < 4; j += 1) {
        const bloc = (Number(results.toString()) >> (2 * j)) & 0b11; // isole les 2 bits du bloc i
        if (bloc === 0b01) {
          // console.log("VALID COLOR", i, "IN", j);
          correct[j] = i;
          blocs[j] = 1;
        } else {
          blocs[j] = 0;
        }
      }
      // console.log(blocs);
      if (correct.length == 4 && correct.every((v) => typeof v == "number")) break;
    }

    const binCorrect = correct
      .slice()
      .reverse()
      .reduce((b, c) => b + c.toString(2).padStart(3, "0"), "0b");
    const input = fhevm.createEncryptedInput(zamamindContractAddress, signer.address);
    const { handles, inputProof } = await input.add16(Number(binCorrect)).encrypt();

    const txGame = await zamamindContract.connect(signer).play(handles[0], inputProof);
    await txGame.wait();
    const encryptedResults = await zamamindContract.gameResults(signer.address);
    const decryptedResults = await fhevm.userDecryptEuint(
      FhevmType.euint8,
      encryptedResults,
      zamamindContractAddress,
      signer,
    );
    expect(decryptedResults).to.eq(85); // 1010101

    const txVictory = await zamamindContract.connect(signer).claim(handles[0], inputProof);
    await txVictory.wait();
    await fhevm.awaitDecryptionOracle();
  };

  it("generate a leaderboard", async function () {
    // solve the game;
    await solve(signers.alice);
    await solve(signers.bob);
    await solve(signers.bob);
    await solve(signers.bob);
    await solve(signers.deployer);
    await solve(signers.deployer);
    await solve(signers.deployer);
    await solve(signers.deployer);
    const scores: { [key: string]: bigint } = {};
    scores[signers.alice.address] = await zamamindContract.connect(signers.alice).getScore(signers.alice);
    scores[signers.bob.address] = await zamamindContract.connect(signers.bob).getScore(signers.bob);
    scores[signers.deployer.address] = await zamamindContract.connect(signers.deployer).getScore(signers.deployer);
    const leaderboard = Object.entries(scores) // [ [addr, score], … ]
      .sort(([, aScore], [, bScore]) => (aScore == bScore ? 0 : aScore > bScore ? -1 : 1))
      .map(([addr]) => addr);

    const top = await zamamindContract.connect(signers.alice).getTop();
    // console.log(scores, leaderboard, top);
    expect(top[0]).to.eq(leaderboard[0]);
    expect(top[1]).to.eq(leaderboard[1]);
    expect(top[2]).to.eq(leaderboard[2]);

    expect(top[3]).to.eq("0x0000000000000000000000000000000000000000");

    await solve(signers.alice);
    await solve(signers.alice);
    await solve(signers.alice);
    await solve(signers.alice);
    await solve(signers.alice);
    await solve(signers.alice);
    scores[signers.alice.address] = await zamamindContract.connect(signers.alice).getScore(signers.alice);

    const leaderboard2 = Object.entries(scores) // [ [addr, score], … ]
      .sort(([, aScore], [, bScore]) => (aScore == bScore ? 0 : aScore > bScore ? -1 : 1))
      .map(([addr]) => addr);

    const top2 = await zamamindContract.connect(signers.alice).getTop();
    expect(top2[0]).to.eq(leaderboard2[0]);
    expect(top2[1]).to.eq(leaderboard2[1]);
    expect(top2[2]).to.eq(leaderboard2[2]);
    for (let i = 3; i < 10; i += 1) {
      expect(top2[i]).to.eq("0x0000000000000000000000000000000000000000");
    }
  });
});
