var Azure = require('azure');
var msRestAzure = require('ms-rest-azure');
var util = require('util');

var computeManagementClient = require('azure-arm-compute');

var StorageManagementClient = require('azure-arm-storage');
var NetworkManagementClient = require('azure-arm-network');
var ResourceManagementClient = require('azure-arm-resource').ResourceManagementClient;
var SubscriptionManagementClient = require('azure-arm-resource').SubscriptionClient;


var AZURE_USER = 'devuser@davidbensonbeboptechnology.onmicrosoft.com';
var AZURE_PASS = 'ViperPit!2';
var SUBSCRIPTION_ID = '6e65fb7d-2d61-45f3-9d96-550175b20de0';

var gComputeClient, gResourceClient, gStorageClient, gNetworkClient;
//Sample Config
var randomIds = [];
//var gResourceGroupName = _generateRandomId('api-test-rg-', randomIds);
var gVmName = _generateRandomId('api-vm-', randomIds);
//START ----------------------- GET FROM L2 TEAM -----------------------
var location = 'southcentralus';

var gResourceGroupName = 'rg-bebopdevextstorage';
var gStorageAccountName = 'bebopdevextstorage';
//var storageAccountName = _generateRandomId('api-test-storage-', randomIds);
var gVmImageURI = 'https://bebopdevextstorage.blob.core.windows.net/system/Microsoft.Compute/Images/bebop-osDisk.d44d1457-b525-4549-9473-53d2a7ffa2b3.vhd';

var gVmSize = 'Standard_NV6';

//var vnetName = _generateRandomId('testvnet', randomIds);
var gVnetName = 'VN-SouthCentralUS-Prod';
var gVnetResourceGroupName = 'VN-SouthCentralUS-Prod';

//var subnetName = _generateRandomId('testsubnet', randomIds);
var gSubnetName = 'SouthCentralUS-Prod-SubNet1';
var gSubnetResourceGroupName = 'VN-SouthCentralUS-Prod';

var gAdminUsername = 'bebopadmin';
var gAdminPassword = 'eV86HdXtCFT5';
//END ----------------------- GET FROM L2 TEAM -----------------------

var gPublicIPName = _generateRandomId('api-testpip', randomIds);
var gNetworkInterfaceName = _generateRandomId('api-testnic', randomIds);
var gIpConfigName = _generateRandomId('api-testcrpip', randomIds);
var gDomainNameLabel = _generateRandomId('api-testdomainname', randomIds);
var gOsDiskName = _generateRandomId('api-testosdisk', randomIds);

var gStorageImageReference = {
    publisher: 'microsoftwindowsserver',
    offer: 'windowsserver',
    sku: '2012-r2-datacenter',
    osType: 'Windows',
    version: 'latest'
};

//Step 1
function createResourceGroup(resourceGroupName, callback) {
    var groupParameters = {
        location: location,
        tags: {
            sampletag: 'simran_Jan2018'
        }
    };
    console.log('Creating resource group: ' + resourceGroupName);
    return gResourceClient.resourceGroups.createOrUpdate(resourceGroupName, groupParameters, callback);
}
//Step 2
function createStorageAccount(callback) {
    console.log('Creating storage account: ' + gStorageAccountName);
    var accountParameters = {
        location: location,
        accountType: 'Standard_LRS'
    };
    return gStorageClient.storageAccounts.create(gResourceGroupName, gStorageAccountName, accountParameters, callback);
}

//Step 3
function createVnet(callback) {
    var vnetParameters = {
        location: location,
        addressSpace: {
            addressPrefixes: ['10.0.0.0/16']
        },
        dhcpOptions: {
            dnsServers: ['10.1.1.1', '10.1.2.4']
        },
        subnets: [{
            name: subnetName,
            addressPrefix: '10.0.0.0/24'
        }],
    };
    console.log('\nCreating vnet: ' + vnetName);
    return networkClient.virtualNetworks.createOrUpdate(gResourceGroupName, gVnetName, vnetParameters, callback);
}

