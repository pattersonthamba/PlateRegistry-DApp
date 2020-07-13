const express = require('express')
const http = require('http')
const socketIO = require('socket.io')
const { Gateway, Wallets } = require('fabric-network');
const fs = require('fs');
const path = require('path');
const util = require('util');
const os = require('os');
const { mainModule } = require('process');
const ccpPath = path.resolve(__dirname, '..', '..', 'test-network', 'organizations', 'peerOrganizations', 'org1.example.com', 'connection-org1.json');
const ccp = JSON.parse(fs.readFileSync(ccpPath, 'utf8'));
var idCounter = 0 ;

// Express stuff
const port = 4001
const app = express()
const server = http.createServer(app)
const io = socketIO(server)
// This method checks if the given car exists and executes callback depending on success / failure
async function getPlate(carID, socket, failure){
    // Create a new file system based wallet for managing identities.
    const walletPath = path.join(process.cwd(), 'wallet');
    const wallet = await Wallets.newFileSystemWallet(walletPath);
    console.log(`Wallet path: ${walletPath}`);
    // Check to see if we've already enrolled the user.
    const identity = await wallet.get('appUser');
    if (!identity) {
        console.log('An identity for the user "appUser" does not exist in the wallet');
        console.log('Run the registerUser.js application before retrying');
		       return;
    }
    const gateway = new Gateway();
        await gateway.connect(ccp, { wallet, identity: 'appUser', discovery: { enabled: true, asLocalhost: true } });
        // Get the network (channel) our contract is deployed to.
        const network = await gateway.getNetwork('mychannel');
        // Get the contract from the network.
        const contract = network.getContract('platechain');
        // Evaluate the specified transaction.
        // queryCar transaction - requires 1 argument, ex: ('queryCar', 'CAR4')
        // queryAllCars transaction - requires no arguments, ex: ('queryAllCars')
        const query_responses = await contract.evaluateTransaction('getPlate', carID);
        console.log(`Transaction has been evaluated, result is: ${query_responses.toString()}`);
        socket.emit('RESPONSE', {type: 'FEED', payload: "Sending query to peers" });
        if (query_responses) {
            if (query_responses[0] instanceof Error) {
                resp = "error from query = ", query_responses[0];
                console.error("error from query = ", query_responses[0]);
                socket.emit('RESPONSE' , {type: 'ERROR' , payload: resp});
            } else {
                data =  JSON.parse(query_responses.toString());
                socket.emit('RESPONSE', {type: 'END', payload: "Data retrieved" });
                if (!data.length) {
                     // additional data for response for query single
                    data = [{Key: carID, 'Record': data}]
                }
                console.log(`query completed, data: ${data}`)
                socket.emit('RESPONSE', {type: 'INFO', payload: data });
            }
        } else {
            // If no payloads returned
            console.log("No payloads were returned from query");
            socket.emit('RESPONSE', {type: 'ERROR', payload: "No payloads were returned from query" });
        }
}
// This method invoke chaincode on the peer using the data specified in the request argument
async function invoke(request, socket){
    try{
    const ccpPath = path.resolve(__dirname, '..', '..', 'test-network', 'organizations', 'peerOrganizations', 'org1.example.com', 'connection-org1.json');
    let ccp = JSON.parse(fs.readFileSync(ccpPath, 'utf8'));

    // Create a new file system based wallet for managing identities.
    const walletPath = path.join(process.cwd(), 'wallet');
    const wallet = await Wallets.newFileSystemWallet(walletPath);
    console.log(`Wallet path: ${walletPath}`);

    // Check to see if we've already enrolled the user.
    const identity = await wallet.get('appUser');
    if (!identity) {
        console.log('An identity for the user "appUser" does not exist in the wallet');
        console.log('Run the registerUser.js application before retrying');
        return;
    }

    // Create a new gateway for connecting to our peer node.
    const gateway = new Gateway();
    await gateway.connect(ccp, { wallet, identity: 'appUser', discovery: { enabled: true, asLocalhost: true } });

    // Get the network (channel) our contract is deployed to.
    const network = await gateway.getNetwork('mychannel');

    // Get the contract from the network.
    const contract = network.getContract('platechain');

    // Submit the specified transaction.
    // createCar transaction - requires 5 argument, ex: ('createCar', 'CAR12', 'Honda', 'Accord', 'Black', 'Tom')
    // changeCarOwner transaction - requires 2 args , ex: ('changeCarOwner', 'CAR12', 'Dave')
    if(request.funcName == "checkPlate"){
        await contract.submitTransaction('checkPlate', request.args[0] , request.args[1] ,request.args[2] , request.args[3] );
        idCounter++ ;
        socket.emit('RESPONSE', {type: 'START', payload: `Transaction is successfull.Check your license plate id : LP_0` + idCounter });
        console.log('Transaction has been submitted');
    }
    else{
        await contract.submitTransaction('renewPlate', request.args[0]);
        idCounter++;
        socket.emit('RESPONSE', {type: 'START', payload: `Transaction is successfull.Check your license plate id : LP_0` + idCounter });
        console.log('Transaction has been submitted');
    }

    // Disconnect from the gateway.
    await gateway.disconnect();


} catch (error) {
    console.error(`Failed to submit transaction: ${error}`);
    process.exit(1);
}
}
// This method takes in the the socket (to respond to client) and the name of the user to be enrolled. It returns the user if successful
// Default user is 'user1' as there are no other users enrolled.
io.on('connection', socket => {
    console.log(`Connected to client with socket ID ${socket.id}`)
    socket.emit('RESPONSE', {type: 'FEED',  payload: `Connected to server with socket ID ${socket.id}` });
    // enroll user when client connects, default user is user1
   // let user = getUser(socket, 'user1');    
    socket.on('REQUEST', (req) => {
        switch (req.action)
        {
            case "QUERY":
                socket.emit('RESPONSE', {type: 'START', payload: `Request for QUERY for ${req.data.ID} received` });
                getPlate(req.data.ID,
                            socket,
                            () => {
                                socket.emit('RESPONSE', {type: 'ERROR', payload: `${req.data.ID} DOES NOT EXIST!` });
                            });
                break;
            case "RENEWAL":
                socket.emit('RESPONSE', {type: 'START', payload: `Request for RENEWAL for ${req.data.ID} to ${req.data.newOwner} received` });
                invoke(
                    { 
                        funcName: "renewPlate",
                        args: [req.data.ID]
                    }
                , socket);
                    break;
            case "CREATE":
                socket.emit('RESPONSE', {type: 'START', payload: `Request for CREATE for ${req.data.ID} received` });
                    invoke(
                        { 
                            funcName: "checkPlate",
                            args: [req.data.owner, req.data.model , req.data.company, req.data.payment]
                        }
                    , socket);
                    break;
        }
    })
    socket.on('disconnect', () => {
        console.log(`Disconnected to client ${socket.id}`)
    })
})
server.listen(port, () => console.log(`Listening on port ${port}`))
