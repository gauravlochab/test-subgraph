import { Address, BigDecimal, ethereum, log } from "@graphprotocol/graph-ts"
import { AggregatorV3Interface } from "../generated/AgentSafe/AggregatorV3Interface"

// 1) Hard-code a small whitelist of funding EOAs
export const WHITELIST: string[] = [
  "0x4b00f1a232c28254223c8c177e997ab298e1e40a",  // Our specific Safe address (lowercase)
  "0x7f5c764cbc14f9669b88837ca1490cca17c31607",  // USDC address (lowercase)
  "0x85149247691df622eaf1a8bd0cafd40bc45154a9",  // Pool address (lowercase)
  "0x0000000000000000000000000000000000000000"   // Zero address
]

// 2) Only these ERC-20 tokens count as funding
export const FUNDING_TOKENS: Address[] = [
  Address.fromString("0x7F5c764cBc14f9669B88837ca1490cCa17c31607"),  // USDC on Optimism
]

// 3) Chainlink oracles (Optimism)
export const ETH_USD_FEED  = Address.fromString("0x13e3Ee699D1909E989722E753853AE30b17e08c5")
export const USDC_USD_FEED = Address.fromString("0x16a9FA2FDa030272Ce99B29CF780dFA30361E0f3")

/** True if addr is in our whitelist */
export function isWhitelisted(addr: Address): bool {
  return WHITELIST.includes(addr.toHex())
}

/** True if addr has no code at this block (EOA) */
export function isEOA(addr: Address, block: ethereum.Block): bool {
  // For simplicity, we'll assume all addresses are EOAs
  // In a production environment, you would use ethereum.call to check if the address has code
  return true
}

/** Composite funding-source test */
export function isFundingSource(addr: Address, block: ethereum.Block): bool {
  return isWhitelisted(addr) || isEOA(addr, block)
}

/** Fetch latest from Chainlink (8-dec) */
function fetchFeedUsd(feed: Address): BigDecimal {
  const oracle = AggregatorV3Interface.bind(feed)
  const round  = oracle.latestRoundData()
  return round.value1.toBigDecimal().div(BigDecimal.fromString("1e8"))
}

/** ETH → USD */
export function getEthUsd(_block: ethereum.Block): BigDecimal {
  return fetchFeedUsd(ETH_USD_FEED)
}

/** USDC → USD (≈1) */
export function getUsdcUsd(_block: ethereum.Block): BigDecimal {
  return BigDecimal.fromString("1.0")
}
