import { describe, it, expect, beforeEach } from "vitest";

interface MockResult {
  value?: unknown;
  error?: number;
}

interface MockContract {
  admin: string;
  paused: boolean;
  totalSupply: bigint;
  balances: Map<string, bigint>;
  stakedBalances: Map<string, bigint>;
  allowances: Map<string, bigint>; // Key as `${owner}:${spender}`
  MAX_SUPPLY: bigint;

  isAdmin(caller: string): boolean;
  validateAddress(addr: string): MockResult | undefined;
  validateAmount(amount: bigint): MockResult | undefined;
  setPaused(caller: string, pause: boolean): MockResult;
  transferAdmin(caller: string, newAdmin: string): MockResult;
  mint(caller: string, recipient: string, amount: bigint): MockResult;
  burn(caller: string, amount: bigint): MockResult;
  transfer(caller: string, recipient: string, amount: bigint): MockResult;
  approve(caller: string, spender: string, amount: bigint): MockResult;
  transferFrom(caller: string, owner: string, recipient: string, amount: bigint): MockResult;
  stake(caller: string, amount: bigint): MockResult;
  unstake(caller: string, amount: bigint): MockResult;
  getBalance(account: string): MockResult;
  getStakedBalance(account: string): MockResult;
  getAllowance(owner: string, spender: string): MockResult;
  getTotalSupply(): MockResult;
  getAdmin(): MockResult;
  isPaused(): MockResult;
}

const mockContract: MockContract = {
  admin: "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM",
  paused: false,
  totalSupply: 0n,
  balances: new Map<string, bigint>(),
  stakedBalances: new Map<string, bigint>(),
  allowances: new Map<string, bigint>(),
  MAX_SUPPLY: 1000000000000000000n,

  isAdmin(caller: string) {
    return caller === this.admin;
  },

  validateAddress(addr: string) {
    if (addr === "SP000000000000000000002Q6VF78") return { error: 105 };
    return undefined;
  },

  validateAmount(amount: bigint) {
    if (amount <= 0n) return { error: 106 };
    return undefined;
  },

  setPaused(caller: string, pause: boolean): MockResult {
    if (!this.isAdmin(caller)) return { error: 100 };
    this.paused = pause;
    return { value: pause };
  },

  transferAdmin(caller: string, newAdmin: string): MockResult {
    if (!this.isAdmin(caller)) return { error: 100 };
    const validation = this.validateAddress(newAdmin);
    if (validation?.error) return validation;
    this.admin = newAdmin;
    return { value: true };
  },

  mint(caller: string, recipient: string, amount: bigint): MockResult {
    if (!this.isAdmin(caller)) return { error: 100 };
    const addrValidation = this.validateAddress(recipient);
    if (addrValidation?.error) return addrValidation;
    const amtValidation = this.validateAmount(amount);
    if (amtValidation?.error) return amtValidation;
    if (this.totalSupply + amount > this.MAX_SUPPLY) return { error: 103 };
    this.balances.set(recipient, (this.balances.get(recipient) || 0n) + amount);
    this.totalSupply += amount;
    return { value: true };
  },

  burn(caller: string, amount: bigint): MockResult {
    if (this.paused) return { error: 104 };
    const amtValidation = this.validateAmount(amount);
    if (amtValidation?.error) return amtValidation;
    const balance = this.balances.get(caller) || 0n;
    if (balance < amount) return { error: 101 };
    this.balances.set(caller, balance - amount);
    this.totalSupply -= amount;
    return { value: true };
  },

  transfer(caller: string, recipient: string, amount: bigint): MockResult {
    if (this.paused) return { error: 104 };
    const addrValidation = this.validateAddress(recipient);
    if (addrValidation?.error) return addrValidation;
    const amtValidation = this.validateAmount(amount);
    if (amtValidation?.error) return amtValidation;
    const balance = this.balances.get(caller) || 0n;
    if (balance < amount) return { error: 101 };
    this.balances.set(caller, balance - amount);
    this.balances.set(recipient, (this.balances.get(recipient) || 0n) + amount);
    return { value: true };
  },

  approve(caller: string, spender: string, amount: bigint): MockResult {
    if (this.paused) return { error: 104 };
    const addrValidation = this.validateAddress(spender);
    if (addrValidation?.error) return addrValidation;
    if (caller === spender) return { error: 108 };
    const key = `${caller}:${spender}`;
    this.allowances.set(key, amount);
    return { value: true };
  },

  transferFrom(caller: string, owner: string, recipient: string, amount: bigint): MockResult {
    if (this.paused) return { error: 104 };
    const ownerValidation = this.validateAddress(owner);
    if (ownerValidation?.error) return ownerValidation;
    const recipValidation = this.validateAddress(recipient);
    if (recipValidation?.error) return recipValidation;
    const amtValidation = this.validateAmount(amount);
    if (amtValidation?.error) return amtValidation;
    const key = `${owner}:${caller}`;
    const allowance = this.allowances.get(key) || 0n;
    if (allowance < amount) return { error: 107 };
    const ownerBalance = this.balances.get(owner) || 0n;
    if (ownerBalance < amount) return { error: 101 };
    this.allowances.set(key, allowance - amount);
    this.balances.set(owner, ownerBalance - amount);
    this.balances.set(recipient, (this.balances.get(recipient) || 0n) + amount);
    return { value: true };
  },

  stake(caller: string, amount: bigint): MockResult {
    if (this.paused) return { error: 104 };
    const amtValidation = this.validateAmount(amount);
    if (amtValidation?.error) return amtValidation;
    const balance = this.balances.get(caller) || 0n;
    if (balance < amount) return { error: 101 };
    this.balances.set(caller, balance - amount);
    this.stakedBalances.set(caller, (this.stakedBalances.get(caller) || 0n) + amount);
    return { value: true };
  },

  unstake(caller: string, amount: bigint): MockResult {
    if (this.paused) return { error: 104 };
    const amtValidation = this.validateAmount(amount);
    if (amtValidation?.error) return amtValidation;
    const stakeBalance = this.stakedBalances.get(caller) || 0n;
    if (stakeBalance < amount) return { error: 102 };
    this.stakedBalances.set(caller, stakeBalance - amount);
    this.balances.set(caller, (this.balances.get(caller) || 0n) + amount);
    return { value: true };
  },

  getBalance(account: string): MockResult {
    return { value: this.balances.get(account) || 0n };
  },

  getStakedBalance(account: string): MockResult {
    return { value: this.stakedBalances.get(account) || 0n };
  },

  getAllowance(owner: string, spender: string): MockResult {
    const key = `${owner}:${spender}`;
    return { value: this.allowances.get(key) || 0n };
  },

  getTotalSupply(): MockResult {
    return { value: this.totalSupply };
  },

  getAdmin(): MockResult {
    return { value: this.admin };
  },

  isPaused(): MockResult {
    return { value: this.paused };
  },
};

