import { ethers } from 'ethers';

const ScavengeClaimSystemABI = [
    {
        "type": "function",
        "name": "executeTyped",
        "inputs": [
            {
                "name": "scavBarID",
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

export const claimScavenge = async (
    scavBarID: string,
    signer: ethers.Signer, 
    claimAddr: string
): Promise<ethers.ContractReceipt> => {
    try {
        const claimContract = new ethers.Contract(claimAddr, ScavengeClaimSystemABI, signer);
        const tx = await claimContract.executeTyped(scavBarID);
        console.log('claim tx hash', tx.hash);
        return await tx.wait();
    } catch (error) {
        // Check for specific error messages
        if (error instanceof Error) {
            if (error.message.toLowerCase().includes('no rolls') || 
                error.message.toLowerCase().includes('already claimed')) {
                console.log('⚠️ No scavenge rolls available - node may be out of sync if showing unclaimed rolls');
                throw new Error('No unclaimed scavenge rolls available');
            }
        }
        console.error("Error claiming scavenge:", error);
        throw error;
    }
}; 