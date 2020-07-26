export const setTokenABI = [
  {
    inputs: [
      {
        internalType: "address[]",
        name: "_components",
        type: "address[]"
      },
      {
        internalType: "int256[]",
        name: "_units",
        type: "int256[]"
      },
      {
        internalType: "address[]",
        name: "_modules",
        type: "address[]"
      },
      {
        internalType: "contract IController",
        name: "_controller",
        type: "address"
      },
      {
        internalType: "address",
        name: "_manager",
        type: "address"
      },
      {
        internalType: "string",
        name: "_name",
        type: "string"
      },
      {
        internalType: "string",
        name: "_symbol",
        type: "string"
      }
    ],
    stateMutability: "nonpayable",
    type: "constructor"
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "owner",
        type: "address"
      },
      {
        indexed: true,
        internalType: "address",
        name: "spender",
        type: "address"
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "value",
        type: "uint256"
      }
    ],
    name: "Approval",
    type: "event"
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "_target",
        type: "address"
      },
      {
        indexed: true,
        internalType: "uint256",
        name: "_value",
        type: "uint256"
      },
      {
        indexed: false,
        internalType: "bytes",
        name: "_data",
        type: "bytes"
      }
    ],
    name: "Invoked",
    type: "event"
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "_locker",
        type: "address"
      },
      {
        indexed: false,
        internalType: "bool",
        name: "_isLocked",
        type: "bool"
      }
    ],
    name: "LockChanged",
    type: "event"
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "address",
        name: "_oldManager",
        type: "address"
      },
      {
        indexed: false,
        internalType: "address",
        name: "_newManager",
        type: "address"
      }
    ],
    name: "ManagerChanged",
    type: "event"
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "_module",
        type: "address"
      },
      {
        indexed: false,
        internalType: "uint8",
        name: "_moduleState",
        type: "uint8"
      }
    ],
    name: "ModuleStateChanged",
    type: "event"
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "from",
        type: "address"
      },
      {
        indexed: true,
        internalType: "address",
        name: "to",
        type: "address"
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "value",
        type: "uint256"
      }
    ],
    name: "Transfer",
    type: "event"
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "_module",
        type: "address"
      }
    ],
    name: "addModule",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "owner",
        type: "address"
      },
      {
        internalType: "address",
        name: "spender",
        type: "address"
      }
    ],
    name: "allowance",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256"
      }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "spender",
        type: "address"
      },
      {
        internalType: "uint256",
        name: "amount",
        type: "uint256"
      }
    ],
    name: "approve",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool"
      }
    ],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "account",
        type: "address"
      }
    ],
    name: "balanceOf",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256"
      }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [
      {
        internalType: "uint256[]",
        name: "_indices",
        type: "uint256[]"
      },
      {
        components: [
          {
            internalType: "address",
            name: "component",
            type: "address"
          },
          {
            internalType: "address",
            name: "module",
            type: "address"
          },
          {
            internalType: "int256",
            name: "unit",
            type: "int256"
          },
          {
            internalType: "uint8",
            name: "positionState",
            type: "uint8"
          },
          {
            internalType: "bytes",
            name: "data",
            type: "bytes"
          }
        ],
        internalType: "struct ISetToken.Position[]",
        name: "_positions",
        type: "tuple[]"
      }
    ],
    name: "batchEditPositions",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "_account",
        type: "address"
      },
      {
        internalType: "uint256",
        name: "_quantity",
        type: "uint256"
      }
    ],
    name: "burn",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [],
    name: "controller",
    outputs: [
      {
        internalType: "contract IController",
        name: "",
        type: "address"
      }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "decimals",
    outputs: [
      {
        internalType: "uint8",
        name: "",
        type: "uint8"
      }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "spender",
        type: "address"
      },
      {
        internalType: "uint256",
        name: "subtractedValue",
        type: "uint256"
      }
    ],
    name: "decreaseAllowance",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool"
      }
    ],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "_index",
        type: "uint256"
      },
      {
        components: [
          {
            internalType: "address",
            name: "component",
            type: "address"
          },
          {
            internalType: "address",
            name: "module",
            type: "address"
          },
          {
            internalType: "int256",
            name: "unit",
            type: "int256"
          },
          {
            internalType: "uint8",
            name: "positionState",
            type: "uint8"
          },
          {
            internalType: "bytes",
            name: "data",
            type: "bytes"
          }
        ],
        internalType: "struct ISetToken.Position",
        name: "_position",
        type: "tuple"
      }
    ],
    name: "editPosition",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [],
    name: "getModules",
    outputs: [
      {
        internalType: "address[]",
        name: "",
        type: "address[]"
      }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "getPositions",
    outputs: [
      {
        components: [
          {
            internalType: "address",
            name: "component",
            type: "address"
          },
          {
            internalType: "address",
            name: "module",
            type: "address"
          },
          {
            internalType: "int256",
            name: "unit",
            type: "int256"
          },
          {
            internalType: "uint8",
            name: "positionState",
            type: "uint8"
          },
          {
            internalType: "bytes",
            name: "data",
            type: "bytes"
          }
        ],
        internalType: "struct ISetToken.Position[]",
        name: "",
        type: "tuple[]"
      }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "spender",
        type: "address"
      },
      {
        internalType: "uint256",
        name: "addedValue",
        type: "uint256"
      }
    ],
    name: "increaseAllowance",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool"
      }
    ],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [],
    name: "initializeModule",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "_target",
        type: "address"
      },
      {
        internalType: "uint256",
        name: "_value",
        type: "uint256"
      },
      {
        internalType: "bytes",
        name: "_data",
        type: "bytes"
      }
    ],
    name: "invoke",
    outputs: [
      {
        internalType: "bytes",
        name: "_returnValue",
        type: "bytes"
      }
    ],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [],
    name: "isLocked",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool"
      }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "_module",
        type: "address"
      }
    ],
    name: "isModule",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool"
      }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "_module",
        type: "address"
      }
    ],
    name: "isPendingModule",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool"
      }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "lock",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [],
    name: "locker",
    outputs: [
      {
        internalType: "address",
        name: "",
        type: "address"
      }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "manager",
    outputs: [
      {
        internalType: "address",
        name: "",
        type: "address"
      }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "_account",
        type: "address"
      },
      {
        internalType: "uint256",
        name: "_quantity",
        type: "uint256"
      }
    ],
    name: "mint",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "",
        type: "address"
      }
    ],
    name: "moduleStates",
    outputs: [
      {
        internalType: "enum SetToken.ModuleState",
        name: "",
        type: "uint8"
      }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256"
      }
    ],
    name: "modules",
    outputs: [
      {
        internalType: "address",
        name: "",
        type: "address"
      }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "name",
    outputs: [
      {
        internalType: "string",
        name: "",
        type: "string"
      }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "popPosition",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256"
      }
    ],
    name: "positions",
    outputs: [
      {
        internalType: "address",
        name: "component",
        type: "address"
      },
      {
        internalType: "address",
        name: "module",
        type: "address"
      },
      {
        internalType: "int256",
        name: "unit",
        type: "int256"
      },
      {
        internalType: "uint8",
        name: "positionState",
        type: "uint8"
      },
      {
        internalType: "bytes",
        name: "data",
        type: "bytes"
      }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [
      {
        components: [
          {
            internalType: "address",
            name: "component",
            type: "address"
          },
          {
            internalType: "address",
            name: "module",
            type: "address"
          },
          {
            internalType: "int256",
            name: "unit",
            type: "int256"
          },
          {
            internalType: "uint8",
            name: "positionState",
            type: "uint8"
          },
          {
            internalType: "bytes",
            name: "data",
            type: "bytes"
          }
        ],
        internalType: "struct ISetToken.Position",
        name: "_position",
        type: "tuple"
      }
    ],
    name: "pushPosition",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "_manager",
        type: "address"
      }
    ],
    name: "setManager",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [
      {
        components: [
          {
            internalType: "address",
            name: "component",
            type: "address"
          },
          {
            internalType: "address",
            name: "module",
            type: "address"
          },
          {
            internalType: "int256",
            name: "unit",
            type: "int256"
          },
          {
            internalType: "uint8",
            name: "positionState",
            type: "uint8"
          },
          {
            internalType: "bytes",
            name: "data",
            type: "bytes"
          }
        ],
        internalType: "struct ISetToken.Position[]",
        name: "_positions",
        type: "tuple[]"
      }
    ],
    name: "setPositions",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [],
    name: "symbol",
    outputs: [
      {
        internalType: "string",
        name: "",
        type: "string"
      }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "totalSupply",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256"
      }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "recipient",
        type: "address"
      },
      {
        internalType: "uint256",
        name: "amount",
        type: "uint256"
      }
    ],
    name: "transfer",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool"
      }
    ],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "sender",
        type: "address"
      },
      {
        internalType: "address",
        name: "recipient",
        type: "address"
      },
      {
        internalType: "uint256",
        name: "amount",
        type: "uint256"
      }
    ],
    name: "transferFrom",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool"
      }
    ],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [],
    name: "unlock",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    stateMutability: "payable",
    type: "receive"
  }
];