import { ethers } from 'ethers';

const KamiUseItemSystemABI = [
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
                "name": "itemIndex",
                "type": "uint32",
                "internalType": "uint32"
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

export const reviveKami = async (
    kamiID: string, 
    signer: ethers.Signer,
    useItemAddr: string
): Promise<ethers.ContractReceipt> => {
    try {
        const kamiUseItemContract = new ethers.Contract(useItemAddr, KamiUseItemSystemABI, signer);
        const redGakkiRibbonIndex = 11001;
        
        const tx = await kamiUseItemContract.executeTyped(kamiID, redGakkiRibbonIndex);
        return await tx.wait();
    } catch (error) {
        console.error("Error reviving Kami:", error);
        throw error;
    }
};