describe("Wellness Token Contract", () => {
  beforeEach(() => {
    mockContract.admin = "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM";
    mockContract.paused = false;
    mockContract.totalSupply = 0n;
    mockContract.balances = new Map();
    mockContract.stakedBalances = new Map();
    mockContract.allowances = new Map();
  });

  it("should allow admin to mint tokens", () => {
    const result = mockContract.mint(mockContract.admin, "ST2CY5V39NHDP5P0TPZ1EMN0VT10V4RJPY48DY7JD", 1000n);
    expect(result).toEqual({ value: true });
    expect(mockContract.balances.get("ST2CY5V39NHDP5P0TPZ1EMN0VT10V4RJPY48DY7JD")).toBe(1000n);
    expect(mockContract.totalSupply).toBe(1000n);
  });

  it("should prevent non-admin from minting", () => {
    const result = mockContract.mint("ST2CY5V39NHDP5P0TPZ1EMN0VT10V4RJPY48DY7JD", "ST3NBRSFKX28FQ2ZJ1MAKX58HKHSDGNV5N7R21XCP", 1000n);
    expect(result).toEqual({ error: 100 });
  });

  it("should prevent minting over max supply", () => {
    const result = mockContract.mint(mockContract.admin, "ST2CY5V39NHDP5P0TPZ1EMN0VT10V4RJPY48DY7JD", 2000000000000000000n);
    expect(result).toEqual({ error: 103 });
  });

  it("should allow token transfer", () => {
    mockContract.mint(mockContract.admin, "ST2CY5V39NHDP5P0TPZ1EMN0VT10V4RJPY48DY7JD", 500n);
    const result = mockContract.transfer("ST2CY5V39NHDP5P0TPZ1EMN0VT10V4RJPY48DY7JD", "ST3NBRSFKX28FQ2ZJ1MAKX58HKHSDGNV5N7R21XCP", 200n);
    expect(result).toEqual({ value: true });
    expect(mockContract.balances.get("ST2CY5V39NHDP5P0TPZ1EMN0VT10V4RJPY48DY7JD")).toBe(300n);
    expect(mockContract.balances.get("ST3NBRSFKX28FQ2ZJ1MAKX58HKHSDGNV5N7R21XCP")).toBe(200n);
  });

  it("should prevent transfer when paused", () => {
    mockContract.setPaused(mockContract.admin, true);
    const result = mockContract.transfer("ST2CY5V39NHDP5P0TPZ1EMN0VT10V4RJPY48DY7JD", "ST3NBRSFKX28FQ2ZJ1MAKX58HKHSDGNV5N7R21XCP", 200n);
    expect(result).toEqual({ error: 104 });
  });

  it("should allow approval and transfer-from", () => {
    mockContract.mint(mockContract.admin, "ST2CY5V39NHDP5P0TPZ1EMN0VT10V4RJPY48DY7JD", 500n);
    const approveResult = mockContract.approve("ST2CY5V39NHDP5P0TPZ1EMN0VT10V4RJPY48DY7JD", "ST3NBRSFKX28FQ2ZJ1MAKX58HKHSDGNV5N7R21XCP", 300n);
    expect(approveResult).toEqual({ value: true });
    const allowance = mockContract.getAllowance("ST2CY5V39NHDP5P0TPZ1EMN0VT10V4RJPY48DY7JD", "ST3NBRSFKX28FQ2ZJ1MAKX58HKHSDGNV5N7R21XCP");
    expect(allowance).toEqual({ value: 300n });
    const transferFromResult = mockContract.transferFrom("ST3NBRSFKX28FQ2ZJ1MAKX58HKHSDGNV5N7R21XCP", "ST2CY5V39NHDP5P0TPZ1EMN0VT10V4RJPY48DY7JD", "ST4J0PS7WAM1FMMVJFVA04VZD7JEZQ8H442N455K", 200n);
    expect(transferFromResult).toEqual({ value: true });
    expect(mockContract.balances.get("ST2CY5V39NHDP5P0TPZ1EMN0VT10V4RJPY48DY7JD")).toBe(300n);
    expect(mockContract.balances.get("ST4J0PS7WAM1FMMVJFVA04VZD7JEZQ8H442N455K")).toBe(200n);
    const remainingAllowance = mockContract.getAllowance("ST2CY5V39NHDP5P0TPZ1EMN0VT10V4RJPY48DY7JD", "ST3NBRSFKX28FQ2ZJ1MAKX58HKHSDGNV5N7R21XCP");
    expect(remainingAllowance).toEqual({ value: 100n });
  });

  it("should prevent transfer-from with insufficient allowance", () => {
    mockContract.mint(mockContract.admin, "ST2CY5V39NHDP5P0TPZ1EMN0VT10V4RJPY48DY7JD", 500n);
    mockContract.approve("ST2CY5V39NHDP5P0TPZ1EMN0VT10V4RJPY48DY7JD", "ST3NBRSFKX28FQ2ZJ1MAKX58HKHSDGNV5N7R21XCP", 100n);
    const result = mockContract.transferFrom("ST3NBRSFKX28FQ2ZJ1MAKX58HKHSDGNV5N7R21XCP", "ST2CY5V39NHDP5P0TPZ1EMN0VT10V4RJPY48DY7JD", "ST4J0PS7WAM1FMMVJFVA04VZD7JEZQ8H442N455K", 200n);
    expect(result).toEqual({ error: 107 });
  });

  it("should allow staking tokens", () => {
    mockContract.mint(mockContract.admin, "ST2CY5V39NHDP5P0TPZ1EMN0VT10V4RJPY48DY7JD", 500n);
    const result = mockContract.stake("ST2CY5V39NHDP5P0TPZ1EMN0VT10V4RJPY48DY7JD", 200n);
    expect(result).toEqual({ value: true });
    expect(mockContract.balances.get("ST2CY5V39NHDP5P0TPZ1EMN0VT10V4RJPY48DY7JD")).toBe(300n);
    expect(mockContract.stakedBalances.get("ST2CY5V39NHDP5P0TPZ1EMN0VT10V4RJPY48DY7JD")).toBe(200n);
  });

  it("should allow unstaking tokens", () => {
    mockContract.mint(mockContract.admin, "ST2CY5V39NHDP5P0TPZ1EMN0VT10V4RJPY48DY7JD", 500n);
    mockContract.stake("ST2CY5V39NHDP5P0TPZ1EMN0VT10V4RJPY48DY7JD", 200n);
    const result = mockContract.unstake("ST2CY5V39NHDP5P0TPZ1EMN0VT10V4RJPY48DY7JD", 100n);
    expect(result).toEqual({ value: true });
    expect(mockContract.stakedBalances.get("ST2CY5V39NHDP5P0TPZ1EMN0VT10V4RJPY48DY7JD")).toBe(100n);
    expect(mockContract.balances.get("ST2CY5V39NHDP5P0TPZ1EMN0VT10V4RJPY48DY7JD")).toBe(400n);
  });

  it("should prevent staking when paused", () => {
    mockContract.setPaused(mockContract.admin, true);
    const result = mockContract.stake("ST2CY5V39NHDP5P0TPZ1EMN0VT10V4RJPY48DY7JD", 200n);
    expect(result).toEqual({ error: 104 });
  });

  it("should return correct read-only values", () => {
    mockContract.mint(mockContract.admin, "ST2CY5V39NHDP5P0TPZ1EMN0VT10V4RJPY48DY7JD", 1000n);
    expect(mockContract.getBalance("ST2CY5V39NHDP5P0TPZ1EMN0VT10V4RJPY48DY7JD")).toEqual({ value: 1000n });
    expect(mockContract.getTotalSupply()).toEqual({ value: 1000n });
    expect(mockContract.getAdmin()).toEqual({ value: mockContract.admin });
    expect(mockContract.isPaused()).toEqual({ value: false });
  });
});