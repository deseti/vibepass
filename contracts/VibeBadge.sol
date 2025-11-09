// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title VibeBadge
 * @dev ERC-721 NFT contract for minting badges with custom token URIs
 * 
 * ═══════════════════════════════════════════════════════════════════════════
 * UPGRADEABILITY CONSIDERATIONS
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * CURRENT: This contract uses a non-upgradeable pattern (direct deployment).
 * 
 * TRADEOFFS OF MAKING THIS CONTRACT UPGRADEABLE:
 * 
 * PROS (Upgradeable Proxy Pattern):
 *    - Can fix bugs or add features post-deployment
 *    - Can adapt to new requirements without losing existing data
 *    - Maintains same contract address across upgrades
 *    - Preserves existing token ownership and state
 * 
 * CONS (Upgradeable Proxy Pattern):
 *    - Increased complexity and attack surface
 *    - Higher deployment gas costs (~2x)
 *    - Storage layout constraints (must append, never reorder)
 *    - Requires careful constructor -> initializer migration
 *    - Centralization risk (owner can change contract logic)
 *    - More difficult to audit and reason about
 * 
 * TODO: To make this upgradeable using OpenZeppelin Upgrades:
 * 
 * 1. Install dependencies:
 *    npm install --save-dev openzeppelin/hardhat-upgrades
 * 
 * 2. Replace imports with upgradeable versions
 * 
 * 3. Change contract declaration:
 *    contract VibeBadge is Initializable, ERC721Upgradeable, OwnableUpgradeable
 * 
 * 4. Replace constructor with initializer:
 *    function initialize() public initializer
 * 
 * 5. Storage layout (CRITICAL - must maintain order in upgrades):
 *    struct VibeBadgeStorage with nextId and _tokenURIs mapping
 *    Future variables MUST be appended below, never inserted above
 * 
 * 6. Deploy with proxy using upgrades.deployProxy
 * 
 * RECOMMENDATION: Start with non-upgradeable for simplicity and security.
 * Only add upgradeability if business requirements justify the tradeoffs.
 * ═══════════════════════════════════════════════════════════════════════════
 */
