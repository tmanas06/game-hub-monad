import { ethers } from "ethers";
import Groq from "groq-sdk";

interface X402Invoice {
    id: string;
    address: string;
    amount: string;
    currency: string;
    network: string;
    description: string;
    "X-Payment-Amount"?: string;
    "X-Payment-Currency"?: string;
    "X-Payment-To"?: string;
}

interface PaymentRule {
    maxPaymentPerTx: number;
    dailySpendingLimit: number;
    autoPayEnabled: boolean;
}

type AIType = "monad" | "groq" | "both";

export class AutoPayAgent {
    private provider: ethers.Provider;
    private wallet: ethers.Wallet;
    private gameApiUrl: string;
    private rules: PaymentRule;
    private dailySpending: number = 0;
    private lastResetDate: Date;
    private groqClient: Groq | null = null;
    private aiType: AIType;
    private pollInterval: ReturnType<typeof setInterval> | null = null;

    constructor() {
        const rpcUrl = process.env.MONAD_TESTNET_RPC || process.env.MONAD_RPC || "https://testnet-rpc.monad.xyz";
        const privateKey = process.env.AGENT_PRIVATE_KEY || process.env.REWARD_WALLET_PRIVATE_KEY;

        if (!privateKey) {
            throw new Error("AGENT_PRIVATE_KEY (or REWARD_WALLET_PRIVATE_KEY) not set in .env");
        }

        // Validate that private key is not a placeholder
        if (privateKey.includes("your_private_key_here") || privateKey.length < 64) {
            throw new Error(
                "AGENT_PRIVATE_KEY is not set correctly. Please set a valid private key in backend/.env file.\n" +
                "You can generate one using: node -e \"console.log(require('crypto').randomBytes(32).toString('hex'))\""
            );
        }

        // Validate private key format
        const cleanKey = privateKey.startsWith("0x") ? privateKey.slice(2) : privateKey;
        if (!/^[0-9a-fA-F]{64}$/.test(cleanKey)) {
            throw new Error(
                "Invalid AGENT_PRIVATE_KEY format. It must be a 64-character hex string (with or without 0x prefix)."
            );
        }

        this.provider = new ethers.JsonRpcProvider(rpcUrl);
        this.wallet = new ethers.Wallet(privateKey, this.provider);
        this.gameApiUrl = `http://localhost:${process.env.PORT || 5001}`;

        this.rules = {
            maxPaymentPerTx: parseFloat(process.env.MAX_PAYMENT_PER_TX || "0.05"),
            dailySpendingLimit: parseFloat(process.env.DAILY_SPENDING_LIMIT || "0.50"),
            autoPayEnabled: process.env.AUTO_PAY_ENABLED !== "false",
        };

        // Initialize AI type
        const aiTypeEnv = (process.env.AI_TYPE || "monad").toLowerCase();
        this.aiType = (aiTypeEnv === "groq" || aiTypeEnv === "both")
            ? (aiTypeEnv === "both" ? "both" : "groq")
            : "monad";

        // Initialize GROQ client if needed
        if (this.aiType === "groq" || this.aiType === "both") {
            const groqApiKey = process.env.GROQ_API_KEY;
            if (!groqApiKey) {
                console.warn("⚠️  GROQ_API_KEY not set. Agent AI features will be disabled.");
                this.aiType = "monad";
            } else {
                this.groqClient = new Groq({ apiKey: groqApiKey });
                console.log(`✓ Agent GROQ AI initialized (AI Type: ${this.aiType})`);
            }
        }

        this.lastResetDate = new Date();
    }

    async initialize() {
        try {
            const balance = await this.provider.getBalance(this.wallet.address);
            console.log(`✓ Agent initialized: ${this.wallet.address}`);
            console.log(`✓ Agent balance: ${ethers.formatEther(balance)} MON`);
            console.log(`✓ Auto-pay rules:`, this.rules);
            console.log(`✓ AI Decision Type: ${this.aiType}`);
        } catch (error) {
            console.error("Failed to initialize agent:", error);
            throw error;
        }
    }

