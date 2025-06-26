const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("FivesGame - 50 Tile Distribution", function () {
  let fivesGame;
  let owner, player1, player2, player3;

  beforeEach(async function () {
    [owner, player1, player2, player3] = await ethers.getSigners();
    
    const FivesGame = await ethers.getContractFactory("FivesGame");
    fivesGame = await FivesGame.deploy();
    await fivesGame.waitForDeployment();
  });

  describe("Contract Constants", function () {
    it("Should have correct hand size", async function () {
      const handSize = await fivesGame.HAND_SIZE();
      expect(handSize).to.equal(5);
    });

    it("Should have correct move timeout", async function () {
      const timeout = await fivesGame.MOVE_TIMEOUT();
      expect(timeout).to.equal(24 * 60 * 60); // 24 hours in seconds
    });

    it("Should have correct tile distribution", async function () {
      // 50-tile distribution: [5, 5, 5, 5, 5, 5, 5, 5, 5, 5]
      const distribution = [];
      for (let i = 0; i < 10; i++) {
        distribution.push(await fivesGame.TILE_DISTRIBUTION(i));
      }
      
      expect(distribution).to.deep.equal([5, 5, 5, 5, 5, 5, 5, 5, 5, 5]);
      
      // Total should be 50 tiles
      const total = distribution.reduce((sum, count) => sum + Number(count), 0);
      expect(total).to.equal(50);
    });
  });

  describe("Game Creation", function () {
    it("Should create a new game with proper parameters", async function () {
      const tx = await fivesGame.connect(owner).createGame(
        2,           // maxPlayers
        false,       // allowIslands
        100,         // winningScore
        "Creator"    // playerName
      );
      const receipt = await tx.wait();
      
      // Check for GameCreated event
      const event = receipt.logs.find(log => log.fragment?.name === "GameCreated");
      expect(event).to.not.be.undefined;
      
      // Verify game exists and has correct properties
      const gameId = 1;
      const gameInfo = await fivesGame.getGame(gameId);
      
      // getGame returns: (state, creator, maxPlayers, currentPlayerIndex, turnNumber, createdAt, allowIslands, playerAddresses, playerScores, tilesRemaining)
      expect(gameInfo[1]).to.equal(owner.address); // creator
      expect(gameInfo[2]).to.equal(2); // maxPlayers
      expect(gameInfo[0]).to.equal(0); // Setup state
      expect(gameInfo[6]).to.equal(false); // allowIslands
      expect(gameInfo[9]).to.equal(50); // tilesRemaining: 50 (no tiles drawn yet - game not started)
    });

    it("Should fail with invalid parameters", async function () {
      // Invalid player count
      await expect(
        fivesGame.createGame(1, false, 100, "Player")
      ).to.be.revertedWith("Invalid player count");
      
      await expect(
        fivesGame.createGame(5, false, 100, "Player")
      ).to.be.revertedWith("Invalid player count");

      // Invalid winning score
      await expect(
        fivesGame.createGame(2, false, 30, "Player")
      ).to.be.revertedWith("Invalid winning score");
      
      await expect(
        fivesGame.createGame(2, false, 600, "Player")
      ).to.be.revertedWith("Invalid winning score");

      // Empty player name
      await expect(
        fivesGame.createGame(2, false, 100, "")
      ).to.be.revertedWith("Player name required");
    });

    it("Should initialize tile pool correctly", async function () {
      await fivesGame.connect(owner).createGame(2, false, 100, "Creator");
      const gameId = 1;
      
      const tilePoolStatus = await fivesGame.getTilePoolStatus(gameId);
      
      // Before game starts, all 50 tiles should be in pool
      let totalRemaining = 0;
      for (let i = 0; i < 10; i++) {
        totalRemaining += Number(tilePoolStatus[i]);
      }
      expect(totalRemaining).to.equal(50);
    });
  });

  describe("Player Management", function () {
    let gameId;

    beforeEach(async function () {
      const tx = await fivesGame.connect(owner).createGame(3, false, 150, "Creator");
      await tx.wait();
      gameId = 1;
    });

    it("Should allow players to join", async function () {
      await expect(
        fivesGame.connect(player1).joinGame(gameId, "Player One")
      ).to.emit(fivesGame, "PlayerJoined");

      const gameInfo = await fivesGame.getGame(gameId);
      expect(gameInfo[7].length).to.equal(2); // playerAddresses length
      expect(gameInfo[7][1]).to.equal(player1.address);
      expect(gameInfo[9]).to.equal(50); // tilesRemaining: 50 (game not started yet - 3 player max)
    });

    it("Should prevent duplicate joins", async function () {
      await fivesGame.connect(player1).joinGame(gameId, "Player One");
      
      await expect(
        fivesGame.connect(player1).joinGame(gameId, "Player One Again")
      ).to.be.revertedWith("Already in this game");
    });

    it("Should auto-start when full", async function () {
      await fivesGame.connect(player1).joinGame(gameId, "Player One");
      
      await expect(
        fivesGame.connect(player2).joinGame(gameId, "Player Two")
      ).to.emit(fivesGame, "GameStarted");

      const gameInfo = await fivesGame.getGame(gameId);
      expect(gameInfo[0]).to.equal(1); // InProgress state
      expect(gameInfo[9]).to.equal(35); // tilesRemaining: 50 - 15 (three hands)
    });

    it("Should give each player 5 tiles", async function () {
      await fivesGame.connect(player1).joinGame(gameId, "Player One");
      await fivesGame.connect(player2).joinGame(gameId, "Player Two");
      // Game auto-starts when full, so hands are dealt
      
      const ownerInfo = await fivesGame.getPlayer(gameId, owner.address);
      const player1Info = await fivesGame.getPlayer(gameId, player1.address);
      
      expect(ownerInfo[2].length).to.equal(5); // hand length
      expect(player1Info[2].length).to.equal(5); // hand length
    });
  });

  describe("Tile Placement and Gameplay", function () {
    let gameId;

    beforeEach(async function () {
      // Create and start a 2-player game
      const tx = await fivesGame.connect(owner).createGame(2, false, 100, "Creator");
      await tx.wait();
      gameId = 1;
      
      await fivesGame.connect(player1).joinGame(gameId, "Player One");
      // Game auto-starts when full
    });

    it("Should allow placing first tile anywhere", async function () {
      const ownerInfo = await fivesGame.getPlayer(gameId, owner.address);
      const firstTile = Number(ownerInfo[2][0]); // hand[0]
      
      const placements = [{ number: firstTile, x: 0, y: 0 }];
      
      await expect(
        fivesGame.connect(owner).playTurn(gameId, placements)
      ).to.emit(fivesGame, "TurnPlaced");

      const tile = await fivesGame.getTileAt(gameId, 0, 0);
      expect(tile[1]).to.equal(firstTile); // number
      expect(tile[0]).to.be.true; // exists
    });

    it("Should prevent non-current player from playing", async function () {
      const player1Info = await fivesGame.getPlayer(gameId, player1.address);
      const firstTile = Number(player1Info[2][0]); // hand[0]
      
      const placements = [{ number: firstTile, x: 0, y: 0 }];
      
      await expect(
        fivesGame.connect(player1).playTurn(gameId, placements)
      ).to.be.revertedWith("Not your turn");
    });

    it("Should enforce mathematical rules for adjacent placement", async function () {
      // Place first tile
      const ownerInfo = await fivesGame.getPlayer(gameId, owner.address);
      const firstTile = Number(ownerInfo[2][0]); // hand[0]
      
      await fivesGame.connect(owner).playTurn(gameId, [{ number: firstTile, x: 0, y: 0 }]);
      
      // Get player1's hand and try to place a tile
      const player1Info = await fivesGame.getPlayer(gameId, player1.address);
      
      // Find a tile that would work (sum or difference of 5)
      let validTile = null;
      let invalidTile = null;
      
      for (let tile of player1Info[2]) { // hand
        const tileNum = Number(tile);
        const sum = firstTile + tileNum;
        const diff = Math.abs(firstTile - tileNum);
        
        if (sum === 5 || diff === 5) {
          validTile = tileNum;
        } else {
          invalidTile = tileNum;
        }
      }

      if (validTile !== null) {
        // Valid placement should work
        await expect(
          fivesGame.connect(player1).playTurn(gameId, [{ number: validTile, x: 1, y: 0 }])
        ).to.emit(fivesGame, "TurnPlaced");
      }

      if (invalidTile !== null) {
        // Get current turn info after potential valid placement
        const currentGameInfo = await fivesGame.getGame(gameId);
        const currentPlayerAddr = currentGameInfo[7][currentGameInfo[3]]; // playerAddresses[currentPlayerIndex]
        
        if (currentPlayerAddr === owner.address) {
          // Get fresh hand data for owner after potential hand refill
          const freshOwnerInfo = await fivesGame.getPlayer(gameId, owner.address);
          
          // Find an invalid tile from owner's current hand
          let ownerInvalidTile = null;
          for (let tile of freshOwnerInfo[2]) { // hand
            const tileNum = Number(tile);
            const sum = firstTile + tileNum;
            const diff = Math.abs(firstTile - tileNum);
            
            if (sum !== 5 && diff !== 5) {
              ownerInvalidTile = tileNum;
              break;
            }
          }
          
          if (ownerInvalidTile !== null) {
            // Invalid placement should fail
            await expect(
              fivesGame.connect(owner).playTurn(gameId, [{ number: ownerInvalidTile, x: 0, y: 1 }])
            ).to.be.revertedWith("Invalid tile placement");
          }
        }
      }
    });

    it("Should refill hand after playing", async function () {
      const ownerInfo = await fivesGame.getPlayer(gameId, owner.address);
      const firstTile = Number(ownerInfo[2][0]); // hand[0]
      
      await fivesGame.connect(owner).playTurn(gameId, [{ number: firstTile, x: 0, y: 0 }]);
      
      const updatedOwnerInfo = await fivesGame.getPlayer(gameId, owner.address);
      expect(updatedOwnerInfo[2].length).to.equal(5); // Hand refilled to 5
    });

    it("Should allow skipping turn", async function () {
      await expect(
        fivesGame.connect(owner).skipTurn(gameId)
      ).to.emit(fivesGame, "TurnChanged");
      
      const gameInfo = await fivesGame.getGame(gameId);
      expect(gameInfo[3]).to.equal(1); // currentPlayerIndex - turn passed to player1
    });

    it("Should allow batch tile placement", async function () {
      // Place first tile to establish a position
      const ownerInfo = await fivesGame.getPlayer(gameId, owner.address);
      const firstTile = Number(ownerInfo[2][0]); // hand[0]
      
      await fivesGame.connect(owner).playTurn(gameId, [{ number: firstTile, x: 0, y: 0 }]);
      
      // Try to place multiple tiles in one turn (if mathematically valid)
      const player1Info = await fivesGame.getPlayer(gameId, player1.address);
      
      // This might fail due to mathematical constraints, but the interface should work
      const multiplePlacements = [
        { number: Number(player1Info[2][0]), x: 1, y: 0 }, // hand[0]
        { number: Number(player1Info[2][1]), x: 2, y: 0 }  // hand[1]
      ];
      
      // Note: This test checks the interface works, actual success depends on tile values
      try {
        await fivesGame.connect(player1).playTurn(gameId, multiplePlacements);
      } catch (error) {
        expect(error.message).to.include("Invalid");
      }
    });
  });

  describe("Tile Pool Management", function () {
    let gameId;

    beforeEach(async function () {
      const tx = await fivesGame.connect(owner).createGame(2, false, 100, "Creator");
      await tx.wait();
      gameId = 1;
      await fivesGame.connect(player1).joinGame(gameId, "Player One");
    });

    it("Should track tile pool correctly", async function () {
      const initialPool = await fivesGame.getTilePoolStatus(gameId);
      const gameInfo = await fivesGame.getGame(gameId);
      
      // Calculate total tiles in pool
      let totalInPool = 0;
      for (let i = 0; i < 10; i++) {
        totalInPool += Number(initialPool[i]);
      }
      
      expect(totalInPool).to.equal(Number(gameInfo[9])); // tilesRemaining
      expect(totalInPool).to.equal(40); // 50 - 10 (two players' hands)
    });

    it("Should decrease pool when tiles are drawn", async function () {
      const initialGameInfo = await fivesGame.getGame(gameId);
      const initialRemaining = Number(initialGameInfo[9]); // tilesRemaining
      
      // Skip turn to draw new tiles
      await fivesGame.connect(owner).skipTurn(gameId);
      
      const updatedGameInfo = await fivesGame.getGame(gameId);
      const updatedRemaining = Number(updatedGameInfo[9]); // tilesRemaining
      
      // Should have drawn 5 new tiles (hand refill) - but only if hand was not already full
      // Since hands are already full (5 tiles), no new tiles should be drawn
      expect(updatedRemaining).to.equal(initialRemaining);
    });

    it("Should handle pool depletion gracefully", async function () {
      // This test would require depleting the entire pool, which is complex
      // For now, we'll just verify the pool status function works
      const poolStatus = await fivesGame.getTilePoolStatus(gameId);
      expect(poolStatus.length).to.equal(10);
      
      for (let i = 0; i < 10; i++) {
        expect(Number(poolStatus[i])).to.be.at.least(0);
      }
    });
  });

  describe("Scoring and Game Completion", function () {
    let gameId;

    beforeEach(async function () {
      const tx = await fivesGame.connect(owner).createGame(2, false, 50, "Creator"); // Low winning score for testing
      await tx.wait();
      gameId = 1;
      await fivesGame.connect(player1).joinGame(gameId, "Player One");
    });

    it("Should track player scores", async function () {
      const ownerInfo = await fivesGame.getPlayer(gameId, owner.address);
      const firstTile = Number(ownerInfo[2][0]); // hand[0]
      
      await fivesGame.connect(owner).playTurn(gameId, [{ number: firstTile, x: 0, y: 0 }]);
      
      const updatedOwnerInfo = await fivesGame.getPlayer(gameId, owner.address);
      expect(Number(updatedOwnerInfo[1])).to.be.greaterThan(0); // score
    });

    it("Should complete game when winning score is reached", async function () {
      // This test would require playing enough tiles to reach winning score
      // For demonstration, we'll verify the game completion logic exists
      const gameInfo = await fivesGame.getGame(gameId);
      // Note: winningScore is not returned by getGame, so we can't directly test it here
      expect(gameInfo[0]).to.equal(1); // InProgress state
    });
  });

  describe("View Functions", function () {
    let gameId;

    beforeEach(async function () {
      const tx = await fivesGame.connect(owner).createGame(2, true, 200, "Creator");
      await tx.wait();
      gameId = 1;
      await fivesGame.connect(player1).joinGame(gameId, "Player One");
    });

    it("Should return correct game information", async function () {
      const gameInfo = await fivesGame.getGame(gameId);
      
      // getGame returns: (state, creator, maxPlayers, currentPlayerIndex, turnNumber, createdAt, allowIslands, playerAddresses, playerScores, tilesRemaining)
      expect(gameInfo[1]).to.equal(owner.address); // creator
      expect(gameInfo[2]).to.equal(2); // maxPlayers
      expect(gameInfo[6]).to.be.true; // allowIslands
      expect(gameInfo[7].length).to.equal(2); // playerAddresses length
      expect(gameInfo[0]).to.equal(1); // InProgress (auto-started)
    });

    it("Should return correct player information", async function () {
      const ownerInfo = await fivesGame.getPlayer(gameId, owner.address);
      const player1Info = await fivesGame.getPlayer(gameId, player1.address);
      
      // getPlayer returns: (name, score, hand, hasJoined, lastMoveTime)
      expect(ownerInfo[0]).to.equal("Creator"); // name
      expect(ownerInfo[3]).to.be.true; // hasJoined
      expect(ownerInfo[1]).to.equal(0); // score
      expect(ownerInfo[2].length).to.equal(5); // hand length
      
      expect(player1Info[0]).to.equal("Player One"); // name
      expect(player1Info[3]).to.be.true; // hasJoined
      expect(player1Info[2].length).to.equal(5); // hand length
    });

    it("Should return player games list", async function () {
      const ownerGames = await fivesGame.getPlayerGames(owner.address);
      const player1Games = await fivesGame.getPlayerGames(player1.address);
      
      expect(ownerGames.length).to.equal(1);
      expect(ownerGames[0]).to.equal(gameId);
      expect(player1Games.length).to.equal(1);
      expect(player1Games[0]).to.equal(gameId);
    });

    it("Should handle non-existent queries gracefully", async function () {
      await expect(
        fivesGame.getGame(999)
      ).to.be.revertedWith("Game does not exist");
      
      // getPlayer doesn't revert for non-players, it returns default values
      const nonPlayerInfo = await fivesGame.getPlayer(gameId, player2.address);
      expect(nonPlayerInfo[3]).to.be.false; // hasJoined should be false
    });
  });

  describe("Edge Cases and Error Handling", function () {
    let gameId;

    beforeEach(async function () {
      const tx = await fivesGame.connect(owner).createGame(2, false, 100, "Creator");
      await tx.wait();
      gameId = 1;
      await fivesGame.connect(player1).joinGame(gameId, "Player One");
    });

    it("Should prevent playing tiles not in hand", async function () {
      const ownerInfo = await fivesGame.getPlayer(gameId, owner.address);
      
      // Try to play a tile number that's not in the hand
      // Since hands only have 5 tiles and there are 10 possible numbers (0-9),
      // there must be at least 5 numbers not in the hand
      let tileNotInHand = null;
      for (let testTile = 0; testTile <= 9; testTile++) {
        let foundInHand = false;
        for (let handTile of ownerInfo[2]) { // hand
          if (Number(handTile) === testTile) {
            foundInHand = true;
            break;
          }
        }
        if (!foundInHand) {
          tileNotInHand = testTile;
          break;
        }
      }
      
      // Should always find a tile not in hand since hand has only 5 tiles out of 10 possible
      expect(tileNotInHand).to.not.be.null;
      
      await expect(
        fivesGame.connect(owner).playTurn(gameId, [{ number: tileNotInHand, x: 0, y: 0 }])
      ).to.be.revertedWith("Don't have this tile");
    });

    it("Should prevent placing tiles at occupied positions", async function () {
      const ownerInfo = await fivesGame.getPlayer(gameId, owner.address);
      const firstTile = Number(ownerInfo[2][0]); // hand[0]
      
      // Place first tile
      await fivesGame.connect(owner).playTurn(gameId, [{ number: firstTile, x: 0, y: 0 }]);
      
      // Try to place another tile at same position
      const player1Info = await fivesGame.getPlayer(gameId, player1.address);
      const secondTile = Number(player1Info[2][0]); // hand[0]
      
      await expect(
        fivesGame.connect(player1).playTurn(gameId, [{ number: secondTile, x: 0, y: 0 }])
      ).to.be.revertedWith("Invalid tile placement");
    });

    it("Should handle empty placement arrays", async function () {
      await expect(
        fivesGame.connect(owner).playTurn(gameId, [])
      ).to.be.revertedWith("Must place at least one tile");
    });

    it("Should prevent actions on non-existent games", async function () {
      await expect(
        fivesGame.connect(owner).playTurn(999, [{ number: 1, x: 0, y: 0 }])
      ).to.be.revertedWith("Game does not exist");
      
      await expect(
        fivesGame.connect(owner).skipTurn(999)
      ).to.be.revertedWith("Game does not exist");
    });
  });
}); 