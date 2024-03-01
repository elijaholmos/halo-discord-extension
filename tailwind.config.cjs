/*
 * Copyright (C) 2024 Elijah Olmos
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

/*
 * Copyright (C) 2023 Elijah Olmos
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

const withOpacityValue = function (variable) {
	return ({ opacityValue }) => {
		if (opacityValue === undefined) {
			return `hsl(var(${variable}))`;
		}
		return `hsl(var(${variable}) / ${opacityValue})`;
	};
};

const noop = function (variable) {
	return () => `hsl(var(${variable}))`;
};

module.exports = {
	theme: {
		extend: {
			colors: {
				discord: withOpacityValue('--discord'),
				'discord-hover': noop('--discord-hover'),
			},
		},
	},
	daisyui: {
		themes: [
			{
				default: {
					primary: '#883fb9',
					secondary: '#f38cc1',
					accent: '#eecd11',
					neutral: '#d6d3d1',
					'base-100': '#1c1917',
					'base-200': '#3c3530',
					info: '#38bdf8',
					success: '#4ade80',
					warning: '#f59e0b',
					error: '#ef4444',
					'--discord': '234 86% 65%',
					'--discord-hover': '235, 66%, 70%',
				},
			},
		],
	},
	content: ['./src/**/*.svelte'],
	plugins: [require('daisyui')],
};
