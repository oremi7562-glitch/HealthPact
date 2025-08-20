;; Wellness Token Contract
;; Clarity v2 (latest syntax as of 2025)
;; Implements SIP-10 compliant fungible token with staking for governance/rewards,
;; approvals, admin controls, pause functionality, and event emissions.
;; Designed for HealthPact platform to incentivize wellness goals.

;; Error codes
(define-constant ERR-NOT-AUTHORIZED u100)
(define-constant ERR-INSUFFICIENT-BALANCE u101)
(define-constant ERR-INSUFFICIENT-STAKE u102)
(define-constant ERR-MAX-SUPPLY-REACHED u103)
(define-constant ERR-PAUSED u104)
(define-constant ERR-ZERO-ADDRESS u105)
(define-constant ERR-INVALID-AMOUNT u106)
(define-constant ERR-INSUFFICIENT-ALLOWANCE u107)
(define-constant ERR-SELF-APPROVAL u108)

;; Token metadata constants
(define-constant TOKEN-NAME "HealthPact Token")
(define-constant TOKEN-SYMBOL "HPT")
(define-constant TOKEN-DECIMALS u6)
(define-constant MAX-SUPPLY u1000000000000000000) ;; 1B tokens with decimals (10^18 total units)

;; Contract state variables
(define-data-var admin principal tx-sender)
(define-data-var paused bool false)
(define-data-var total-supply uint u0)

;; Maps for balances, stakes, and allowances
(define-map balances principal uint)
(define-map staked-balances principal uint)
(define-map allowances {owner: principal, spender: principal} uint)

;; Private helper: Check if caller is admin
(define-private (is-admin)
  (is-eq tx-sender (var-get admin)))

;; Private helper: Ensure contract is not paused
(define-private (ensure-not-paused)
  (asserts! (not (var-get paused)) (err ERR-PAUSED)))

