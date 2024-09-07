#!/bin/bash

NETWORK="${NETWORK:-localhost}"

npx hardhat test --network "$NETWORK"



