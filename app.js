var Azure = require('azure');
var msRestAzure = require('ms-rest-azure');
var util = require('util');

var computeManagementClient = require('azure-arm-compute');

var AZURE_USER = 'devuser@davidbensonbeboptechnology.onmicrosoft.com';
var AZURE_PASS = 'Batman1qaz';
var SUBSCRIPTION_ID = 'abb8a257-30cb-4b25-9cb5-de7bbc0f39dc';

var computeClient;
var resourceGroupName = 'RG-testvm';
var vmName = 'customtestvm2';

function getVM(cb) {
    var options = {
        expand: 'instanceView'
    }
    computeClient.virtualMachines.get(resourceGroupName, vmName, options, function(err, result) {
        if (err) {
            console.log(err);
            cb(err);


        } else {
            //console.log('VM Get: ', JSON.stringify(result));
            console.log('VM Get: ', result.instanceView.statuses);
            cb(null, result);
        }
    });
}

function listVM(cb) {
    computeClient.virtualMachines.list(resourceGroupName, function(err, result) {
        if (err) {
            console.log(err);
            cb(err);
        } else {
            console.log('VM List: ', result);
            cb(null, result);
        }
    });
}

function getStatusForAll(cb) {
    computeClient.virtualMachines.listAll(function(err, result, request, response) {
        if (err) {
            console.log(err);
            cb(err);


        } else {
            console.log('ALL VMs: ', result);
            cb(null, result);
        }
    });
}

function startVM(cb) {
    computeClient.virtualMachines.start(resourceGroupName, vmName, function(err, result) {
        if (err) {
            console.log(err);
            cb(err);


        } else {
            console.log('VM Started: ', result);
            cb(null, result);
        }
    });
}

function stopVM(cb) {
    computeClient.virtualMachines.powerOff(resourceGroupName, vmName, function(err, result) {
        if (err) {
            console.log(err);
            cb(err);
        } else {
            console.log('VM Stopped: ', result);
            cb(null, result);
        }
    });
}

function deallocateVM(cb) {
    computeClient.virtualMachines.deallocate(resourceGroupName, vmName, function(err, result) {
        if (err) {
            console.log(err);
            cb(err);
        } else {
            console.log('VM Deallocated: ', result);
            cb(null, result);
        }
    });
}

/* ERROR:
Error: Failed to acquire token for the user.
Error: Get Token request returned http error: 400 and server response: {"error":"invalid_grant","error_description":"AADSTS50034: To sign into this application the account must be added to the dsbconsulting.net directory.\r\nTrace ID: 90280a3e-5570-4d63-a577-f995bdedddc7\r\nCorrelation ID: 695bc84e-d496-4cfd-a972-a6014bad3c7f\r\nTimestamp: 2017-02-10 18:52:35Z","error_codes":[50034],"timestamp":"2017-02-10 18:52:35Z","trace_id":"90280a3e-5570-4d63-a577-f995bdedddc7","correlation_id":"695bc84e-d496-4cfd-a972-a6014bad3c7f"}
*/
msRestAzure.loginWithUsernamePassword(AZURE_USER, AZURE_PASS, function(err, credentials) {
    var START = false;
    var STOP = !START;

    if (err) throw err;
    console.log('Auth Success!');

    computeClient = new computeManagementClient(credentials, SUBSCRIPTION_ID);

    if (START) {
        startVM(function(err, result) {
            console.log('VM Start Done');
        })
    }

    if (STOP) {
        stopVM(function(err, result) {
            console.log('VM stop Done');
            deallocateVM(function(err, result) {
                console.log('Deallcoate Done');
            })
        });
    }

    setInterval(function() {
        getVM(function(err, result) {

        });
    }, 5000);
    /*
        stopVM(function(err, result) {
            if (err) {
                console.log(err);
                return false;
            }
            console.log('VM Stopped Done');

            deallocateVM(function(err, result) {
                console.log('VM Deallocate Done');
            });
        });

    */


});