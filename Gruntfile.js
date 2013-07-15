module.exports = function(grunt) {
	grunt.loadNpmTasks('grunt-contrib-jshint');
	grunt.loadNpmTasks('grunt-contrib-uglify');

	grunt.initConfig({
		jshint: {
			all: [ './knockout.mapper.js' ]
		},
		uglify: {
			options: {
				mangle: false
			},
			my_target: {
				files: {
					'./knockout.mapper.min.js': ['./knockout.mapper.js']
				}
			}
		}
	});

	grunt.registerTask('default', ['jshint', 'uglify']);
};