function _generateRandomId(prefix, currentList) {
    var newNumber;
    while (true) {
        newNumber = prefix + Math.floor(Math.random() * 10000);
        if (!currentList || currentList.indexOf(newNumber) === -1) {
            break;
        }
    }
    return newNumber;
}


function getSubnetInfo(callback) {
    console.log('\nGetting subnet info for: ', gSubnetResourceGroupName, gSubnetName);
    return gNetworkClient.subnets.get(gSubnetResourceGroupName, gVnetName, gSubnetName, callback);
}

function createNIC(subnetInfo, publicIPInfo, callback) {
    var nicParameters = {
        location: location,
        ipConfigurations: [{
            name: gIpConfigName,
            privateIPAllocationMethod: 'Dynamic',
            subnet: subnetInfo,
            publicIPAddress: publicIPInfo
        }]
    };
    console.log('\nCreating Network Interface: ' + gNetworkInterfaceName);
    return gNetworkClient.networkInterfaces.createOrUpdate(gResourceGroupName, gNetworkInterfaceName, nicParameters, callback);
}

function findVMImage(callback) {
    console.log(util.format('\nFinding a VM Image for location %s from ' +
        'publisher %s with offer %s and sku %s', location, publisher, offer, sku));
    return computeClient.virtualMachineImages.list(location, gStorageImageReference.publisher, gStorageImageReference.offer, gStorageImageReference.sku, {
        top: 1
    }, callback);
}

// https://docs.microsoft.com/en-us/rest/api/compute/virtualmachines/virtualmachines-create-or-update
function createVirtualMachine(newlyCreatedResourceGroup, nicId, callback) {

    //TODO, get from AMI Profile
    var resourceGroupForImage = 'BEBOP-AMI';
    var amiId = 'Bebop-AMI-AvidAdobe-20180117';

    //TODO GET FROM POD PROFILE
    var newWorkstationName = _generateRandomId('simjan18vm-', randomIds);

    //SUBSCRIPTION_ID from region profile

    var vmParameters = {
        location: location,
        osProfile: {
            computerName: newWorkstationName,
            adminUsername: gAdminUsername,
            adminPassword: gAdminPassword
        },
        hardwareProfile: {
            vmSize: gVmSize
        },
        storageProfile: {

            imageReference: {
                id: `/subscriptions/${SUBSCRIPTION_ID}/resourceGroups/${resourceGroupForImage}/providers/Microsoft.Compute/images/${amiId}`
            },
            osDisk: {
                name: gOsDiskName,
                caching: 'None',
                createOption: 'FromImage',
                osType: 'Windows'
            },
        },
        networkProfile: {
            networkInterfaces: [{
                id: nicId,
                primary: true
            }]
        }
    };
    console.log('Creating Virtual Machine: ' + gVmName);
    gComputeClient.virtualMachines.beginCreateOrUpdate(newlyCreatedResourceGroup, newWorkstationName, vmParameters, callback);
}



/*
	Main function to launch VM
*/


function launchVMSimple2() {

    getSubnetInfo(function(err, subnetInfo) {
        if (err) {
            console.log(err);
            return false;
        }
        createNIC(subnetInfo, null, function(err, nicInfo) {
            if (err) {
                console.log(err);
                return false;
            }

            createVirtualMachine(nicInfo.id, function(err, vmInfo) {
                if (err) {
                    console.log(err);
                    return false;
                }

                console.log('Created VM: ', util.inspect(vmInfo, {
                    depth: null
                }));

            });
        });
    });

}


