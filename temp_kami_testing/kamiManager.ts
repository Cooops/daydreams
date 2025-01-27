import { ethers } from 'ethers';
import { getKamiInfo as _getKamiInfo } from './actions/echoKamis.js';
import { reviveKami } from './actions/reviveKamis.js';
import { feedKami } from './actions/feedKami.js'
import { moveToRoom } from './actions/movePlayer.js';
import { startHarvesting } from './actions/harvestKamis.js';
import { stopHarvesting } from './actions/stopHarvestKamis.js';
import { collectHarvest } from './actions/collectHarvest.js';
import { purchaseItem } from './actions/purchaseItem.js';
import { claimScavenge } from './actions/claimScavenge.js';

// import from abi file cleanly soon
const WorldABI = [
    {
        "type": "function",
        "name": "systems",
        "inputs": [],
        "outputs": [
            {
                "name": "",
                "type": "address",
                "internalType": "contract IUint256Component"
            }
        ],
        "stateMutability": "view"
    }
];

const Uint256ComponentABI = [
    {
        "type": "function",
        "name": "getEntitiesWithValue",
        "inputs": [{ "name": "value", "type": "bytes", "internalType": "bytes" }],
        "outputs": [{ "name": "", "type": "uint256[]", "internalType": "uint256[]" }],
        "stateMutability": "view"
    }
];

interface KamiStats {
    health: {
        base: number;
        boost: number;
        sync: number;
    };
    power: {
        base: number;
        boost: number;
        sync: number;
    };
    harmony: {
        base: number;
        boost: number;
        sync: number;
    };
    violence: {
        base: number;
        boost: number;
        sync: number;
    };
}

interface KamiTraits {
    face: number;
    hand: number;
    body: number;
    background: number;
    color: number;
}

interface KamiInfo {
    id: string;
    index: number;
    name: string;
    mediaURI: string;
    stats: KamiStats;
    traits: KamiTraits;
    affinities: string[];
    account: string;
    level: string;
    xp: string;
    room: number;
    state: string;
}

interface HarvestInfo {
    startTime: number;
    lastCollectTime: number;
    rewards: number;
    status: number;
}

export class KamiManager {
    private provider: ethers.providers.JsonRpcProvider;
    private signer: ethers.Wallet;
    private worldAddr: string;
    private systemAddresses: { [key: string]: string } = {};

    private readonly SYSTEM_IDS = {
        GETTER: "system.getter",
        MOVE: "system.account.move",
        USE_ITEM: "system.kami.use.item",
        HARVEST_START: "system.harvest.start",
        HARVEST_STOP: "system.harvest.stop",
        HARVEST_COLLECT: "system.harvest.collect",
        ITEM_PURCHASE: "system.item.purchase",
        SCAVENGE_CLAIM: "system.scavenge.claim",
    };

    constructor(
        providerUrl: string = "https://json-rpc.preyominet.initia.tech/",
        privateKey: string = "0x_your_kami_private_key_here",
        worldAddr: string = "0x89090F774BeC95420f6359003149f51fec207133"
    ) {
        this.provider = new ethers.providers.JsonRpcProvider(providerUrl);
        this.signer = new ethers.Wallet(privateKey, this.provider);
        this.worldAddr = worldAddr;
    }

    async getAddrByID(registryAddr: string, id: string): Promise<string> {
        const registry = new ethers.Contract(registryAddr, Uint256ComponentABI, this.signer);
        try {
            const values = await registry.getEntitiesWithValue(ethers.utils.arrayify(id));
            return values.length > 0
                ? ethers.utils.getAddress(values[0].toHexString())
                : ethers.constants.AddressZero;
        } catch (error) {
            console.error("Error fetching values:", error);
            return ethers.constants.AddressZero;
        }
    };

    async getSystemAddress(systemId: string): Promise<string> {
        if (!this.systemAddresses[systemId]) {
            const world = new ethers.Contract(this.worldAddr, WorldABI, this.signer);
            const systemRegistryAddr = await world.systems();
            const id = ethers.utils.solidityKeccak256(["string"], [systemId]);
            this.systemAddresses[systemId] = await this.getAddrByID(systemRegistryAddr, id);
        }
        return this.systemAddresses[systemId];
    }

    async getKamiInfo(kamiIndex: number): Promise<KamiInfo> {
        const getterAddr = await this.getSystemAddress(this.SYSTEM_IDS.GETTER);
        return await _getKamiInfo(kamiIndex, this.signer, getterAddr) as KamiInfo;
    }

    async moveToRoom(roomIndex: number): Promise<ethers.ContractReceipt> {
        const moveAddr = await this.getSystemAddress(this.SYSTEM_IDS.MOVE);
        return await moveToRoom(roomIndex, this.signer, moveAddr);
    }

    async reviveKami(kamiIndex: number): Promise<ethers.ContractReceipt> {
        const useItemAddr = await this.getSystemAddress(this.SYSTEM_IDS.USE_ITEM);
        const kamiInfo = await this.getKamiInfo(kamiIndex);
        return await reviveKami(kamiInfo.id, this.signer, useItemAddr);
    }

    async feedKami(kamiIndex: number, foodIndex: number): Promise<ethers.ContractReceipt> {
        const useItemAddr = await this.getSystemAddress(this.SYSTEM_IDS.USE_ITEM);
        const kamiInfo = await this.getKamiInfo(kamiIndex);
        return await feedKami(kamiInfo.id, foodIndex, this.signer, useItemAddr);
    }

    async getCurrentRoom(kamiIndex: number): Promise<number> {
        const kamiInfo = await this.getKamiInfo(kamiIndex);
        // get the room from the kamiInfo (hack until we can read more data on chain)
        return kamiInfo.room;
    }

    async startHarvesting(kamiID: string, nodeID: string): Promise<ethers.ContractReceipt> {
        const harvestAddr = await this.getSystemAddress(this.SYSTEM_IDS.HARVEST_START);
        return await startHarvesting(kamiID, nodeID, this.signer, harvestAddr);
    }

    async stopHarvesting(kamiID: string): Promise<ethers.ContractReceipt> {
        const harvestAddr = await this.getSystemAddress(this.SYSTEM_IDS.HARVEST_STOP);
        return await stopHarvesting(kamiID, this.signer, harvestAddr);
    }

    async collectHarvest(harvestID: string): Promise<ethers.ContractReceipt> {
        const collectAddr = await this.getSystemAddress(this.SYSTEM_IDS.HARVEST_COLLECT);
        return await collectHarvest(harvestID, this.signer, collectAddr);
    }

    async purchaseItem(itemIndex: number, amount: number = 1): Promise<ethers.ContractReceipt> {
        const purchaseAddr = await this.getSystemAddress(this.SYSTEM_IDS.ITEM_PURCHASE);
        return await purchaseItem(itemIndex, amount, this.signer, purchaseAddr);
    }

    async claimScavenge(scavBarID: string): Promise<ethers.ContractReceipt> {
        const claimAddr = await this.getSystemAddress(this.SYSTEM_IDS.SCAVENGE_CLAIM);
        return await claimScavenge(scavBarID, this.signer, claimAddr);
    }
}
