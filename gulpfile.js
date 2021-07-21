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
const babelify = require('babelify');
const env = require('gulp-env');
const template = require('gulp-template');
const rename = require('gulp-rename');

function promisifyStream(stream) {
  return new Promise((resolve) => stream.on('end', resolve));
}

gulp.task('dev_env', () => new Promise((resolve, reject) => {
  env({
    file: '.env',
  });
  resolve();
}));

gulp.task('config', async () => {
  await promisifyStream(
    gulp.src('app.config.tmpl.js')
      .pipe(template({
        rapidapiKey: process.env.rapidapiKey,
        azureKey: process.env.azureKey,
      }))
      .pipe(rename('app.config.js'))
      .pipe(gulp.dest('./')),
  );
});

gulp.task('copy', () => gulp.src('src/favicon.ico')
  .pipe(gulp.dest('dist')));

gulp.task('browserify', () => browserify('src/js/app.js', { sourceType: module })
  .bundle()
// Pass desired output filename to vinyl-source-stream
  .pipe(source('bundle.js'))
// Start piping stream to tasks!
  .pipe(gulp.dest('src/js/')));

gulp.task('sass', async () => {
  await promisifyStream(
    gulp.src('src/scss/*.scss')
      .pipe(sass(
        {
          ouputStyle: 'compressed',
        },
      ).on('error', sass.logError))
      .pipe(gulp.dest('src/css')),
  );
});

gulp.task('start-sass', () => gulp.src('src/scss/*.scss')
  .pipe(sass({
    ouputStyle: 'compressed',
  }).on('error', sass.logError))
  .pipe(gulp.dest('src/css'))
  .pipe(browsersync.stream()));

gulp.task('cleancss', async () => {
  await promisifyStream(
    gulp.src('src/css/*.css')
      .pipe(cleancss({ compatibility: 'ie8' }))
      .pipe(gulp.dest('dist/css')),
  );
});

gulp.task('autoprefixer', async () => {
  await promisifyStream(
    gulp.src('src/css/*.css', { base: './' })
      .pipe(autoprefixer('last 2 versions'))
      .pipe(gulp.dest('./')),
  );
});

gulp.task('babel', async () => {
  await promisifyStream(
    gulp.src('src/js/bundle.js')
      .pipe(babel({
        presets: [
          ['@babel/env', {
            modules: false,
          }],
        ],
      }))
      .pipe(gulp.dest('dist/js')),
  );
});

gulp.task('uglify', async () => {
  await promisifyStream(
    gulp.src('dist/js/*.js', { base: './' })
      // .pipe(sourcemaps.init())
      .pipe(uglify())
      // .pipe(sourcemaps.write('maps'))
      .pipe(gulp.dest('./')),
  );
});

gulp.task('htmlmin', async () => {
  await promisifyStream(
    gulp.src('src/**/*.html')
      .pipe(htmlmin({ collapseWhitespace: true }))
      .pipe(gulp.dest('dist')),
  );
});

gulp.task('image', async () => {
  await promisifyStream(
    gulp.src('src/img/*')
      .pipe(image())
      .pipe(gulp.dest('dist/img')),
  );
});

gulp.task('reload', (done) => {
  browsersync.reload();
  done();
});

gulp.task('tests', async () => {
  gulp
    .src('src/js/app.js')
    .pipe(jasmineBrowser.specRunner())
    .pipe(jasmineBrowser.server({ port: 3001 }));
});

gulp.task('start', async () => {
  (gulp.parallel('dev_env', 'config'))();
  browsersync.init({
    server: {
      baseDir: 'src',
    },
  });
  gulp.watch('src/scss/*.scss', { ignoreInitial: false }, gulp.series('start-sass'));

  gulp.watch(['src/*.html', 'src/js/*.js', '!src/js/bundle.js'], { ignoreInitial: false }, gulp.series('browserify', 'reload'));
});

gulp.task('build', async () => {
  (gulp.series('dev_env', 'sass', 'autoprefixer', 'cleancss', 'config', 'browserify', 'babel', 'browserify', 'uglify', 'htmlmin', 'image', 'copy'))();
});
