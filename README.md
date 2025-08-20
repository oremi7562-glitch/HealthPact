# HealthPact
A blockchain-powered wellness platform that incentivizes patients to achieve health goals through tokenized rewards, ensuring transparency and patient data sovereignty — all on-chain.

---

## Overview
HealthPact is a decentralized platform designed to motivate patients to maintain healthy habits, such as regular exercise, medication adherence, or dietary goals, by rewarding them with tokens. Built on the Stacks blockchain using Clarity, it ensures secure, transparent, and patient-controlled interactions. The platform integrates with healthcare providers and wearables for verified data, rewarding patients for meeting milestones while protecting privacy.

The system consists of five main smart contracts that form a secure, transparent, and rewarding ecosystem for patients, healthcare providers, and insurers:

1. **Wellness Token Contract** – Issues and manages HealthPact tokens (HPT) for rewards and staking.
2. **Health Goal Contract** – Defines and tracks patient health goals with verifiable milestones.
3. **Reward Distribution Contract** – Automates token rewards for verified goal completion.
4. **Data Oracle Contract** – Integrates off-chain health data (e.g., from wearables or providers) securely.
5. **Patient Data Vault Contract** – Ensures patient-controlled, encrypted health data storage and sharing.

---

## Features
- **HealthPact Tokens (HPT)** for rewarding wellness achievements and staking for additional benefits.
- **Customizable Health Goals** set by patients or providers, with verifiable progress tracking.
- **Automated Reward System** for milestone completion, ensuring fair and transparent payouts.
- **Secure Data Integration** via oracles for real-time health data from wearables or medical records.
- **Patient-Controlled Data** with encrypted storage and selective sharing for privacy.
- **Stakeholder Collaboration** allowing insurers or employers to fund reward pools.
- **Anti-Fraud Mechanisms** to prevent gaming of the reward system.
- **Interoperability** with healthcare systems for seamless integration.

---

## Smart Contracts

### Wellness Token Contract
- Mint, burn, and transfer HPT tokens.
- Staking mechanism for patients to earn additional rewards or governance rights.
- Token supply cap and anti-inflation controls.

### Health Goal Contract
- Create and manage patient-specific health goals (e.g., 10,000 steps daily, medication adherence).
- Track progress with milestones verified via oracle data.
- Goal completion triggers for reward distribution.

### Reward Distribution Contract
- Automates HPT token payouts upon verified goal completion.
- Configurable reward structures (e.g., fixed or tiered rewards).
- Transparent record of all reward transactions.

### Data Oracle Contract
- Securely integrates off-chain data from wearables, apps, or healthcare providers.
- Verifies health goal progress (e.g., steps, heart rate, or lab results).
- Ensures data integrity with cryptographic proofs.

### Patient Data Vault Contract
- Stores encrypted health data on-chain, controlled by patient private keys.
- Selective data sharing with providers or insurers via smart contract permissions.
- Audit trail for all data access requests.

---

## Installation
1. Install [Clarinet CLI](https://docs.hiro.so/clarinet/getting-started).
2. Clone this repository:
   ```bash
   git clone https://github.com/yourusername/healthpact.git
   ```
3. Run tests:
   ```bash
   npm test
   ```
4. Deploy contracts:
   ```bash
   clarinet deploy
   ```

## Usage
Each smart contract operates independently but integrates with others to form the HealthPact ecosystem. Refer to individual contract documentation for function calls, parameters, and usage examples. Example workflow:
1. Patients set health goals via the Health Goal Contract.
2. Wearables or providers send verified data to the Data Oracle Contract.
3. Upon milestone completion, the Reward Distribution Contract issues HPT tokens.
4. Patients manage data privacy through the Patient Data Vault Contract.
5. Tokens can be staked or redeemed via the Wellness Token Contract.

## License
MIT License
