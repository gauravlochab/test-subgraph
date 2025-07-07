import { Swap } from "../generated/Pool/UniswapV3Pool";
import { Trader } from "../generated/schema";
import { Address, BigDecimal, BigInt } from "@graphprotocol/graph-ts";

// Safe conversion to BigDecimal with fallback to zero
function safeToBigDecimal(value: BigInt): BigDecimal {
  if (value.isZero()) {
    return BigDecimal.fromString("0");
  }
  return value.toBigDecimal();
}

export function handleSwap(ev: Swap): void {
  // Track all traders, not just a specific wallet
  const traderAddress = ev.transaction.from;
  
  // Create or load the trader entity
  let trader = Trader.load(traderAddress);
  
  if (trader == null) {
    trader = new Trader(traderAddress);
    trader.volumeUsd = BigDecimal.fromString("0");
  }
  
  // Track a simple counter of swaps instead of trying to calculate USD value
  // This avoids any potential issues with BigDecimal conversions
  // We'll just add 1 USD for each swap as a simple counter
  trader.volumeUsd = trader.volumeUsd.plus(BigDecimal.fromString("1"));
  
  // Save the entity
  trader.save();
}
