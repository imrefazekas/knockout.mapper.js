var gulp = global.gulp = require('gulp'),
	plugins = global.plugins = require("gulp-load-plugins")( { scope: ['devDependencies'] } );

gulp.task( 'jshint', function(callback) {
	return gulp.src( 'knockout.mapper.js' )
		.pipe( global.plugins.jshint( { "predef": [ "define", "ko" ] } ) )
		.pipe( global.plugins.jshint.reporter('default' ));
} );

gulp.task( 'uglify', function(callback) {
	return gulp.src( 'knockout.mapper.js' )
		.pipe( global.plugins.rename( 'knockout.mapper.min.js') )
		.pipe( global.plugins.uglify( {outSourceMap: true} ) )
		.pipe( gulp.dest('./') );
} );

gulp.task( 'default', [ 'jshint', 'uglify' ] );
