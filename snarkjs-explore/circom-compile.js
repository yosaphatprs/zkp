import { wasm as circom_tester } from 'circom_tester';
import { mkdirSync, existsSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
    console.log("Compile Circuit");
    const buildDir = path.join(__dirname, 'build');
    if (!existsSync(buildDir)) mkdirSync(buildDir, { recursive: true });

    const circuitPath = path.join(__dirname, 'circuits', 'circuit_no_merkle.circom');
    console.log(`Reading circuit from: ${circuitPath}`);

    const r1csPath = path.join(buildDir, 'circuit.r1cs');
    const wasmPath = path.join(buildDir, 'circuit_js', 'circuit.wasm');
    
    await circom_tester(circuitPath, {
        r1cs: r1csPath,
        wasm: wasmPath,
        include: path.join(__dirname, 'node_modules')
    });

    console.log(`Circuit compiled successfully.`);
    console.log(`R1CS file created at: ${r1csPath}`);
    console.log(`WASM file created at: ${wasmPath}`);
}

main().catch(console.error).then(() => process.exit(0));