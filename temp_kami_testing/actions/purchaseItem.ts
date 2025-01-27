import { ethers } from 'ethers';

const ItemPurchaseSystemABI = [
    {
        "type": "function",
        "name": "executeTyped",
        "inputs": [
            {
                "name": "numTypes",
                "type": "uint256",
                "internalType": "uint256"
            },
            {
                "name": "itemTypes",
                "type": "uint256[]",
                "internalType": "uint256[]"
            },
            {
                "name": "amounts",
                "type": "uint256[]",
                "internalType": "uint256[]"
            },
            {
                "name": "numItems",
                "type": "uint256",
                "internalType": "uint256"
            }
        ],
        "outputs": [],
        "stateMutability": "nonpayable"
    }
];

export const purchaseItem = async (
    itemIndex: number,
    amount: number,
    signer: ethers.Signer,
    purchaseAddr: string
): Promise<ethers.ContractReceipt> => {
    try {
        const purchaseContract = new ethers.Contract(purchaseAddr, ItemPurchaseSystemABI, signer);

        // Convert decimal to hex and pad to 64 characters (32 bytes)
        const hex = itemIndex.toString(16);
        const paddedHex = hex.padStart(64, '0');  // "000...2af9"

        // Format parameters to match working transaction
        const numTypes = 1;
        const itemTypes = [paddedHex.toString()];
        const amounts = [amount];
        const numItems = 1;

        console.log(
            numTypes,
            itemTypes,
            amounts,
            numItems
        )

        const tx = await purchaseContract.executeTyped(
            numTypes,
            itemTypes,
            amounts,
            numItems
        );
        console.log('purchase tx hash', tx.hash);
        return await tx.wait();
    } catch (error) {
        console.error("Error purchasing item:", error);
        throw error;
    }
};