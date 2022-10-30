/*
 * Copyright (C) 2022 Elijah Olmos
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, version 3.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program. If not, see <http://www.gnu.org/licenses/>.
 */

import { decode, encode, fromUint8Array, toUint8Array } from 'js-base64';
import { stores } from '../stores';

/**
 * @param {ArrayBuffer} input
 * @returns {string} base64 encoded string
 */
const base64 = (input) => fromUint8Array(new Uint8Array(input));

/**
 * @param {string} input Base64 encoded string to be AES encrypted
 */
const aesEncrypt = async function (input) {
	const nonce = crypto.getRandomValues(new Uint8Array(12));
	const aes_key = await crypto.subtle.generateKey(
		{
			name: 'AES-GCM',
			length: 256,
		},
		true,
		['encrypt', 'decrypt']
	);
	const encrypted = await crypto.subtle.encrypt(
		{
			name: 'AES-GCM',
			iv: nonce,
		},
		aes_key,
		toUint8Array(input)
	);

	const [value, auth_tag] = [
		encrypted.slice(0, encrypted.byteLength - 16),
		encrypted.slice(encrypted.byteLength - 16),
	];

	return {
		value: base64(value),
		auth_tag: base64(auth_tag),
		nonce: fromUint8Array(nonce),
		aes_key: base64(await crypto.subtle.exportKey('raw', aes_key)),
	};
};

/**
 * @param {string} input base64 encoded string
 * @returns {Promise<string>} base64 encoded string
 */
const rsaEncrypt = async function (input) {
	const { pkey } = stores.health.get('pkey');
	const rsa_key = await crypto.subtle.importKey(
		'spki',
		toUint8Array(decode(pkey).split('\n').slice(1, -2).join('')),
		{
			name: 'RSA-OAEP',
			hash: 'SHA-256',
		},
		false,
		['encrypt']
	);
	const encrypted = await crypto.subtle.encrypt({ name: 'RSA-OAEP' }, rsa_key, toUint8Array(input));

	return base64(encrypted);
};

/**
 * Apply a hybrid AES/RSA encryption algorithm to a utf-8 string
 * @param {string} input utf-8 encoded data payload to be encrypted
 * @returns {Promise<string>} Encrypted utf-8 string of the structure `{aes_key}:{auth_tag}:{nonce}:{value}`. Each component is base64 encoded.
 */
export const encrypt = async function (input) {
	const { aes_key, auth_tag, nonce, value } = await aesEncrypt(encode(input));
	const ekey = await rsaEncrypt(aes_key);
	return [ekey, nonce, auth_tag, value].join(':');
};
