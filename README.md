# SPID/CIE OIDC Federation Relying Party in Node.js

This project is an example full web server built in Express for a <b>Relying Party</b> in the <b>SPID/CIE Openid Connect Federation</b>, with all the requirements and directives given by AGID + Team Digitale ([technical rules](https://docs.italia.it/italia/spid/spid-cie-oidc-docs/it/versione-corrente/index.html)).

The project is based on the [spid-cie-oidc-nodejs](https://github.com/italia/spid-cie-oidc-nodejs/) project, by the developers community of the Italian government, which uses a suite of <b>Node.js libraries</b>. 

In order to try the project and perform some tests, a Federation Authority and a Provider server are needed, which are developed using a Django SDK ([spid-cie-oidc-django](https://github.com/italia/spid-cie-oidc-django/tree/main)).

## Setup

To setup the project and the test servers, see the full documentation provided in the [spid-cie-oidc-nodejs](https://github.com/italia/spid-cie-oidc-nodejs/) public repo.

## Main changes from the original project

The main differences from the original project are: 

<ul>
    <li><b>OPs listing</b> - function to get the list of the SPID providers by querying the Federation Listing Endpoint.</li>
    <li><b>Resolve endpoint</b> - Mandatory federation endpoint to resolve another subject.</li>
    <li><b>Changes in metadata</b> - Added mandatory params (e.g. those relative to signing and encryption algorithms).</li>
   	<li><b>Added error descriptions</b></li>
    <li><b>Changed http client</b> - New HTTP client (axios) to perform https requests and better known.</li>
    <li><b>Different jwks</b> - Implemented the difference between the JWKS Federation Keys and the OIDC Core keys.</li>
    <li>Some small fixes</li>
</ul>

