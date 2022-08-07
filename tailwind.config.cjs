module.exports = {
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
				},
			},
		],
	},
	content: ['./src/**/*.svelte'],
	plugins: [require('daisyui')],
};
