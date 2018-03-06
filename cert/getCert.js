const x509 = require('x509');
var cert = x509.parseCert('cert.pem');
console.log(JSON.stringify(cert));