contract VibeBadge is ERC721, Ownable {
    // Incremental token ID counter
    uint256 private nextId;

    // Mapping from token ID to token URI
    mapping(uint256 => string) private _tokenURIs;

    // Developer address for receiving fees
    address payable public immutable devAddress;

    // Fee percentage (3% = 300 basis points)
    uint256 public constant FEE_PERCENTAGE = 3;
    uint256 public constant FEE_DENOMINATOR = 100;

    // Mint price in wei (0.001 ETH = 1000000000000000 wei)
    uint256 public mintPrice;

    // Events
    event BadgeMinted(address indexed to, uint256 indexed tokenId, string tokenURI);
    event DevFeeCollected(address indexed from, address indexed devAddress, uint256 amount);
    event MintPriceUpdated(uint256 oldPrice, uint256 newPrice);

    /**
     * @dev Constructor initializes the ERC721 token with name and symbol
     * @param _devAddress Address that will receive 3% fee from mints
     * @param _mintPrice Initial mint price in wei
     */
    constructor(address payable _devAddress, uint256 _mintPrice) ERC721("VibeBadge", "VBADGE") Ownable(msg.sender) {
        require(_devAddress != address(0), "VibeBadge: dev address cannot be zero");
        devAddress = _devAddress;
        mintPrice = _mintPrice;
        nextId = 1; // Start token IDs from 1
    }

    /**
     * @dev Mints a single badge - User pays mintPrice + 3% fee, all goes to dev
     * @param to Address to receive the badge
     * @param uri Token URI for the badge metadata
     * @return tokenId The ID of the newly minted token
     * 
     * Payment structure:
     * - mintPrice = $1 in ETH (base price for badge)
     * - 3% fee = $0.03 in ETH (additional fee)
     * - Total required = mintPrice + (mintPrice * 3 / 100)
     * - All payment goes to dev address
     */
    function mintBadge(address to, string memory uri) public payable returns (uint256) {
        require(to != address(0), "VibeBadge: mint to zero address");
        require(bytes(uri).length > 0, "VibeBadge: empty token URI");
        
        // Calculate total required: mintPrice + 3% fee
        uint256 feeAmount = (mintPrice * FEE_PERCENTAGE) / FEE_DENOMINATOR;
        uint256 totalRequired = mintPrice + feeAmount;
        
        require(msg.value >= totalRequired, "VibeBadge: insufficient payment");

        // Transfer ALL payment to dev address (mintPrice + fee)
        (bool success, ) = devAddress.call{value: totalRequired}("");
        require(success, "VibeBadge: payment transfer failed");
        
        emit DevFeeCollected(msg.sender, devAddress, totalRequired);

        // Refund any excess payment
        uint256 refund = msg.value - totalRequired;
        if (refund > 0) {
            (bool refundSuccess, ) = payable(msg.sender).call{value: refund}("");
            require(refundSuccess, "VibeBadge: refund failed");
        }

        uint256 tokenId = nextId;
        nextId++;

        _safeMint(to, tokenId);
        _tokenURIs[tokenId] = uri;

        emit BadgeMinted(to, tokenId, uri);

        return tokenId;
    }

    /**
     * @dev Batch mints badges to multiple addresses - All payment goes to dev
     * @param recipients Array of addresses to receive badges
     * @param uris Array of token URIs corresponding to each badge
     */
    function batchMint(address[] memory recipients, string[] memory uris) public payable {
        require(recipients.length == uris.length, "VibeBadge: arrays length mismatch");
        require(recipients.length > 0, "VibeBadge: empty arrays");
        
        // Calculate total: (mintPrice + 3% fee) * number of badges
        uint256 feePerBadge = (mintPrice * FEE_PERCENTAGE) / FEE_DENOMINATOR;
        uint256 totalPerBadge = mintPrice + feePerBadge;
        uint256 totalRequired = totalPerBadge * recipients.length;
        
        require(msg.value >= totalRequired, "VibeBadge: insufficient payment for batch");

        // Transfer ALL payment to dev address
        (bool success, ) = devAddress.call{value: totalRequired}("");
        require(success, "VibeBadge: payment transfer failed");
        emit DevFeeCollected(msg.sender, devAddress, totalRequired);

        // Refund excess payment
        uint256 refund = msg.value - totalRequired;
        if (refund > 0) {
            (bool refundSuccess, ) = payable(msg.sender).call{value: refund}("");
            require(refundSuccess, "VibeBadge: refund failed");
        }

        for (uint256 i = 0; i < recipients.length; i++) {
            require(recipients[i] != address(0), "VibeBadge: mint to zero address");
            require(bytes(uris[i]).length > 0, "VibeBadge: empty token URI");
            
            uint256 tokenId = nextId;
            nextId++;

            _safeMint(recipients[i], tokenId);
            _tokenURIs[tokenId] = uris[i];

            emit BadgeMinted(recipients[i], tokenId, uris[i]);
        }
    }

    /**
     * @dev Owner can update mint price (base price, fee 3% will be calculated on top)
     * @param _newPrice New mint price in wei (equivalent to $1 in ETH)
     */
    function setMintPrice(uint256 _newPrice) public onlyOwner {
        uint256 oldPrice = mintPrice;
        mintPrice = _newPrice;
        emit MintPriceUpdated(oldPrice, _newPrice);
    }

    /**
     * @dev Returns the total amount user needs to pay (mintPrice + 3% fee)
     * @return Total amount in wei
     */
    function getTotalMintCost() public view returns (uint256) {
        uint256 fee = (mintPrice * FEE_PERCENTAGE) / FEE_DENOMINATOR;
        return mintPrice + fee;
    }

    /**
     * @dev Returns the token URI for a given token ID
     * @param tokenId The ID of the token
     * @return The token URI string
     */
    function tokenURI(uint256 tokenId) public view virtual override returns (string memory) {
        require(_exists(tokenId), "VibeBadge: URI query for nonexistent token");
        return _tokenURIs[tokenId];
    }

    /**
     * @dev Returns the next token ID to be minted
     * @return The next token ID
     */
    function getNextTokenId() public view returns (uint256) {
        return nextId;
    }

    /**
     * @dev Helper function to check if a token exists
     * @param tokenId The ID of the token to check
     * @return bool indicating if the token exists
     */
    function _exists(uint256 tokenId) internal view returns (bool) {
        return _ownerOf(tokenId) != address(0);
    }

    /**
     * @dev Fallback function to receive ETH
     */
    receive() external payable {}
}
