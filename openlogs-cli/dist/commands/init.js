"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initCommand = void 0;
const commander_1 = require("commander");
const chalk_1 = __importDefault(require("chalk"));
const openlogs_sdk_1 = require("@nextera.one/openlogs-sdk");
const fsutil_1 = require("./fsutil");
function bytesToHex(bytes) {
    return Buffer.from(bytes).toString("hex");
}
exports.initCommand = new commander_1.Command("init")
    .description("Create an OpenLogs identity keypair (ed25519)")
    .option("-o, --out <path>", "Output path for identity JSON", "./.openlogs/identity.json")
    .option("--kid <kid>", "Key id to embed in signatures", "kid:local")
    .action(async (options) => {
    const { privateKey, publicKey } = await (0, openlogs_sdk_1.generateEd25519Keypair)();
    const identity = {
        alg: "ed25519",
        kid: String(options.kid),
        privateKeyHex: bytesToHex(privateKey),
        publicKeyHex: bytesToHex(publicKey),
        createdAt: new Date().toISOString(),
    };
    (0, fsutil_1.writeJsonFile)(String(options.out), identity);
    console.log(chalk_1.default.green("✅ OpenLogs identity created"));
    console.log(`Wrote: ${options.out}`);
});
