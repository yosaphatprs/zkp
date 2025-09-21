import poseidon, { poseidon1, poseidon2 } from "poseidon-lite";

console.log("--- Calculating Merkle Root with SIMPLIFIED HASHING ---");

const patient1 = { id: 1001n, age: 17n, vaccine: 0n };
const patient2 = { id: 2002n, age: 25n, vaccine: 1n };

const leaf1_Age = poseidon1([patient1.age]);
const leaf1_Vac = poseidon1([patient1.vaccine]);
const leaf2_Age = poseidon1([patient2.age]);
const leaf2_Vac = poseidon1([patient2.vaccine]);

console.log("Leaf P1 Age Hash:", leaf1_Age.toString());
console.log("Leaf P1 Vac Hash:", leaf1_Vac.toString());
console.log("Leaf P2 Age Hash:", leaf2_Age.toString());
console.log("Leaf P2 Vac Hash:", leaf2_Vac.toString());

const hashP1 = poseidon2([leaf1_Age, leaf1_Vac]);
const hashP2 = poseidon2([leaf2_Age, leaf2_Vac]);

console.log("\nHash P1:", hashP1.toString());
console.log("Hash P2:", hashP2.toString());

const merkleRoot = poseidon2([hashP1, hashP2]);
console.log("\n======================================================");
console.log(">>> NEW MERKLE ROOT:", merkleRoot.toString());
console.log("======================================================");
