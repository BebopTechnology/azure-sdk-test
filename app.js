var Azure = require('azure');
var MsRest = require('ms-rest-azure');

var AZURE_USER = 'test@domain.net';
var AZURE_PASS = '****';

/* ERROR:
Error: Failed to acquire token for the user.
Error: Get Token request returned http error: 400 and server response: {"error":"invalid_grant","error_description":"AADSTS50034: To sign into this application the account must be added to the dsbconsulting.net directory.\r\nTrace ID: 90280a3e-5570-4d63-a577-f995bdedddc7\r\nCorrelation ID: 695bc84e-d496-4cfd-a972-a6014bad3c7f\r\nTimestamp: 2017-02-10 18:52:35Z","error_codes":[50034],"timestamp":"2017-02-10 18:52:35Z","trace_id":"90280a3e-5570-4d63-a577-f995bdedddc7","correlation_id":"695bc84e-d496-4cfd-a972-a6014bad3c7f"}
*/
MsRest.loginWithUsernamePassword(AZURE_USER, AZURE_PASS, function(err, credentials) {
    if (err) throw err;

    var storageClient = Azure.createARMStorageManagementClient(credentials, 'subscription-id');

});