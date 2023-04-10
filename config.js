// Get the connection type
var _baseProtocol = (location.protocol === 'https:' ? "https" : "http");
var _baseUrl = _baseProtocol + '://connector.emobiq.com';
var _connectorsUrl = _baseProtocol + '://connector.emobiq.com';

// Prepare the default base configuration
var _baseConfig = {
    appid: '167400835835714',
    packagename: 'com.orangekloud.SpecTruckv2',
    appmain: _baseUrl + '/',
    api: _baseUrl + '/api',
    appmainhost: _baseUrl + '/app3/',
    navservice: _connectorsUrl + '/connector/nav/',
    rawservice: _connectorsUrl + '/connector/raw/',
    rawsqlservice: _connectorsUrl + '/rawsqlconnector/',
    axservice: _connectorsUrl + '/axconnector/',
    mssqlservice: _connectorsUrl + '/mssqlconnector/',
    crmservice: _connectorsUrl + '/crmconnector/',
    crm365service: _connectorsUrl + ':12000/crm/',
    mailservice: _connectorsUrl + '/mailconnector/',
    assetPath: _connectorsUrl + '/archive/app/167400835835714/asset/',
    publicAssetPath: _connectorsUrl + '/archive/public/',
    urlConnectorSapB1: _connectorsUrl + '/connector/sapb1/',
    urlConnectorDynamicsGP: _connectorsUrl + '/connector/dynamicsgp/',
    urlConnectorSOAP: _connectorsUrl + '/connector/soap/',
    urlConnectorAcumatica: _connectorsUrl + '/connector/acumatica/',
    urlConnectorSAGE: _connectorsUrl + '/connector/sage/',
    urlConnectorPayPal: _connectorsUrl + '/connector/paypal/',
    urlConnectorREST: _connectorsUrl + '/connector/rest/',

    urlMicrosoftOAuth2: 'https://login.microsoftonline.com',
    urlMicrosoftOAuth2ScopeDynamicsBC: 'https://api.businesscentral.dynamics.com/.default'
}
