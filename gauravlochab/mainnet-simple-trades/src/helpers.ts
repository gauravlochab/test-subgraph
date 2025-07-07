import { BigDecimal, BigInt, Bytes, ethereum } from "@graphprotocol/graph-ts"
import { Agent, FundingBalance } from "../generated/schema"

// Constants
const ZERO_BI = BigInt.fromI32(0)
const ZERO_BD = BigDecimal.fromString("0")

// Helper function to load or create Agent
export function loadOrCreateAgent(id: Bytes, block: BigInt): Agent {
  let agent = Agent.load(id)
  
  if (agent == null) {
    agent = new Agent(id)
    agent.createdBlock = block
    agent.save()
  }
  
  return agent
}

// Helper function to load or create FundingBalance
export function loadOrCreateFundingBalance(id: Bytes, block: BigInt): FundingBalance {
  let fundingBalance = FundingBalance.load(id)
  
  if (fundingBalance == null) {
    // Create agent first
    const agent = loadOrCreateAgent(id, block)
    
    // Create funding balance
    fundingBalance = new FundingBalance(id)
    // Set agent reference
    fundingBalance.agent = agent.id
    fundingBalance.totalInUsd = ZERO_BD
    fundingBalance.totalOutUsd = ZERO_BD
    fundingBalance.netUsd = ZERO_BD
    fundingBalance.firstInTimestamp = ZERO_BI
    fundingBalance.lastChangeTs = ZERO_BI
    fundingBalance.save()
  }
  
  return fundingBalance
}

// Helper function to update funding balance
export function updateFunding(
  safeAddress: Bytes,
  amountUsd: BigDecimal,
  isIncoming: boolean,
  timestamp: BigInt,
  event: ethereum.Event,
  source: string,
  fromAddress: Bytes | null = null,
  toAddress: Bytes | null = null
): void {
  // Load or create FundingBalance
  const fundingBalance = loadOrCreateFundingBalance(safeAddress, event.block.number)
  
  // Update funding balance based on direction
  if (isIncoming) {
    fundingBalance.totalInUsd = fundingBalance.totalInUsd.plus(amountUsd)
  } else {
    fundingBalance.totalOutUsd = fundingBalance.totalOutUsd.plus(amountUsd)
  }
  
  // Update net USD
  fundingBalance.netUsd = fundingBalance.totalInUsd.minus(fundingBalance.totalOutUsd)
  
  // Update timestamps
  fundingBalance.lastChangeTs = timestamp
  
  // Set firstInTimestamp if this is the first transaction
  if (fundingBalance.firstInTimestamp.equals(ZERO_BI)) {
    fundingBalance.firstInTimestamp = timestamp
  }
  
  fundingBalance.save()
  
  // Note: FundingTransaction creation is commented out until graph codegen is run
  // After running graph codegen, uncomment the following code:
  /*
  // Create a FundingTransaction entity
  const transaction = new FundingTransaction(event.transaction.hash)
  transaction.fundingBalance = safeAddress
  transaction.timestamp = timestamp
  transaction.blockNumber = event.block.number
  transaction.isIncoming = isIncoming
  transaction.amountUsd = amountUsd
  transaction.runningBalanceUsd = fundingBalance.netUsd
  transaction.source = source
  
  if (fromAddress) {
    transaction.fromAddress = fromAddress
  }
  
  if (toAddress) {
    transaction.toAddress = toAddress
  }
  
  transaction.save()
  */
}
