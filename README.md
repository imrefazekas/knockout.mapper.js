#knockout.mapper.js

[Knockout.mapper.js](https://github.com/imrefazekas/knockout.mapper.js) is a very simple plugin for knockout allowing you to:
- map object to a view model including validation, static fields, computed values, functions and custom bindings
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
// Knockout data model itself - including custom bindings
obj.dataModel = {
	firstName: "Planet",
	lastName: "Earth",
	fullName: function() {
		return this.firstName() + " " + this.lastName();
	},
	name:{
		read: function () {
			return this.firstName() + " " + this.lastName();
		},
		write: function (value) {
			var lastSpacePos = value ? value.lastIndexOf(" ") : 0;
			if (lastSpacePos > 0) { // Ignore values with no space character
				this.firstName(value.substring(0, lastSpacePos)); // Update "firstName"
				this.lastName(value.substring(lastSpacePos + 1)); // Update "lastName"
			}
		},
		owner: this
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


For a more complex scenario please find a complex project boilerplate: [Division.js](https://github.com/imrefazekas/division.js), where one business model is defined and maintained allowing you to use the same objects - including model and validation and computed values and associated functions - on both client side, server side and DB interaction!