;; Private helper: Validate non-zero address
(define-private (validate-address (addr principal))
  (asserts! (not (is-eq addr 'SP000000000000000000002Q6VF78)) (err ERR-ZERO-ADDRESS)))

;; Private helper: Validate positive amount
(define-private (validate-amount (amount uint))
  (asserts! (> amount u0) (err ERR-INVALID-AMOUNT)))

;; Event emission helper (prints for indexing)
(define-private (emit-transfer-event (from principal) (to principal) (amount uint))
  (print { event: "transfer", from: from, to: to, amount: amount }))

(define-private (emit-mint-event (to principal) (amount uint))
  (print { event: "mint", to: to, amount: amount }))

(define-private (emit-burn-event (from principal) (amount uint))
  (print { event: "burn", from: from, amount: amount }))

(define-private (emit-stake-event (staker principal) (amount uint))
  (print { event: "stake", staker: staker, amount: amount }))

(define-private (emit-unstake-event (staker principal) (amount uint))
  (print { event: "unstake", staker: staker, amount: amount }))

(define-private (emit-approval-event (owner principal) (spender principal) (amount uint))
  (print { event: "approval", owner: owner, spender: spender, amount: amount }))

;; Public: Transfer admin rights to a new principal
(define-public (transfer-admin (new-admin principal))
  (begin
    (asserts! (is-admin) (err ERR-NOT-AUTHORIZED))
    (validate-address new-admin)
    (var-set admin new-admin)
    (ok true)))

;; Public: Pause or unpause the contract (affects transfers, stakes, etc.)
(define-public (set-paused (pause bool))
  (begin
    (asserts! (is-admin) (err ERR-NOT-AUTHORIZED))
    (var-set paused pause)
    (ok pause)))

;; Public: Mint new tokens to a recipient (admin only)
(define-public (mint (recipient principal) (amount uint))
  (begin
    (asserts! (is-admin) (err ERR-NOT-AUTHORIZED))
    (validate-address recipient)
    (validate-amount amount)
    (let ((new-supply (+ (var-get total-supply) amount)))
      (asserts! (<= new-supply MAX-SUPPLY) (err ERR-MAX-SUPPLY-REACHED))
      (map-set balances recipient (+ amount (default-to u0 (map-get? balances recipient))))
      (var-set total-supply new-supply)
      (emit-mint-event recipient amount)
      (ok true))))

;; Public: Burn tokens from caller's balance
(define-public (burn (amount uint))
  (begin
    (ensure-not-paused)
    (validate-amount amount)
    (let ((balance (default-to u0 (map-get? balances tx-sender))))
      (asserts! (>= balance amount) (err ERR-INSUFFICIENT-BALANCE))
      (map-set balances tx-sender (- balance amount))
      (var-set total-supply (- (var-get total-supply) amount))
      (emit-burn-event tx-sender amount)
      (ok true))))

;; Public: Transfer tokens to a recipient
(define-public (transfer (recipient principal) (amount uint))
  (begin
    (ensure-not-paused)
    (validate-address recipient)
    (validate-amount amount)
    (let ((sender-balance (default-to u0 (map-get? balances tx-sender))))
      (asserts! (>= sender-balance amount) (err ERR-INSUFFICIENT-BALANCE))
      (map-set balances tx-sender (- sender-balance amount))
      (map-set balances recipient (+ amount (default-to u0 (map-get? balances recipient))))
      (emit-transfer-event tx-sender recipient amount)
      (ok true))))

;; Public: Approve a spender to transfer tokens on behalf of owner
(define-public (approve (spender principal) (amount uint))
  (begin
    (ensure-not-paused)
    (validate-address spender)
    (asserts! (not (is-eq tx-sender spender)) (err ERR-SELF-APPROVAL))
    (map-set allowances {owner: tx-sender, spender: spender} amount)
    (emit-approval-event tx-sender spender amount)
    (ok true)))

;; Public: Transfer tokens from one account to another using allowance
(define-public (transfer-from (owner principal) (recipient principal) (amount uint))
  (begin
    (ensure-not-paused)
    (validate-address owner)
    (validate-address recipient)
    (validate-amount amount)
    (let ((allowance (default-to u0 (map-get? allowances {owner: owner, spender: tx-sender})))
          (owner-balance (default-to u0 (map-get? balances owner))))
      (asserts! (>= allowance amount) (err ERR-INSUFFICIENT-ALLOWANCE))
      (asserts! (>= owner-balance amount) (err ERR-INSUFFICIENT-BALANCE))
      (map-set allowances {owner: owner, spender: tx-sender} (- allowance amount))
      (map-set balances owner (- owner-balance amount))
      (map-set balances recipient (+ amount (default-to u0 (map-get? balances recipient))))
      (emit-transfer-event owner recipient amount)
      (ok true))))

;; Public: Stake tokens for rewards/governance
(define-public (stake (amount uint))
  (begin
    (ensure-not-paused)
    (validate-amount amount)
    (let ((balance (default-to u0 (map-get? balances tx-sender))))
      (asserts! (>= balance amount) (err ERR-INSUFFICIENT-BALANCE))
      (map-set balances tx-sender (- balance amount))
      (map-set staked-balances tx-sender (+ amount (default-to u0 (map-get? staked-balances tx-sender))))
      (emit-stake-event tx-sender amount)
      (ok true))))

;; Public: Unstake tokens back to balance
(define-public (unstake (amount uint))
  (begin
    (ensure-not-paused)
    (validate-amount amount)
    (let ((stake-balance (default-to u0 (map-get? staked-balances tx-sender))))
      (asserts! (>= stake-balance amount) (err ERR-INSUFFICIENT-STAKE))
      (map-set staked-balances tx-sender (- stake-balance amount))
      (map-set balances tx-sender (+ amount (default-to u0 (map-get? balances tx-sender))))
      (emit-unstake-event tx-sender amount)
      (ok true))))

;; Read-only: Get token name
(define-read-only (get-name)
  (ok TOKEN-NAME))

;; Read-only: Get token symbol
(define-read-only (get-symbol)
  (ok TOKEN-SYMBOL))

;; Read-only: Get token decimals
(define-read-only (get-decimals)
  (ok TOKEN-DECIMALS))

;; Read-only: Get balance of an account
(define-read-only (get-balance (account principal))
  (ok (default-to u0 (map-get? balances account))))

;; Read-only: Get staked balance of an account
(define-read-only (get-staked-balance (account principal))
  (ok (default-to u0 (map-get? staked-balances account))))

;; Read-only: Get allowance for spender from owner
(define-read-only (get-allowance (owner principal) (spender principal))
  (ok (default-to u0 (map-get? allowances {owner: owner, spender: spender}))))

;; Read-only: Get total supply
(define-read-only (get-total-supply)
  (ok (var-get total-supply)))

;; Read-only: Get current admin
(define-read-only (get-admin)
  (ok (var-get admin)))

;; Read-only: Check if contract is paused
(define-read-only (is-paused)
  (ok (var-get paused)))