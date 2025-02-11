export const KAMI_ABIS = {
    // World contract ABI
    world: [
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
    ],

    // Registry contract ABI
    registry: [
        {
            "type": "function",
            "name": "getEntitiesWithValue",
            "inputs": [
                {
                    "name": "value",
                    "type": "bytes",
                    "internalType": "bytes"
                }
            ],
            "outputs": [
                {
                    "name": "",
                    "type": "uint256[]",
                    "internalType": "uint256[]"
                }
            ],
            "stateMutability": "view"
        }
    ],

    // Getter system ABI
    getter: [
        {
            "type": "function",
            "name": "getKamiByIndex",
            "inputs": [
                {
                    "name": "index",
                    "type": "uint32"
                }
            ],
            "outputs": [
                {
                    "components": [
                        { "name": "id", "type": "uint256" },
                        { "name": "index", "type": "uint32" },
                        { "name": "name", "type": "string" },
                        { "name": "mediaURI", "type": "string" },
                        {
                            "name": "stats",
                            "components": [
                                {
                                    "name": "health", "type": "tuple", "components": [
                                        { "name": "base", "type": "int32" },
                                        { "name": "shift", "type": "int32" },
                                        { "name": "boost", "type": "int32" },
                                        { "name": "sync", "type": "int32" }
                                    ]
                                },
                                {
                                    "name": "power", "type": "tuple", "components": [
                                        { "name": "base", "type": "int32" },
                                        { "name": "shift", "type": "int32" },
                                        { "name": "boost", "type": "int32" },
                                        { "name": "sync", "type": "int32" }
                                    ]
                                },
                                {
                                    "name": "harmony", "type": "tuple", "components": [
                                        { "name": "base", "type": "int32" },
                                        { "name": "shift", "type": "int32" },
                                        { "name": "boost", "type": "int32" },
                                        { "name": "sync", "type": "int32" }
                                    ]
                                },
                                {
                                    "name": "violence", "type": "tuple", "components": [
                                        { "name": "base", "type": "int32" },
                                        { "name": "shift", "type": "int32" },
                                        { "name": "boost", "type": "int32" },
                                        { "name": "sync", "type": "int32" }
                                    ]
                                }
                            ],
                            "type": "tuple"
                        },
                        {
                            "name": "traits",
                            "components": [
                                { "name": "face", "type": "uint32" },
                                { "name": "hand", "type": "uint32" },
                                { "name": "body", "type": "uint32" },
                                { "name": "background", "type": "uint32" },
                                { "name": "color", "type": "uint32" }
                            ],
                            "type": "tuple"
                        },
                        { "name": "affinities", "type": "string[]" },
                        { "name": "account", "type": "uint256" },
                        { "name": "level", "type": "uint256" },
                        { "name": "xp", "type": "uint256" },
                        { "name": "room", "type": "uint32" },
                        { "name": "state", "type": "string" }
                    ],
                    "name": "",
                    "type": "tuple"
                }
            ],
            "stateMutability": "view"
        }
    ],

    // Move system ABI
    move: [
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
    ],

    // Harvest system ABI
    harvest: [
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
    ],

    // Feed/Use Item System ABI
    useItem: [
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
    ],

    // Item Purchase System ABI
    purchase: [
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
    ],

    // Harvest Stop System ABI
    harvestStop: [
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
    ],

    // Harvest Collect System ABI
    harvestCollect: [
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
    ],

    // Scavenge Claim System ABI
    scavengeClaim: [
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
    ]
};
