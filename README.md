<h3 align="center">How to run plugin tests<h3>

Most cordova plugins use the [cordova-plugin-test-framework](https://github.com/apache/cordova-plugin-test-framework) to run tests.  

To run these types of tests you will need to:

* Use an existing Cordova project (That's what this project is for! :D)
    * Clone this porject
    * From the project root run `npm install`
    * From the project root run `cordova prepare <platform>` platform can be: [android]
* From the root:
    * Run `cordova plugin add --link ../<cordova-plugin-name>`
    * Run `cordova plugin add --link ../<cordova-plugin-name>/tests`
    * Run `cordova run <platform>`
        * Note: Whenever you change any js file you must remove either the plugin or plugin/tests (depending on where the js files are) and re-add it for changes to take effect
            * `cordova plugin remove <cordova-plugin-name>` or `cordova plugin remove <cordova-plugin-name-tests>`



<h3 align="center">Contributing<h3>

## Formatting

* Run `npm test` (from the plugin directory)
  * If it finds any formatting errors you can try and automatically fix them with:
    * `node node_modules/eslint/bin/eslint <file-path> --fix`
  * Otherwise, please manually fix the error before commiting