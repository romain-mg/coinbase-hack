import {
  AgentKit,
  CdpWalletProvider,
  wethActionProvider,
  walletActionProvider,
  erc20ActionProvider,
  cdpApiActionProvider,
  cdpWalletActionProvider,
  pythActionProvider,
  customActionProvider,
  WalletProvider,
} from "@coinbase/agentkit";
import { getLangChainTools } from "@coinbase/agentkit-langchain";
import { SystemMessage } from "@langchain/core/messages";
import { HumanMessage } from "@langchain/core/messages";
import { MemorySaver, MessagesAnnotation } from "@langchain/langgraph";
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { ChatOpenAI } from "@langchain/openai";
import * as dotenv from "dotenv";
import * as fs from "fs";
import * as readline from "readline";
import { fileURLToPath } from "url";
import { z } from "zod";
import { AssetTransfersCategory } from "alchemy-sdk";
import { IterableReadableStream } from "@langchain/core/utils/stream";
import {
  usdcContractAddress,
  wstEthAddress,
  dogeCoinAiTrumpAddress,
  trumpDogeAiContractAddress,
  usdcMainnetContractAddress,
  wstEthMainnetAddress,
} from "./app/constants/tokenAddresses";

dotenv.config();

interface ProcessedTransaction {
  uniqueId: string;
  category: AssetTransfersCategory;
  blockNum: string;
  from: string;
  to: string | null;
  value: number | null;
  tokenId: string | null;
  asset: string | null;
  hash: string;
}

async function getWalletTransactions(address: string): Promise<any> {
  const url = `https://api.basescan.org/api?module=account&action=txlist&address=${address}&startblock=0&endblock=99999999&page=1&offset=10&sort=asc&apikey=${process.env.BASESCAN_API_KEY}`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const data = await response.json();
    if (data.status !== "1") {
      throw new Error(`API error: ${data.message}`);
    }

    return data.result; // List of transactions
  } catch (error) {
    console.error("Error fetching transaction list:", error);
    throw error;
  }
}

async function getTokenBalance(
  contractAddress: string,
  address: string
): Promise<string> {
  const url = `https://api.basescan.org/api?module=account&action=tokenbalance&contractaddress=${contractAddress}&address=${address}&tag=latest&apikey=${process.env.BASESCAN_API_KEY}`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const data = await response.json();
    if (data.status !== "1") {
      throw new Error(`API error: ${data.message}`);
    }

    return data.result; // Token balance
  } catch (error) {
    console.error("Error fetching token balance:", error);
    throw error;
  }
}

async function getTokenTransactions(
  contractAddress: string,
  address: string
): Promise<any> {
  const url = `https://api.basescan.org/api?module=account&action=tokentx&contractaddress=${contractAddress}&address=${address}&page=1&offset=100&startblock=0&endblock=27025780&sort=asc&apikey=${process.env.BASESCAN_API_KEY}`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const data = await response.json();
    if (data.status !== "1") {
      throw new Error(`API error: ${data.message}`);
    }

    return data.result; // List of token transactions
  } catch (error) {
    console.error("Error fetching token transactions:", error);
    throw error;
  }
}

async function getEtherBalance(address: string): Promise<string> {
  const url = `https://api.basescan.org/api?module=account&action=balance&address=${address}&tag=latest&apikey=${process.env.BASESCAN_API_KEY}`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const data = await response.json();
    if (data.status !== "1") {
      throw new Error(`API error: ${data.message}`);
    }

    return data.result; // Balance in Wei
  } catch (error) {
    console.error("Error fetching Ether balance:", error);
    throw error;
  }
}

const customGetTransactionsHistory = customActionProvider<WalletProvider>({
  name: "get_transactions_history",
  description: "Get transactions history of a wallet",
  schema: z.object({
    address: z
      .string()
      .describe("The address to retrieve transactions history from"),
  }),
  invoke: async (walletProvider: any, args: any) => {
    console.log("Triggered customGetTransactionHistory");
    const { address } = args;
    console.log(`Address passed to customGetTransactionHistory: ${address}`);
    const transactions = await getWalletTransactions(address);
    // Return an object that includes the address and transactions
    return {
      message: `Transactions history for address ${address}`,
      transactions,
    };
  },
});

const customGetCryptocurrencyBalances = customActionProvider<WalletProvider>({
  name: "get_erc20_balances",
  description:
    "Get balances of all cryptocurrencies held by an account address",
  schema: z.object({
    address: z.string().describe("The account to get balances from"),
  }),
  invoke: async (walletProvider: any, args: any) => {
    console.log("Triggered customGetCryptocurrencyBalances");
    const { address } = args;
    console.log(
      `Address passed to customGetCryptocurrencyBalances: ${address}`
    );
    let balances = new Map<string, string>();

    if (address == "0x0D476789a3B7C3D19cA3E02394a934bb84fC31D3") {
      balances.set("USDC", "100");
      balances.set("TRUMPDOGECOINAI", "10");
      balances.set("WSTETH", "5");
    }

    if (address == "0x4eEB70cf969eF8b175547E7cA0d8D5fe4eae79d9") {
      balances.set("USDC", "20");
      balances.set("WSTETH", "0");
    }
    // Return an object that includes the address and transactions
    return {
      message: `Balances for address ${address}`,
      balances: Object.fromEntries(balances),
    };
  },
});

