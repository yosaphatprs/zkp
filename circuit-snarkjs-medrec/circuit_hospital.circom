pragma circom 2.0.0;

include "../node_modules/circomlib/circuits/comparators.circom";

template VerifyPatient() {
    signal input threshold;         

    signal input age;    

    component ageCheck = LessThan(16); 
    ageCheck.in[0] <== threshold - 1;
    ageCheck.in[1] <== age;

    ageCheck.out === 1;
}

component main {public [threshold]} = VerifyPatient();