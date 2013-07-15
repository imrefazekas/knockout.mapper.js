#knockout.mapper.js

[Knockout.mapper.js](https://github.com/imrefazekas/knockout.mapper.js) is a very simple plugin for knockout allowing you to:
- map object to a view model including validation, static fields, computed values and functions
- update a view model's values based on a model prototype
- exports JSON by a model prototype

License: [MIT](http://www.opensource.org/licenses/mit-license.php)

##Usage
```javascript
// Let's have a model prototype. (could have been received from server-side or define any way you want to...)
var obj = {};
// Knockout static properties 
obj.statics = {
	"prop": "val"
};
// Knockout data model itself
obj.dataModel = {
	firstName: "Planet",
	lastName: "Earth",
	fullName: function() {
		return this.firstName() + " " + this.lastName();
	}
};
// Knockout methods to be added to the model
obj.methods = {
	capitalizeLastName: function() {
		var currentVal = this.lastName();
		this.lastName(currentVal.toUpperCase());
	},
	init: function(){
		console.log('Helloka!');
	}
};
// validation rules defined 
obj.validation = {
	firstName: { required: true, type: "alphanum" },
	lastName: { notblank: true, type: "alphanum" }
};

var viewModel = {};

// map your JS object to have a knockout viewmodel
ko.mapObject( viewModel, obj.dataModel, obj.validation, obj.methods, obj.statics );

// apply bindings as usual
ko.applyBindings( viewModel );

obj.dataModel.firstName = "Universe";
// updating the viewmodel based on some changes might received from server-side
ko.updateViewModel( viewModel, obj.dataModel );

// print out the JSON containing only the fields possessed by the prototype passed by. Much faster, than the toJSON of knockout and can be targeted only content you are really interested in
console.log( ko.toJSONByPrototype( viewModel, obj.dataModel ) );
```
