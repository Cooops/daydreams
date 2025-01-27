import { KamiManager } from "../kamiManager.js";

// We can already implement this strategy:
export async function simpleHarvestStrategy(
    manager: KamiManager,
    kamiIndex: number,
    startHarvestID: string,     // ID used to start harvesting
    harvestStateID: string,     // ID used for collecting/stopping harvest
    nodeID: string,             // Resource node ID
    // harvestDuration: number, // in milliseconds
    options: {
        collectInterval: number, // milliseconds between collections
        maxCycles: number,
        cooldownWait: number, // milliseconds to wait after cooldown error
        initialCooldown: number // milliseconds to wait after placing
    }
) {
    let cycles = 0;
    let didStartHarvest = false;
    let stopAttempts = 0; // Moved outside try block
    
    try {
        // Initial state check
        const initialState = await manager.getKamiInfo(kamiIndex);
        console.log(`Initial kami state: ${initialState.state}`);
        
        // Start harvesting if not already harvesting
        if (initialState.state === "RESTING") {
            console.log('Starting new harvest session...');
            await manager.startHarvesting(startHarvestID, nodeID);
            didStartHarvest = true;
            
            // Wait for initial cooldown after placing
            console.log(`Waiting ${options.initialCooldown}ms for initial cooldown...`);
            await new Promise(r => setTimeout(r, options.initialCooldown));
            
        } else if (initialState.state === "HARVESTING") {
            console.log('Joining existing harvest session...');
        } else {
            console.log(`Cannot start strategy - kami in ${initialState.state} state`);
            return;
        }

        // Main collection loop
        while (cycles < options.maxCycles) {
            console.log(`Starting collection cycle ${cycles + 1}/${options.maxCycles}`);
            
            try {
                await manager.collectHarvest(harvestStateID);
                console.log('Successfully collected rewards');
                cycles++;
            } catch (error) {
                if (error instanceof Error) {
                    const errorMsg = error.message.toLowerCase();
                    if (errorMsg.includes('cooldown')) {
                        console.log(`Collection failed - kami on cooldown, waiting ${options.cooldownWait}ms...`);
                        await new Promise(r => setTimeout(r, options.cooldownWait));
                        // Don't increment cycles, we'll retry this one
                        continue;
                    } else {
                        console.log(`Collection attempt failed with error: ${error.message}`);
                        // Still increment cycles to move on
                        cycles++;
                    }
                }
            }
            
            if (cycles < options.maxCycles) {
                console.log(`Waiting ${options.collectInterval}ms until next collection...`);
                await new Promise(r => setTimeout(r, options.collectInterval));
            }
        }

        // Stop harvesting at the end
        // console.log('Strategy complete - stopping harvest');
        stopAttempts = 1;
        
        while (true) { // Keep trying until success
            try {
                await manager.stopHarvesting(harvestStateID);
                console.log('Successfully stopped harvesting');
                break;
            } catch (error) {
                if (error instanceof Error && error.message.toLowerCase().includes('cooldown')) {
                    console.log(`Stop attempt ${stopAttempts} failed - kami on cooldown, waiting ${options.cooldownWait}ms...`);
                    await new Promise(r => setTimeout(r, options.cooldownWait));
                    stopAttempts++;
                } else {
                    console.error('Failed to stop harvest with unexpected error:', error instanceof Error ? error.message : 'Unknown error');
                    throw error; // Re-throw unexpected errors
                }
            }
        }
    } catch (error: unknown) {
        if (error instanceof Error) {
            console.error('Strategy error:', error.message);
        } else {
            console.error('Unknown strategy error');
        }
    }
    
    const stopMsg = stopAttempts > 0 ? ` (took ${stopAttempts} attempts to stop)` : '';
    console.log(`Strategy completed ${cycles} collection cycles${stopMsg}`);
}
