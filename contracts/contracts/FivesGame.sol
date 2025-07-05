// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * @title FivesGame
 * @dev Smart contract for the Fives tile weaving game with 50-tile distribution
 * @notice This contract manages on-chain games, player moves, and scoring with proper tile management
 */
contract FivesGame {
    // Game constants
    uint8 public constant HAND_SIZE = 5;  // Players draw 5 tiles at a time
    uint256 public constant MOVE_TIMEOUT = 24 hours;
    uint256 public constant WINNING_SCORE = 1000;

    // Individual tile distribution (50 tiles per player)
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
    
    // Player structure - Each player has their own tile pool
    struct Player {
        address wallet;
        string name;
        uint256 score;
        uint8[] hand;        // Display numbers 0-9 in player's hand
        uint8[] tilePool;    // Individual pool of 50 tiles per player
        uint256 poolSeed;    // Individual randomization seed
        bool hasJoined;
        uint256 lastMoveTime;
        address controllerAddress; // ✅ NEW: Address that can control this player (for ZeroDev compatibility)
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
    event TilesBurned(uint256 indexed gameId, address indexed player, uint8 tilesBurned);
    event ControllerAddressSet(uint256 indexed gameId, address indexed player, address indexed controller); // ✅ NEW
    
    // State variables
    mapping(uint256 => Game) public games;
    mapping(address => uint256[]) public playerGames;
    uint256 public nextGameId = 1;
    
    // NEW: Authorized paymaster contracts
    mapping(address => bool) public authorizedPaymasters;
    address public owner;
    
    // NEW: Events for paymaster management
    event PaymasterAuthorized(address indexed paymaster);
    event PaymasterRevoked(address indexed paymaster);
    
    constructor() {
        owner = msg.sender;
        
        // Pre-authorize common ZeroDev paymaster addresses
        // These are the standard ZeroDev addresses for different networks
        authorizedPaymasters[0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789] = true; // EntryPoint v0.6
        authorizedPaymasters[0x0576a174D229E3cFA37253523E645A78A0C91B57] = true; // ZeroDev Paymaster v1
        
        emit PaymasterAuthorized(0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789);
        emit PaymasterAuthorized(0x0576a174D229E3cFA37253523E645A78A0C91B57);
    }
    
    // NEW: Modifier to check authorization
    modifier onlyAuthorizedForPlayer(address playerAddress) {
        require(
            msg.sender == playerAddress || authorizedPaymasters[msg.sender],
            "Unauthorized: sender must be player or authorized paymaster"
        );
        _;
    }
    
    // NEW: Owner functions to manage paymasters
    function authorizePaymaster(address paymaster) external {
        require(msg.sender == owner, "Only owner can authorize paymasters");
        authorizedPaymasters[paymaster] = true;
        emit PaymasterAuthorized(paymaster);
    }
    
    function revokePaymaster(address paymaster) external {
        require(msg.sender == owner, "Only owner can revoke paymasters");
        authorizedPaymasters[paymaster] = false;
        emit PaymasterRevoked(paymaster);
    }
    
    // NEW: Check if an address is authorized
    function isAuthorizedPaymaster(address paymaster) external view returns (bool) {
        return authorizedPaymasters[paymaster];
    }
    
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
        require(_isPlayerInGame(gameId, msg.sender), "Player not in game or not authorized");
        _;
    }
    
    modifier isCurrentPlayer(uint256 gameId) {
        require(_isCurrentPlayer(gameId, msg.sender), "Not your turn or not authorized");
        _;
    }
    
    // ✅ NEW: Enhanced modifiers for controller address support
    modifier isPlayerOrControllerInGame(uint256 gameId, address playerAddr) {
        require(_isPlayerInGame(gameId, playerAddr), "Player not in game or not authorized");
        _;
    }
    
    modifier isCurrentPlayerOrController(uint256 gameId, address playerAddr) {
        require(_isCurrentPlayer(gameId, playerAddr), "Not current player's turn or not authorized");
        _;
    }
    
    // ✅ NEW: Internal helper functions for controller address support
    function _isPlayerInGame(uint256 gameId, address caller) internal view returns (bool) {
        Game storage game = games[gameId];
        
        // Check if caller is the player directly
        if (game.players[caller].hasJoined) {
            return true;
        }
        
        // Check if caller is a controller for any player in the game
        for (uint i = 0; i < game.playerAddresses.length; i++) {
            address playerAddr = game.playerAddresses[i];
            Player storage player = game.players[playerAddr];
            if (player.controllerAddress == caller && player.hasJoined) {
                return true;
            }
        }
        
        return false;
    }
    
    function _isCurrentPlayer(uint256 gameId, address caller) internal view returns (bool) {
        Game storage game = games[gameId];
        address currentPlayerAddr = game.playerAddresses[game.currentPlayerIndex];
        Player storage currentPlayer = game.players[currentPlayerAddr];
        
        // Check if caller is the current player directly
        if (currentPlayerAddr == caller) {
            return true;
        }
        
        // Check if caller is the controller for the current player
        if (currentPlayer.controllerAddress == caller) {
            return true;
        }
        
        return false;
    }
    
    function _getPlayerAddressForCaller(uint256 gameId, address caller) internal view returns (address) {
        Game storage game = games[gameId];
        
        // Check if caller is a player directly
        if (game.players[caller].hasJoined) {
            return caller;
        }
        
        // Check if caller is a controller for any player
        for (uint i = 0; i < game.playerAddresses.length; i++) {
            address playerAddr = game.playerAddresses[i];
            Player storage player = game.players[playerAddr];
            if (player.controllerAddress == caller && player.hasJoined) {
                return playerAddr;
            }
        }
        
        return address(0); // Not found
    }
    
    /**
     * @dev Create a new game - SIMPLIFIED: Always specify player address
     * @param maxPlayers Maximum number of players (2-4)
     * @param allowIslands Whether to allow island placements
     * @param winningScore The winning score for the game
     * @param playerName Name of the creating player
     * @param playerAddress Address to use as the player (msg.sender becomes controller)
     */
    function createGame(
        uint8 maxPlayers,
        bool allowIslands,
        uint256 winningScore,
        string memory playerName,
        address playerAddress
    ) external onlyAuthorizedForPlayer(playerAddress) returns (uint256) {
        require(maxPlayers >= 1 && maxPlayers <= 4, "Invalid player count");
        require(winningScore >= 50 && winningScore <= 50000, "Invalid winning score");
        require(bytes(playerName).length > 0, "Player name required");
        require(playerAddress != address(0), "Player address required");
        
        uint256 gameId = nextGameId++;
        Game storage game = games[gameId];
        
        game.gameId = gameId;
        game.state = GameState.Setup;
        game.creator = playerAddress; // ✅ Use specified player address as creator
        game.maxPlayers = maxPlayers;
        game.currentPlayerIndex = 0;
        game.turnNumber = 1;
        game.createdAt = block.timestamp;
        game.lastMoveAt = block.timestamp;
        game.allowIslands = allowIslands;
        game.winningScore = winningScore;
        
        // Add specified address as first player, with msg.sender as controller
        _addPlayerToGameWithController(gameId, playerAddress, playerName, msg.sender);
        
        emit GameCreated(gameId, playerAddress, maxPlayers);
        emit ControllerAddressSet(gameId, playerAddress, msg.sender);
        return gameId;
    }
    

    
    /**
     * @dev Join an existing game - SIMPLIFIED: Always specify player address
     * @param gameId The game to join
     * @param playerName Name of the joining player
     * @param playerAddress Address to use as the player (msg.sender becomes controller)
     */
    function joinGame(uint256 gameId, string memory playerName, address playerAddress) 
        external 
        onlyAuthorizedForPlayer(playerAddress)
        gameExists(gameId) 
        gameInState(gameId, GameState.Setup) 
    {
        Game storage game = games[gameId];
        require(!game.players[playerAddress].hasJoined, "Player address already in this game");
        require(game.playerAddresses.length < game.maxPlayers, "Game is full");
        require(bytes(playerName).length > 0, "Player name required");
        require(playerAddress != address(0), "Player address required");
        
        _addPlayerToGameWithController(gameId, playerAddress, playerName, msg.sender);
        
        emit PlayerJoined(gameId, playerAddress, playerName);
        emit ControllerAddressSet(gameId, playerAddress, msg.sender);
        
        // Auto-start if game is full
        if (game.playerAddresses.length == game.maxPlayers) {
            _startGame(gameId);
        }
    }
    

    
    /**
     * @dev Start a game (creator or their controller can start)
     * @param gameId The game to start
     */
    function startGame(uint256 gameId) 
        external 
        gameExists(gameId) 
        gameInState(gameId, GameState.Setup) 
    {
        Game storage game = games[gameId];
        
        // Allow creator directly, their controller, or authorized paymasters to start the game
        bool canStart = (msg.sender == game.creator) || 
                       (game.players[game.creator].controllerAddress == msg.sender) ||
                       (authorizedPaymasters[msg.sender]);
        require(canStart, "Only creator, their controller, or authorized paymaster can start game");
        require(game.playerAddresses.length >= 1, "Need at least 1 player");
        
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
        
        // ✅ ENHANCED: Get the actual player address (might be different from msg.sender if using controller)
        address actualPlayerAddr = _getPlayerAddressForCaller(gameId, msg.sender);
        require(actualPlayerAddr != address(0), "Player address not found");
        Player storage player = game.players[actualPlayerAddr];

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

        emit TurnPlaced(gameId, actualPlayerAddr, placements, totalScore);

        // Draw tiles to refill hand from player's individual pool
        _drawTilesToHand(gameId, actualPlayerAddr);

        // Check win condition
        if (player.hand.length == 0 || player.score >= game.winningScore) {
            game.state = GameState.Completed;
            emit GameCompleted(gameId, actualPlayerAddr, player.score);
            return;
        }

        // Move to next turn
        _nextTurn(gameId);
    }
    
    /**
     * @dev Skip turn - BURNS current hand and draws fresh tiles
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
        
        // ✅ ENHANCED: Get the actual player address (might be different from msg.sender if using controller)
        address actualPlayerAddr = _getPlayerAddressForCaller(gameId, msg.sender);
        require(actualPlayerAddr != address(0), "Player address not found");
        Player storage player = game.players[actualPlayerAddr];
        
        player.lastMoveTime = block.timestamp;
        
        // BURN: Clear current hand (tiles are lost forever)
        uint8 tilesBurned = uint8(player.hand.length);
        delete player.hand; // Clear the hand array
        player.hand = new uint8[](0); // Reset to empty array
        
        // Draw fresh tiles to refill hand from player's individual pool
        _drawTilesToHand(gameId, actualPlayerAddr);
        
        // Emit event showing tiles were burned
        if (tilesBurned > 0) {
            emit TilesBurned(gameId, actualPlayerAddr, tilesBurned);
        }
        
        _nextTurn(gameId);
    }
    
    /**
     * @dev Cancel a game (creator, their controller, authorized paymasters, or if in setup for 24+ hours)
     * @param gameId The game ID
     */
    function cancelGame(uint256 gameId) external gameExists(gameId) {
        Game storage game = games[gameId];
        
        bool canCancel = (msg.sender == game.creator) ||
                        (game.players[game.creator].controllerAddress == msg.sender) ||
                        (authorizedPaymasters[msg.sender]) ||
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
        
        // Calculate total tiles remaining across all players
        uint256 totalTilesRemaining = 0;
        for (uint i = 0; i < game.playerAddresses.length; i++) {
            totalTilesRemaining += game.players[game.playerAddresses[i]].tilePool.length;
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
            totalTilesRemaining,
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
     * ✅ NEW: Get player information including controller address for a game
     */
    function getPlayerWithController(uint256 gameId, address playerAddr) external view gameExists(gameId) returns (
        string memory name,
        uint256 score,
        uint8[] memory hand,
        bool hasJoined,
        uint256 lastMoveTime,
        address controllerAddress
    ) {
        Player storage player = games[gameId].players[playerAddr];
        return (
            player.name,
            player.score,
            player.hand,
            player.hasJoined,
            player.lastMoveTime,
            player.controllerAddress
        );
    }
    
    /**
     * ✅ NEW: Get controller address for a player in a game
     */
    function getControllerAddress(uint256 gameId, address playerAddr) external view gameExists(gameId) returns (address) {
        return games[gameId].players[playerAddr].controllerAddress;
    }
    
    /**
     * @dev Get player's individual tile pool status
     */
    function getPlayerTilePool(uint256 gameId, address playerAddr) external view gameExists(gameId) returns (
        uint8[10] memory remainingCounts
    ) {
        Player storage player = games[gameId].players[playerAddr];
        
        // Count remaining tiles of each number in player's individual pool
        for (uint i = 0; i < player.tilePool.length; i++) {
            remainingCounts[player.tilePool[i]]++;
        }
        
        return remainingCounts;
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
     * @dev Get all placed tiles efficiently (OPTIMIZED: No more 225-call board scanning!)
     * @param gameId The game ID
     * @return xPositions Array of x coordinates for placed tiles
     * @return yPositions Array of y coordinates for placed tiles  
     * @return numbers Array of tile numbers corresponding to positions
     * @return turnNumbers Array of turn numbers when tiles were placed
     */
    function getPlacedTiles(uint256 gameId) external view gameExists(gameId) returns (
        int16[] memory xPositions,
        int16[] memory yPositions,
        uint8[] memory numbers,
        uint256[] memory turnNumbers
    ) {
        Game storage game = games[gameId];
        uint256 totalTiles = game.placedTiles.length;
        
        // Initialize return arrays
        xPositions = new int16[](totalTiles);
        yPositions = new int16[](totalTiles);
        numbers = new uint8[](totalTiles);
        turnNumbers = new uint256[](totalTiles);
        
        // Fill arrays with tile data
        for (uint256 i = 0; i < totalTiles; i++) {
            bytes32 positionHash = game.placedTiles[i];
            Tile storage tile = game.board[positionHash];
            
            xPositions[i] = tile.x;
            yPositions[i] = tile.y;
            numbers[i] = tile.number;
            turnNumbers[i] = tile.turnPlaced;
        }
        
        return (xPositions, yPositions, numbers, turnNumbers);
    }
    
    /**
     * @dev Get games for a player
     */
    function getPlayerGames(address player) external view returns (uint256[] memory) {
        return playerGames[player];
    }
    
    /**
     * @dev Legacy function for compatibility - returns current player's tile pool
     */
    function getTilePoolStatus(uint256 gameId) external view gameExists(gameId) returns (
        uint8[10] memory remainingCounts
    ) {
        // Return the current player's tile pool for backward compatibility
        Game storage game = games[gameId];
        address currentPlayerAddr = game.playerAddresses[game.currentPlayerIndex];
        Player storage player = game.players[currentPlayerAddr];
        
        // Count remaining tiles of each number in current player's pool
        for (uint i = 0; i < player.tilePool.length; i++) {
            remainingCounts[player.tilePool[i]]++;
        }
        
        return remainingCounts;
    }
    
    // Internal functions
    
    /**
     * @dev Initialize individual tile pool for a player
     */
    function _initializePlayerTilePool(address playerAddr, uint256 gameId) internal {
        Game storage game = games[gameId];
        Player storage player = game.players[playerAddr];
        
        // Create individual tile pool with 5 of each number (0-9)
        player.tilePool = new uint8[](50);
        uint8 index = 0;
        
        for (uint8 number = 0; number <= 9; number++) {
            for (uint8 count = 0; count < TILE_DISTRIBUTION[number]; count++) {
                player.tilePool[index] = number;
                index++;
            }
        }
        
        // Set individual randomization seed
        player.poolSeed = uint256(keccak256(abi.encodePacked(
            block.timestamp, 
            block.prevrandao, 
            gameId, 
            playerAddr,
            blockhash(block.number - 1)
        )));
        
        // Shuffle player's individual pool
        _shufflePlayerTilePool(playerAddr, gameId);
    }
    
    function _shufflePlayerTilePool(address playerAddr, uint256 gameId) internal {
        Game storage game = games[gameId];
        Player storage player = game.players[playerAddr];
        uint256 poolSize = player.tilePool.length;
        
        // Enhanced shuffle - Fisher-Yates algorithm with 3x swaps
        uint256 swapCount = poolSize * 3; // 150 swaps for 50 tiles
        
        for (uint256 swaps = 0; swaps < swapCount; swaps++) {
            // Update player's individual seed
            player.poolSeed = uint256(keccak256(abi.encodePacked(
                player.poolSeed, 
                block.timestamp, 
                block.difficulty, 
                block.number,
                swaps,
                playerAddr
            )));
            
            uint256 i = player.poolSeed % poolSize;
            uint256 j = (player.poolSeed >> 16) % poolSize;
            
            // Swap tiles[i] and tiles[j]
            if (i != j) {
                uint8 temp = player.tilePool[i];
                player.tilePool[i] = player.tilePool[j];
                player.tilePool[j] = temp;
            }
        }
    }
    

    
    // ✅ NEW: Add player to game with controller address
    function _addPlayerToGameWithController(uint256 gameId, address player, string memory name, address controllerAddress) internal {
        Game storage game = games[gameId];
        
        game.players[player] = Player({
            wallet: player,
            name: name,
            score: 0,
            hand: new uint8[](0),
            tilePool: new uint8[](0),
            poolSeed: 0,
            hasJoined: true,
            lastMoveTime: block.timestamp,
            controllerAddress: controllerAddress
        });
        
        game.playerAddresses.push(player);
        playerGames[player].push(gameId);
        
        // Initialize individual tile pool for this player
        _initializePlayerTilePool(player, gameId);
    }
    
    function _startGame(uint256 gameId) internal {
        Game storage game = games[gameId];
        game.state = GameState.InProgress;
        game.lastMoveAt = block.timestamp;
        
        // Deal initial hands to each player from their individual pools
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
        
        // Draw tiles from player's individual pool
        uint8 tilesDrawn = 0;
        while (tilesDrawn < tilesToDraw && player.tilePool.length > 0) {
            // Draw from the end of player's shuffled pool
            uint8 drawnTile = player.tilePool[player.tilePool.length - 1];
            player.tilePool.pop();
            
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
        uint8 positionCount = 0;
        for (uint i = 0; i < allPlacements.length; i++) {
            if (allPlacements[i].x == placement.x && allPlacements[i].y == placement.y) {
                positionCount++;
            }
        }
        
        if (positionCount > 1) {
            return false;
        }
        
        // QUINTO STYLE RULE 1: First move must be on or adjacent to center (7,7)
        if (game.placedTiles.length == 0) {
            bool hasValidFirstTile = false;
            for (uint k = 0; k < allPlacements.length; k++) {
                int16 dx = allPlacements[k].x - 7;
                int16 dy = allPlacements[k].y - 7;
                
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
            
            return _checkTurnContiguity(placement, allPlacements, game);
        }
        
        // QUINTO STYLE RULE 2: Check adjacency to existing tiles (unless islands allowed)
        if (!game.allowIslands) {
            bool hasAdjacency = _checkAdjacencyToBoard(gameId, allPlacements);
            if (!hasAdjacency) {
                return false;
            }
        }
        
        // QUINTO STYLE RULE 3: Check turn contiguity
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
            return true;
        }
        
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
            return false;
        }
        
        return true; // Simplified for now
    }
    
    function _checkAdjacencyToBoard(uint256 gameId, TilePlacement[] memory allPlacements) internal view returns (bool) {
        Game storage game = games[gameId];
        
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
        // ✅ PROPER FIVES RULE VALIDATION: All sequences must sum to multiples of 5
        
        // Check horizontal sequences that would include this placement
        if (!_validateSequenceInDirection(gameId, placement, allPlacements, 1, 0)) {
            return false;
        }
        
        // Check vertical sequences that would include this placement
        if (!_validateSequenceInDirection(gameId, placement, allPlacements, 0, 1)) {
            return false;
        }
        
        return true;
    }
    
    function _validateSequenceInDirection(
        uint256 gameId,
        TilePlacement memory placement,
        TilePlacement[] memory allPlacements,
        int16 dx,
        int16 dy
    ) internal view returns (bool) {
        Game storage game = games[gameId];
        
        // Build the complete sequence that would exist after this placement
        uint8[] memory sequence = new uint8[](15);
        uint8 sequenceLength = 0;
        
        // Find the start of the sequence
        int16 startX = placement.x;
        int16 startY = placement.y;
        
        // Go back to find the beginning of the sequence
        while (true) {
            int16 checkX = startX - dx;
            int16 checkY = startY - dy;
            
            if (checkX < 0 || checkX >= 15 || checkY < 0 || checkY >= 15) {
                break;
            }
            
            if (_getTileAtPosition(gameId, checkX, checkY, allPlacements) == 255) {
                break;
            }
            
            startX = checkX;
            startY = checkY;
        }
        
        // Build the complete sequence from start
        int16 currentX = startX;
        int16 currentY = startY;
        
        while (currentX >= 0 && currentX < 15 && currentY >= 0 && currentY < 15) {
            uint8 tileNumber = _getTileAtPosition(gameId, currentX, currentY, allPlacements);
            
            if (tileNumber == 255) {
                break;
            }
            
            sequence[sequenceLength] = tileNumber;
            sequenceLength++;
            
            currentX += dx;
            currentY += dy;
        }
        
        // If sequence is only 1 tile, it's valid (no rule to check)
        if (sequenceLength <= 1) {
            return true;
        }
        
        // Calculate sequence sum
        uint256 sequenceSum = 0;
        for (uint i = 0; i < sequenceLength; i++) {
            sequenceSum += sequence[i];
        }
        
        // ✅ CORE FIVES RULE: Sequence must sum to a multiple of 5
        if (sequenceSum % 5 != 0) {
            return false;
        }
        
        return true;
    }
    
    function _calculateSequenceScore(uint256 gameId, TilePlacement[] memory placedTiles) internal view returns (uint256) {
        uint256 totalScore = 0;
        
        // Simple fix: Score each sequence only once by checking if we're at the start of sequence
        for (uint i = 0; i < placedTiles.length; i++) {
            TilePlacement memory tile = placedTiles[i];
            
            // Only score horizontal sequence if this is the leftmost tile in the sequence
            if (_isLeftmostInSequence(gameId, tile, 1, 0, placedTiles)) {
                totalScore += _calculateSequenceScoreInDirection(gameId, tile, 1, 0, placedTiles);
            }
            
            // Only score vertical sequence if this is the topmost tile in the sequence
            if (_isTopmostInSequence(gameId, tile, 0, 1, placedTiles)) {
                totalScore += _calculateSequenceScoreInDirection(gameId, tile, 0, 1, placedTiles);
            }
        }
        
        return totalScore;
    }
    
    function _calculateSequenceScoreInDirection(
        uint256 gameId, 
        TilePlacement memory centerTile, 
        int16 dx, 
        int16 dy,
        TilePlacement[] memory thisTurnTiles
    ) internal view returns (uint256) {
        Game storage game = games[gameId];
        
        // Find the complete sequence in this direction
        uint8[] memory sequence = new uint8[](15); // Max board width/height
        uint8 sequenceLength = 0;
        int16 startX = centerTile.x;
        int16 startY = centerTile.y;
        
        // Find the start of the sequence
        while (true) {
            int16 checkX = startX - dx;
            int16 checkY = startY - dy;
            
            if (checkX < 0 || checkX >= 15 || checkY < 0 || checkY >= 15) {
                break;
            }
            
            if (_getTileAtPosition(gameId, checkX, checkY, thisTurnTiles) == 255) {
                break; // No tile at this position
            }
            
            startX = checkX;
            startY = checkY;
        }
        
        // Build the complete sequence
        int16 currentX = startX;
        int16 currentY = startY;
        
        while (currentX >= 0 && currentX < 15 && currentY >= 0 && currentY < 15) {
            uint8 tileNumber = _getTileAtPosition(gameId, currentX, currentY, thisTurnTiles);
            
            if (tileNumber == 255) {
                break; // No tile at this position
            }
            
            sequence[sequenceLength] = tileNumber;
            sequenceLength++;
            
            currentX += dx;
            currentY += dy;
        }
        
        // Score the sequence if it's 2+ tiles
        if (sequenceLength < 2) {
            return 0;
        }
        
        // Calculate sequence sum
        uint256 sequenceSum = 0;
        for (uint i = 0; i < sequenceLength; i++) {
            sequenceSum += sequence[i];
        }
        
        // Simple scoring: sum of tile numbers × 10
        uint256 score = sequenceSum * 10;
        
        return score;
    }
    
    function _getTileAtPosition(
        uint256 gameId, 
        int16 x, 
        int16 y, 
        TilePlacement[] memory thisTurnTiles
    ) internal view returns (uint8) {
        Game storage game = games[gameId];
        
        // First check if this position has a tile from this turn
        for (uint i = 0; i < thisTurnTiles.length; i++) {
            if (thisTurnTiles[i].x == x && thisTurnTiles[i].y == y) {
                return thisTurnTiles[i].number;
            }
        }
        
        // Then check if there's already a tile on the board
        bytes32 positionHash = keccak256(abi.encodePacked(x, y));
        Tile storage tile = game.board[positionHash];
        
        if (tile.isPlaced) {
            return tile.number;
        }
        
        return 255; // No tile at this position
    }
    
    function _isLeftmostInSequence(
        uint256 gameId, 
        TilePlacement memory tile, 
        int16 dx, 
        int16 dy,
        TilePlacement[] memory thisTurnTiles
    ) internal view returns (bool) {
        Game storage game = games[gameId];
        
        // Check if there's a tile to the left of this tile in the sequence
        int16 leftX = tile.x - dx;
        int16 leftY = tile.y - dy;
        
        if (leftX < 0 || leftX >= 15 || leftY < 0 || leftY >= 15) {
            return true; // No tile to the left, so this is the leftmost tile
        }
        
        // Check if there's a tile from this turn at the left position
        for (uint i = 0; i < thisTurnTiles.length; i++) {
            if (thisTurnTiles[i].x == leftX && thisTurnTiles[i].y == leftY) {
                return false; // There's a tile from this turn to the left
            }
        }
        
        // Check if there's a tile already on the board at the left position
        bytes32 leftPositionHash = keccak256(abi.encodePacked(leftX, leftY));
        Tile storage leftTile = game.board[leftPositionHash];
        
        if (leftTile.isPlaced) {
            return false; // There's a tile to the left, so this is not the leftmost tile
        }
        
        return true; // No tile to the left, so this is the leftmost tile
    }
    
    function _isTopmostInSequence(
        uint256 gameId, 
        TilePlacement memory tile, 
        int16 dx, 
        int16 dy,
        TilePlacement[] memory thisTurnTiles
    ) internal view returns (bool) {
        Game storage game = games[gameId];
        
        // Check if there's a tile above this tile in the sequence
        int16 topX = tile.x - dx;
        int16 topY = tile.y - dy;
        
        if (topX < 0 || topX >= 15 || topY < 0 || topY >= 15) {
            return true; // No tile above, so this is the topmost tile
        }
        
        // Check if there's a tile from this turn at the top position
        for (uint i = 0; i < thisTurnTiles.length; i++) {
            if (thisTurnTiles[i].x == topX && thisTurnTiles[i].y == topY) {
                return false; // There's a tile from this turn above
            }
        }
        
        // Check if there's a tile already on the board at the top position
        bytes32 topPositionHash = keccak256(abi.encodePacked(topX, topY));
        Tile storage topTile = game.board[topPositionHash];
        
        if (topTile.isPlaced) {
            return false; // There's a tile above, so this is not the topmost tile
        }
        
        return true; // No tile above, so this is the topmost tile
    }
} 