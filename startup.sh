#!/usr/bin/env bash
rm ./build/contracts/* && truffle compile -e development --network development
testrpc --gasLimit=200000000 --network-id=121252523
truffle compile -e development --network development
truffle migrate reset --network development --compile-all


# #!/usr/bin/env bash
# testrpc --gasLimit=100000000 --network development
# rm ./build/contracts/*
# truffle compile -e development --network development
# truffle migrate reset --network development --compile-all
#
#
#
# # testrpc --gasLimit=100000000
# # truffle compile
# # truffle migrate reset
