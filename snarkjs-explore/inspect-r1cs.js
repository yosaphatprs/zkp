import { readR1cs } from 'r1csfile';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
    try {
        const publicDir = path.join(__dirname, '/snarkjs-explore/..', 'public');
        const r1csPath = path.join(publicDir, 'circuit.r1cs');
        console.log(`Membaca file R1CS dari: ${r1csPath}`);
        const r1cs = await readR1cs(r1csPath);

        console.log("\n--- R1CS Information ---");
        console.log(`Number of Wires: ${r1cs.nWires}`);
        console.log(`Number of Constraints: ${r1cs.nConstraints}`);
        console.log(`Number of Private Inputs: ${r1cs.nPrvInputs}`);
        console.log(`Number of Public Inputs: ${r1cs.nPubInputs}`);
        console.log(`Number of Labels: ${r1cs.nLabels}`);
        if (r1cs.nConstraints > 0) {
            console.log("\nContoh Constraint pertama:");
            const firstConstraint = r1cs.constraints[0];
            console.log(firstConstraint);
        }

    } catch (error) {
        console.error("Terjadi error:", error);
    }
}

main().then(() => process.exit(0));