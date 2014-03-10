var path = require('path');
var exec = require('child_process').exec;
var watch = require('node-watch');

var count =0;

//watch this directory, any changes, execute build or make command
watch(path.resolve(__dirname), function(filename) {

	console.log("File changed: ", filename);  

    if(filename.indexOf("build/build.") == -1)
    {
        exec("component build", function(error)
        {
            console.log('Change forced rebuild: ' + count++);
        });
    }
});

