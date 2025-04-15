// utils/alkahest-integration.ts
import { makeClient } from "alkahest-ts";
import { createWalletClient, http, encodeAbiParameters, parseAbiParameters, decodeAbiParameters } from "viem";
import { privateKeyToAccount, nonceManager } from "viem/accounts";
import { baseSepolia } from "viem/chains";
import { contractAddresses } from "./contract-addresses";

// Configure client with wallet for interacting with Alkahest
export const getAlkahestClient = (privateKey: string, rpcUrl: string) => {
  return makeClient(
    createWalletClient({
      account: privateKeyToAccount(privateKey as `0x${string}`, {
        nonceManager, // automatic nonce management
      }),
      chain: baseSepolia,
      transport: http(rpcUrl),
    }),
  );
};

// Function to create storage proof agreement
export const createStorageProofAgreement = async (
  buyerClient: ReturnType<typeof getAlkahestClient>,
  sellerAddress: string, 
  tokenAddress: string, 
  paymentAmount: bigint,
  fileCid: string, 
  storageDuration: bigint,
  expirationTime: bigint = 0n
) => {
  // Step 1: Construct the storage demand
  // We encode the CID and duration as a custom demand format
  const baseStorageDemand = encodeAbiParameters(
    parseAbiParameters("(string cid, uint256 duration)"), 
    [{ cid: fileCid, duration: storageDuration }]
  );

  // Step 2: Create a trusted party demand to ensure only the specific storage provider can fulfill
  const storageDemand = buyerClient.arbiters.encodeTrustedPartyDemand({
    creator: sellerAddress,
    baseArbiter: contractAddresses["Base Sepolia"].trivialArbiter,
    baseDemand: baseStorageDemand,
  });

  // Step 3: Approve the escrow contract to spend tokens
  const escrowApproval = await buyerClient.erc20.approve(
    { address: tokenAddress, value: paymentAmount },
    contractAddresses["Base Sepolia"].erc20EscrowObligation,
  );
  
  // Wait for approval transaction to complete
  await buyerClient.viemClient.waitForTransactionReceipt({ hash: escrowApproval });
  
  // Step 4: Create the escrow for storage services
  const escrow = await buyerClient.erc20.buyWithErc20(
    { address: tokenAddress, value: paymentAmount },
    { arbiter: contractAddresses["Base Sepolia"].trustedPartyArbiter, demand: storageDemand },
    expirationTime,
  );
  
  return escrow;
};

// Function for storage provider to fulfill storage proof agreement
export const fulfillStorageProofAgreement = async (
  sellerClient: ReturnType<typeof getAlkahestClient>,
  escrowUid: string,
  proofOfStorageCid: string
) => {
  // Step 1: Get and decode the escrow statement
  const buyStatement = await sellerClient.getAttestation(escrowUid);
  const decodedStatement = sellerClient.erc20.decodeEscrowStatement(buyStatement.data);
  const decodedDemand = sellerClient.arbiters.decodeTrustedPartyDemand(decodedStatement.demand);
  
  // Step 2: Decode the base storage demand
  const decodedBaseDemand = decodeAbiParameters(
    parseAbiParameters("(string cid, uint256 duration)"),
    decodedDemand.baseDemand
  )[0];
  
  // Step 3: Create the storage proof result
  // This could include verification or actual proof data in a real implementation
  const storageProofResult = JSON.stringify({
    originalCid: decodedBaseDemand.cid,
    proofCid: proofOfStorageCid,
    timestamp: Date.now(),
    duration: decodedBaseDemand.duration.toString()
  });
  
  // Step 4: Create the result statement using JobResultObligation
  const resultHash = await sellerClient.viemClient.writeContract({
    address: contractAddresses["Base Sepolia"].jobResultObligation,
    abi: [
      {
        name: "makeStatement",
        type: "function",
        inputs: [
          { name: "data", type: "tuple", components: [{ name: "result", type: "string" }] },
          { name: "refUID", type: "bytes32" }
        ],
        outputs: [{ type: "bytes32" }],
        stateMutability: "nonpayable"
      }
    ],
    functionName: "makeStatement",
    args: [
      { result: storageProofResult },
      "0x0000000000000000000000000000000000000000000000000000000000000000"
    ],
  });
  
  const resultStatement = await sellerClient.getAttestationFromTxHash(resultHash);
  
  // Step 5: Collect payment for providing storage proof
  const collection = await sellerClient.erc20.collectPayment(
    escrowUid,
    resultStatement.uid
  );
  
  return {
    collection,
    resultUid: resultStatement.uid
  };
};

// Function for buyer to verify storage fulfillment
export const verifyStorageFulfillment = async (
  buyerClient: ReturnType<typeof getAlkahestClient>,
  escrowUid: string
) => {
  // Wait for the fulfillment of the escrow
  const fulfillment = await buyerClient.waitForFulfillment(
    contractAddresses["Base Sepolia"].erc20EscrowObligation,
    escrowUid
  );
  
  if (!fulfillment.fulfillment) {
    throw new Error("Storage proof not fulfilled");
  }
  
  // Get the attestation data
  const fulfillmentData = await buyerClient.getAttestation(fulfillment.fulfillment);
  
  // Decode the result
  const decodedResult = decodeAbiParameters(
    parseAbiParameters("(string result)"),
    fulfillmentData.data
  )[0];
  
  // Parse the JSON result
  const storageProof = JSON.parse(decodedResult.result);
  
  return {
    originalCid: storageProof.originalCid,
    proofCid: storageProof.proofCid,
    timestamp: storageProof.timestamp,
    duration: storageProof.duration
  };
};