<h1 align="center">cordova-testing</h1>

This is a project that aims to assist in testing plugins with information, or by actually using the project. 

## How To Run [cordova-plugin-test-framework](https://github.com/apache/cordova-plugin-test-framework) Tests

To run these types of tests you will need to use an actual Cordova project.  You can use an existing project or you can clone this project. Either way, you should be able to follow these directions:

* From the project root run `npm install`
* In `config.xml` ensure you have the following entries with your correct ip
    * `<content src="http://<local-ip>:8333/cdvtests/index.html" />`
    * `<allow-navigation href="*://<local-ip>/*" />`
* Now add the plugin you want to test (you will need admin permission for the below commands)
    * Run `cordova plugin add --link ../<cordova-plugin-name>`
    * Run `cordova plugin add --link ../<cordova-plugin-name>/tests`
* Run the project:
    * `cordova prepare <platform>`
    * `cordova run <platform>`
* Once the project is loaded onto your device, we can start the **hot re-loading js server** (optional)
    * This will allow you to make changes to the plugin's js and test js files and see the change's reflected immediately after a page refresh
        * (If using your own project, you can copy the `scripts` folder from this project to your's)
    * Run `node ./scripts/hot-reload-js.js <platform>` (currently only available for android)
    * Note: It may be import to avoid running a `cordova prepare/build/run` while the hot-reload server is running, this may result in unexpected and strange errors if the server has a lock on some files
    * Note: This will create and populate a folder `/hot-reload-files` (incase you were wondering where that came from)


<h1 align="center">Contributing<h1>

## Formatting

Before committing:

* Run `npm test` (from the plugin directory)
  * If it finds any formatting errors you can try and automatically fix them with:
    * `node node_modules/eslint/bin/eslint <file-path> --fix`
  * Otherwise, please manually fix the error before committing