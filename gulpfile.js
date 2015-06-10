var gulp = require('gulp'),
    uglify = require('gulp-uglify'),
    htmlreplace = require('gulp-html-replace'),
    source = require('vinyl-source-stream'),
    concat = require('gulp-concat'),
    order = require('gulp-order'),
    browserify = require('browserify'),
    watchify = require('watchify'),
    reactify = require('reactify'),
    streamify = require('gulp-streamify'),
    less = require('gulp-less'),
    livereload = require('gulp-livereload');

// base paths
var static_path = 'openframe/static',
    bower_path = static_path + '/components',
    template_path = 'openframe/templates';

// explicit file/dir paths
var path = {
    HTML: template_path + '/index.html',

    // CSS
    LESS_SRC: [
        static_path + '/src/less/*.less',
        static_path + '/src/bootstrap/less/*.less'
    ],
    LESS_ENTRY_POINT: static_path + '/src/less/styles.less',
    BOOTSTRAP_LESS_ENTRY_POINT: static_path + '/src/bootstrap/less/bootstrap.less',
    CSS_DIST: static_path + '/dist/css',
    CSS_BUILD: static_path + '/dist/css/*.css',

    // JAVASCRIPT
    JS_LIBS_SRC: [
        bower_path + '/jquery/dist/jquery.js',
        bower_path + '/bootstrap/dist/js/bootstrap.js',
        bower_path + '/swiper/dist/js/swiper.min.js',
        bower_path + '/lodash/lodash.js',
        bower_path + '/react/react.js'
    ],
    JS_APP_SRC: static_path + '/src/js',
    JS_DIST: static_path + '/dist/js',
    JS_BUILD_FILENAME: 'build.js',
    JS_MINIFIED_BUILD_FILENAME: 'build.min.js',
    JS_DEST_BUILD: static_path + '/dist/js',
    JS_ENTRY_POINT: static_path + '/src/js/react-app.js',

    // IMAGES
    IMG_SRC: static_path + '/src/img/*',
    IMG_DIST: static_path + '/dist/img',

    // FONTS
    FONT_SRC: static_path + '/src/bootstrap/fonts/*',
    FONT_DIST: static_path + '/dist/fonts'
};

// 
// DEV TASKS
// 

process.env.BROWSERIFYSHIM_DIAGNOSTICS=1;

// Currently unused. Copies the html to the dist destination.
gulp.task('copy', function() {
    gulp.src(path.HTML)
        .pipe(gulp.dest(path.DEST));
});

// Concat all Vendor dependencies
gulp.task('libs', function() {
    gulp.src( path.JS_LIBS_SRC )
       .pipe(concat('libs.js'))
       .pipe(gulp.dest(path.JS_DIST));
});

// Custom LESS compiling
gulp.task('less', function() {
    return gulp.src(path.LESS_ENTRY_POINT)
        .pipe(less())
        // handle errors so the compiler doesn't stop
        .on('error', function (err) {
            console.log(err.message);
            this.emit('end');
        })
        .pipe(gulp.dest(path.CSS_DIST));
});

// Bootstrap LESS compiling
gulp.task('bootstrap', function() {
    return gulp.src(path.BOOTSTRAP_LESS_ENTRY_POINT)
        .pipe(less())
        // handle errors so the compiler doesn't stop
        .on('error', function (err) {
            console.log(err.message);
            this.emit('end');
        })
        .pipe(gulp.dest(path.CSS_DIST));
});

// Move images to dist directory
gulp.task('img', function() {
    gulp.src(path.IMG_SRC)
        .pipe(gulp.dest(path.IMG_DIST));
});

// Move fonts to dist directory
gulp.task('fonts', function() {
    gulp.src(path.FONT_SRC)
        .pipe(gulp.dest(path.FONT_DIST));
});

// Compile both custom and bootstrap LESS, then concat into a singl
// CSS output.
gulp.task('css', ['less', 'bootstrap'], function() {
    gulp.src([path.CSS_DIST + '/*.css', '!' + path.CSS_DIST + '/all-styles.css'])
        .pipe(concat('all-styles.css'))
        .pipe(gulp.dest(path.CSS_DIST))
        .pipe(livereload());
});

// Watch for changes to ann of the less files or javascript files
// and recompile to dist
gulp.task('watch', function() {
    livereload.listen();
    gulp.watch(path.LESS_SRC, ['css', 'img', 'fonts']);

    var watcher = watchify(browserify({
        entries: [path.JS_ENTRY_POINT],
        transform: [reactify],
        debug: true,
        cache: {},
        packageCache: {},
        fullPaths: true
    }));

    return watcher.on('update', function() {
            watcher.bundle()
                .on('error', function (err) {
                    console.log(err.message);
                    this.emit('end');
                })
                .pipe(source(path.JS_BUILD_FILENAME))
                .pipe(gulp.dest(path.JS_DIST));
            
            console.log('Updated');

        })
        .bundle()
        .pipe(source(path.JS_BUILD_FILENAME))
        .pipe(gulp.dest(path.JS_DIST));
});

// 
// PROD TASKS
// 

gulp.task('build', function() {
    browserify({
            entries: [path.JS_ENTRY_POINT],
            transform: [reactify]
        })
        .bundle()
        .pipe(source(path.JS_MINIFIED_BUILD_FILENAME))
        .pipe(streamify(uglify(path.JS_MINIFIED_BUILD_FILENAME)))
        .pipe(gulp.dest(path.JS_DEST_BUILD));
});

gulp.task('default', ['watch']);
