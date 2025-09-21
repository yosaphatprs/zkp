#!/bin/bash
set -e

# Benchmark gnark sangat berbeda, karena gnark hanya dijalankan secara sekuensial dalam sebuah file (bisa lebih
# kalau circuit atau helper diluar main.go).
# Mengakibatkan library ini tidak seperti Snarkjs dan ZoKrates yang masing-masing menghasilkan
# file-file hasil compile, witness dan prove. Sehingga beberapa proses dapat langsung dilewati dengan 
# menggunakan file tersebut.
# Maka dari itu, untuk mendapatkan nilai verify atau prove saja, perlu untuk mengurangkan waktu verify
# dengan prove serta witness secara manual

cd ../gnark-medrec

# Compile~Compute Witness
hyperfine --runs 100 --warmup 3 "go run main.go witness" --export-json compute-witness.json

# Compile~Generate Proof
hyperfine --runs 100 --warmup 3 "go run main.go prove" --export-json generate-proof.json

# Compile~Verify
hyperfine --runs 100 --warmup 3 "go run main.go verify" --export-json verify-proof.json