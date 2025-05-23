"use client"

import { useEffect, useRef, useState } from "react"

type CodeBlock = {
  id: string;
  x: number;
  y: number;
  scale: number;
  opacity: number;
  text: string;
  visible: boolean;
  currentText: string;
  isTyping: boolean;
  typingIndex: number;
  typingSpeed: number;
  fontSize: number;
}

export default function MatrixBackground() {
  const containerRef = useRef<HTMLDivElement>(null)
  const [codeBlocks, setCodeBlocks] = useState<CodeBlock[]>([])
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })

  // Code snippets to display
  const codeSnippets = [
    `import { createPublicClient, http } from 'viem'
import { mainnet } from 'viem/chains'

const client = createPublicClient({
  chain: mainnet,
  transport: http()
})`,
    `import { JsonRpcProvider } from '@mysten/sui.js';

const provider = new JsonRpcProvider();
const { objects } = await provider.getOwnedObjects({
  owner: '0x123...',
});`,
    `import { connect, keyStores } from 'near-api-js';

const keyStore = new keyStores.BrowserLocalStorageKeyStore();
const near = await connect({
  networkId: 'testnet',
  keyStore,
  nodeUrl: 'https://rpc.testnet.near.org',
});`,
    `import {
  Connection,
  PublicKey,
} from '@solana/web3.js';

const connection = new Connection(
  'https://api.mainnet-beta.solana.com'
);

const balance = await connection.getBalance(
  new PublicKey('GgPpTKg78vmzgDtP1DNn8m')
);`,
    `import { getContract } from 'viem'

const contract = getContract({
  address: '0xFBA3912Ca04dd458c843e2EE08967fC04f3579c2',
  abi: wagmiAbi,
  client,
})`,
    `function transferToken(address to, uint256 amount) public {
  require(balanceOf[msg.sender] >= amount);
  balanceOf[msg.sender] -= amount;
  balanceOf[to] += amount;
  emit Transfer(msg.sender, to, amount);
}`,
    `contract NFTMinter {
  mapping(uint256 => address) public tokenOwner;

  function mint(address to) public returns (uint256) {
    uint256 tokenId = _getNextTokenId();
    tokenOwner[tokenId] = to;
    return tokenId;
  }
}`,
    `async function connectWallet() {
  if (window.ethereum) {
    try {
      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts"
      });
      return accounts[0];
    } catch (error) {
      console.log("User denied access");
    }
  }
}`,
    `import { ethers } from 'ethers';

const provider = new ethers.providers.Web3Provider(window.ethereum);
const signer = provider.getSigner();
const tx = await signer.sendTransaction({
  to: "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
  value: ethers.utils.parseEther("0.1")
});`,
    `import { Token, CurrencyAmount, Percent } from '@uniswap/sdk-core';
import { Pool, Position, nearestUsableTick } from '@uniswap/v3-sdk';

const position = new Position({
  pool: pool,
  liquidity: 1000000,
  tickLower: nearestUsableTick(pool.tickCurrent - 60, pool.tickSpacing),
  tickUpper: nearestUsableTick(pool.tickCurrent + 60, pool.tickSpacing)
});`,
    `import { Contract } from 'ethers';

const erc20Abi = [
  "function balanceOf(address owner) view returns (uint256)",
  "function transfer(address to, uint amount) returns (bool)",
  "event Transfer(address indexed from, address indexed to, uint amount)"
];

const tokenContract = new Contract(tokenAddress, erc20Abi, signer);`,
    `import { ChainId, Fetcher, WETH, Route, Trade, TokenAmount, TradeType } from '@uniswap/sdk';

const DAI = await Fetcher.fetchTokenData(ChainId.MAINNET, '0x6B175474E89094C44Da98b954EedeAC495271d0F');
const pair = await Fetcher.fetchPairData(DAI, WETH[DAI.chainId]);
const route = new Route([pair], WETH[DAI.chainId]);
const trade = new Trade(route, new TokenAmount(WETH[DAI.chainId], '100000000000000000'), TradeType.EXACT_INPUT);`,
    `import { Framework } from '@superfluid-finance/sdk-core';

const sf = await Framework.create({
  networkName: "matic",
  provider
});

const createFlowOperation = sf.cfaV1.createFlow({
  flowRate: "1000000000",
  receiver: "0x8c36C43F0d59401527D30025989Fb937458F8cD0",
  superToken: "0x3AD736904E9e65189c3000c7DD2c8AC8bB7cD4e3"
});`,
    `interface LendingPool {
  function deposit(
    address asset,
    uint256 amount,
    address onBehalfOf,
    uint16 referralCode
  ) external;

  function withdraw(
    address asset,
    uint256 amount,
    address to
  ) external returns (uint256);
}`,
    `import { Wallet, JsonRpcProvider } from 'ethers';

const provider = new JsonRpcProvider('https://eth-mainnet.g.alchemy.com/v2/YOUR_API_KEY');
const wallet = new Wallet('YOUR_PRIVATE_KEY', provider);

const factoryAbi = [ "function getPair(address tokenA, address tokenB) external view returns (address pair)" ];
const factory = new Contract('0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f', factoryAbi, wallet);`
  ];

  // Generate code blocks
  useEffect(() => {
    const generateBlocks = () => {
      const windowWidth = window.innerWidth;
      const windowHeight = window.innerHeight;
      const newCodeBlocks = [];

      const numBlocks = windowWidth < 768 ? 4 : 8;

      // Create a grid system to better distribute blocks
      const gridCols = windowWidth < 768 ? 2 : 4;
      const gridRows = 2;
      const cellWidth = 100 / gridCols;
      const cellHeight = 100 / gridRows;

      // Keep track of used cells to avoid overlap
      const usedCells = new Set();

      for (let i = 0; i < numBlocks; i++) {
        const text = codeSnippets[Math.floor(Math.random() * codeSnippets.length)];

        // Try to find an unused cell
        let cellX: number;
        let cellY: number;
        let cellKey: string;
        let attempts = 0;

        do {
          cellX = Math.floor(Math.random() * gridCols);
          cellY = Math.floor(Math.random() * gridRows);
          cellKey = `${cellX}-${cellY}`;
          attempts++;

          // If we've tried too many times, just use any cell
          if (attempts > 20) break;
        } while (usedCells.has(cellKey) && usedCells.size < (gridCols * gridRows));

        usedCells.add(cellKey);

        // Calculate position within the cell (with some padding)
        const padding = 10;
        const xPos = (cellX * cellWidth) + padding + (Math.random() * (cellWidth - (padding * 2)));
        const yPos = (cellY * cellHeight) + padding + (Math.random() * (cellHeight - (padding * 2)));

        newCodeBlocks.push({
          id: `code-${i}-${Date.now()}`,
          x: xPos,
          y: yPos,
          scale: 0.6 + Math.random() * 0.5,
          opacity: 0.2 + Math.random() * 0.4, // Higher opacity between 40-80%
          text: text,
          visible: Math.random() > 0.3, // Some blocks start visible
          currentText: "",
          isTyping: true,
          typingIndex: 0,
          typingSpeed: 40 + Math.random() * 60,
          fontSize: 10 + Math.floor(Math.random() * 4) // Random font size between 10px and 13px
        });
      }

      setCodeBlocks(newCodeBlocks);
    };

    generateBlocks();

    // Handle window resize
    window.addEventListener('resize', generateBlocks);
    return () => window.removeEventListener('resize', generateBlocks);
  }, []);

  // Track mouse position
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({
        x: e.clientX,
        y: e.clientY
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Animation for typing effect
  useEffect(() => {
    const animateTyping = () => {
      setCodeBlocks(prev =>
        prev.map(block => {
          if (!block.visible) {
            // Create a new block to replace invisible ones
            if (Math.random() > 0.92) {
              // Use a different code snippet than the previous one
              const availableSnippets = codeSnippets.filter(snippet => snippet !== block.text);
              const text = availableSnippets[Math.floor(Math.random() * availableSnippets.length)];

              // Find an unused position
              const gridCols = window.innerWidth < 768 ? 2 : 4;
              const gridRows = 2;
              const cellWidth = 100 / gridCols;
              const cellHeight = 100 / gridRows;

              // Generate a random cell position
              const cellX = Math.floor(Math.random() * gridCols);
              const cellY = Math.floor(Math.random() * gridRows);
              const padding = 10;
              const xPos = (cellX * cellWidth) + padding + (Math.random() * (cellWidth - (padding * 2)));
              const yPos = (cellY * cellHeight) + padding + (Math.random() * (cellHeight - (padding * 2)));

              return {
                ...block,
                visible: true,
                text: text,
                currentText: "",
                typingIndex: 0,
                isTyping: true,
                x: xPos,
                y: yPos,
                typingSpeed: 40 + Math.random() * 60,
                fontSize: 20 + Math.floor(Math.random() * 4) // Random font size when creating new block
              };
            }
            return block;
          }

          if (block.isTyping) {
            // Continue typing
            if (block.typingIndex < block.text.length) {
              return {
                ...block,
                currentText: block.text.substring(0, block.typingIndex + 1),
                typingIndex: block.typingIndex + 1
              };
            }

            // Finished typing, pause before deleting
            return {
              ...block,
              isTyping: false,
              // Wait longer at the end of typing
              typingSpeed: 1500 + Math.random() * 2000
            };
          }

          // Deleting
          if (block.typingIndex > 0) {
            return {
              ...block,
              currentText: block.text.substring(0, block.typingIndex - 1),
              typingIndex: block.typingIndex - 1,
              typingSpeed: 20 + Math.random() * 30
            };
          }

          // Finished deleting, make invisible and allow for new block
          return {
            ...block,
            visible: false
          };
        })
      );
    };

    // Set up a more frequent animation frame for smoother typing
    const interval = setInterval(animateTyping, 50);
    return () => clearInterval(interval);
  }, []);

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 w-full h-full overflow-hidden z-0 bg-black"
      style={{ pointerEvents: "none", opacity: 0.8 }}
    >
      {codeBlocks.map(block => {
        // Calculate 3D parallax effect based on mouse position
        const windowWidth = typeof window !== 'undefined' ? window.innerWidth : 1000;
        const windowHeight = typeof window !== 'undefined' ? window.innerHeight : 800;

        // Calculate the center of the screen
        const centerX = windowWidth / 2;
        const centerY = windowHeight / 2;

        // Calculate the relative mouse position from center (-1 to 1)
        const relativeX = (mousePosition.x - centerX) / centerX;
        const relativeY = (mousePosition.y - centerY) / centerY;

        // Apply parallax based on depth (scale)
        const parallaxFactor = block.scale * 20;
        const moveX = relativeX * parallaxFactor;
        const moveY = relativeY * parallaxFactor;

        return (
          <div
            key={block.id}
            className={`absolute font-mono text-xs leading-relaxed whitespace-pre overflow-hidden transition-all duration-700 ${block.visible ? '' : 'opacity-0'}`}
            style={{
              left: `${block.x}%`,
              top: `${block.y}%`,
              transform: `translate(${moveX}px, ${moveY}px) scale(${block.scale})`,
              opacity: block.visible ? block.opacity : 0,
              maxWidth: '1290px',
              maxHeight: '540px',
              color: 'rgba(74, 222, 128, 0.9)',
              backgroundColor: 'rgba(0, 0, 0, 0.75)',
              padding: '10px',
              borderRadius: '3px',
              border: 'none',
              boxShadow: 'none',
              fontSize: `${block.fontSize}px`,
              pointerEvents: 'none',
              zIndex: Math.round(block.scale * 10),
              filter: 'brightness(0.9)',
              transition: 'transform 0.3s ease-out, opacity 0.5s ease'
            }}
          >
            {block.currentText}
            {block.visible && block.isTyping && (
              <span className="inline-block w-1.5 h-3.5 bg-green-400 ml-0.5 animate-pulse" style={{ verticalAlign: 'middle' }} />
            )}
          </div>
        );
      })}
    </div>
  );
}
