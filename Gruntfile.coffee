#jshint camelcase: false
module.exports = (grunt) ->
  "use strict"

  # load all grunt tasks
  require("matchdep").filterDev("grunt-*").forEach grunt.loadNpmTasks

  # configurable paths
  config =
    app: "app"
    dist: "dist"
    tmp: "tmp"
    resources: "resources"

  grunt.initConfig
    config: config
    clean:
      dist:
        files: [
          dot: true
          src: [
            "<%= config.dist %>/*"
            "<%= config.tmp %>/*"
          ]
        ]

    jshint:
      options:
        jshintrc: ".jshintrc"

      files: "<%= config.app %>/js/*.js"

    copy:
      appLinux:
        files: [
          expand: true
          cwd: "<%= config.app %>"
          dest: "<%= config.dist %>/app.nw"
          src: "**"
        ]

      appMacos:
        files: [
          {
            expand: true
            cwd: "<%= config.app %>"
            dest: "<%= config.dist %>/node-webkit.app/Contents/Resources/app.nw"
            src: "**"
          }
          {
            expand: true
            cwd: "<%= config.resources %>/mac/"
            dest: "<%= config.dist %>/node-webkit.app/Contents/"
            filter: "isFile"
            src: "*.plist"
          }
          {
            expand: true
            cwd: "<%= config.resources %>/mac/"
            dest: "<%= config.dist %>/node-webkit.app/Contents/Resources/"
            filter: "isFile"
            src: "*.icns"
          }
        ]

      appMacosAssets:
        files: [
          expand: true
          cwd: "<%= config.app %>"
          dest: "<%= config.dist %>/FireBird.app/Contents/Resources/app.nw"
          src: "**"
        ]

      webkit:
        files: [
          expand: true
          cwd: "<%=config.resources %>/node-webkit/MacOS"
          dest: "<%= config.dist %>/"
          src: "**"
        ]

      copyWinToTmp:
        files: [
          expand: true
          cwd: "<%= config.resources %>/node-webkit/Windows/"
          dest: "<%= config.tmp %>/"
          src: "**"
        ]

    compress:
      appToTmp:
        options:
          archive: "<%= config.tmp %>/app.zip"

        files: [
          expand: true
          cwd: "<%= config.app %>"
          src: ["**"]
        ]

      finalWindowsApp:
        options:
          archive: "<%= config.dist %>/firebird-window-v0.0.1.zip"

        files: [
          expand: true
          cwd: "<%= config.tmp %>"
          src: ["**"]
        ]
      finalMacApp:
        options:
          archive: "<%= config.dist %>/firebird-macos-v0.0.1.zip"

        files: [
          expand: true
          cwd: "dist"
          src: ["FireBird.app/**"]
        ]

    rename:
      app:
        files: [
          src: "<%= config.dist %>/node-webkit.app"
          dest: "<%= config.dist %>/FireBird.app"
        ]

      zipToApp:
        files: [
          src: "<%= config.tmp %>/app.zip"
          dest: "<%= config.tmp %>/app.nw"
        ]

    watch:
      assetsMac:
        files: ['<%= config.app %>/**/*']
        tasks: ['copy:appMacosAssets']

  sed:
    versionNumber:
      pattern: ( ->
        old = grunt.option('oldver')
        if old then RegExp.quote(old) else old
      )(),
      replacement: grunt.option('newver')
      recursive: true


  grunt.registerTask "chmod", "Add lost Permissions.", ->
    fs = require("fs")
    fs.chmodSync "dist/FireBird.app/Contents/Frameworks/node-webkit Helper EH.app/Contents/MacOS/node-webkit Helper EH", "555"
    fs.chmodSync "dist/FireBird.app/Contents/Frameworks/node-webkit Helper NP.app/Contents/MacOS/node-webkit Helper NP", "555"
    fs.chmodSync "dist/FireBird.app/Contents/Frameworks/node-webkit Helper.app/Contents/MacOS/node-webkit Helper", "555"
    fs.chmodSync "dist/FireBird.app/Contents/MacOS/node-webkit", "555"
    return

  grunt.registerTask "createLinuxApp", "Create linux distribution.", ->
    done = @async()
    childProcess = require("child_process")
    exec = childProcess.exec
    exec "mkdir -p ./dist; cp resources/node-webkit/Linux64/node-webkit-v0.9.2-linux-x64/nw.pak dist/ && cp resources/node-webkit/Linux64/node-webkit-v0.9.2-linux-x64/nw dist/node-webkit", (error, stdout, stderr) ->
      result = true
      grunt.log.write stdout  if stdout
      grunt.log.write stderr  if stderr
      if error isnt null
        grunt.log.error error
        result = false
      done result
      return

    return

  grunt.registerTask "createWindowsApp", "Create windows distribution.", ->
    done = @async()
    childProcess = require("child_process")
    exec = childProcess.exec
    exec "cat tmp/nw.exe tmp/app.nw > tmp/QuickQuestion.exe && rm tmp/app.nw tmp/nw.exe", (error, stdout, stderr) ->
      result = true
      grunt.log.write stdout  if stdout
      grunt.log.write stderr  if stderr
      if error isnt null
        grunt.log.error error
        result = false
      done result
      return

    return

  grunt.registerTask "launchMacApp", "Launch mac application", ->
    done = @async()
    childProcess = require("child_process")
    exec = childProcess.exec
    exec "open ./dist/FireBird.app", (error, stdout, stderr) ->
      result = true
      grunt.log.write stdout  if stdout
      grunt.log.write stderr  if stderr
      if error isnt null
        grunt.log.error error
        result = false
      done result
      return

    return

  grunt.registerTask "setVersion", "Set version to all needed files", (version) ->
    config = grunt.config.get(["config"])
    appPath = config.app
    resourcesPath = config.resources
    mainPackageJSON = grunt.file.readJSON("package.json")
    appPackageJSON = grunt.file.readJSON(appPath + "/package.json")
    infoPlistTmp = grunt.file.read(resourcesPath + "/mac/Info.plist.tmp",
      encoding: "UTF8"
    )
    infoPlist = grunt.template.process(infoPlistTmp,
      data:
        version: version
    )
    mainPackageJSON.version = version
    appPackageJSON.version = version
    grunt.file.write "package.json", JSON.stringify(mainPackageJSON, null, 2),
      encoding: "UTF8"

    grunt.file.write appPath + "/package.json", JSON.stringify(appPackageJSON, null, 2),
      encoding: "UTF8"

    grunt.file.write resourcesPath + "/mac/Info.plist", infoPlist,
      encoding: "UTF8"

    return

  grunt.registerTask "deploy:linux", [
    "clean:dist"
    "copy:appLinux"
    "createLinuxApp"
  ]

  grunt.registerTask "deploy:windows", [
    "clean:dist"
    "copy:copyWinToTmp"
    "compress:appToTmp"
    "rename:zipToApp"
    "createWindowsApp"
    "compress:finalWindowsApp"
  ]

  grunt.registerTask "deploy:mac", [
    "clean:dist"
    "copy:webkit"
    "copy:appMacos"
    "rename:app"
    "chmod"
    "compress:finalMacApp"
  ]

  grunt.registerTask "start:mac", [
    "clean:dist"
    "copy:webkit"
    "copy:appMacos"
    "rename:app"
    "chmod"
    "launchMacApp"
    "watch:assetsMac"
  ]

  # Version numbering task.
  # grunt change-version-number --oldver=A.B.C --newver=X.Y.Z
  # This can be overzealous, so its changes should always be manually reviewed!
  grunt.registerTask('change-version-number', 'sed')

  grunt.registerTask "check", ["jshint"]
  return
