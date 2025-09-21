#!/bin/bash
set -e

cd ../snarkjs-medrec

# Compute Witness
hyperfine --runs 100 --warmup 5 "snarkjs wtns calculate circuit_js/circuit.wasm ../circuit-snarkjs-medrec/input_no_merkle.json witness.wtns" --export-json compute-witness.json 
## Verify Witness
snarkjs wtns check circuit.r1cs witness.wtns

# Generate Proof
hyperfine --runs 100 --warmup 5 "snarkjs groth16 prove circuit_final.zkey witness.wtns proof.json public.json" --export-json generate-proof.json

# Compute Witness + Generate Proof
hyperfine --runs 100 --warmup 5 "snarkjs groth16 fullprove ../circuit-snarkjs-medrec/input_no_merkle.json circuit_js/circuit.wasm circuit_final.zkey proof.json public.json" --export-json compute-witness_generate-proof.json

# Verify Proof
echo "# Verify Proof #"
snarkjs groth16 verify verification_key.json public.json proof.json
