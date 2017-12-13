The fhirprovenance project uses Ethereum's blockchain to store cryptographic hashes of FHIR resources so future resesource readers can verify that the data within the resource has not been tampered with.

# Development
## Start Truffle
```
npm install
npm install -g truffle
npm install -g ethereumjs-testrpc
./startup.sh
# leave this running in one terminal
```

## Start the server
In different terminal window, compile truffle and start the server
```
truffle compile --network development
npm start
```

# Production
```
truffle compile -e production
```
