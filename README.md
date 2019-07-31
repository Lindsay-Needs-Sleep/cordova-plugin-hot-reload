## How to run plugin tests

Most cordova plugins use the [cordova-plugin-test-framework](https://github.com/apache/cordova-plugin-test-framework) to run tests.  

To run these types of tests you will need to:

* Use an existing Cordova project (That's what this project is for! :D)
* From the root:
    * Run `cordova plugin add --link ../<cordova-plugin-name>`
    * Run `cordova plugin add --link ../<cordova-plugin-name>/tests`
    * Run `cordova run <platform>`
        * Note: Whenever you change any js file you must remove either the plugin or plugin/tests (depending on where the js files are) and re-add it for changes to take effect
            * `cordova plugin remove <cordova-plugin-name>` or `cordova plugin remove <cordova-plugin-name-tests>`