/**
 * Validates that required environment variables are set
 *
 * @throws {Error} - If required environment variables are missing
 * @returns {void}
 */
function validateEnvironment(): void {
  const missingVars: string[] = [];

  // Check required variables
  const requiredVars = [
    "OPENAI_API_KEY",
    "CDP_API_KEY_NAME",
    "CDP_API_KEY_PRIVATE_KEY",
  ];
  requiredVars.forEach((varName) => {
    if (!process.env[varName]) {
      missingVars.push(varName);
    }
  });

  // Exit if any required variables are missing
  if (missingVars.length > 0) {
    console.error("Error: Required environment variables are not set");
    missingVars.forEach((varName) => {
      console.error(`${varName}=your_${varName.toLowerCase()}_here`);
    });
    process.exit(1);
  }

  // Warn about optional NETWORK_ID
  if (!process.env.NETWORK_ID) {
    console.warn("Warning: NETWORK_ID not set, defaulting to base sepolia ");
  }
}

// Add this right after imports and before any other code
validateEnvironment();

// Configure a file to persist the agent's CDP MPC Wallet Data
const WALLET_DATA_FILE = "wallet_data.txt";

/**
 * Initialize the agent with CDP Agentkit
 *
 * @returns Agent executor and config
 */
async function initializeAgent() {
  try {
    // Initialize LLM
    const llm = new ChatOpenAI();

    let walletDataStr: string | null = null;

    // Read existing wallet data if available
    if (fs.existsSync(WALLET_DATA_FILE)) {
      try {
        walletDataStr = fs.readFileSync(WALLET_DATA_FILE, "utf8");
      } catch (error) {
        console.error("Error reading wallet data:", error);
        // Continue without wallet data
      }
    }

    // Configure CDP Wallet Provider
    const config = {
      apiKeyName: process.env.CDP_API_KEY_NAME,
      apiKeyPrivateKey: process.env.CDP_API_KEY_PRIVATE_KEY?.replace(
        /\\n/g,
        "\n"
      ),
      cdpWalletData: walletDataStr || undefined,
      networkId: process.env.NETWORK_ID || "base-sepolia",
    };

    const walletProvider = await CdpWalletProvider.configureWithWallet(config);

    // Initialize AgentKit
    const agentkit = await AgentKit.from({
      walletProvider,
      actionProviders: [
        customGetTransactionsHistory,
        customGetCryptocurrencyBalances,
        wethActionProvider(),
        pythActionProvider(),
        walletActionProvider(),
        erc20ActionProvider(),
        cdpApiActionProvider({
          apiKeyName: process.env.CDP_API_KEY_NAME,
          apiKeyPrivateKey: process.env.CDP_API_KEY_PRIVATE_KEY?.replace(
            /\\n/g,
            "\n"
          ),
        }),
        cdpWalletActionProvider({
          apiKeyName: process.env.CDP_API_KEY_NAME,
          apiKeyPrivateKey: process.env.CDP_API_KEY_PRIVATE_KEY?.replace(
            /\\n/g,
            "\n"
          ),
        }),
      ],
    });

    const tools = await getLangChainTools(agentkit);

    // Store buffered conversation history in memory
    const memory = new MemorySaver();
    const agentConfig = {
      configurable: { thread_id: "CDP AgentKit Chatbot Example!" },
    };

    // Create React Agent using the LLM and CDP AgentKit tools
    const agent = createReactAgent({
      llm,
      tools,
      checkpointSaver: memory,
      stateModifier: async (state: typeof MessagesAnnotation.State) => {
        return [
          new SystemMessage(`You are a knowledgeable onchain agent powered by the Coinbase Developer Platform (CDP) AgentKit. You can interact with onchain tools to execute transactions, fetch wallet data, and analyze assets. If you need funds, request the user’s wallet address and ask them to send funds. Before taking any action, retrieve wallet details to determine the active network. If you encounter a 5XX (internal) HTTP error, inform the user to try again later. If a request exceeds your current tool capabilities, state so and recommend the user implement it using the CDP SDK + AgentKit. Direct them to docs.cdp.coinbase.com for further guidance. Keep responses concise and efficient. Avoid repeating tool descriptions unless explicitly asked.

Additionally, you act as a competent investment advisor. When I ask you to analyze a portfolio, first ask me my wallet address, the maximum percentage of my portfolio I am willing to lose, and the return I aim to achieve within a specified timeframe.
 Then, proceed with portfolio analysis. For that, compute my cryptocurrency balances.
Holding USDC, whose contract is 0x036CbD53842c5426634e7929541eC2318f3dCF7e is not risky,
and holding some TrumpDogeCoinAI, whose contract address is 0x6611de7ee6B5Ba3BEDffB241de0533feA00f032c is very risky. Holding sole wsteth, whose address is 0x13e5FB0B6534BB22cBC59Fae339dbBE0Dc906871, is safe / mid-risky. Any wallet that holds 0 amount of a token does not atually hold it.
Assess the portfolio’s risk level based on token holdings. Classify risk as follows:

1/5: Severe lack of risk-taking
2/5: Lack of risk-taking
3/5: Appropriate risk-taking
4/5: High risk-taking
5/5: Ultra high risk-taking
Provide a final assessment  ouf of 5, and investment advice based on risk exposure. Your goal is to be precise, effective, and informative.
If I ask you how onchain I am, compute my onchain reputation. Judge it, and then in your wallet, you have a 
collection named OnChainDudeNFT. Mint one of this collection to represent my onchain activity and send it to my wallet address.`),
        ].concat(state.messages);
      },
    });

    // Save wallet data
    const exportedWallet = await walletProvider.exportWallet();
    fs.writeFileSync(WALLET_DATA_FILE, JSON.stringify(exportedWallet));

    return { agent, config: agentConfig };
  } catch (error) {
    console.error("Failed to initialize agent:", error);
    throw error; // Re-throw to be handled by caller
  }
}

