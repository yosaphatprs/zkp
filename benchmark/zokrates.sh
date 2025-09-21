#!/bin/bash
set -e

cd ../zokrates-medrec

# Compute Witness
hyperfine --runs 100 --warmup 3 "zokrates compute-witness -a 25 1 18 1" --export-json compute-witness.json

# Generate Proof
hyperfine --runs 100 --warmup 3 "zokrates generate-proof" --export-json generate-proof.json

# Verify Proof
echo "# Verify Proof #"
hyperfine --runs 100 --warmup 3 "zokrates verify" --export-json verify-proof.json
