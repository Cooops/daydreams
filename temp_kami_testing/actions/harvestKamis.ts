import { ethers } from 'ethers';

const HarvestSystemABI = [
    {
        "type": "function",
        "name": "executeTyped",
        "inputs": [
            {
                "name": "kamiID",
                "type": "uint256",
                "internalType": "uint256"
            },
            {
                "name": "nodeID",
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

export const startHarvesting = async (
    kamiID: string,
    nodeID: string,
    signer: ethers.Signer,
    harvestAddr: string
): Promise<ethers.ContractReceipt> => {
    const harvestContract = new ethers.Contract(harvestAddr, HarvestSystemABI, signer);
    
    // Add 0x prefix if not present
    const formattedKamiID = kamiID.startsWith('0x') ? kamiID : `0x${kamiID}`;
    const formattedNodeID = nodeID.startsWith('0x') ? nodeID : `0x${nodeID}`;
    
    console.log('kami/node id', formattedKamiID, formattedNodeID);
    const tx = await harvestContract.executeTyped(formattedKamiID, formattedNodeID);
    console.log('tx hash', tx.hash);
    return await tx.wait();
}; 