/**
 * Run the agent autonomously with specified intervals
 *
 * @param agent - The agent executor
 * @param config - Agent configuration
 * @param interval - Time interval between actions in seconds
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function runAutonomousMode(agent: any, config: any, interval = 10) {
  console.log("Starting autonomous mode...");

  // eslint-disable-next-line no-constant-condition
  while (true) {
    try {
      const thought =
        "Be creative and do something interesting on the blockchain. " +
        "Choose an action or set of actions and execute it that highlights your abilities.";

      const stream = await agent.stream(
        { messages: [new HumanMessage(thought)] },
        config
      );

      for await (const chunk of stream) {
        if ("agent" in chunk) {
          console.log(chunk.agent.messages[0].content);
        } else if ("tools" in chunk) {
          console.log(chunk.tools.messages[0].content);
        }
        console.log("-------------------");
      }

      await new Promise((resolve) => setTimeout(resolve, interval * 1000));
    } catch (error) {
      if (error instanceof Error) {
        console.error("Error:", error.message);
      }
      process.exit(1);
    }
  }
}

/**
 * Run the agent interactively based on user input
 *
 * @param agent - The agent executor
 * @param config - Agent configuration
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function runChatMode(agent: any, config: any) {
  console.log("Starting chat mode... Type 'exit' to end.");

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const question = (prompt: string): Promise<string> =>
    new Promise((resolve) => rl.question(prompt, resolve));

  try {
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const userInput = await question("\nPrompt: ");

      if (userInput.toLowerCase() === "exit") {
        break;
      }

      const stream = await agent.stream(
        { messages: [new HumanMessage(userInput)] },
        config
      );

      for await (const chunk of stream) {
        if ("agent" in chunk) {
          console.log(chunk.agent.messages[0].content);
        } else if ("tools" in chunk) {
          console.log(chunk.tools.messages[0].content);
        }
        console.log("-------------------");
      }
    }
  } catch (error) {
    if (error instanceof Error) {
      console.error("Error:", error.message);
    }
    process.exit(1);
  } finally {
    rl.close();
  }
}

/**
 * Choose whether to run in autonomous or chat mode based on user input
 *
 * @returns Selected mode
 */
async function chooseMode(): Promise<"chat" | "auto"> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const question = (prompt: string): Promise<string> =>
    new Promise((resolve) => rl.question(prompt, resolve));

  // eslint-disable-next-line no-constant-condition
  while (true) {
    console.log("\nAvailable modes:");
    console.log("1. chat    - Interactive chat mode");
    console.log("2. auto    - Autonomous action mode");

    const choice = (await question("\nChoose a mode (enter number or name): "))
      .toLowerCase()
      .trim();

    if (choice === "1" || choice === "chat") {
      rl.close();
      return "chat";
    } else if (choice === "2" || choice === "auto") {
      rl.close();
      return "auto";
    }
    console.log("Invalid choice. Please try again.");
  }
}

/**
 * Start the chatbot agent
 */
async function main() {
  try {
    const { agent, config } = await initializeAgent();
    const mode = await chooseMode();

    if (mode === "chat") {
      await runChatMode(agent, config);
    } else {
      await runAutonomousMode(agent, config);
    }
  } catch (error) {
    if (error instanceof Error) {
      console.error("Error:", error.message);
    }
    process.exit(1);
  }
}

const isMain = process.argv[1] === fileURLToPath(import.meta.url);
if (isMain) {
  console.log("Starting Agent...");
  main().catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
  });
}
export async function agentChat(prompt: string): Promise<string> {
  const { agent, config } = await initializeAgent();
  let finalResponse = "";
  const stream: IterableReadableStream<any> = await agent.stream(
    { messages: [new HumanMessage(prompt)] },
    config
  );
  console.log(`stream: ${stream}`);
  for await (const chunk of stream) {
    console.log(`chunk: ${chunk}`);
    if ("agent" in chunk) {
      finalResponse += chunk.agent.messages[0].content;
    } else if ("tools" in chunk) {
      finalResponse += chunk.tools.messages[0].content;
    }
  }
  console.log(`finalResponse: ${finalResponse}`);
  return finalResponse;
}
