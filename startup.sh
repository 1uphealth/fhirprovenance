#!/usr/bin/env bash
testrpc --gasLimit=100000000
truffle compile
truffle migrate reset

