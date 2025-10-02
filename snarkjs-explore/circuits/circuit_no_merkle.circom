pragma circom 2.0.0;

include "../node_modules/circomlib/circuits/comparators.circom";

template VerifyPatient() {
    signal input threshold;         
    signal input claimVaccineStatus; 

    signal input age;    
    signal input vaccineStatus;

    component ageCheck = LessThan(16); 
    ageCheck.in[0] <== threshold - 1;
    ageCheck.in[1] <== age;

    component vaccineCheck = IsEqual();
    vaccineCheck.in[0] <== vaccineStatus;
    vaccineCheck.in[1] <== claimVaccineStatus;

    signal allChecksValid;
    allChecksValid <== ageCheck.out * vaccineCheck.out;
    allChecksValid === 1;
}

component main {public [threshold, claimVaccineStatus]} = VerifyPatient();