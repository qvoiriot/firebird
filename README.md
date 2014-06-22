#Fire Bird
==========
</br>

Initially i wanted to build the project on an Ios platform, using Xcode and Sprite Builder.

</br>

After searches, i've learned about `Node Webkit` and decided to build a `Front-End Project` of **flappy bird**.
Completely write in `html/css/js`.

</br>

##Simple way to use Node Webkit
===============================

1. Go on the `Node Webkit repo on GitHub`. Select your pre-built binarie for your OS.

2. **Unzip** the folder and put it at the same place that your `index.html`.

3. create a simple *package.json* for your application.

4. `Run the node-webkit exe` in your app folder.

5. **CONGRATS**

##Best way tu use NodeWebkit and create distribution
====================================================

1. add all the dependencies in **package.json**

2. ` nvm use --> npm install` --> it should install all the node modules you need

3. create **GruntFile.coffee** to config all the process

4. `Redo arborescence`
      * *app*         : here is all your app with the icons and the package.json to configure it.
      * *dist*        : here is the place where all version will be built.
      * *ressources*  : ressources for node webkit for mac / windows / linux.

5. run grunt **start:mac**


