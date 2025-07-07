import { SafeReceived, ExecutionSuccess } from "../generated/AgentSafe/Safe"
import { Transfer } from "../generated/USDC/ERC20"
import { Address, BigDecimal } from "@graphprotocol/graph-ts"
import {
  isFundingSource,
  FUNDING_TOKENS,
  getEthUsd,
  getUsdcUsd
} from "./common"
import { updateFunding } from "./helpers"

// Helper function to check if an address is our specific Safe
function isSafe(addr: Address): boolean {
  // Only return true for our specific Safe address
  return addr.toHexString().toLowerCase() === "0x4b00f1a232c28254223c8c177e997ab298e1e40a";
}

// — ETH deposits
export function handleSafeReceived(ev: SafeReceived): void {
  if (!isFundingSource(ev.params.sender, ev.block)) return
  const usd = ev.params.value
    .toBigDecimal()
    .times(getEthUsd(ev.block))
    .div(BigDecimal.fromString("1e18"))
  updateFunding(
    ev.address, 
    usd, 
    true, 
    ev.block.timestamp, 
    ev, 
    "ETH", 
    ev.params.sender, 
    ev.address
  )
}

// — ETH refunds
export function handleExecutionSuccess(ev: ExecutionSuccess): void {
  if (ev.params.payment.isZero()) return
  const to = ev.transaction.to as Address
  if (!isFundingSource(to, ev.block)) return
  const usd = ev.params.payment
    .toBigDecimal()
    .times(getEthUsd(ev.block))
    .div(BigDecimal.fromString("1e18"))
  updateFunding(
    to, 
    usd, 
    false, 
    ev.block.timestamp, 
    ev, 
    "ETH", 
    ev.address, 
    to
  )
}

// — USDC transfers
export function handleUSDC(ev: Transfer): void {
  // only process USDC
  let isUsdc = false
  for (let i = 0; i < FUNDING_TOKENS.length; i++) {
    if (FUNDING_TOKENS[i].equals(ev.address)) {
      isUsdc = true
      break
    }
  }
  if (!isUsdc) return

  const from = ev.params.from
  const to   = ev.params.to
  const usd  = ev.params.value.toBigDecimal()
                 .times(getUsdcUsd(ev.block))
                 .div(BigDecimal.fromString("1e6"))

  // deposit: whitelisted/EOA ➔ Safe
  if (isFundingSource(from, ev.block) && isSafe(to)) {
    updateFunding(
      to, 
      usd, 
      true, 
      ev.block.timestamp, 
      ev, 
      "USDC", 
      from, 
      to
    )
    return
  }

  // refund: Safe ➔ whitelisted/EOA
  if (isSafe(from) && isFundingSource(to, ev.block)) {
    updateFunding(
      from, 
      usd, 
      false, 
      ev.block.timestamp, 
      ev, 
      "USDC", 
      from, 
      to
    )
    return
  }
}
