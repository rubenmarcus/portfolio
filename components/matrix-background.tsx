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
    `module sui_coin::managed_coin {
    use sui::coin::{Self, Coin, TreasuryCap};
    use sui::transfer;
    use sui::tx_context::{Self, TxContext};

    public entry fun mint<T>(
        cap: &mut TreasuryCap<T>,
        amount: u64,
        recipient: address,
        ctx: &mut TxContext
    ) {
        let coin = coin::mint<T>(cap, amount, ctx);
        transfer::public_transfer(coin, recipient);
    }

    public entry fun burn<T>(
        cap: &mut TreasuryCap<T>,
        coin: Coin<T>
    ) {
        coin::burn(cap, coin);
    }
}`,
    `import { Wallet, JsonRpcProvider } from 'ethers';

const provider = new JsonRpcProvider('https://eth-mainnet.g.alchemy.com/v2/YOUR_API_KEY');
const wallet = new Wallet('YOUR_PRIVATE_KEY', provider);

const factoryAbi = [ "function getPair(address tokenA, address tokenB) external view returns (address pair)" ];
const factory = new Contract('0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f', factoryAbi, wallet);`,
    `import { useAccount, useConnect, useDisconnect } from 'wagmi'
import { InjectedConnector } from 'wagmi/connectors/injected'

function Profile() {
  const { address, isConnected } = useAccount()
  const { connect } = useConnect({
    connector: new InjectedConnector(),
  })
  const { disconnect } = useDisconnect()

  if (isConnected)
    return (
      <div>
        Connected to {address}
        <button onClick={() => disconnect()}>Disconnect</button>
      </div>
    )
  return <button onClick={() => connect()}>Connect Wallet</button>
}`,

    `import {
  SuiClient,
  getFullnodeUrl
} from '@mysten/sui.js/client';

const client = new SuiClient({
  url: getFullnodeUrl('mainnet')
});

const txb = new TransactionBlock();
const [coin] = txb.splitCoins(txb.gas, [txb.pure(1000000)]);
txb.transferObjects([coin], txb.pure(receiver));

const { bytes } = await client.signAndExecuteTransactionBlock({
  transactionBlock: txb,
  options: { showBalanceChanges: true }
});`,
    `import {
  Transaction,
  SystemProgram,
  Keypair,
  sendAndConfirmTransaction
} from '@solana/web3.js';

// Creating a new transaction to transfer SOL
const newTransaction = new Transaction().add(
  SystemProgram.transfer({
    fromPubkey: sender,
    toPubkey: recipient,
    lamports: LAMPORTS_PER_SOL / 100,
  })
);

// Signing and sending the transaction
const signature = await sendAndConfirmTransaction(
  connection,
  newTransaction,
  [senderKeypair]
);`,
    `import { transactions, providers, utils } from 'near-api-js';

// Setup NEAR connection
const provider = new providers.JsonRpcProvider({ url: nearConfig.nodeUrl });

// Create transaction for calling a contract
const actions = [
  transactions.functionCall(
    'nft_mint',
    { token_id: 'unique-token', metadata: { title: 'My NFT' } },
    300000000000000, // 300 TGas
    utils.format.parseNearAmount('0.01') // deposit 0.01 NEAR
  )
];

// Create and sign transaction
const tx = await providers.getTransactionLastResult(
  await nearAccount.signAndSendTransaction({
    receiverId: 'nft.example.near',
    actions
  })
);`,
    `module nft::create_nft {
    use sui::url::{Self, Url};
    use sui::object::{Self, UID};
    use sui::package;
    use sui::transfer;
    use sui::tx_context::{Self, TxContext};

    /// An example NFT that can be minted by anybody
    struct NFT has key, store {
        id: UID,
        /// Name for the token
        name: String,
        /// Description of the token
        description: String,
        /// URL for the token
        url: Url,
    }

    /// Create a new NFT
    public entry fun mint(
        name: vector<u8>,
        description: vector<u8>,
        url: vector<u8>,
        ctx: &mut TxContext
    ) {
        let nft = NFT {
            id: object::new(ctx),
            name: std::string::utf8(name),
            description: std::string::utf8(description),
            url: url::new_unsafe_from_bytes(url)
        };

        transfer::public_transfer(nft, tx_context::sender(ctx))
    }
}`,
    `import {
    Metaplex,
    keypairIdentity,
    bundlrStorage,
    toMetaplexFile,
} from "@metaplex-foundation/js";
import { Connection, clusterApiUrl, Keypair } from "@solana/web3.js";

// Connection to Solana
const connection = new Connection(clusterApiUrl("devnet"));
const wallet = Keypair.generate();

// Create Metaplex instance
const metaplex = Metaplex.make(connection)
    .use(keypairIdentity(wallet))
    .use(bundlrStorage());

// Upload metadata and mint NFT
const { uri } = await metaplex.nfts().uploadMetadata({
    name: "My NFT",
    description: "My NFT description",
    image: "https://example.com/image.png",
});

const { nft } = await metaplex.nfts().create({
    uri: uri,
    name: "My NFT",
    sellerFeeBasisPoints: 500, // 5%
});`,
    `import { Contract, Account, utils } from 'near-api-js';

// Initialize contract
const contract = new Contract(
  account,
  "nft.nearexample.testnet",
  {
    viewMethods: ["nft_tokens_for_owner", "nft_metadata"],
    changeMethods: ["nft_mint", "nft_transfer"],
  }
);

// Get NFTs owned by an account
const nfts = await contract.nft_tokens_for_owner({
  account_id: account.accountId,
  from_index: "0",
  limit: 50
});

// Transfer an NFT
await contract.nft_transfer(
  {
    receiver_id: "friend.testnet",
    token_id: "token-1",
    memo: "Enjoy your NFT!"
  },
  300000000000000, // 300 TGas
  1 // attached deposit in yoctoNEAR (1 = 10^-24 NEAR)
);`,
    `import {
  account,
  writeContract,
  readContract,
  createEventFilter,
  getContractEvents
} from 'viem'

// Read from contract
const balance = await readContract({
  address: '0xFBA3912Ca04dd458c843e2EE08967fC04f3579c2',
  abi: erc20ABI,
  functionName: 'balanceOf',
  args: ['0xA0Cf798816D4b9b9866b5330EEa46a18382f251e']
})

// Write to contract
const hash = await writeContract({
  address: '0xFBA3912Ca04dd458c843e2EE08967fC04f3579c2',
  abi: erc20ABI,
  functionName: 'transfer',
  args: ['0xA0Cf798816D4b9b9866b5330EEa46a18382f251e', 1000n]
})

// Query events
const filter = await createEventFilter({
  address: '0xFBA3912Ca04dd458c843e2EE08967fC04f3579c2',
  abi: erc20ABI,
  eventName: 'Transfer'
})

const events = await getContractEvents({
  filter
})`,
    `module sui_coin::managed_coin {
// ... existing code ...
}`,
    `import { Wallet, JsonRpcProvider } from 'ethers';

const provider = new JsonRpcProvider('https://eth-mainnet.g.alchemy.com/v2/YOUR_API_KEY');
const wallet = new Wallet('YOUR_PRIVATE_KEY', provider);

const factoryAbi = [ "function getPair(address tokenA, address tokenB) external view returns (address pair)" ];
const factory = new Contract('0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f', factoryAbi, wallet);`,
    `import { useAccount, useConnect, useDisconnect } from 'wagmi'
import { InjectedConnector } from 'wagmi/connectors/injected'

function Profile() {
  const { address, isConnected } = useAccount()
  const { connect } = useConnect({
    connector: new InjectedConnector(),
  })
  const { disconnect } = useDisconnect()

  if (isConnected)
    return (
      <div>
        Connected to {address}
        <button onClick={() => disconnect()}>Disconnect</button>
      </div>
    )
  return <button onClick={() => connect()}>Connect Wallet</button>
}`,
    `import {
  ReownAppKit,
  useReownStore,
  useReownCheckout
} from '@reown-app-kit/react'

function App() {
  return (
    <ReownAppKit apiKey="YOUR_API_KEY">
      <YourApp />
    </ReownAppKit>
  )
}

function BuyButton() {
  const { startCheckout } = useReownCheckout()
  const { connected } = useReownStore()

  return (
    <button
      onClick={() => startCheckout({
        productId: 'product_123',
        quantity: 1
      })}
      disabled={!connected}
    >
      Buy NFT
    </button>
  )
}`,
    `import { ThirdwebSDK } from "@thirdweb-dev/sdk";

const sdk = new ThirdwebSDK("ethereum");
const contract = await sdk.getContract("0x...");

// Mint an NFT
const tx = await contract.erc721.mint({
  name: "Cool NFT",
  description: "This is a cool NFT",
  image: "ipfs://...",
  to: "0x..." // recipient address
});`,
    `import {
  SuiClient,
  getFullnodeUrl
} from '@mysten/sui.js/client';

const client = new SuiClient({
  url: getFullnodeUrl('mainnet')
});

const txb = new TransactionBlock();
const [coin] = txb.splitCoins(txb.gas, [txb.pure(1000000)]);
txb.transferObjects([coin], txb.pure(receiver));

const { bytes } = await client.signAndExecuteTransactionBlock({
  transactionBlock: txb,
  options: { showBalanceChanges: true }
});`,
    `import {
  Transaction,
  SystemProgram,
  Keypair,
  sendAndConfirmTransaction
} from '@solana/web3.js';

// Creating a new transaction to transfer SOL
const newTransaction = new Transaction().add(
  SystemProgram.transfer({
    fromPubkey: sender,
    toPubkey: recipient,
    lamports: LAMPORTS_PER_SOL / 100,
  })
);

// Signing and sending the transaction
const signature = await sendAndConfirmTransaction(
  connection,
  newTransaction,
  [senderKeypair]
);`,
    `import { transactions, providers, utils } from 'near-api-js';

// Setup NEAR connection
const provider = new providers.JsonRpcProvider({ url: nearConfig.nodeUrl });

// Create transaction for calling a contract
const actions = [
  transactions.functionCall(
    'nft_mint',
    { token_id: 'unique-token', metadata: { title: 'My NFT' } },
    300000000000000, // 300 TGas
    utils.format.parseNearAmount('0.01') // deposit 0.01 NEAR
  )
];

// Create and sign transaction
const tx = await providers.getTransactionLastResult(
  await nearAccount.signAndSendTransaction({
    receiverId: 'nft.example.near',
    actions
  })
);`,
    `module nft::create_nft {
    use sui::url::{Self, Url};
    use sui::object::{Self, UID};
    use sui::package;
    use sui::transfer;
    use sui::tx_context::{Self, TxContext};

    /// An example NFT that can be minted by anybody
    struct NFT has key, store {
        id: UID,
        /// Name for the token
        name: String,
        /// Description of the token
        description: String,
        /// URL for the token
        url: Url,
    }

    /// Create a new NFT
    public entry fun mint(
        name: vector<u8>,
        description: vector<u8>,
        url: vector<u8>,
        ctx: &mut TxContext
    ) {
        let nft = NFT {
            id: object::new(ctx),
            name: std::string::utf8(name),
            description: std::string::utf8(description),
            url: url::new_unsafe_from_bytes(url)
        };

        transfer::public_transfer(nft, tx_context::sender(ctx))
    }
}`,
    `import {
    Metaplex,
    keypairIdentity,
    bundlrStorage,
    toMetaplexFile,
} from "@metaplex-foundation/js";
import { Connection, clusterApiUrl, Keypair } from "@solana/web3.js";

// Connection to Solana
const connection = new Connection(clusterApiUrl("devnet"));
const wallet = Keypair.generate();

// Create Metaplex instance
const metaplex = Metaplex.make(connection)
    .use(keypairIdentity(wallet))
    .use(bundlrStorage());

// Upload metadata and mint NFT
const { uri } = await metaplex.nfts().uploadMetadata({
    name: "My NFT",
    description: "My NFT description",
    image: "https://example.com/image.png",
});

const { nft } = await metaplex.nfts().create({
    uri: uri,
    name: "My NFT",
    sellerFeeBasisPoints: 500, // 5%
});`,
    `import { Contract, Account, utils } from 'near-api-js';

// Initialize contract
const contract = new Contract(
  account,
  "nft.nearexample.testnet",
  {
    viewMethods: ["nft_tokens_for_owner", "nft_metadata"],
    changeMethods: ["nft_mint", "nft_transfer"],
  }
);

// Get NFTs owned by an account
const nfts = await contract.nft_tokens_for_owner({
  account_id: account.accountId,
  from_index: "0",
  limit: 50
});

// Transfer an NFT
await contract.nft_transfer(
  {
    receiver_id: "friend.testnet",
    token_id: "token-1",
    memo: "Enjoy your NFT!"
  },
  300000000000000, // 300 TGas
  1 // attached deposit in yoctoNEAR (1 = 10^-24 NEAR)
);`
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
