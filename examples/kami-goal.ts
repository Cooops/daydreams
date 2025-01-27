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
import { ETERNUM_CONTEXT, PROVIDER_GUIDE } from "./eternum-context";
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
import { KAMI_CONTEXT } from './kami-context';
import { EvmChain } from "../packages/core/src/core/chains/evm";
import { KAMI_ABIS } from './kami-abis';

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
        rpcUrl: "https://rpc.preyominet.initia.tech",
        privateKey: env.KAMIGOTCHI_PRIVATE_KEY,
    });

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
            logLevel: LogLevel.DEBUG,
        }
    );

    // Register a generic action handler
    dreams.registerOutput({
        name: "CHAIN_OPERATION",
        role: HandlerRole.OUTPUT,
        handler: async (data: any) => {
            const { operation, contractAddress, functionName, args } = data.payload;

            // Get the appropriate ABI based on function name
            const abi = KAMI_ABIS[functionName];
            if (!abi) {
                throw new Error(`No ABI found for function: ${functionName}`);
            }

            try {
                let result;
                if (operation === "read") {
                    result = await yominetChain.read({
                        contractAddress,
                        abi,
                        functionName,
                        args,
                    });
                } else if (operation === "write") {
                    result = await yominetChain.write({
                        contractAddress,
                        abi,
                        functionName,
                        args,
                    });
                } else {
                    throw new Error("Invalid operation type");
                }
                return `Operation ${operation} executed successfully: ${JSON.stringify(result, null, 2)}`;
            } catch (error) {
                return `Error during ${operation} operation: ${error instanceof Error ? error.message : 'Unknown error'}`;
            }
        },
        schema: z
            .object({
                operation: z.enum(["read", "write"]).describe("The type of operation to perform"),
                contractAddress: z.string().describe("The address of the contract"),
                abi: z.any().describe("The ABI of the contract"),
                functionName: z.string().describe("The function to call"),
                args: z.array(z.any()).describe("The arguments for the function call"),
                overrides: z.optional(z.object({
                    gasLimit: z.number().describe("Optional gas limit for the transaction"),
                })).describe("Optional transaction overrides"),
            })
            .describe("The payload for a blockchain operation"),
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
    dreams.on("memory:experience_stored", ({ experience }) => {
        console.log(chalk.blue("\n💾 New experience stored:"), {
            action: experience.action,
            outcome: experience.outcome,
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
