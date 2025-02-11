/**
 * Example demonstrating goal-based agent functionality in the Daydreams package.
 * This example creates an agent that can plan and execute hierarchical goals.
 *
 * To customize:
 * 1. Define a new context for the agent (similar to ETERNUM_CONTEXT)
 * 2. Inject the context into the agent initialization
 */

import { LLMClient } from "../packages/core/src/core/llm-client";
import { ChainOfThought } from "../packages/core/src/core/chain-of-thought";
import * as readline from "readline";
import chalk from "chalk";

import { ChromaVectorDB } from "../packages/core/src/core/vector-db";
import {
    GoalStatus,
    HandlerRole,
    LogLevel,
} from "../packages/core/src/core/types";
import { fetchGraphQL } from "../packages/core/src/core/providers";
import { z } from "zod";
import { env } from "../packages/core/src/core/env";
import { KAMI_CONTEXT, PROVIDER_GUIDE } from './kami-context';
import { EvmChain } from "../packages/core/src/core/chains/evm";
import { KAMI_ABIS } from './kami-abis';
import { ethers } from "../packages/core/node_modules/ethers";
import { nil } from "ajv";


// move me to kami specific file (?)
const SYSTEM_IDS = {
    GETTER: "system.getter",
    MOVE: "system.account.move",
    USE_ITEM: "system.kami.use.item",
    HARVEST_START: "system.harvest.start",
    HARVEST_STOP: "system.harvest.stop",
    HARVEST_COLLECT: "system.harvest.collect",
    ITEM_PURCHASE: "system.item.purchase",
    SCAVENGE_CLAIM: "system.scavenge.claim",
};

/**
 * Helper function to get user input from CLI
 */
async function getCliInput(prompt: string): Promise<string> {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });

    return new Promise((resolve) => {
        rl.question(prompt, (answer) => {
            rl.close();
            resolve(answer);
        });
    });
}

/**
 * Helper function to format goal status with colored icons
 */
function printGoalStatus(status: GoalStatus): string {
    const colors: Record<GoalStatus, string> = {
        pending: chalk.yellow("⏳ PENDING"),
        active: chalk.blue("▶️ ACTIVE"),
        completed: chalk.green("✅ COMPLETED"),
        failed: chalk.red("❌ FAILED"),
        ready: chalk.cyan("🎯 READY"),
        blocked: chalk.red("🚫 BLOCKED"),
    };
    return colors[status] || status;
}

