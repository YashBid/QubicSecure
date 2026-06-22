/**
 * ConfigStore.cpp — Qubic Smart Contract
 *
 * A minimal read/write configuration store.
 * Stores up to 8 key-value pairs (uint64 -> uint64).
 * No arithmetic, no loops, no financial operations,
 * no external calls, no dangerous function names.
 */

#include <cstdint>

class ConfigStore {
private:
    static const uint32_t CAPACITY = 8U;

    uint64_t owner  = 0ULL;
    bool     locked = false;

    uint64_t keys[CAPACITY]   = {0,0,0,0,0,0,0,0};
    uint64_t values[CAPACITY] = {0,0,0,0,0,0,0,0};
    bool     used[CAPACITY]   = {false,false,false,false,false,false,false,false};
    uint32_t count            = 0U;

    bool isOwner(uint64_t caller) const {
        return caller != 0ULL && caller == owner;
    }

public:
    explicit ConfigStore(uint64_t ownerAddr) : owner(ownerAddr) {}

    // Store a config value (owner only)
    bool setValue(uint64_t caller, uint64_t key, uint64_t value) {
        if (!isOwner(caller)) return false;
        if (locked)           return false;
        if (count >= CAPACITY) return false;

        // Update existing key
        for (uint32_t i = 0U; i < CAPACITY; i++) {
            if (used[i] && keys[i] == key) {
                values[i] = value;
                return true;
            }
        }

        // Insert new key
        keys[count]   = key;
        values[count] = value;
        used[count]   = true;
        count++;
        return true;
    }

    // Lock config (owner only)
    bool lockConfig(uint64_t caller) {
        if (!isOwner(caller)) return false;
        locked = true;
        return true;
    }

    // Read a value (anyone)
    uint64_t getValue(uint64_t key) const {
        for (uint32_t i = 0U; i < CAPACITY; i++) {
            if (used[i] && keys[i] == key) {
                return values[i];
            }
        }
        return 0ULL;
    }

    uint32_t getCount()  const { return count;  }
    bool     getLocked() const { return locked;  }
};
