// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title FivesGame
 * @dev Smart contract for the Fives tile weaving game with 50-tile distribution
 * @notice This contract manages on-chain games, player moves, and scoring with proper tile management
 */
contract FivesGame {
    // Game constants
    uint8 public constant HAND_SIZE = 5;  // Players draw 5 tiles at a time
    uint256 public constant MOVE_TIMEOUT = 24 hours;
    uint256 public constant WINNING_SCORE = 100;

    // Tile distribution (50 total tiles)
    uint8[10] public TILE_DISTRIBUTION = [5, 5, 5, 5, 5, 5, 5, 5, 5, 5];
    // Index:  0  1  2  3  4  5  6  7  8  9
    // Means:  5x0, 5x1, 5x2, 5x3, 5x4, 5x5, 5x6, 5x7, 5x8, 5x9

    // Game state enum
    enum GameState { Setup, InProgress, Completed, Cancelled }
    
    // Tile structure
    struct Tile {
        uint8 number;        // Display number 0-9
        int16 x;
        int16 y;
        bool isPlaced;
        uint256 turnPlaced;
    }
    
    struct TilePlacement {
        uint8 number;        // Display number 0-9
        int16 x;
        int16 y;
    }
    
    // Player structure
    struct Player {
        address wallet;
        string name;
        uint256 score;
        uint8[] hand;        // Display numbers 0-9
        bool hasJoined;
        uint256 lastMoveTime;
    }
    
    // Game structure
    struct Game {
        uint256 gameId;
        GameState state;
        address creator;
        uint8 maxPlayers;
        uint8 currentPlayerIndex;
        uint256 turnNumber;
        uint256 createdAt;
        uint256 lastMoveAt;
        bool allowIslands;
        uint256 winningScore;
        mapping(address => Player) players;
        address[] playerAddresses;
        mapping(bytes32 => Tile) board; // position hash => tile
        bytes32[] placedTiles; // ordered list of placed tiles
        uint8[] tilePool; // Shared pool of tiles to draw from
        uint256 poolSeed; // Seed for pseudo-random tile drawing
    }
    
    // Events
    event GameCreated(uint256 indexed gameId, address indexed creator, uint8 maxPlayers);
    event PlayerJoined(uint256 indexed gameId, address indexed player, string name);
    event GameStarted(uint256 indexed gameId);
    event TurnPlaced(uint256 indexed gameId, address indexed player, TilePlacement[] placements, uint256 score);
    event GameCompleted(uint256 indexed gameId, address indexed winner, uint256 score);
    event GameCancelled(uint256 indexed gameId);
    event TurnChanged(uint256 indexed gameId, address indexed currentPlayer, uint8 playerIndex);
    event TilesDrawn(uint256 indexed gameId, address indexed player, uint8 tilesDrawn);
    
    // State variables
    mapping(uint256 => Game) public games;
    mapping(address => uint256[]) public playerGames;
    uint256 public nextGameId = 1;
    
    // Modifiers
    modifier gameExists(uint256 gameId) {
        require(gameId > 0 && gameId < nextGameId, "Game does not exist");
        _;
    }
    
    modifier gameInState(uint256 gameId, GameState expectedState) {
        require(games[gameId].state == expectedState, "Game not in expected state");
        _;
    }
    
    modifier isPlayerInGame(uint256 gameId) {
        require(games[gameId].players[msg.sender].hasJoined, "Player not in game");
        _;
    }
    
    modifier isCurrentPlayer(uint256 gameId) {
        Game storage game = games[gameId];
        require(
            game.playerAddresses[game.currentPlayerIndex] == msg.sender,
            "Not your turn"
        );
        _;
    }
    
    /**
     * @dev Create a new game
     * @param maxPlayers Maximum number of players (2-4)
     * @param allowIslands Whether to allow island placements
     * @param winningScore The winning score for the game
     * @param playerName Name of the creating player
     */
    function createGame(
        uint8 maxPlayers,
        bool allowIslands,
        uint256 winningScore,
        string memory playerName
    ) external returns (uint256) {
        require(maxPlayers >= 2 && maxPlayers <= 4, "Invalid player count");
        require(winningScore >= 50 && winningScore <= 500, "Invalid winning score");
        require(bytes(playerName).length > 0, "Player name required");
        
        uint256 gameId = nextGameId++;
        Game storage game = games[gameId];
        
        game.gameId = gameId;
        game.state = GameState.Setup;
        game.creator = msg.sender;
        game.maxPlayers = maxPlayers;
        game.currentPlayerIndex = 0;
        game.turnNumber = 1;
        game.createdAt = block.timestamp;
        game.lastMoveAt = block.timestamp;
        game.allowIslands = allowIslands;
        game.winningScore = winningScore;
        game.poolSeed = uint256(keccak256(abi.encodePacked(block.timestamp, block.prevrandao, gameId)));
        
        // Initialize tile pool with Quinto distribution
        _initializeTilePool(gameId);
        
        // Add creator as first player
        _addPlayerToGame(gameId, msg.sender, playerName);
        
        emit GameCreated(gameId, msg.sender, maxPlayers);
        return gameId;
    }
    
    /**
     * @dev Join an existing game
     * @param gameId The game to join
     * @param playerName Name of the joining player
     */
    function joinGame(uint256 gameId, string memory playerName) 
        external 
        gameExists(gameId) 
        gameInState(gameId, GameState.Setup) 
    {
        Game storage game = games[gameId];
        require(!game.players[msg.sender].hasJoined, "Already in this game");
        require(game.playerAddresses.length < game.maxPlayers, "Game is full");
        require(bytes(playerName).length > 0, "Player name required");
        
        _addPlayerToGame(gameId, msg.sender, playerName);
        
        emit PlayerJoined(gameId, msg.sender, playerName);
        
        // Auto-start if game is full
        if (game.playerAddresses.length == game.maxPlayers) {
            _startGame(gameId);
        }
    }
    
    /**
     * @dev Start a game (creator only)
     * @param gameId The game to start
     */
    function startGame(uint256 gameId) 
        external 
        gameExists(gameId) 
        gameInState(gameId, GameState.Setup) 
    {
        Game storage game = games[gameId];
        require(msg.sender == game.creator, "Only creator can start game");
        require(game.playerAddresses.length >= 2, "Need at least 2 players");
        
        _startGame(gameId);
    }
    
    /**
     * @dev Place a tile on the board
     * @param gameId The game ID
     * @param placements Array of TilePlacement objects
     */
    function playTurn(uint256 gameId, TilePlacement[] memory placements) 
        external 
        gameExists(gameId) 
        gameInState(gameId, GameState.InProgress)
        isPlayerInGame(gameId)
        isCurrentPlayer(gameId)
    {
        require(placements.length > 0, "Must place at least one tile");
        require(placements.length <= 10, "Too many tiles in one turn");

        Game storage game = games[gameId];
        Player storage player = game.players[msg.sender];

        // Validate all placements before applying any
        for (uint i = 0; i < placements.length; i++) {
            require(_playerHasTile(player, placements[i].number), "Don't have this tile");
            require(_isValidPlacement(gameId, placements[i], placements), "Invalid tile placement");
        }

        // Apply all placements
        for (uint i = 0; i < placements.length; i++) {
            TilePlacement memory placement = placements[i];
            
            // Place tile on board
            bytes32 positionHash = keccak256(abi.encodePacked(placement.x, placement.y));
            game.board[positionHash] = Tile({
                number: placement.number,
                x: placement.x,
                y: placement.y,
                isPlaced: true,
                turnPlaced: game.turnNumber
            });
            game.placedTiles.push(positionHash);

            // Remove from hand
            _removeTileFromHand(player, placement.number);
        }
        
        // Calculate Quinto-style sequence score for this entire turn
        uint256 totalScore = _calculateSequenceScore(gameId, placements);

        // Update player score
        player.score += totalScore;
        player.lastMoveTime = block.timestamp;

        emit TurnPlaced(gameId, msg.sender, placements, totalScore);

        // Draw tiles to refill hand
        _drawTilesToHand(gameId, msg.sender);

        // Check win condition
        if (player.hand.length == 0 || player.score >= game.winningScore) {
            game.state = GameState.Completed;
            emit GameCompleted(gameId, msg.sender, player.score);
            return;
        }

        // Move to next turn
        _nextTurn(gameId);
    }
    
    /**
     * @dev Skip turn and draw tiles
     * @param gameId The game ID
     */
    function skipTurn(uint256 gameId) 
        external 
        gameExists(gameId) 
        gameInState(gameId, GameState.InProgress)
        isPlayerInGame(gameId)
        isCurrentPlayer(gameId)
    {
        Game storage game = games[gameId];
        game.players[msg.sender].lastMoveTime = block.timestamp;
        
        // Draw tiles to refill hand
        _drawTilesToHand(gameId, msg.sender);
        
        _nextTurn(gameId);
    }
    
    /**
     * @dev Cancel a game (creator only, or if in setup for 24+ hours)
     * @param gameId The game ID
     */
    function cancelGame(uint256 gameId) external gameExists(gameId) {
        Game storage game = games[gameId];
        
        bool canCancel = msg.sender == game.creator ||
                        (game.state == GameState.Setup && block.timestamp > game.createdAt + 24 hours);
        
        require(canCancel, "Cannot cancel game");
        
        game.state = GameState.Cancelled;
        emit GameCancelled(gameId);
    }
    
    // View functions
    
    /**
     * @dev Get game information
     */
    function getGame(uint256 gameId) external view gameExists(gameId) returns (
        GameState state,
        address creator,
        uint8 maxPlayers,
        uint8 currentPlayerIndex,
        uint256 turnNumber,
        uint256 createdAt,
        bool allowIslands,
        address[] memory playerAddresses,
        uint256[] memory playerScores,
        uint256 tilesRemaining,
        uint256 winningScore
    ) {
        Game storage game = games[gameId];
        
        uint256[] memory scores = new uint256[](game.playerAddresses.length);
        for (uint i = 0; i < game.playerAddresses.length; i++) {
            scores[i] = game.players[game.playerAddresses[i]].score;
        }
        
        return (
            game.state,
            game.creator,
            game.maxPlayers,
            game.currentPlayerIndex,
            game.turnNumber,
            game.createdAt,
            game.allowIslands,
            game.playerAddresses,
            scores,
            game.tilePool.length,
            game.winningScore
        );
    }
    
    /**
     * @dev Get player information for a game
     */
    function getPlayer(uint256 gameId, address playerAddr) external view gameExists(gameId) returns (
        string memory name,
        uint256 score,
        uint8[] memory hand,
        bool hasJoined,
        uint256 lastMoveTime
    ) {
        Player storage player = games[gameId].players[playerAddr];
        return (
            player.name,
            player.score,
            player.hand,
            player.hasJoined,
            player.lastMoveTime
        );
    }
    
    /**
     * @dev Get tile at position
     */
    function getTileAt(uint256 gameId, int16 x, int16 y) external view gameExists(gameId) returns (
        bool exists,
        uint8 number,
        uint256 turnPlaced
    ) {
        bytes32 positionHash = keccak256(abi.encodePacked(x, y));
        Tile storage tile = games[gameId].board[positionHash];
        
        return (tile.isPlaced, tile.number, tile.turnPlaced);
    }
    
    /**
     * @dev Get games for a player
     */
    function getPlayerGames(address player) external view returns (uint256[] memory) {
        return playerGames[player];
    }
    
    /**
     * @dev Get remaining tiles count for each number
     */
    function getTilePoolStatus(uint256 gameId) external view gameExists(gameId) returns (
        uint8[10] memory remainingCounts
    ) {
        Game storage game = games[gameId];
        
        // Count remaining tiles of each number
        for (uint i = 0; i < game.tilePool.length; i++) {
            remainingCounts[game.tilePool[i]]++;
        }
        
        return remainingCounts;
    }
    
    // Internal functions
    
    function _initializeTilePool(uint256 gameId) internal {
        Game storage game = games[gameId];
        
        // Create tile pool with 5 of each number (0-9) - optimized
        // Pre-allocate array to avoid multiple resizing operations
        game.tilePool = new uint8[](50);
        uint8 index = 0;
        
        for (uint8 number = 0; number <= 9; number++) {
            for (uint8 count = 0; count < TILE_DISTRIBUTION[number]; count++) {
                game.tilePool[index] = number;
                index++;
            }
        }
        
        // Light shuffle - only swap a few positions to save gas
        _lightShuffleTilePool(gameId);
    }
    
    function _lightShuffleTilePool(uint256 gameId) internal {
        Game storage game = games[gameId];
        uint256 poolSize = game.tilePool.length;
        
        // Light shuffle - only perform 10 swaps to save gas
        for (uint8 swaps = 0; swaps < 10; swaps++) {
            game.poolSeed = uint256(keccak256(abi.encodePacked(game.poolSeed, block.timestamp, swaps)));
            uint256 i = game.poolSeed % poolSize;
            uint256 j = (game.poolSeed >> 8) % poolSize;
            
            // Swap tiles[i] and tiles[j]
            if (i != j) {
                uint8 temp = game.tilePool[i];
                game.tilePool[i] = game.tilePool[j];
                game.tilePool[j] = temp;
            }
        }
    }
    
    function _addPlayerToGame(uint256 gameId, address player, string memory name) internal {
        Game storage game = games[gameId];
        
        game.players[player] = Player({
            wallet: player,
            name: name,
            score: 0,
            hand: new uint8[](0),
            hasJoined: true,
            lastMoveTime: block.timestamp
        });
        
        game.playerAddresses.push(player);
        playerGames[player].push(gameId);
    }
    
    function _startGame(uint256 gameId) internal {
        Game storage game = games[gameId];
        game.state = GameState.InProgress;
        game.lastMoveAt = block.timestamp;
        
        // Deal initial hands to each player
        for (uint i = 0; i < game.playerAddresses.length; i++) {
            _drawTilesToHand(gameId, game.playerAddresses[i]);
        }
        
        emit GameStarted(gameId);
    }
    
    function _drawTilesToHand(uint256 gameId, address playerAddr) internal {
        Game storage game = games[gameId];
        Player storage player = game.players[playerAddr];
        
        uint8 tilesToDraw = 0;
        if (player.hand.length < HAND_SIZE) {
            tilesToDraw = HAND_SIZE - uint8(player.hand.length);
        }
        
        // Draw tiles from pool
        uint8 tilesDrawn = 0;
        while (tilesDrawn < tilesToDraw && game.tilePool.length > 0) {
            // Draw from the end of the pool (already shuffled)
            uint8 drawnTile = game.tilePool[game.tilePool.length - 1];
            game.tilePool.pop();
            
            player.hand.push(drawnTile);
            tilesDrawn++;
        }
        
        if (tilesDrawn > 0) {
            emit TilesDrawn(gameId, playerAddr, tilesDrawn);
        }
    }
    
    function _nextTurn(uint256 gameId) internal {
        Game storage game = games[gameId];
        game.currentPlayerIndex = (game.currentPlayerIndex + 1) % uint8(game.playerAddresses.length);
        
        if (game.currentPlayerIndex == 0) {
            game.turnNumber++;
        }
        
        game.lastMoveAt = block.timestamp;
        
        emit TurnChanged(gameId, game.playerAddresses[game.currentPlayerIndex], game.currentPlayerIndex);
    }
    
    function _playerHasTile(Player storage player, uint8 tileNumber) internal view returns (bool) {
        for (uint i = 0; i < player.hand.length; i++) {
            if (player.hand[i] == tileNumber) {
                return true;
            }
        }
        return false;
    }
    
    function _removeTileFromHand(Player storage player, uint8 tileNumber) internal {
        for (uint i = 0; i < player.hand.length; i++) {
            if (player.hand[i] == tileNumber) {
                player.hand[i] = player.hand[player.hand.length - 1];
                player.hand.pop();
                return;
            }
        }
    }
    
    function _isValidPlacement(uint256 gameId, TilePlacement memory placement, TilePlacement[] memory allPlacements) internal view returns (bool) {
        Game storage game = games[gameId];
        
        // Check position isn't already occupied
        bytes32 positionHash = keccak256(abi.encodePacked(placement.x, placement.y));
        if (game.board[positionHash].isPlaced) {
            return false;
        }
        
        // Check position isn't being used by another placement in this turn
        // Count how many placements use the same position
        uint8 positionCount = 0;
        for (uint i = 0; i < allPlacements.length; i++) {
            if (allPlacements[i].x == placement.x && allPlacements[i].y == placement.y) {
                positionCount++;
            }
        }
        
        // If more than one placement uses the same position, it's invalid
        if (positionCount > 1) {
            return false;
        }
        
        // QUINTO STYLE RULE 1: First move must be on or adjacent to center (7,7)
        if (game.placedTiles.length == 0) {
            // Check if at least one tile in the turn is on or adjacent to center
            bool hasValidFirstTile = false;
            for (uint k = 0; k < allPlacements.length; k++) {
                int16 dx = allPlacements[k].x - 7;
                int16 dy = allPlacements[k].y - 7;
                
                // On center or orthogonally adjacent to center
                if ((dx == 0 && dy == 0) || 
                    (dx == 0 && (dy == 1 || dy == -1)) ||
                    (dy == 0 && (dx == 1 || dx == -1))) {
                    hasValidFirstTile = true;
                    break;
                }
            }
            if (!hasValidFirstTile) {
                return false;
            }
            
            // For subsequent tiles in first turn, check turn contiguity
            return _checkTurnContiguity(placement, allPlacements, game);
        }
        
        // QUINTO STYLE RULE 2: Check adjacency to existing tiles (unless islands allowed)
        if (!game.allowIslands) {
            bool hasAdjacency = _checkAdjacencyToBoard(gameId, allPlacements);
            if (!hasAdjacency) {
                return false;
            }
        }
        
        // QUINTO STYLE RULE 3: Check turn contiguity (all tiles in same row or column)
        if (!_checkTurnContiguity(placement, allPlacements, game)) {
            return false;
        }
        
        // QUINTO STYLE RULE 4: Check 5-tile sequence limits
        if (!_checkSequenceLimits(gameId, placement, allPlacements)) {
            return false;
        }
        
        return true;
    }
    
    function _checkTurnContiguity(TilePlacement memory placement, TilePlacement[] memory allPlacements, Game storage game) internal view returns (bool) {
        if (allPlacements.length <= 1) {
            return true; // Single tile is always contiguous
        }
        
        // Check if all tiles are in same row OR same column
        bool allSameRow = true;
        bool allSameCol = true;
        
        for (uint i = 1; i < allPlacements.length; i++) {
            if (allPlacements[i].y != allPlacements[0].y) {
                allSameRow = false;
            }
            if (allPlacements[i].x != allPlacements[0].x) {
                allSameCol = false;
            }
        }
        
        if (!allSameRow && !allSameCol) {
            return false; // Must be in same row OR column
        }
        
        // Check contiguity - no gaps unless filled by existing tiles
        if (allSameRow) {
            return _checkRowContiguity(allPlacements[0].y, allPlacements, game);
        } else {
            return _checkColumnContiguity(allPlacements[0].x, allPlacements, game);
        }
    }
    
    function _checkRowContiguity(int16 y, TilePlacement[] memory allPlacements, Game storage game) internal view returns (bool) {
        // Get sorted x coordinates
        int16[] memory xCoords = new int16[](allPlacements.length);
        for (uint i = 0; i < allPlacements.length; i++) {
            xCoords[i] = allPlacements[i].x;
        }
        
        // Simple bubble sort for small arrays
        for (uint i = 0; i < xCoords.length - 1; i++) {
            for (uint j = 0; j < xCoords.length - i - 1; j++) {
                if (xCoords[j] > xCoords[j + 1]) {
                    int16 temp = xCoords[j];
                    xCoords[j] = xCoords[j + 1];
                    xCoords[j + 1] = temp;
                }
            }
        }
        
        // Check for gaps that aren't filled by existing tiles
        for (uint i = 1; i < xCoords.length; i++) {
            for (int16 x = xCoords[i-1] + 1; x < xCoords[i]; x++) {
                bytes32 gapHash = keccak256(abi.encodePacked(x, y));
                if (!game.board[gapHash].isPlaced) {
                    return false; // Gap not filled by existing tile
                }
            }
        }
        
        return true;
    }
    
    function _checkColumnContiguity(int16 x, TilePlacement[] memory allPlacements, Game storage game) internal view returns (bool) {
        // Get sorted y coordinates
        int16[] memory yCoords = new int16[](allPlacements.length);
        for (uint i = 0; i < allPlacements.length; i++) {
            yCoords[i] = allPlacements[i].y;
        }
        
        // Simple bubble sort for small arrays
        for (uint i = 0; i < yCoords.length - 1; i++) {
            for (uint j = 0; j < yCoords.length - i - 1; j++) {
                if (yCoords[j] > yCoords[j + 1]) {
                    int16 temp = yCoords[j];
                    yCoords[j] = yCoords[j + 1];
                    yCoords[j + 1] = temp;
                }
            }
        }
        
        // Check for gaps that aren't filled by existing tiles
        for (uint i = 1; i < yCoords.length; i++) {
            for (int16 y = yCoords[i-1] + 1; y < yCoords[i]; y++) {
                bytes32 gapHash = keccak256(abi.encodePacked(x, y));
                if (!game.board[gapHash].isPlaced) {
                    return false; // Gap not filled by existing tile
                }
            }
        }
        
        return true;
    }
    
    function _checkAdjacencyToBoard(uint256 gameId, TilePlacement[] memory allPlacements) internal view returns (bool) {
        Game storage game = games[gameId];
        
        // Check if any tile in this turn is adjacent to existing board tiles
        for (uint i = 0; i < allPlacements.length; i++) {
            if (_hasAdjacentBoardTile(gameId, allPlacements[i].x, allPlacements[i].y)) {
                return true;
            }
        }
        
        return false;
    }
    
    function _hasAdjacentBoardTile(uint256 gameId, int16 x, int16 y) internal view returns (bool) {
        Game storage game = games[gameId];
        
        int16[4] memory dx = [int16(-1), int16(1), int16(0), int16(0)];
        int16[4] memory dy = [int16(0), int16(0), int16(-1), int16(1)];
        
        for (uint i = 0; i < 4; i++) {
            bytes32 adjHash = keccak256(abi.encodePacked(x + dx[i], y + dy[i]));
            if (game.board[adjHash].isPlaced) {
                return true;
            }
        }
        
        return false;
    }
    
    function _checkSequenceLimits(uint256 gameId, TilePlacement memory placement, TilePlacement[] memory allPlacements) internal view returns (bool) {
        Game storage game = games[gameId];
        
        // Check horizontal sequence length
        uint8 horizontalCount = _getSequenceLength(gameId, placement.x, placement.y, allPlacements, true);
        if (horizontalCount > 5) {
            return false;
        }
        
        // Check vertical sequence length
        uint8 verticalCount = _getSequenceLength(gameId, placement.x, placement.y, allPlacements, false);
        if (verticalCount > 5) {
            return false;
        }
        
        return true;
    }
    
    function _getSequenceLength(uint256 gameId, int16 x, int16 y, TilePlacement[] memory allPlacements, bool horizontal) internal view returns (uint8) {
        Game storage game = games[gameId];
        
        int16 start;
        int16 end;
        if (horizontal) {
            start = x;
            end = x;
            
            // Find leftmost tile
            while (start > 0 && (_hasExistingTile(gameId, start - 1, y) || _hasPlacementTile(allPlacements, start - 1, y))) {
                start--;
            }
            
            // Find rightmost tile
            while (end < 14 && (_hasExistingTile(gameId, end + 1, y) || _hasPlacementTile(allPlacements, end + 1, y))) {
                end++;
            }
        } else {
            start = y;
            end = y;
            
            // Find topmost tile
            while (start > 0 && (_hasExistingTile(gameId, x, start - 1) || _hasPlacementTile(allPlacements, x, start - 1))) {
                start--;
            }
            
            // Find bottommost tile
            while (end < 14 && (_hasExistingTile(gameId, x, end + 1) || _hasPlacementTile(allPlacements, x, end + 1))) {
                end++;
            }
        }
        
        int16 length = end - start + 1;
        return length > 0 ? uint8(uint16(length)) : 0;
    }
    
    function _hasExistingTile(uint256 gameId, int16 x, int16 y) internal view returns (bool) {
        Game storage game = games[gameId];
        bytes32 hash = keccak256(abi.encodePacked(x, y));
        return game.board[hash].isPlaced;
    }
    
    function _hasPlacementTile(TilePlacement[] memory allPlacements, int16 x, int16 y) internal pure returns (bool) {
        for (uint i = 0; i < allPlacements.length; i++) {
            if (allPlacements[i].x == x && allPlacements[i].y == y) {
                return true;
            }
        }
        return false;
    }
    
    function _calculateTileScore(uint256 gameId, int16 x, int16 y) internal view returns (uint256) {
        // Quinto-style scoring is sequence-based, not per-tile
        // This function will be called for each placed tile, but we need to calculate sequences
        // For now, return base score - sequence calculation happens in playTurn
        return 1;
    }
    
    function _calculateSequenceScore(uint256 gameId, TilePlacement[] memory placedTiles) internal view returns (uint256) {
        uint256 totalScore = 0;
        
        // Track processed rows and columns to avoid double counting
        bool[15] memory processedRows;
        bool[15] memory processedCols;
        
        // For each placed tile, check if it creates or extends sequences
        for (uint i = 0; i < placedTiles.length; i++) {
            TilePlacement memory tile = placedTiles[i];
            
            // Check horizontal sequence (if row not yet processed)
            // Use tile.y directly since coordinates are 0-14
            if (!processedRows[uint16(tile.y)]) {
                uint256 horizontalScore = _getSequenceScore(gameId, tile.x, tile.y, true, placedTiles);
                if (horizontalScore > 0) {
                    totalScore += horizontalScore;
                    processedRows[uint16(tile.y)] = true;
                }
            }
            
            // Check vertical sequence (if column not yet processed)
            // Use tile.x directly since coordinates are 0-14
            if (!processedCols[uint16(tile.x)]) {
                uint256 verticalScore = _getSequenceScore(gameId, tile.x, tile.y, false, placedTiles);
                if (verticalScore > 0) {
                    totalScore += verticalScore;
                    processedCols[uint16(tile.x)] = true;
                }
            }
        }
        
        return totalScore;
    }
    
    function _getSequenceScore(uint256 gameId, int16 x, int16 y, bool horizontal, TilePlacement[] memory placedTiles) internal view returns (uint256) {
        Game storage game = games[gameId];
        
        // Find sequence bounds
        int16 start;
        int16 end;
        if (horizontal) {
            start = x;
            end = x;
            
            // Find leftmost tile
            while (start > 0 && (_hasExistingTile(gameId, start - 1, y) || _hasPlacementTile(placedTiles, start - 1, y))) {
                start--;
            }
            
            // Find rightmost tile
            while (end < 14 && (_hasExistingTile(gameId, end + 1, y) || _hasPlacementTile(placedTiles, end + 1, y))) {
                end++;
            }
        } else {
            start = y;
            end = y;
            
            // Find topmost tile
            while (start > 0 && (_hasExistingTile(gameId, x, start - 1) || _hasPlacementTile(placedTiles, x, start - 1))) {
                start--;
            }
            
            // Find bottommost tile
            while (end < 14 && (_hasExistingTile(gameId, x, end + 1) || _hasPlacementTile(placedTiles, x, end + 1))) {
                end++;
            }
        }
        
        int16 length = end - start + 1;
        uint8 sequenceLength = length > 0 ? uint8(uint16(length)) : 0;
        
        // Only score sequences of 2+ tiles
        if (sequenceLength < 2) {
            return 0;
        }
        
        // Check if at least one tile in sequence was placed this turn
        bool hasNewTile = false;
        uint256 sequenceSum = 0;
        
        for (int16 pos = start; pos <= end; pos++) {
            uint8 tileNumber;
            bool isNewTile = false;
            
            if (horizontal) {
                // Check if this position has a newly placed tile
                for (uint i = 0; i < placedTiles.length; i++) {
                    if (placedTiles[i].x == pos && placedTiles[i].y == y) {
                        tileNumber = placedTiles[i].number;
                        isNewTile = true;
                        hasNewTile = true;
                        break;
                    }
                }
                
                // If not new, get from existing board
                if (!isNewTile) {
                    bytes32 hash = keccak256(abi.encodePacked(pos, y));
                    if (game.board[hash].isPlaced) {
                        tileNumber = game.board[hash].number;
                    }
                }
            } else {
                // Check if this position has a newly placed tile
                for (uint i = 0; i < placedTiles.length; i++) {
                    if (placedTiles[i].x == x && placedTiles[i].y == pos) {
                        tileNumber = placedTiles[i].number;
                        isNewTile = true;
                        hasNewTile = true;
                        break;
                    }
                }
                
                // If not new, get from existing board
                if (!isNewTile) {
                    bytes32 hash = keccak256(abi.encodePacked(x, pos));
                    if (game.board[hash].isPlaced) {
                        tileNumber = game.board[hash].number;
                    }
                }
            }
            
            sequenceSum += tileNumber;
        }
        
        // Only score if sequence contains newly placed tile and sums to multiple of 5
        if (hasNewTile && sequenceSum % 5 == 0 && sequenceSum > 0) {
            return sequenceSum * 10; // Quinto-style scoring: sum × 10
        }
        
        return 0;
    }
} 