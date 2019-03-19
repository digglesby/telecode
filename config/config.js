const fs = require('fs');
const privateKey = fs.readFileSync( 'telecode.digglesby.com.key' );
const certificate = fs.readFileSync( 'telecode.digglesby.com.server.crt' );

module.exports = {
	"DEV":true,
	"SSL":false,
	'PRIVATE_KEY':privateKey,
	"CERTIFICATE":certificate,
	"PORT":3000
}
