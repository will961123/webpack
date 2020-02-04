const autoprefixer = require("autoprefixer");

module.exports = {
	plugins: [
		autoprefixer({
			overrideBrowserslist: ['ie >= 8', 'Firefox >= 20', 'Safari >= 5', 'Android >= 4', 'Ios >= 6', 'last 4 version']

		})
	]
};
