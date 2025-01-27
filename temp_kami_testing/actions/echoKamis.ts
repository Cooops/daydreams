import { ethers } from 'ethers';

// Contract ABIs

const GetterSystemABI = [
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
              { "name": "health", "type": "tuple", "components": [
                { "name": "base", "type": "int32" },
                { "name": "shift", "type": "int32" },
                { "name": "boost", "type": "int32" },
                { "name": "sync", "type": "int32" }
              ]},
              { "name": "power", "type": "tuple", "components": [
                { "name": "base", "type": "int32" },
                { "name": "shift", "type": "int32" },
                { "name": "boost", "type": "int32" },
                { "name": "sync", "type": "int32" }
              ]},
              { "name": "harmony", "type": "tuple", "components": [
                { "name": "base", "type": "int32" },
                { "name": "shift", "type": "int32" },
                { "name": "boost", "type": "int32" },
                { "name": "sync", "type": "int32" }
              ]},
              { "name": "violence", "type": "tuple", "components": [
                { "name": "base", "type": "int32" },
                { "name": "shift", "type": "int32" },
                { "name": "boost", "type": "int32" },
                { "name": "sync", "type": "int32" }
              ]}
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
];

export const getKamiInfo = async (kamiIndex: number, signer: ethers.Signer, getterAddr: string) => {
    const getterContract = new ethers.Contract(getterAddr, GetterSystemABI, signer);
    const kamiInfo = await getterContract.getKamiByIndex(kamiIndex);
    
    // Create a clean JSON structure
    return {
        id: kamiInfo.id.toString(),
        index: kamiInfo.index,
        name: kamiInfo.name,
        mediaURI: kamiInfo.mediaURI,
        stats: {
            health: {
                base: kamiInfo.stats.health.base,
                shift: kamiInfo.stats.health.shift,
                boost: kamiInfo.stats.health.boost,
                sync: kamiInfo.stats.health.sync
            },
            power: {
                base: kamiInfo.stats.power.base,
                shift: kamiInfo.stats.power.shift,
                boost: kamiInfo.stats.power.boost,
                sync: kamiInfo.stats.power.sync
            },
            harmony: {
                base: kamiInfo.stats.harmony.base,
                shift: kamiInfo.stats.harmony.shift,
                boost: kamiInfo.stats.harmony.boost,
                sync: kamiInfo.stats.harmony.sync
            },
            violence: {
                base: kamiInfo.stats.violence.base,
                shift: kamiInfo.stats.violence.shift,
                boost: kamiInfo.stats.violence.boost,
                sync: kamiInfo.stats.violence.sync
            }
        },
        traits: {
            face: kamiInfo.traits.face,
            hand: kamiInfo.traits.hand,
            body: kamiInfo.traits.body,
            background: kamiInfo.traits.background,
            color: kamiInfo.traits.color
        },
        affinities: kamiInfo.affinities,
        account: kamiInfo.account.toString(),
        level: kamiInfo.level.toString(),
        xp: kamiInfo.xp.toString(),
        room: kamiInfo.room,
        state: kamiInfo.state
    };
};