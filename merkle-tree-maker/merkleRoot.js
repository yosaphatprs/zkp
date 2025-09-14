import { poseidon3, poseidon2 } from "poseidon-lite";

console.log("--- Calculating Merkle Root for Patient Dataset ---");

const patient1 = {
  id: 1001n,
  age: 17n,
  vaccine: 0n,
  saltAge: 98765n,
  saltVac: 56789n,
};
const patient2 = {
  id: 2002n,
  age: 25n,
  vaccine: 1n,
  saltAge: 12345n,
  saltVac: 54321n,
};

console.log("\n[Step 1] Calculating Leaf Hashes...");
const leaf1_Age = poseidon3([patient1.id, patient1.age, patient1.saltAge]);
const leaf1_Vac = poseidon3([patient1.id, patient1.vaccine, patient1.saltVac]);
const leaf2_Age = poseidon3([patient2.id, patient2.age, patient2.saltAge]);
const leaf2_Vac = poseidon3([patient2.id, patient2.vaccine, patient2.saltVac]);

console.log("Leaf P1 Age:", leaf1_Age.toString());
console.log("Leaf P1 Vac:", leaf1_Vac.toString());
console.log("Leaf P2 Age:", leaf2_Age.toString());
console.log("Leaf P2 Vac:", leaf2_Vac.toString());

console.log("\n[Step 2] Calculating Intermediate Hashes...");
const hashP1 = poseidon2([leaf1_Age, leaf1_Vac]);
const hashP2 = poseidon2([leaf2_Age, leaf2_Vac]);

console.log("Hash P1 (Leaf1_Age, Leaf1_Vac):", hashP1.toString());
console.log("Hash P2 (Leaf2_Age, Leaf2_Vac):", hashP2.toString());

console.log("\n[Step 3] Calculating Final Merkle Root...");
const merkleRoot = poseidon2([hashP1, hashP2]);

console.log("\n======================================================");
console.log(">>> FINAL MERKLE ROOT:", merkleRoot.toString());
console.log("======================================================");
