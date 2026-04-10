// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;
pragma abicoder v2;

import "../../src/interfaces/v3-periphery/INonfungiblePositionManager.sol";

contract MockPositionManager is INonfungiblePositionManager {
    INonfungiblePositionManager.MintParams public lastMintParams;
    uint256 public mintCallCount;

    function mint(INonfungiblePositionManager.MintParams calldata params)
        external
        payable
        returns (
            uint256 tokenId,
            uint128 liquidity,
            uint256 amount0,
            uint256 amount1
        )
    {
        lastMintParams = params;
        mintCallCount++;
        return (1, 0, params.amount0Desired, params.amount1Desired);
    }

    // INonfungiblePositionManager
    function positions(uint256)
        external
        pure
        returns (
            uint96 nonce,
            address operator,
            address token0,
            address token1,
            uint24 fee,
            int24 tickLower,
            int24 tickUpper,
            uint128 liquidity,
            uint256 feeGrowthInside0LastX128,
            uint256 feeGrowthInside1LastX128,
            uint128 tokensOwed0,
            uint128 tokensOwed1
        )
    {
        return (0, address(0), address(0), address(0), 0, 0, 0, 0, 0, 0, 0, 0);
    }

    function increaseLiquidity(IncreaseLiquidityParams calldata)
        external
        payable
        returns (
            uint128 liquidity,
            uint256 amount0,
            uint256 amount1
        )
    {
        return (0, 0, 0);
    }

    function decreaseLiquidity(DecreaseLiquidityParams calldata)
        external
        payable
        returns (uint256 amount0, uint256 amount1)
    {
        return (0, 0);
    }

    function collect(CollectParams calldata)
        external
        payable
        returns (uint256 amount0, uint256 amount1)
    {
        return (0, 0);
    }

    function burn(uint256) external payable {}

    // IPoolInitializer
    function createAndInitializePoolIfNecessary(
        address,
        address,
        uint24,
        uint160
    ) external payable returns (address) {
        return address(0);
    }

    // IPeripheryPayments
    function unwrapWETH9(uint256, address) external payable {}

    function refundETH() external payable {}

    function sweepToken(address, uint256, address) external payable {}

    // IPeripheryImmutableState
    function factory() external pure returns (address) {
        return address(0);
    }

    function WETH9() external pure returns (address) {
        return address(0);
    }

    // IERC721Metadata
    function name() external pure returns (string memory) {
        return "";
    }

    function symbol() external pure returns (string memory) {
        return "";
    }

    function tokenURI(uint256) external pure returns (string memory) {
        return "";
    }

    // IERC721Enumerable
    function totalSupply() external pure returns (uint256) {
        return 0;
    }

    function tokenOfOwnerByIndex(address, uint256) external pure returns (uint256) {
        return 0;
    }

    function tokenByIndex(uint256) external pure returns (uint256) {
        return 0;
    }

    // IERC721
    function balanceOf(address) external pure returns (uint256) {
        return 0;
    }

    function ownerOf(uint256) external pure returns (address) {
        return address(0);
    }

    function safeTransferFrom(address, address, uint256) external pure {}

    function transferFrom(address, address, uint256) external pure {}

    function approve(address, uint256) external pure {}

    function getApproved(uint256) external pure returns (address) {
        return address(0);
    }

    function setApprovalForAll(address, bool) external pure {}

    function isApprovedForAll(address, address) external pure returns (bool) {
        return false;
    }

    function safeTransferFrom(address, address, uint256, bytes calldata) external pure {}

    // IERC165
    function supportsInterface(bytes4) external pure returns (bool) {
        return false;
    }
}
