import { KamiManager } from '../kamiManager.js';
import { simpleHarvestStrategy } from '../strategies/simpleStrategy.js';

async function testRunner() {
    console.log('Starting KamiManager tests...\n');

    const manager = new KamiManager();

    // Test 1: Get Kami Info [[[✅]]]
    // ========================
    try {
        console.log('Test 1: Getting Kami Info for index 6717...');
        const kamiInfo = await manager.getKamiInfo(6717);
        console.log('✅ Successfully got Kami info:');
        console.log(JSON.stringify(kamiInfo, null, 2));
    } catch (error) {
        console.error('❌ Failed to get Kami info:', error);
    }

    // Test 2: Room Movement [[[✅]]]
    // ========================
    // try {
    //     console.log('\nTest 2: Testing room movement...');
    //     const currentRoom = await manager.getCurrentRoom(6717);
    //     console.log(`Current room: ${currentRoom}`);

    //     // Move to room ???
    //     const targetRoom = 30;
    //     console.log(`Moving to room ${targetRoom}...`);

    //     const receipt = await manager.moveToRoom(targetRoom);
    //     console.log('✅ Successfully moved rooms:');
    //     console.log('Transaction hash:', receipt.transactionHash);

    //     const newRoom = await manager.getCurrentRoom(6717);
    //     console.log(`New room: ${newRoom}`);
    // } catch (error) {
    //     console.error('❌ Failed to move rooms:', error);
    // }

    // Test 3: Try to revive a Kami [[[✅]]]
    // ===============================
    // try {
    //     console.log('\nTest 3: Attempting to revive Kami 6717...');
    //     const kamiInfo = await manager.getKamiInfo(6717);

    //     if (kamiInfo.state === "DEAD") {
    //         const receipt = await manager.reviveKami(6717);
    //         console.log('✅ Successfully revived Kami:');
    //         console.log('Transaction hash:', receipt.transactionHash);
    //     } else {
    //         console.log(`ℹ️ Kami is not dead (current state: ${kamiInfo.state})`);
    //     }
    // } catch (error) {
    //     console.error('❌ Failed to revive Kami:', error);
    // }

    // Test 4: Start Harvesting  [[[✅]]]
    // successful raw data:
    // ~~~~~~~~~~~~~~~~~~~~
    // From: 0x8e5a96d64674b0c5f33a0c19643c4d67dedfa13f
    // To: 0xd89b4ef72950b95d114e2d8081bf03b814d7aec6
    // MethodID: 0x915657fb
    // [0]:  8b523040ac55508516879b497be69f4d84f051e137a89bc91e3edd0d41a4afda
    // [1]:  48e075902440c00b3be18427203d7d4865a6ef147e1424b144e22e0756107769
    // =======================
    // try {
    //     console.log('\nTest 4: Starting harvesting for Kami 6717...');
    //     const kamiInfo = await manager.getKamiInfo(6717);

    //     if (kamiInfo.state !== "HARVESTING" && kamiInfo.state !== "DEAD") {
    //         const nodeID = "48e075902440c00b3be18427203d7d4865a6ef147e1424b144e22e0756107769"; // scrap paths node id from nodes.json
    //         // DEV TODO -- ask kami team/figure out what this value is thats used for starting/stopping harvesting, its static but i cant seem to find where to get it onchain
    //         const kamiID = "8b523040ac55508516879b497be69f4d84f051e137a89bc91e3edd0d41a4afda"; // hard coded kami id for mr. freeze
    //         const receipt = await manager.startHarvesting(kamiID, nodeID);
    //         console.log('✅ Successfully started harvesting:');
    //         console.log('Transaction hash:', receipt.transactionHash);
    //     } else {
    //         console.log(`ℹ️ Kami cannot harvest (current state: ${kamiInfo.state})`);
    //     }
    // } catch (error) {
    //     console.error('❌ Failed to start harvesting:', error);
    // }

    // Test 5: Feed a kami  [[[✅]]]
    // ===============================
    // try {
    //     console.log('\nTest 5: Attempting to feed Kami 6717...');
    //     const kamiInfo = await manager.getKamiInfo(6717);

    //     if (kamiInfo.state !== "DEAD") {
    //         const receipt = await manager.feedKami(6717, 11301); // 11301 = Maple-Flavor Ghost Gum
    //         console.log('✅ Successfully fed Kami:');
    //         console.log('Transaction hash:', receipt.transactionHash);
    //     } else {
    //         console.log(`ℹ️ Kami is fully fed (current state: ${kamiInfo.state})`);
    //     }
    // } catch (error) {
    //     console.error('❌ Failed to feed Kami:', error);
    // }

    // Test 6: Stop Harvesting  [[[✅]]]
    // successful raw data:
    // ~~~~~~~~~~~~~~~~~~~~
    // Sender / Receiver
    // From: 0x8e5a96d64674b0c5f33a0c19643c4d67dedfa13f
    // To: 0x22a578ad94f4489e38b56fe7e2171bc454bced47
    // To: 0x22a578ad94f4489e38b56fe7e2171bc454bced47
    // MethodID: 0x3e991df3
    // [0]:  d21d057c09ca8949c30a0334967bc2fc80ff620f6e1c472739a272c9a2f5c6f0
    // try {
    //     console.log('\nTest 6: Stop harvesting for Kami 6717...');
    //     const kamiInfo = await manager.getKamiInfo(6717);

    //     if (kamiInfo.state === "HARVESTING") {
    //         const kamiHarvestID = "0xd21d057c09ca8949c30a0334967bc2fc80ff620f6e1c472739a272c9a2f5c6f0"; // hard coded harvestID for kami, need to also review/see from kami team how to find this onchain. its not the kami's id itself.
    //         const receipt = await manager.stopHarvesting(kamiHarvestID);
    //         console.log('✅ Successfully stopped harvesting:');
    //         console.log('Transaction hash:', receipt.transactionHash);
    //     } else {
    //         console.log(`ℹ️ Kami cannot be stopped (current state: ${kamiInfo.state})`);
    //     }
    // } catch (error) {
    //     console.error('❌ Failed to stop harvesting:', error);
    // }

    // Test 7: Simple Harvest Strategy ✨ [[[✅]]]
    // try {
    //     console.log('\nTest 7: Running simple harvest strategy...');

    //     // Constants from our successful tests
    //     const nodeID = "48e075902440c00b3be18427203d7d4865a6ef147e1424b144e22e0756107769"; // scrap paths
    //     const kamiHarvestID = "0x8b523040ac55508516879b497be69f4d84f051e137a89bc91e3edd0d41a4afda";
    //     const kamiSecondHarvestID = "0xd21d057c09ca8949c30a0334967bc2fc80ff620f6e1c472739a272c9a2f5c6f0"

    //     // Run strategy with timeout
    //     const timeoutPromise = new Promise((_, reject) =>
    //         setTimeout(() => reject(new Error('Strategy timeout')), 600000) // 10 minute timeout
    //     );

    //     const strategyPromise = simpleHarvestStrategy(manager, 6717, kamiHarvestID, kamiSecondHarvestID, nodeID, {
    //         collectInterval: 90000, // 90 seconds between collections
    //         maxCycles: 1,
    //         cooldownWait: 60000,
    //         initialCooldown: 60000
    //     });

    //     try {
    //         await Promise.race([strategyPromise, timeoutPromise]);
    //     } catch (error: unknown) {
    //         if (error instanceof Error && error.message === 'Strategy timeout') {
    //             console.log('✅ Strategy timed out after 10 minutes as expected');
    //         } else {
    //             throw error;
    //         }
    //     }
    // } catch (error: unknown) {
    //     if (error instanceof Error) {
    //         console.error('❌ Failed to run harvest strategy:', error.message);
    //     } else {
    //         console.error('❌ Failed to run harvest strategy with unknown error');
    //     }
    // }

    // Test 8: Purchase Items ✨ [[[❌ not documented yet/can't figure out besides my raw method call way]]]
    // try {
    //     console.log('\nTest 8: Testing item purchase...');

    //     // Item from items.json
    //     const item = {
    //         name: "Red Gakki Ribbon",
    //         index: 11001,
    //         description: "Capable of raising a Kamigotchi from the dead",
    //         quantity: 1
    //     };

    //     console.log(`\nAttempting to purchase ${item.quantity}x ${item.name} (index: ${item.index})...`);
    //     try {
    //         const receipt = await manager.purchaseItem(item.index, item.quantity);
    //         console.log('✅ Successfully purchased item:');
    //         console.log('Transaction hash:', receipt.transactionHash);
    //     } catch (error) {
    //         if (error instanceof Error) {
    //             console.log(`ℹ️ Could not purchase ${item.name}: ${error.message}`);
    //         } else {
    //             throw error;
    //         }
    //     }

    // } catch (error: unknown) {
    //     if (error instanceof Error) {
    //         console.error('❌ Failed to test item purchase:', error.message);
    //     } else {
    //         console.error('❌ Failed to test item purchase with unknown error');
    //     }
    // }

    // Test 9: Claim Scavenge ✨
    // try {
    //     console.log('\nTest 9: Testing scavenge claim...');

    //     // Scavenge ID from Scrap Paths node
    //     const scavBarID = "0x3d494f4976c2522c8dbb2d97b7de000c134092e039a4ab24fee1ffc004887f6b";

    //     console.log(`Attempting to claim scavenge from Scrap Paths (ID: ${scavBarID})...`);
    //     try {
    //         const receipt = await manager.claimScavenge(scavBarID);
    //         console.log('✅ Successfully claimed scavenge:');
    //         console.log('Transaction hash:', receipt.transactionHash);
    //     } catch (error) {
    //         if (error instanceof Error) {
    //             if (error.message === 'No unclaimed scavenge rolls available') {
    //                 console.log('ℹ️ No scavenge rolls to claim');
    //             } else {
    //                 console.log(`ℹ️ Could not claim scavenge: ${error.message}`);
    //             }
    //         } else {
    //             throw error;
    //         }
    //     }
    // } catch (error: unknown) {
    //     if (error instanceof Error) {
    //         console.error('❌ Failed to test scavenge claim:', error.message);
    //     } else {
    //         console.error('❌ Failed to test scavenge claim with unknown error');
    //     }
    // }
}

// Run tests
testRunner().catch((error: unknown) => {
    if (error instanceof Error) {
        console.error('Test runner failed:', error.message);
    } else {
        console.error('Test runner failed with unknown error');
    }
}); 