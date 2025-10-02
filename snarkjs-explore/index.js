import { groth16, wtns } from "snarkjs";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import path from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  try {
    const inputs = {
      age: 25,
      vaccineStatus: 1,
      threshold: 18,
      claimVaccineStatus: 1,
    };

    const publicDir = path.join(__dirname, "..", "/snarkjs-explore/public");
    const wasmPath = path.join(publicDir, "circuit.wasm");
    const zkeyPath = path.join(publicDir, "circuit_final.zkey");
    const vkeyPath = path.join(publicDir, "verification_key.json");

    console.log("Generating proof...");
    const { proof, publicSignals } = await groth16.fullProve(
      inputs,
      wasmPath,
      zkeyPath
    );

    console.log("\nProof Generated:");
    console.log(JSON.stringify(proof, null, 2));
    console.log("\nPublic Signals:");
    console.log(publicSignals);

    console.log("\nVerifying proof...");
    const verificationKey = JSON.parse(readFileSync(vkeyPath));
    const isValid = await groth16.verify(verificationKey, publicSignals, proof);

    if (isValid) {
      console.log("\nVerification successful! The proof is valid.");
    } else {
      console.log("\nVerification failed! The proof is invalid.");
    }
  } catch (error) {
    console.error("An error occurred:", error);
    process.exit(1);
  }
}

main().then(() => process.exit(0));
