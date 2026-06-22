/**
 * safe-low.cpp — Qubic Smart Contract (LOW RISK)
 *
 * This contract is mostly safe. It uses proper access control,
 * explicit overflow/underflow guards, and the Checks-Effects-Interactions
 * pattern. One low-severity flag remains: timestamp comparison for
 * time windows (acceptable when precision requirement is > 60 seconds).
 *
 * Expected audit result:
 *   Risk Level : Low
 *   Issues     : 1
 *   Critical   : 0
 *   High       : 0
 *   Medium     : 0
 *   Low        : 1  (Timestamp dependence — acceptable use)
 */

#include <cstdint>

class LowRiskContract {
private:
    uint64_t balance = 0;
    address  owner;
    uint64_t startTime = 0;
    uint64_t endTime   = 0;

    static const uint64_t MAX_AMOUNT = 1000000ULL;

public:
    explicit LowRiskContract(address _owner, uint64_t _start, uint64_t _end)
        : owner(_owner), startTime(_start), endTime(_end) {}

    // Safe: access control + underflow guard
    void withdraw(uint64_t amount) {
        if (msg.sender != owner)  revert("Not owner");
        if (amount > balance)     revert("Insufficient balance");
        if (amount > MAX_AMOUNT)  revert("Amount exceeds limit");

        balance -= amount;  // Safe: checked above
    }

    // Safe: Checks-Effects-Interactions strictly followed
    void transfer(address to, uint64_t amount) {
        if (msg.sender != owner) revert("Not owner");
        if (amount > balance)    revert("Insufficient balance");

        balance -= amount;   // 1. Effect first
        to.call(amount);     // 2. Interaction after state is settled
    }

    // Safe: overflow guard before addition
    void deposit(uint64_t amount) {
        if (amount > MAX_AMOUNT)           revert("Amount exceeds limit");
        if (balance + amount < balance)    revert("Overflow detected");

        balance += amount;
    }

    // LOW: Timestamp used for activity window — precision > 60s is acceptable
    bool isActive() {
        return block.timestamp >= startTime && block.timestamp <= endTime;
    }

    uint64_t getBalance() const { return balance; }
    address  getOwner()   const { return owner;   }
};
