/**
 * vulnerable-medium.cpp — Qubic Smart Contract (MEDIUM RISK DEMO)
 *
 * ⚠️  FOR TESTING ONLY — Review and fix before deploying ⚠️
 *
 * This contract has basic access control in place but retains
 * arithmetic and MEV-related vulnerabilities.
 *
 * Expected audit result:
 *   Risk Level : High
 *   Issues     : 5–6
 *   Critical   : 0
 *   High       : 2   (Integer overflow/underflow)
 *   Medium     : 3   (Unchecked call, Front-running, Unbounded loop)
 *   Low        : 1   (Timestamp dependence)
 */

#include <cstdint>

class MediumRiskContract {
private:
    uint64_t balance;
    uint64_t price;
    address  owner;
    bool     locked;

public:
    // Access control present, but arithmetic is still unsafe
    void withdraw(uint64_t amount) {
        if (msg.sender != owner) return;
        balance = balance - amount;  // HIGH: Integer underflow — no pre-check
    }

    // MEDIUM: Return value of external call is not checked
    void sendFunds(address to, uint64_t amount) {
        if (msg.sender != owner) return;
        to.call(amount);             // Unchecked — silent failure possible
    }

    // MEDIUM: Front-running — no slippage or deadline parameter
    void swap(uint64_t amountIn) {
        uint64_t amountOut = amountIn * price;
        balance = balance + amountIn;  // HIGH: Integer overflow
    }

    // MEDIUM: Unbounded loop — will become uncallable as array grows
    void batchProcess(uint64_t[] ids) {
        for (uint i = 0; i < ids.length; i++) {
            process(ids[i]);
        }
    }

    // LOW: Timestamp dependence for deadline check
    bool checkDeadline() {
        return block.timestamp < deadline;
    }

    uint64_t getBalance() const {
        return balance;
    }
};
