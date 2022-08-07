const fetch = require('node-fetch');
const { client_id, client_secret, dev_client_id, dev_client_secret } =
	process.env;

const tokenExchange = async (event) => {
	try {
		let { code, redirect_uri } = event.queryStringParameters;
		redirect_uri = decodeURIComponent(redirect_uri);
		const res = await fetch('https://discord.com/api/oauth2/token', {
			method: 'POST',
			headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
			body: new URLSearchParams({
				client_id: event.dev ? dev_client_id : client_id,
				client_secret: event.dev ? dev_client_secret : client_secret, //'AEyk1m2mQsDy1Jl19QrCjPHyEZcXWomg',
				grant_type: 'authorization_code',
				code,
				redirect_uri,
			}).toString(),
		});

		return { statusCode: 200, body: { data: res.json() } };
	} catch (e) {
		console.error(e);
		return { statusCode: 500, body: JSON.stringify(e) };
	}
};

const origins = {
	prod: [
		'chrome-extension://ldakjkgbikbopkahholdoojdbhgeepge',
		'chrome-extension://kldfajpfobbfblgngjefabadklacccbi',
	],
	dev: [
		'chrome-extension://ojlbjbemdpmhehlgpanomkemdfopdfim',
		'chrome-extension://aebmfhpemknjmlchapbfkajkfmkmdjdj',
		'chrome-extension://gicgpkhjjgbkhljliibmjklbdkobjalf',
	],
	uninstall: ['http://glassintel.com', 'http://www.glassintel.com'],
};

exports.handler = async (event, context) => {
	const { method } = event.requestContext.http;
	if (method !== 'POST') return { statusCode: 404 };

	const origin = event.headers.origin;
	if (!Object.values(origins).flat().includes(origin))
		return { statusCode: 403 };

	event.dev = origins.dev.includes(origin) ? true : false;

	const { route } = event.queryStringParameters;
	let res = {statusCode: 200, body: {data: {test: 1}}};
	switch (route) {
		case 'code':
			res = await tokenExchange(event);
			break;
		case 'refresh':
			res = await tokenRefresh(event);
			break;
		case 'uninstall':
			//TODO: implement
			break;
	}
	return res;
};
