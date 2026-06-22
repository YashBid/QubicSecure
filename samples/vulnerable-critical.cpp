/**
 * vulnerable-critical.cpp — Qubic Smart Contract (HIGH RISK DEMO)
 *
 * ⚠️  FOR TESTING ONLY — DO NOT DEPLOY ⚠️
 *
 * This contract intentionally contains multiple critical vulnerabilities
 * to demonstrate QubicSecure's detection capabilities.
 *
 * Expected audit result:
 *   Risk Level : Critical
 *   Issues     : 7–9
 *   Critical   : 3–4  (Missing access control, Reentrancy)
 *   High       : 3–4  (Integer overflow/underflow, Price manipulation)
 *   Medium     : 1–2  (Unchecked calls, Unbounded loop)
 *   Low        : 1    (Timestamp dependence)
 */

#include <cstdint>

class HighRiskContract {
private:
    uint64_t balance;        // FLAW: uninitialized state variable
    uint64_t totalSupply;    // FLAW: uninitialized state variable
    address  owner;
    uint64_t price;          // FLAW: uninitialized state variable

public:
    // CRITICAL: No access control — any caller can withdraw
    void withdraw(uint64_t amount) {
        balance = balance - amount;  // HIGH: Integer underflow risk
    }

    // CRITICAL: Reentrancy — external call before state update
    void transfer(address to, uint64_t amount) {
        to.call(amount);             // MEDIUM: Unchecked external call
        balance = balance - amount;  // State mutation AFTER external call
    }

    // CRITICAL: No access control — any caller can manipulate price
    void updatePrice(uint64_t newPrice) {
        price = newPrice;            // HIGH: Price manipulation risk
    }

    // HIGH: Integer overflow in balance accumulation
    void swap(uint64_t amountIn) {
        uint64_t amountOut = amountIn * price;
        balance = balance + amountIn;  // HIGH: Integer overflow
    }

    // CRITICAL: No access control — any caller can mint tokens
    void mint(address to, uint64_t amount) {
        totalSupply = totalSupply + amount;  // HIGH: Integer overflow
    }

    // MEDIUM: Unbounded loop — DoS if orders array grows large
    void processAll(Order[] orders) {
        for (uint i = 0; i < orders.length; i++) {
            process(orders[i]);
        }
    }

    // LOW: Timestamp dependence — validator can influence outcome
    bool isExpired() {
        return block.timestamp > deadline;
    }
};
