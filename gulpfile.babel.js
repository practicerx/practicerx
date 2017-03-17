'use strict';

import gulp from 'gulp';
import gulpLoadPlugins from 'gulp-load-plugins';
import runSequence from 'run-sequence';
import browserSync from 'browser-sync';
import swPrecache from 'sw-precache';
const $ = gulpLoadPlugins();

// SASS
gulp.task('sass', function() {
    return gulp.src('_sass/main.sass')
        .pipe($.sass({
            sourceComments: 'map',
            onError: browserSync.notify
        }))
        .pipe(gulp.dest('assets/css'));
});

// Minify and add prefix to css. – changed destination output from '_site/css' to the '_includes' folder so that it can be inline in head.html
gulp.task('css', () => {
  const AUTOPREFIXER_BROWSERS = [
    'ie >= 10',
    'ie_mob >= 10',
    'ff >= 30',
    'chrome >= 34',
    'safari >= 7',
    'opera >= 23',
    'ios >= 7',
    'android >= 4.4',
    'bb >= 10'
  ];

  return gulp.src('assets/css/main.css')
    .pipe($.autoprefixer(AUTOPREFIXER_BROWSERS))
    .pipe($.cssnano())
    .pipe(gulp.dest('_includes/'));
});

// Compile scss to css.
//gulp.task('scss', () => {
  //  return gulp.src('sass/main.sass')
    //    .pipe($.sass({
      //      includePaths: ['css'],
        //    onError: browserSync.notify
  //      }))
    //    .pipe(gulp.dest('css'));
//});

// Minify the HTML.
gulp.task('minify-html', () => {
  return gulp.src('_site/**/*.html')
    .pipe($.htmlmin({
      removeComments: true,
      collapseWhitespace: true,
      collapseBooleanAttributes: true,
      removeAttributeQuotes: true,
      removeRedundantAttributes: true,
      removeEmptyAttributes: true,
      removeScriptTypeAttributes: true,
      removeStyleLinkTypeAttributes: true,
      removeOptionalTags: true
    }))
    .pipe(gulp.dest('_site'));
});

// Optimize images.
gulp.task('minify-images', () => {
  gulp.src('images/**/*')
    .pipe($.imagemin({
      progressive: true,
      interlaced: true
    }))
    .pipe(gulp.dest('_site/images'));
});

// Concatenate, transpiles ES2015 code to ES5 and minify JavaScript.
gulp.task('scripts', () => {
  gulp.src([
    // Note: You need to explicitly list your scripts here in the right order
    //       to be correctly concatenated
    './_scripts/main.js'
  ])
    .pipe($.concat('main.min.js'))
    .pipe($.babel())
    .pipe($.uglify({preserveComments: 'some'}))
    .pipe(gulp.dest('assets/scripts/'));
});

// Watch change in files.
gulp.task('serve', ['jekyll-build'], () => {
  browserSync.init({
    notify: false,
    // Run as an https by uncommenting 'https: true'
    // Note: this uses an unsigned certificate which on first access
    //       will present a certificate warning in the browser.
    https: true,
    server: '_site',
    port: 3000
  });

  // Watch sass changes.
  gulp.watch('_sass/**/*.sass', ['sass']);

  // Watch JavaScript changes.
  gulp.watch('_scripts/**/*.js', ['scripts']);

  // Watch html changes.
  gulp.watch([
    'assets/*.css',
    'scripts/**/*.js',
    '_includes/**/*.html',
    '_layouts/**/*.html',
    '_posts/**/*.md',
    '*.html',
    'index.html'
  ], ['jekyll-build', browserSync.reload]);
});

gulp.task('generate-service-worker', function(callback) {
  var path = require('path');
  var rootDir = '_site';

  swPrecache.write(path.join(rootDir, 'sw.js'), {
    staticFileGlobs: [rootDir + '/**/*.{js,html,css,png,jpg,gif,json}'],
    stripPrefix: rootDir,
    replacePrefix: '/practicerx.github.io'
  }, callback);
});

// ? Running 'sass' task here, I believe, is redundant.
gulp.task('jekyll-build', ['scripts', 'sass', 'css'], $.shell.task([ 'jekyll build' ]));

// Default task.
gulp.task('default', () =>
  runSequence(
    'sass',
    'jekyll-build',
    'minify-html',
    'css',
    'generate-service-worker',
    'minify-images'
  )
);

// Removed 'sass', 'css' for ?redundancy.
gulp.task('build', () =>
  runSequence(
    'minify-html',
    'minify-images',
    'generate-service-worker',
    'serve'
  )
);

// Deploy website to gh-pages.
gulp.task('gh-pages', () => {
  return gulp.src('./_site/**/*')
    .pipe($.ghPages());
});

gulp.task('deploy', () => {
  runSequence(
    'sass',
    'jekyll-build',
    'minify-html',
    'css',
    'generate-service-worker',
    'minify-images',
    'gh-pages'
  )
});