function launchVMSimpleOrg() {
    var aResourceGroupName = _generateRandomId('rgWorkstation-', randomIds);
    createResourceGroup(aResourceGroupName, function(err, rgObj) {
        if (err) {
            console.log(err);
            return false;
        }

        /*
        { id: '/subscriptions/6e65fb7d-2d61-45f3-9d96-550175b20de0/resourceGroups/rgWorkstation-3572',
  name: 'rgWorkstation-3572',
  properties: { provisioningState: 'Succeeded' },
  location: 'southcentralus',
  tags: { sampletag: 'simran_Jan2018' } }
  */

        console.log(rgObj);
        /*
        getSubnetInfo(function(err, subnetInfo) {
            if (err) {
                console.log(err);
                return false;
            }

            createNIC(subnetInfo, null, function(err, nicInfo) {
                if (err) {
                    console.log(err);
                    return false;
                }


                createVirtualMachine(nicInfo.id, function(err, vmInfo) {
                    if (err) {
                        console.log(err);
                        return false;
                    }

                    console.log('Created VM: ', util.inspect(vmInfo, {
                        depth: null
                    }));

                });

            });

        });
          */
    });

}

function launchVMSimple() {
    var aResourceGroupName = _generateRandomId('rgWorkstation-', randomIds);
    createResourceGroup(aResourceGroupName, function(err, rgObj) {
        if (err) {
            console.log(err);
            return false;
        }
        getSubnetInfo(function(err, subnetInfo) {
            if (err) {
                console.log(err);
                return false;
            }

            createNIC(subnetInfo, null, function(err, nicInfo) {
                if (err) {
                    console.log(err);
                    return false;
                }


                createVirtualMachine(aResourceGroupName, nicInfo.id, function(err, vmInfo) {
                    if (err) {
                        console.log(err);
                        return false;
                    }

                    console.log('Created VM: ', util.inspect(vmInfo, {
                        depth: null
                    }));

                });

            });

        });
    });

}


function launchVM() {
    createResourceGroup(function(err, result) {
        if (err) return finalCallback(err);
        createStorageAccount(function(err, accountInfo) {
            if (err) return finalCallback(err);
            createVnet(function(err, vnetInfo) {
                if (err) return finalCallback(err);
                console.log('\nCreated vnet:\n' + util.inspect(vnetInfo, {
                    depth: null
                }));
                getSubnetInfo(function(err, subnetInfo) {
                    if (err) return finalCallback(err);
                    console.log('\nFound subnet:\n' + util.inspect(subnetInfo, {
                        depth: null
                    }));
                    createPublicIP(function(err, publicIPInfo) {
                        if (err) return finalCallback(err);
                        console.log('\nCreated public IP:\n' + util.inspect(publicIPInfo, {
                            depth: null
                        }));
                        createNIC(subnetInfo, publicIPInfo, function(err, nicInfo) {
                            if (err) return finalCallback(err);
                            console.log('\nCreated Network Interface:\n' + util.inspect(nicInfo, {
                                depth: null
                            }));
                            findVMImage(function(err, vmImageInfo) {
                                if (err) return finalCallback(err);
                                console.log('\nFound Vm Image:\n' + util.inspect(vmImageInfo, {
                                    depth: null
                                }));
                                createVirtualMachine(nicInfo.id, vmImageInfo[0].name, function(err, vmInfo) {
                                    if (err) return finalCallback(err);
                                    //console.log('\nCreated VM:\n' + util.inspect(vmInfo, { depth: null }));
                                    return finalCallback(null, vmInfo);
                                });
                            });
                        });
                    });
                });
            });
        });
    });

}

/*
	Start here
*/
msRestAzure.loginWithUsernamePassword(AZURE_USER, AZURE_PASS, function(err, credentials) {
    if (err) throw err;
    console.log('Auth Success!');
    gComputeClient = new computeManagementClient(credentials, SUBSCRIPTION_ID);
    gResourceClient = new ResourceManagementClient(credentials, SUBSCRIPTION_ID);
    gStorageClient = new StorageManagementClient(credentials, SUBSCRIPTION_ID);
    gNetworkClient = new NetworkManagementClient(credentials, SUBSCRIPTION_ID);

    launchVMSimple();
    //findVMImage();

});