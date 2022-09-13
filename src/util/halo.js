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

// temporary until extracted into separate npm module

export const AUTHORIZATION_KEY = 'TE1TX0FVVEg';
export const CONTEXT_KEY = 'TE1TX0NPTlRFWFQ';
const url = {
	gateway: 'https://gateway.halo.gcu.edu',
	validate: 'https://halo.gcu.edu/api/token-validate/',
};

export const getUserOverview = async function ({ cookie, uid }) {
	const res = await (
		await fetch(url.gateway, {
			method: 'POST',
			headers: {
				accept: '*/*',
				'content-type': 'application/json',
				authorization: `Bearer ${cookie.TE1TX0FVVEg}`,
				contexttoken: `Bearer ${cookie.TE1TX0NPTlRFWFQ}`,
			},
			body: JSON.stringify({
				//Specific GraphQL query syntax, reverse-engineered
				operationName: 'HeaderFields',
				variables: {
					userId: uid,
					skipClasses: false,
					//skipInboxCount: true,
				},
				query: 'query HeaderFields($userId: String!, $skipClasses: Boolean!) {\n  userInfo: getUserById(id: $userId) {\n    id\n    firstName\n    lastName\n    userImgUrl\n    sourceId\n    __typename\n  }\n  classes: getCourseClassesForUser @skip(if: $skipClasses) {\n    courseClasses {\n      id\n      classCode\n      slugId\n      startDate\n      endDate\n      name\n      description\n      stage\n      modality\n      version\n      courseCode\n      units {\n        id\n        current\n        title\n        sequence\n        __typename\n      }\n      instructors {\n        ...headerUserFields\n        __typename\n      }\n      students {\n        isAccommodated\n        isHonors\n        ...headerUserFields\n        __typename\n      }\n      __typename\n    }\n    __typename\n  }\n}\n\nfragment headerUserFields on CourseClassUser {\n  id\n  courseClassId\n  roleName\n  baseRoleName\n  status\n  userId\n  user {\n    ...headerUser\n    __typename\n  }\n  __typename\n}\n\nfragment headerUser on User {\n  id\n  userStatus\n  firstName\n  lastName\n  userImgUrl\n  sourceId\n  lastLogin\n  __typename\n}\n',
			}),
		})
	).json();

	if (res?.errors?.[0]?.message?.includes('401')) throw res.errors;
	//Error handling and data validation could be improved
	if (res.error) return console.error(res.error);
	return res.data;
};

/**
 * Get the Halo user ID from a Halo cookie object
 * @param {Object} args Destructured arguments
 * @param {Object} args.cookie Cookie object of the user
 * @returns {Promise<string>} Halo UID, pulled from the cookie
 */
export const getUserId = async function ({ cookie }) {
	const res = await (
		await fetch(url.validate, {
			method: 'POST',
			headers: {
				accept: '*/*',
				'content-type': 'application/json',
				authorization: `Bearer ${cookie.TE1TX0FVVEg}`,
				contexttoken: `Bearer ${cookie.TE1TX0NPTlRFWFQ}`,
			},
			body: JSON.stringify({
				userToken: cookie.TE1TX0FVVEg,
				contextToken: cookie.TE1TX0NPTlRFWFQ,
			}),
		})
	).json();

	if (res?.errors?.[0]?.message?.includes('401')) throw { code: 401, cookie };
	//Error handling and data validation could be improved
	if (res.error) return console.error(res.error);
	return res.payload.userid;
};

export const getHaloUserInfo = async function ({ cookie }) {
	const res = await (
		await fetch(url.validate, {
			method: 'POST',
			headers: {
				accept: '*/*',
				'content-type': 'application/json',
				authorization: `Bearer ${cookie.TE1TX0FVVEg}`,
				contexttoken: `Bearer ${cookie.TE1TX0NPTlRFWFQ}`,
			},
			body: JSON.stringify({
				userToken: cookie.TE1TX0FVVEg,
				contextToken: cookie.TE1TX0NPTlRFWFQ,
			}),
		})
	).json();

	if (res?.errors?.[0]?.message?.includes('401')) throw { code: 401, cookie };
	//Error handling and data validation could be improved
	if (res.error) return console.error(res.error);
	return res.payload;
};

export const getCookie = async function () {
	const cookies = await chrome.cookies.getAll({ url: 'https://halo.gcu.edu' });
	return cookies.reduce((acc, cookie) => ({ ...acc, [cookie.name]: cookie.value }), {});
};