async function main() {
    // Initialize core components
    const llmClient = new LLMClient({
        model: "openrouter:deepseek/deepseek-r1", // High performance model
    });

    // initialize yominet chain
    const yominetChain = new EvmChain({
        chainName: "yominet",
        chainId: 4471190363524365,
        rpcUrl: "https://json-rpc.preyominet.initia.tech/",
        privateKey: env.KAMIGOTCHI_PRIVATE_KEY,
    });

    // dev note: move to new place?
    async function getSystemsAddress(worldAddress: string): Promise<string> {
        // get the system address based off the function name (?)
        // hard move for now
        const systems = await yominetChain.read({
            contractAddress: worldAddress,
            abi: KAMI_ABIS.world,
            functionName: "systems",
            args: []
        });
        return systems;
    }

    async function getRegistryValues(systemRegistryAddr: string, systemId: string): Promise<string> {
        console.log("Getting entities with ID:", systemId);

        const values = await yominetChain.read({
            contractAddress: systemRegistryAddr,
            abi: KAMI_ABIS.registry,
            functionName: "getEntitiesWithValue",
            args: [ethers.toBeArray(ethers.id(systemId))]
        });
        return values;
    }

    const memory = new ChromaVectorDB("agent_memory");
    await memory.purge(); // Clear previous session data

    // Load initial context documents
    await memory.storeDocument({
        title: "Game Rules",
        content: KAMI_CONTEXT,
        category: "rules",
        tags: ["game-mechanics", "rules"],
        lastUpdated: new Date(),
    });

    await memory.storeDocument({
        title: "Provider Guide",
        content: PROVIDER_GUIDE,
        category: "rules",
        tags: ["provider-guide"],
        lastUpdated: new Date(),
    });

    // Initialize the main reasoning engine
    const dreams = new ChainOfThought(
        llmClient,
        memory,
        {
            worldState: KAMI_CONTEXT,
        },
        {
            logLevel: LogLevel.WARN,
        }
    );

    // Register a generic action handler
    dreams.registerOutput({
        name: "CHAIN_OPERATION",
        role: HandlerRole.OUTPUT,
        handler: async (data: any) => {
            // Helper function to process a single operation
            const processOperation = async (op: any) => {
                const { operation, contractAddress: worldAddress, functionName, args } = op;

                try {
                    let result;
                    if (operation === "read") {
                        // 1. Get systems registry from world contract
                        console.log("\n=== Step 1: Getting Systems Registry ===");
                        console.log("World Address:", worldAddress);
                        const systemRegistryAddr = await getSystemsAddress(worldAddress);
                        console.log("Got system registry address:", systemRegistryAddr);

                        // 2. Get getter system address from registry
                        console.log("\n=== Step 2: Getting Getter System ===");
                        const values = await getRegistryValues(systemRegistryAddr, SYSTEM_IDS.GETTER);
                        console.log("Registry response values:", values);

                        // 3. Convert response to address
                        console.log("\n=== Step 3: Converting Response to Address ===");
                        const getterAddr = values.length > 0
                            ? ethers.getAddress(ethers.toBeHex(values[0]))
                            : ethers.ZeroAddress;
                        console.log("Final getter address:", getterAddr);

                        // 4. Make the actual getter call
                        console.log("\n=== Step 4: Getting Kami Info ===");
                        if (functionName === "getKamiByIndex") {
                            const rawResult = await yominetChain.read({
                                contractAddress: getterAddr,
                                abi: KAMI_ABIS.getter,
                                functionName,
                                args
                            });

                            console.log("Raw result:", rawResult);

                            // Create a clean JSON structure from the array
                            const cleanResult = {
                                id: rawResult[0].toString(),
                                index: Number(rawResult[1]),
                                name: rawResult[2],
                                mediaURI: rawResult[3],
                                stats: {
                                    health: {
                                        base: Number(rawResult[4][0][0]),
                                        shift: Number(rawResult[4][0][1]),
                                        boost: Number(rawResult[4][0][2]),
                                        sync: Number(rawResult[4][0][3])
                                    },
                                    power: {
                                        base: Number(rawResult[4][1][0]),
                                        shift: Number(rawResult[4][1][1]),
                                        boost: Number(rawResult[4][1][2]),
                                        sync: Number(rawResult[4][1][3])
                                    },
                                    harmony: {
                                        base: Number(rawResult[4][2][0]),
                                        shift: Number(rawResult[4][2][1]),
                                        boost: Number(rawResult[4][2][2]),
                                        sync: Number(rawResult[4][2][3])
                                    },
                                    violence: {
                                        base: Number(rawResult[4][3][0]),
                                        shift: Number(rawResult[4][3][1]),
                                        boost: Number(rawResult[4][3][2]),
                                        sync: Number(rawResult[4][3][3])
                                    }
                                },
                                traits: {
                                    face: Number(rawResult[5][0]),
                                    hand: Number(rawResult[5][1]),
                                    body: Number(rawResult[5][2]),
                                    background: Number(rawResult[5][3]),
                                    color: Number(rawResult[5][4])
                                },
                                affinities: rawResult[6],
                                account: rawResult[7].toString(),
                                level: rawResult[8].toString(),
                                xp: rawResult[9].toString(),
                                room: Number(rawResult[10]),
                                state: rawResult[11]
                            };
                            result = cleanResult;
                        } else {
                            throw new Error("Invalid function name");
                        }
                    } else if (operation === "write") {
                        // get the system address based off the function name (?)
                        if (functionName === "moveKami") {
                            // dev note: blow all these into re-usable functions once its all working.
                            // use function name as identifier for now, and update to actual function call when calling write()
                            const systemRegistryAddr = await getSystemsAddress(worldAddress);
                            const values = await getRegistryValues(systemRegistryAddr, SYSTEM_IDS.MOVE);
                            console.log("Registry response values:", values);
                            const moveAddr = values.length > 0
                                ? ethers.getAddress(ethers.toBeHex(values[0]))
                                : ethers.ZeroAddress;
                            console.log("Final move address:", moveAddr);
                            const moveResult = await yominetChain.write({
                                contractAddress: moveAddr,
                                abi: KAMI_ABIS.move,
                                functionName: "executeTyped",
                                args
                            });
                            // dev note:
                            // log these out + store em for data purposes?
                            //   gasUsed: 783878n,
                            //   blobGasUsed: null,
                            //   cumulativeGasUsed: 783878n,
                            //   gasPrice: 2000000000n,
                            // console.log("Move result:", moveResult);
                            return `Transaction executed successfully: ${JSON.stringify(
                                moveResult,
                                null,
                                2
                            )}`;
                        } else if (functionName === "startHarvest") {
                            // Log the current state before attempting to start harvest
                            console.log("Attempting to start harvest for Kami:", args);

                            const systemRegistryAddr = await getSystemsAddress(worldAddress);
                            const values = await getRegistryValues(systemRegistryAddr, SYSTEM_IDS.HARVEST_START);
                            console.log("Registry response values:", values);

                            const harvestAddr = values.length > 0
                                ? ethers.getAddress(ethers.toBeHex(values[0]))
                                : ethers.ZeroAddress;
                            console.log("Final harvest address:", harvestAddr);
                            const harvestResult = await yominetChain.write({
                                contractAddress: harvestAddr,
                                abi: KAMI_ABIS.harvest,
                                functionName: "executeTyped",
                                args
                            });
                            return `Transaction executed successfully: ${JSON.stringify(
                                harvestResult,
                                null,
                                2
                            )}`;
                        } else if (functionName === "feedKami") {
                            console.log("Attempting to feed Kami:", args);

                            const systemRegistryAddr = await getSystemsAddress(worldAddress);
                            const values = await getRegistryValues(systemRegistryAddr, SYSTEM_IDS.USE_ITEM);
                            console.log("Registry response values:", values);

                            const useItemAddr = values.length > 0
                                ? ethers.getAddress(ethers.toBeHex(values[0]))
                                : ethers.ZeroAddress;
                            console.log("Final use item address:", useItemAddr);

                            const feedResult = await yominetChain.write({
                                contractAddress: useItemAddr,
                                abi: KAMI_ABIS.useItem,
                                functionName: "executeTyped",
                                args
                            });
                            return `Transaction executed successfully: ${JSON.stringify(
                                feedResult,
                                null,
                                2
                            )}`;
                        } else if (functionName === "stopHarvest") {
                            console.log("Attempting to stop harvest:", args);

                            const systemRegistryAddr = await getSystemsAddress(worldAddress);
                            const values = await getRegistryValues(systemRegistryAddr, SYSTEM_IDS.HARVEST_STOP);
                            console.log("Registry response values:", values);

                            const harvestStopAddr = values.length > 0
                                ? ethers.getAddress(ethers.toBeHex(values[0]))
                                : ethers.ZeroAddress;
                            console.log("Final harvest stop address:", harvestStopAddr);

                            const stopResult = await yominetChain.write({
                                contractAddress: harvestStopAddr,
                                abi: KAMI_ABIS.harvestStop,
                                functionName: "executeTyped",
                                args
                            });
                            return `Transaction executed successfully: ${JSON.stringify(
                                stopResult,
                                null,
                                2
                            )}`;
                        } else if (functionName === "collectHarvest") {
                            console.log("Attempting to collect harvest:", args);

                            const systemRegistryAddr = await getSystemsAddress(worldAddress);
                            const values = await getRegistryValues(systemRegistryAddr, SYSTEM_IDS.HARVEST_COLLECT);
                            console.log("Registry response values:", values);

                            const collectAddr = values.length > 0
                                ? ethers.getAddress(ethers.toBeHex(values[0]))
                                : ethers.ZeroAddress;
                            console.log("Final collect address:", collectAddr);

                            const collectResult = await yominetChain.write({
                                contractAddress: collectAddr,
                                abi: KAMI_ABIS.harvestCollect,
                                functionName: "executeTyped",
                                args
                            });
                            return `Transaction executed successfully: ${JSON.stringify(
                                collectResult,
                                null,
                                2
                            )}`;
                        } else if (functionName === "purchaseItem") {
                            console.log("Attempting to purchase item:", args);

                            const systemRegistryAddr = await getSystemsAddress(worldAddress);
                            const values = await getRegistryValues(systemRegistryAddr, SYSTEM_IDS.ITEM_PURCHASE);
                            console.log("Registry response values:", values);

                            const purchaseAddr = values.length > 0
                                ? ethers.getAddress(ethers.toBeHex(values[0]))
                                : ethers.ZeroAddress;
                            console.log("Final purchase address:", purchaseAddr);

                            // Format parameters for purchase
                            const [numTypes, itemTypes, amounts, numItems] = args;

                            const purchaseResult = await yominetChain.write({
                                contractAddress: purchaseAddr,
                                abi: KAMI_ABIS.purchase,
                                functionName: "executeTyped",
                                args: [numTypes, itemTypes, amounts, numItems]
                            });
                            return `Transaction executed successfully: ${JSON.stringify(
                                purchaseResult,
                                null,
                                2
                            )}`;
                        } else {
                            throw new Error("Invalid function name");
                        }
                    } else {
                        throw new Error("Invalid operation type");
                    }
                    return `Operation ${operation} executed successfully: ${JSON.stringify(result, null, 2)}`;
                } catch (error) {
                    return `Error during ${operation} operation: ${error instanceof Error ? error.message : 'Unknown error'}`;
                }
            };

            // Handle both single operations and batches
            if (Array.isArray(data.payload)) {
                const results = await Promise.all(
                    data.payload.map(op => processOperation(op))
                );
                return `Batch operations completed:\n${results.join('\n')}`;
            }
            return processOperation(data.payload);
        },
        schema: z.union([
            // Single operation
            z.object({
                operation: z.enum(["read", "write"]).describe("The type of operation to perform"),
                contractAddress: z.string().describe("The world contract address"),
                functionName: z.string().describe("The function to call"),
                args: z.array(z.any()).describe("The arguments for the function call"),
            }),
            // Batch operations
            z.array(
                z.object({
                    operation: z.enum(["read", "write"]).describe("The type of operation to perform"),
                    contractAddress: z.string().describe("The world contract address"),
                    functionName: z.string().describe("The function to call"),
                    args: z.array(z.any()).describe("The arguments for the function call"),
                })
            )
        ]).describe("The payload for blockchain operations (single or batch)"),
    });

    // Set up event logging

    // Thought process events
    dreams.on("step", (step) => {
        if (step.type === "system") {
            console.log("\n💭 System prompt:", step.content);
        } else {
            console.log("\n🤔 New thought step:", {
                content: step.content,
                tags: step.tags,
            });
        }
    });

    // Uncomment to log token usage
    // llmClient.on("trace:tokens", ({ input, output }) => {
    //   console.log("\n💡 Tokens used:", { input, output });
    // });

    // Action execution events
    dreams.on("action:start", (action) => {
        console.log("\n🎬 Starting action:", {
            type: action.type,
            payload: action.payload,
        });
    });

    dreams.on("action:complete", ({ action, result }) => {
        console.log("\n✅ Action complete:", {
            type: action.type,
            result,
        });
    });

    dreams.on("action:error", ({ action, error }) => {
        console.log("\n❌ Action failed:", {
            type: action.type,
            error,
        });
    });

    // Thinking process events
    dreams.on("think:start", ({ query }) => {
        console.log("\n🧠 Starting to think about:", query);
    });

    dreams.on("think:complete", ({ query }) => {
        console.log("\n🎉 Finished thinking about:", query);
    });

    dreams.on("think:timeout", ({ query }) => {
        console.log("\n⏰ Thinking timed out for:", query);
    });

    dreams.on("think:error", ({ query, error }) => {
        console.log("\n💥 Error while thinking about:", query, error);
    });

    // Goal management events
    dreams.on("goal:created", ({ id, description }) => {
        console.log(chalk.cyan("\n🎯 New goal created:"), {
            id,
            description,
        });
    });

    dreams.on("goal:updated", ({ id, status }) => {
        console.log(chalk.yellow("\n📝 Goal status updated:"), {
            id,
            status: printGoalStatus(status),
        });
    });

    dreams.on("goal:completed", ({ id, result }) => {
        console.log(chalk.green("\n✨ Goal completed:"), {
            id,
            result,
        });
    });

    dreams.on("goal:failed", ({ id, error }) => {
        console.log(chalk.red("\n💥 Goal failed:"), {
            id,
            error: error instanceof Error ? error.message : String(error),
        });
    });

    // Memory management events
    dreams.on("memory:experience_stored", async ({ experience }) => {
        // Await the outcome promise before logging
        const outcome = await experience.outcome;

        console.log(chalk.blue("\n💾 New experience stored:"), {
            action: experience.action,
            // Format the outcome if it's JSON
            outcome: typeof outcome === 'string' ? outcome : JSON.stringify(outcome, null, 2),
            importance: experience.importance,
            timestamp: experience.timestamp,
        });

        if (experience.emotions?.length) {
            console.log(
                chalk.blue("😊 Emotional context:"),
                experience.emotions.join(", ")
            );
        }
    });

    dreams.on("memory:knowledge_stored", ({ document }) => {
        console.log(chalk.magenta("\n📚 New knowledge documented:"), {
            title: document.title,
            category: document.category,
            tags: document.tags,
            lastUpdated: document.lastUpdated,
        });
        console.log(chalk.magenta("📝 Content:"), document.content);
    });

    dreams.on("memory:experience_retrieved", ({ experiences }) => {
        console.log(chalk.yellow("\n🔍 Relevant past experiences found:"));
        experiences.forEach((exp, index) => {
            console.log(chalk.yellow(`\n${index + 1}. Previous Experience:`));
            console.log(`   Action: ${exp.action}`);
            console.log(`   Outcome: ${exp.outcome}`);
            console.log(`   Importance: ${exp.importance || "N/A"}`);
            if (exp.emotions?.length) {
                console.log(`   Emotions: ${exp.emotions.join(", ")}`);
            }
        });
    });

    dreams.on("memory:knowledge_retrieved", ({ documents }) => {
        console.log(chalk.green("\n📖 Relevant knowledge retrieved:"));
        documents.forEach((doc, index) => {
            console.log(chalk.green(`\n${index + 1}. Knowledge Entry:`));
            console.log(`   Title: ${doc.title}`);
            console.log(`   Category: ${doc.category}`);
            console.log(`   Tags: ${doc.tags.join(", ")}`);
            console.log(`   Content: ${doc.content}`);
        });
    });

    // Main interaction loop
    while (true) {
        console.log(chalk.cyan("\n🤖 Enter your goal (or 'exit' to quit):"));
        const userInput = await getCliInput("> ");

        if (userInput.toLowerCase() === "exit") {
            console.log(chalk.yellow("Goodbye! 👋"));
            break;
        }

        try {
            // Plan and execute goals
            console.log(chalk.cyan("\n🤔 Planning strategy for goal..."));
            await dreams.decomposeObjectiveIntoGoals(userInput);

            console.log(chalk.cyan("\n🎯 Executing goals..."));

            const stats = {
                completed: 0,
                failed: 0,
                total: 0,
            };

            // Execute goals until completion
            while (true) {
                const readyGoals = dreams.goalManager.getReadyGoals();
                const activeGoals = dreams.goalManager
                    .getGoalsByHorizon("short")
                    .filter((g) => g.status === "active");
                const pendingGoals = dreams.goalManager
                    .getGoalsByHorizon("short")
                    .filter((g) => g.status === "pending");

                // Status update
                console.log(chalk.cyan("\n📊 Current Progress:"));
                console.log(`Ready goals: ${readyGoals.length}`);
                console.log(`Active goals: ${activeGoals.length}`);
                console.log(`Pending goals: ${pendingGoals.length}`);
                console.log(`Completed: ${stats.completed}`);
                console.log(`Failed: ${stats.failed}`);

                // Check if all goals are complete
                if (
                    readyGoals.length === 0 &&
                    activeGoals.length === 0 &&
                    pendingGoals.length === 0
                ) {
                    console.log(chalk.green("\n✨ All goals completed!"));
                    break;
                }

                // Handle blocked goals
                if (readyGoals.length === 0 && activeGoals.length === 0) {
                    console.log(
                        chalk.yellow(
                            "\n⚠️ No ready or active goals, but some goals are pending:"
                        )
                    );
                    pendingGoals.forEach((goal) => {
                        const blockingGoals =
                            dreams.goalManager.getBlockingGoals(goal.id);
                        console.log(
                            chalk.yellow(
                                `\n📌 Pending Goal: ${goal.description}`
                            )
                        );
                        console.log(
                            chalk.yellow(
                                `   Blocked by: ${blockingGoals.length} goals`
                            )
                        );
                        blockingGoals.forEach((blocking) => {
                            console.log(
                                chalk.yellow(
                                    `   - ${blocking.description} (${blocking.status})`
                                )
                            );
                        });
                    });
                    break;
                }

                // Execute next goal
                try {
                    await dreams.processHighestPriorityGoal();
                    stats.completed++;
                } catch (error) {
                    console.error(
                        chalk.red("\n❌ Goal execution failed:"),
                        error
                    );
                    stats.failed++;

                    // Ask to continue
                    const shouldContinue = await getCliInput(
                        chalk.yellow(
                            "\nContinue executing remaining goals? (y/n): "
                        )
                    );

                    if (shouldContinue.toLowerCase() !== "y") {
                        console.log(chalk.yellow("Stopping goal execution."));
                        break;
                    }
                }

                stats.total++;
            }

            // Learning summary
            console.log(chalk.cyan("\n📊 Learning Summary:"));

            const recentExperiences = await dreams.memory.getRecentEpisodes(5);
            console.log(chalk.blue("\n🔄 Recent Experiences:"));
            recentExperiences.forEach((exp, index) => {
                console.log(chalk.blue(`\n${index + 1}. Experience:`));
                console.log(`   Action: ${exp.action}`);
                console.log(`   Outcome: ${exp.outcome}`);
                console.log(`   Importance: ${exp.importance || "N/A"}`);
            });

            const relevantDocs = await dreams.memory.findSimilarDocuments(
                userInput,
                3
            );
            console.log(chalk.magenta("\n📚 Accumulated Knowledge:"));
            relevantDocs.forEach((doc, index) => {
                console.log(chalk.magenta(`\n${index + 1}. Knowledge Entry:`));
                console.log(`   Title: ${doc.title}`);
                console.log(`   Category: ${doc.category}`);
                console.log(`   Tags: ${doc.tags.join(", ")}`);
            });

            // Final execution summary
            console.log(chalk.cyan("\n📊 Final Execution Summary:"));
            console.log(chalk.green(`✅ Completed Goals: ${stats.completed}`));
            console.log(chalk.red(`❌ Failed Goals: ${stats.failed}`));
            console.log(
                chalk.blue(
                    `📈 Success Rate: ${Math.round(
                        (stats.completed / stats.total) * 100
                    )}%`
                )
            );
            console.log(
                chalk.yellow(
                    `🧠 Learning Progress: ${recentExperiences.length} new experiences, ${relevantDocs.length} relevant knowledge entries`
                )
            );
        } catch (error) {
            console.error(chalk.red("Error processing goal:"), error);
        }
    }

    // Graceful shutdown handler
    process.on("SIGINT", async () => {
        console.log(chalk.yellow("\nShutting down..."));
        process.exit(0);
    });
}

// Start the application
main().catch((error) => {
    console.error(chalk.red("Fatal error:"), error);
    process.exit(1);
});
