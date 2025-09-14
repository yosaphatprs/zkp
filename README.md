# Zero Knowledge dengan ZK-SNARKJS untuk Validasi Umur + Vaksin

## Alur Sistem

1. Dibutuhkan Merkle Tree berisi data user. Isinya harus ada ID, Umur dan Status Vaksin. Boleh ditambah data lain(?).
2. Merkle Tree dibuat dari kumpulan data user yang ada, sehingga menghasilkan Merkle Root. **Hyperledger Fabric tidak menyediakan Merkle Root, karena sistem hash dalam Hyperledger Fabric adalah melakukan hash dari kumpulan transaksi yang ada tanpa membuat Merkle Tree**
3. Setiap ada data baru user, Merkle Tree diupdate sehingga menghasilkan Merkle Root baru. Kemudian Merkle root disimpan dalam jaringan Hyperledger Fabric(?).
4. Merkle Root akan digunakan untuk membuat proof dan mengecek validasi.
5. User menginput data Umur dan Status Vaksin.
6. Website (dalam artian bukan input user) mengirimkan input yang dibutuhkan untuk validasi, yaitu:

   - ID
   - Merkle Root yang diambil dari Hyperledger Fabric
   - Batas Umur (bisa hardcode/ambil dari database off-chain/onchain)
   - Status vaksin yang disimpan onchain/offchain
   - saltAge dan saltVaccine (bisa diambil dari database off-chain/onchain)
   - Index dan element dari merkle Tree (bisa fetch dulu/disimpan secara onchain/offchain pada data user).

7. Kemudian, website akan membuat proof dan public signals zk-SNARKJS dengan input di atas.
8. Proof dan public signals dikirim ke smart contract untuk divalidasi atau divalidasi melalui website(?).
9. Jika valid, maka user dianggap lolos validasi umur dan vaksin.
10. Jika tidak valid, maka user dianggap tidak lolos validasi umur dan vaksin.