    private shouldResetDailyLimit() {
        const now = new Date();
        const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        return this.lastResetDate < midnight;
    }

    async canPay(amount: number, invoice?: X402Invoice): Promise<{ allowed: boolean; reason?: string }> {
        if (this.shouldResetDailyLimit()) {
            this.dailySpending = 0;
            this.lastResetDate = new Date();
        }

        if (!this.rules.autoPayEnabled) {
            return { allowed: false, reason: "Auto-pay disabled" };
        }

        const ruleCheck = this.checkPaymentRules(amount);
        if (!ruleCheck.allowed) {
            return ruleCheck;
        }

        if (this.aiType === "groq" || this.aiType === "both") {
            if (invoice && this.groqClient) {
                const aiDecision = await this.askGROQ(invoice, amount);
                if (this.aiType === "groq") {
                    return aiDecision;
                } else {
                    if (!aiDecision.allowed) {
                        return aiDecision;
                    }
                }
            }
        }

        return { allowed: true };
    }

    private checkPaymentRules(amount: number): { allowed: boolean; reason?: string } {
        if (amount > this.rules.maxPaymentPerTx) {
            return {
                allowed: false,
                reason: `Amount exceeds max payment per tx (${this.rules.maxPaymentPerTx})`,
            };
        }

        if (this.dailySpending + amount > this.rules.dailySpendingLimit) {
            return {
                allowed: false,
                reason: `Daily spending limit would be exceeded`,
            };
        }

        return { allowed: true };
    }

    private async askGROQ(invoice: X402Invoice, amount: number): Promise<{ allowed: boolean; reason?: string }> {
        if (!this.groqClient) {
            return { allowed: false, reason: "GROQ client not initialized" };
        }

        try {
            const prompt = `You are an AI payment agent for a blockchain gaming platform. Evaluate whether to approve this payment request.

Payment Details:
- Amount: ${amount} USDC
- Invoice ID: ${invoice.id}
- Description: ${invoice.description}
- Recipient: ${invoice["X-Payment-To"] || "Unknown"}
- Network: ${invoice.network}
- Daily spending so far: ${this.dailySpending.toFixed(4)} USDC
- Daily limit: ${this.rules.dailySpendingLimit} USDC
- Max per transaction: ${this.rules.maxPaymentPerTx} USDC

Rules:
1. Amount must be reasonable for gaming (typically 0.01-0.05 USDC)
2. Daily spending should not exceed limits
3. Only approve legitimate gaming payments
4. Reject suspicious or unusually large amounts

Respond with ONLY a JSON object in this exact format:
{
  "allowed": true or false,
  "reason": "brief explanation"
}`;

            const completion = await this.groqClient.chat.completions.create({
                messages: [
                    { role: "system", content: "You are a payment security agent. Always respond with valid JSON only." },
                    { role: "user", content: prompt },
                ],
                model: process.env.GROQ_MODEL || "llama-3.1-70b-versatile",
                temperature: 0.3,
                max_tokens: 200,
            });

            const responseText = completion.choices[0]?.message?.content || "";

            let decision;
            try {
                const jsonMatch = responseText.match(/\{[\s\S]*\}/);
                if (jsonMatch) {
                    decision = JSON.parse(jsonMatch[0]);
                } else {
                    throw new Error("No JSON found in response");
                }
            } catch (parseError) {
                console.error("Failed to parse GROQ response:", responseText);
                const lowerResponse = responseText.toLowerCase();
                decision = {
                    allowed: lowerResponse.includes("allowed") || lowerResponse.includes("approve"),
                    reason: "AI decision (parsed from text)",
                };
            }

            console.log(`🤖 GROQ Decision: ${decision.allowed ? "✓ Approved" : "✗ Denied"} - ${decision.reason}`);
            return {
                allowed: decision.allowed === true,
                reason: decision.reason || "AI evaluation",
            };
        } catch (error) {
            console.error("GROQ AI error:", error);
            return this.checkPaymentRules(amount);
        }
    }

