var Azure = require('azure');
var msRestAzure = require('ms-rest-azure');
var util = require('util');

var computeManagementClient = require('azure-arm-compute');

var StorageManagementClient = require('azure-arm-storage');
var NetworkManagementClient = require('azure-arm-network');
var ResourceManagementClient = require('azure-arm-resource').ResourceManagementClient;
var SubscriptionManagementClient = require('azure-arm-resource').SubscriptionClient;



var AZURE_USER = 'devuser@davidbensonbeboptechnology.onmicrosoft.com';
var AZURE_PASS = 'Batman1qaz';
var SUBSCRIPTION_ID = 'abb8a257-30cb-4b25-9cb5-de7bbc0f39dc';

var gComputeClient, gResourceClient, gStorageClient, gNetworkClient;

//Sample Config
var randomIds = [];
var location = 'eastus';
//var gResourceGroupName = _generateRandomId('api-test-rg-', randomIds);


var gVmName = _generateRandomId('api-vm-', randomIds);
//START ----------------------- GET FROM L2 TEAM -----------------------
var gResourceGroupName = 'RG-testvm';

var gStorageAccountName = 'rgtestvmdisks927';
//var storageAccountName = _generateRandomId('api-test-storage-', randomIds);

var gVmImageName = 'https://rgtestvmdisks927.blob.core.windows.net/system/Microsoft.Compute/Images/testtemplate/template-osDisk.5d248dc0-a027-4cb1-9021-bb7f09096755.vhd';

//var vnetName = _generateRandomId('testvnet', randomIds);
var gVnetName = 'VNet-SouthCentralUS-Dev';
var gVnetResourceGroupName = 'RG-SouthCentralUS-Dev';

//var subnetName = _generateRandomId('testsubnet', randomIds);
var gSubnetName = 'SouthCentralUS-Subnet1';
var gSubnetResourceGroupName = 'RG-SouthCentralUS-Dev';

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
function createResourceGroup(callback) {
    var groupParameters = {
        location: location,
        tags: {
            sampletag: 'apiSampleValue'
        }
    };
    console.log('Creating resource group: ' + gResourceGroupName);
    return gResourceClient.resourceGroups.createOrUpdate(gResourceGroupName, groupParameters, callback);
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

    console.log('\nGetting subnet info for: ' + gSubnetName);
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
    return gNetworkClient.networkInterfaces.createOrUpdate(gVnetResourceGroupName, gNetworkInterfaceName, nicParameters, callback);
}

function findVMImage(callback) {
    console.log(util.format('\nFinding a VM Image for location %s from ' +
        'publisher %s with offer %s and sku %s', location, publisher, offer, sku));
    return computeClient.virtualMachineImages.list(location, gStorageImageReference.publisher, gStorageImageReference.offer, gStorageImageReference.sku, {
        top: 1
    }, callback);
}


function createVirtualMachine(nicId, callback) {

    var vmParameters = {
        location: location,
        osProfile: {
            computerName: gVmName,
            adminUsername: gAdminUsername,
            adminPassword: gAdminPassword
        },
        hardwareProfile: {
            vmSize: 'Standard_A1'
        },
        storageProfile: {

            osDisk: {
                name: gOsDiskName,
                caching: 'None',
                createOption: 'FromImage',
                osType: 'Windows',
                vhd: {
                    uri: 'https://' + gStorageAccountName + '.blob.core.windows.net/vhds/customvm1djlgjqeg4mkx4osDisktest1.vhd'
                },
                image: {
                    uri: 'https://imagetestvmdisks240.blob.core.windows.net/system/Microsoft.Compute/Images/customimage/azcustomimage-osDisk.057fdab2-2ef3-4efe-82da-990e4596c2b2.vhd'
                }
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
    gComputeClient.virtualMachines.createOrUpdate(gResourceGroupName, gVmName, vmParameters, callback);
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

function launchVMSimple() {
    createResourceGroup(function(err, result) {
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

    launchVMSimple2();
    //findVMImage();

});