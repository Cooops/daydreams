import { ethers } from 'ethers';

const MoveSystemABI = [
    {
        "type": "function",
        "name": "executeTyped",
        "inputs": [
            {
                "name": "toIndex",
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

export const moveToRoom = async (
    roomIndex: number,
    signer: ethers.Signer,
    moveAddr: string
): Promise<ethers.ContractReceipt> => {
    const moveContract = new ethers.Contract(moveAddr, MoveSystemABI, signer);
    const tx = await moveContract.executeTyped(roomIndex);
    return await tx.wait();
}; 