    async processPayment(invoice: X402Invoice): Promise<{
        success: boolean;
        txHash?: string;
        signature?: string;
        error?: string;
    }> {
        try {
            const amount = parseFloat(invoice["X-Payment-Amount"] || "0");
            const amountInUsdc = amount / 1e6;

            console.log(`\n💳 Processing payment...`);
            console.log(`  Amount: ${amountInUsdc} USDC`);
            console.log(`  Description: ${invoice.description}`);

            const canPay = await this.canPay(amountInUsdc, invoice);
            if (!canPay.allowed) {
                console.error(`  ✗ Payment denied: ${canPay.reason}`);
                return { success: false, error: canPay.reason };
            }

            const signature = await this.generateAndSignEIP3009Transfer(
                invoice["X-Payment-To"] || "",
                invoice["X-Payment-Amount"] || "0"
            );

            this.dailySpending += amountInUsdc;

            console.log(`  ✓ Payment authorized`);
            console.log(`  ✓ Signature: ${signature.substring(0, 30)}...`);

            return {
                success: true,
                signature,
                txHash: `0x${Date.now().toString(16)}`,
            };
        } catch (error) {
            console.error(`  ✗ Payment failed:`, error);
            return { success: false, error: String(error) };
        }
    }

    private async generateAndSignEIP3009Transfer(to: string, amount: string): Promise<string> {
        try {
            const domain = {
                name: "USD Coin",
                version: "2",
                chainId: 10143,
                verifyingContract: process.env.USDC_ADDRESS || "0x0000000000000000000000000000000000000000",
            };

            const types = {
                TransferWithAuthorization: [
                    { name: "from", type: "address" },
                    { name: "to", type: "address" },
                    { name: "value", type: "uint256" },
                    { name: "validAfter", type: "uint256" },
                    { name: "validBefore", type: "uint256" },
                    { name: "nonce", type: "bytes32" },
                ],
            };

            const nonce = ethers.randomBytes(32);
            const now = Math.floor(Date.now() / 1000);
            const validBefore = now + parseInt(process.env.GAME_MAX_TIMEOUT || "300");

            const value = {
                from: this.wallet.address,
                to: to,
                value: amount,
                validAfter: 0,
                validBefore: validBefore,
                nonce: nonce,
            };

            const signature = await this.wallet.signTypedData(domain, types, value);
            return Buffer.from(signature.substring(2), "hex").toString("base64");
        } catch (error) {
            console.error("Error generating EIP-3009 signature:", error);
            throw error;
        }
    }

    getStatus() {
        return {
            address: this.wallet.address,
            aiType: this.aiType,
            rules: this.rules,
            dailySpending: this.dailySpending,
        };
    }

    async start() {
        const agentBalance = await this.provider.getBalance(this.wallet.address);

        console.log("\n🤖 Auto-Pay Agent Started (integrated)");
        console.log(`  Agent Address: ${this.wallet.address}`);
        console.log(`  Agent Balance: ${ethers.formatEther(agentBalance)} MON`);
        console.log(`  Chain ID: 10143 (Monad Testnet)`);
        console.log(`  Auto-Pay Enabled: ${this.rules.autoPayEnabled}`);
        console.log(`  Max Payment Per Tx: ${this.rules.maxPaymentPerTx} USDC`);
        console.log(`  Daily Spending Limit: ${this.rules.dailySpendingLimit} USDC\n`);

        if (agentBalance === 0n) {
            console.warn("⚠️  Agent balance is 0. The agent won't be able to pay invoices.");
        }

        // Poll for balance updates periodically
        this.pollInterval = setInterval(async () => {
            try {
                const currentBalance = await this.provider.getBalance(this.wallet.address);
                if (currentBalance > 0n) {
                    console.log(`📡 Agent listening... (Balance: ${ethers.formatEther(currentBalance)} MON)`);
                }
            } catch (error) {
                console.error("Error in agent loop:", error);
            }
        }, 30000);

        console.log("📡 Agent listening for x402 invoices...\n");
    }

    stop() {
        if (this.pollInterval) {
            clearInterval(this.pollInterval);
            this.pollInterval = null;
            console.log("🛑 Agent stopped");
        }
    }
}
