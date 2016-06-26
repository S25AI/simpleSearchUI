"use strict";

const gulp          = require('gulp');
const sass          = require('gulp-sass');
const browserSync   = require('browser-sync').create();
const runSequence   = require('run-sequence');

gulp.task('greet', () => {
	console.log(`Hello, user`);
});

gulp.task('browserSync', () => {
	browserSync.init({
		server: {
			baseDir: 'dist'
		}
	});
});

gulp.task('sass', () => {
	return gulp.src('src/sass/main.sass')
		.pipe(sass({outputStyle: 'expanded'}))
		.pipe(gulp.dest('dist/css'))
		.pipe(browserSync.reload({
			stream: true
		}));
});

gulp.task('watch', ['browserSync', 'sass'], () => {
	gulp.watch('src/sass/*.sass', ['sass']);
});

gulp.task('default', callback => {
	runSequence(['sass', 'browserSync', 'watch'], callback);
});