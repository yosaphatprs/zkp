package main

import (
	"fmt"
	"log"
	"os"
	"time"

	"github.com/consensys/gnark-crypto/ecc"
	"github.com/consensys/gnark/backend/groth16"
	"github.com/consensys/gnark/constraint"
	"github.com/consensys/gnark/frontend"
	"github.com/consensys/gnark/frontend/cs/r1cs"
	"github.com/consensys/gnark/std/math/cmp"
)

type Circuit struct {
	AgeThreshold       frontend.Variable `gnark:",public"`
	ClaimVaccineStatus frontend.Variable `gnark:",public"`

	Age           frontend.Variable `gnark:"age"`
	VaccineStatus frontend.Variable `gnark:"vaccine"`
}

func (c *Circuit) Define(api frontend.API) error {
	ageThresholdMinusOne := api.Sub(c.AgeThreshold, 1)
	ageCheck := cmp.IsLess(api, ageThresholdMinusOne, c.Age)
	vaxCheck := cmp.IsEqual(api, c.VaccineStatus, c.ClaimVaccineStatus)

	api.AssertIsEqual(api.Mul(ageCheck, vaxCheck), 1)
	return nil
}

var (
	ccs constraint.ConstraintSystem
	pk  groth16.ProvingKey
	vk  groth16.VerifyingKey
)

func initKeys() {
	var circuit Circuit
	var err error
	ccs, err = frontend.Compile(ecc.BN254.ScalarField(), r1cs.NewBuilder, &circuit)
	if err != nil {
		log.Fatalf("compile error: %v", err)
	}

	pk, vk, err = groth16.Setup(ccs)
	if err != nil {
		log.Fatalf("setup error: %v", err)
	}
}

func main() {
	if len(os.Args) < 2 {
		fmt.Println("Select benchmark [witness|prove|verify]")
		return
	}

	initKeys()

	start := time.Now()
	switch os.Args[1] {
	case "witness":
		runWitness()
	case "prove":
		runProve()
	case "verify":
		runVerify()
	default:
		fmt.Println("No command")
	}
	fmt.Println("Elapsed:", time.Since(start))
}

func runWitness() {
	assignment := &Circuit{
		AgeThreshold:       18,
		ClaimVaccineStatus: 1,
		Age:                25,
		VaccineStatus:      1,
	}
	_, err := frontend.NewWitness(assignment, ecc.BN254.ScalarField())
	if err != nil {
		log.Fatalf("Witness error: %v", err)
	}
}

func runProve() {
	assignment := &Circuit{
		AgeThreshold:       18,
		ClaimVaccineStatus: 1,
		Age:                25,
		VaccineStatus:      1,
	}
	witness, _ := frontend.NewWitness(assignment, ecc.BN254.ScalarField())
	proof, err := groth16.Prove(ccs, pk, witness)
	if err != nil {
		log.Fatalf("Prove error: %v", err)
	}
	fmt.Println("Proof generated:", proof)
}

func runVerify() {
	assignment := &Circuit{
		AgeThreshold:       18,
		ClaimVaccineStatus: 1,
		Age:                25,
		VaccineStatus:      1,
	}
	witness, _ := frontend.NewWitness(assignment, ecc.BN254.ScalarField())
	publicWitness, _ := witness.Public()
	proof, _ := groth16.Prove(ccs, pk, witness)

	err := groth16.Verify(proof, vk, publicWitness)
	if err != nil {
		fmt.Println("Proof invalid:", err)
	} else {
		fmt.Println("Proof verified successfully!")
	}
}
