const gulp = require('gulp');
const sass = require('gulp-sass');
const autoprefixer = require('gulp-autoprefixer');
const uglify = require('gulp-uglify');
const babel = require('gulp-babel');
const htmlmin = require('gulp-htmlmin');
const image = require('gulp-image');
const browsersync = require('browser-sync').create();
const cleancss = require('gulp-clean-css');
const jasmineBrowser = require('gulp-jasmine-browser');
const browserify = require('browserify');
const source = require('vinyl-source-stream');

function promisifyStream(stream) {
  return new Promise((resolve) => stream.on('end', resolve));
}

gulp.task('browserify', function() {
  return browserify('src/js/app.js')
    .bundle()
    //Pass desired output filename to vinyl-source-stream
    .pipe(source('bundle.js'))
    // Start piping stream to tasks!
    .pipe(gulp.dest('src/js/'));
})

gulp.task('sass', async function() {
  await promisifyStream(
    gulp.src('src/scss/*.scss')
        .pipe(sass({ouputStyle: 'compressed'}).on('error', sass.logError))
        .pipe(gulp.dest('src/css'))
  )
});

gulp.task('start-sass', function() {
  return gulp.src('src/scss/*.scss')
        .pipe(sass({ouputStyle: 'compressed'}).on('error', sass.logError))
        .pipe(gulp.dest('src/css'))
        // .pipe(browsersync.stream())
});

gulp.task('cleancss', async function() {
  await promisifyStream(
    gulp.src('src/css/*.css')
      .pipe(cleancss({compatibility: 'ie8'}))
      .pipe(gulp.dest('dist/css'))
  )
})

gulp.task('autoprefixer', async function() {
  await promisifyStream(
      gulp.src('src/css/*.css', {base: './'})
        .pipe(autoprefixer('last 2 versions'))
        .pipe(gulp.dest('./'))
  )
});

gulp.task('babel', async function() {
  await promisifyStream(
    gulp.src('src/js/bundle.js')
      .pipe(babel({
          presets: [
          ['@babel/env', {
            modules: false
          }]
        ]
      }))
      .pipe(gulp.dest('dist/js'))
  )
})

gulp.task('uglify', async function() {
  await promisifyStream(
    gulp.src('dist/js/*.js', {base: './'})
      // .pipe(sourcemaps.init())
      .pipe(uglify())
      // .pipe(sourcemaps.write('maps'))
      .pipe(gulp.dest('./'))
  )
})

gulp.task('htmlmin', async function() {
  await promisifyStream(
    gulp.src('src/**/*.html')
      .pipe(htmlmin({ collapseWhitespace: true }))
      .pipe(gulp.dest('dist'))
  )
})

gulp.task('image', async function () {
  await promisifyStream(
    gulp.src('src/img/*')
    .pipe(image())
    .pipe(gulp.dest('dist/img'))
  )
})

gulp.task('tests', async function() {
    gulp
        .src('src/js/app.js')
        .pipe(jasmineBrowser.specRunner())
        .pipe(jasmineBrowser.server({ port: 3001 }));
});

gulp.task('start', async function() {
  // (gulp.series('browsersync'))();
  browsersync.init({
      server:  {
        baseDir : "src"
      }
  });
  gulp.watch('src/scss/*.scss', {ignoreInitial: false}, gulp.series('start-sass', 'browserify')).on('change', browsersync.reload);
  gulp.watch(['src/*.html', 'src/js/*.js']).on('change', browsersync.reload);
})

gulp.task('build', async function() {
  (gulp.series('sass', 'autoprefixer', 'cleancss', 'browserify', 'babel', 'uglify', 'htmlmin', 'image'))();
});
