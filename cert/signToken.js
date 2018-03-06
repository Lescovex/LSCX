var jwt = require('jsonwebtoken');
var fs = require('fs');
var token = jwt.sign({ foo: 'bar' }, 'shhhhh');
//backdate a jwt 30 seconds
var older_token = jwt.sign({ foo: 'bar', iat: Math.floor(Date.now() / 1000) - 30 }, 'shhhhh');

// sign with RSA SHA256
var cert = fs.readFileSync('privkey.pem');  // get private key
var token = jwt.sign({ foo: 'bar' }, {key : cert,passphrase:'12345'}, { algorithm: 'RS256'});
console.log(token);
