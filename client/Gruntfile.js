module.exports = function (grunt) {

    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-ng-annotate');
    grunt.loadNpmTasks('grunt-contrib-less');
    grunt.loadNpmTasks('grunt-html2js');

    grunt.registerTask('default', ['clean', 'html2js', 'concat', 'copy', 'less:dev']);
    grunt.registerTask('app', ['html2js', 'concat']);
    grunt.registerTask('release', ['clean', 'html2js', 'jshint', 'concat', 'less:release', 'uglify', 'copy']);

    grunt.registerTask('timestamp', function () {
        grunt.log.subhead(Date());
    });


    grunt.initConfig({
        distdir: 'dist',
        modules: 'node_modules',
        pkg: grunt.file.readJSON('package.json'),
        banner: '/*! <%= pkg.title || pkg.name %> - v <%= pkg.version %> - <%= grunt.template.today("yyyy-mm-dd") %> */ \n',
        src: {
            appjs: ['app/**/*.js'],
            appjsTpl: ['<%= distdir %>/templates/**/*.js'],
            tpl: ['app/**/*.html'],
            less: {
                all: ['./less/**/*.less'],
                styles: ['./less/styles.less'],
                app: ['./less/app.less']
            },
            lessWatch: ['src/less/**/*.less']
        },
        clean: ['<%= distdir %>/*'],
        copy: {
            assets: {
                files: [
                    {dest: '<%= distdir %>', src: '**', expand: true, cwd: 'assets/'},
                    {
                        dest: '<%= distdir %>',
                        src: ['fonts/*.*'],
                        expand: true,
                        dot: true,
                        cwd: '<%= modules %>/bootstrap/dist'
                    },
                    {
                        dest: '<%= distdir %>',
                        src: ['fonts/*.*'],
                        expand: true,
                        dot: true,
                        cwd: '<%= modules %>/font-awesome'
                    }
                ]
            }
        },
        ngAnnotate: {
            options: {singleQuotes: true},
            app: {files: [{expand: true, src: '<%= src.appjs %>'}]}
        },
        html2js: {
            app: {
                options: {
                    base: 'app'
                },
                src: ['<%= src.tpl %>'],
                dest: '<%= distdir %>/templates/app.js',
                module: 'templates.app'
            }
        },
        concat: {
            dist: {
                options: {
                    banner: "<%= banner %>"
                },
                src: ['<%= src.appjs %>', '<%= src.appjsTpl %>'],
                dest: '<%= distdir %>/js/<%= pkg.name %>.js'
            }
        },
        uglify: {
            dist: {
                options: {
                    banner: "<%= banner %>"
                },
                src: ['<%= src.appjs %>', '<%= src.appjsTpl %>'],
                dest: '<%= distdir %>/js/<%= pkg.name %>.js'
            }
        },
        less: {
            dev: {
                files: {
                    '<%= distdir %>/css/styles.css': ['<%= src.less.styles %>'],
                    '<%= distdir %>/css/<%= pkg.name %>.css': ['<%= src.less.app %>']
                }
            },
            release: {
                options: {
                    plugins: [
                        new (require('less-plugin-autoprefix'))(),
                        new (require('less-plugin-clean-css'))()
                    ]
                },
                files: {
                    '<%= distdir %>/css/styles.css': ['<%= src.less.styles %>'],
                    '<%= distdir %>/css/<%= pkg.name %>.css': ['<%= src.less.app %>']
                }
            }
        },
        watch: {
            build: {
                files: ['<%= src.appjs %>', '<%= src.tpl %>', '<%= src.less.all %>'],
                tasks: ['default', 'timestamp']
            },
            app: {
                files: ['<%= src.appjs %>', '<%= src.tpl %>', '<%= src.less.all %>'],
                tasks: ['app']
            }
        },
        jshint: {
            files: ['Gruntgile.js', '<%= src.appjs %>', '<%= src.appjsTpl %>'],
            options: {
                curly: true,
                eqeqeq: true,
                immed: true,
                latedef: true,
                newcap: true,
                noarg: true,
                sub: true,
                boss: true,
                eqnull: true,
                globals: {}
            }
        }
    });

};
