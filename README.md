<h1 align="center">cordova-hot-reload</h1>

**cordova-hot-reload** runs a server which will hot reload:
- all your project's files in www (useful for app development)
- all www files provided by locally installed plugins (useful for plugin development)

will serve all files located in www.  It will watch them for changes too so you don't have to reload the app 

## Usage

1) From the project root:
```
npm install cordova-hot-reload --save-dev
node node_modules/cordova-hot-reload/serve.js <platform> <port>
```
2) Change config.xml:  
`<content src="index.html" />` to  
`<content src="http://<computer-ip-address>:<port>/index.html" />`  
and add `<allow-navigation href="*://<computer-ip-address>/*" />`

3) Run your project:  
`cordova run <platform>`

You're good to go!

### Usage details

`<platform>` Currently only supports `android`  
`<computer-ip-address>` Ensure this is the address of the computer that is running **cordova-hot-reload**, it should be something like `192.168.0.86`, not `localhost`.


### Plugin Development

To successfully hot reload your plugin it must be added via link.  You must use **admin permission** for the following commands.

* `cordova plugin add --link <relative path to cordova-plugin>` 
* `cordova plugin add --link <relative path to cordova-plugin>/tests` (Yep, cordova-hot-reload also works for sub-plugins!)

**Caveats**: 
- **cordova-hot-reload** does **not** do anything to help with native src files (java/swift/Obj-c).  
  - Fortunately, thanks to adding via link, you merely need to re-run the project and you're good to go.  (You don't have to remove and re-add the plugin!)  
  - This also means that you are safe to modify the native code directly in Android Studio if desired.  
  - Note: The link only works for native files (no js/css/html/etc), you also need to be careful about adding and deleting files.  These changes will be exclusive to the platform folder and will not be transferred back to your plugin folder.
- If you modify plugin.xml you will need to restart the **cordova-hot-reload** server.

<h1 align="center">Contributing<h1>

## Formatting

Before committing:

* Run `npm test` (from the plugin directory)
  * If it finds any formatting errors you can try and automatically fix them with:
    * `node run eslint-fix`
  * Otherwise, please manually fix the error before committing