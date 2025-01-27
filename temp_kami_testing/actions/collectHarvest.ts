import { ethers } from 'ethers';

const HarvestCollectSystemABI = [
    {
        "type": "function",
        "name": "executeTyped",
        "inputs": [
            {
                "name": "harvestID",
                "type": "uint256",
                "internalType": "uint256"
            }
        ],
        "outputs": [
            {
                "name": "",
                "type": "bytes",
                "internalType": "bytes"
            }
        ],
        "stateMutability": "nonpayable"
    }
];

export const collectHarvest = async (
    harvestID: string,
    signer: ethers.Signer,
    collectAddr: string
): Promise<ethers.ContractReceipt> => {
    const collectContract = new ethers.Contract(collectAddr, HarvestCollectSystemABI, signer);
    
    // Add 0x prefix if not present
    const formattedHarvestID = harvestID.startsWith('0x') ? harvestID : `0x${harvestID}`;
    
    const tx = await collectContract.executeTyped(formattedHarvestID);
    console.log('collect tx hash', tx.hash);
    return await tx.wait();
}; 