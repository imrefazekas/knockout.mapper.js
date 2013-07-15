/// Knockout Mapper plugin v0.0.1
/// (c) 2013 Imre Fazekas
/// License: MIT (http://www.opensource.org/licenses/mit-license.php)
(function (factory) {
	// Module systems magic dance.
	if (typeof require === "function" && typeof exports === "object" && typeof module === "object") {
		// CommonJS or Node: hard-coded dependency on "knockout"
		factory(require("knockout"), exports);
	} else if (typeof define === "function" && define.amd) {
		// AMD anonymous module with hard-coded dependency on "knockout"
		define(["knockout", "exports"], factory);
	} else {
		// <script> tag: use the global `ko` object, attaching a `mapping` property
		factory(ko, ko.mapping = {});
	}
}(
	function (ko, exports) {
		var breaker = {};
		var nativeForEach = Array.prototype.forEach;
		var isArray = Array.isArray || function(obj) {
			return toString.call(obj) == '[object Array]';
		};
		var isString = function (obj) {
			return "[object String]" == toString.call(obj);
		};
		var isObject = function (obj) {
			return obj === Object(obj);
		};
		var isBoolean = function(obj) {
			return obj === true || obj === false || toString.call(obj) == '[object Boolean]';
		};
		var isNumber = function (obj) {
			return (toString.call(obj) == "[object " + Number + "]") || !isNaN(obj);
		};
		var isFunction = function (obj) {
			return toString.call(obj) == "[object " + Function + "]";
		};
		if (typeof (/./) !== 'function') {
			isFunction = function(obj) {
				return typeof obj === 'function';
			};
		}
		var each = function(obj, iterator, context) {
			if (obj === null) return;
			if (nativeForEach && obj.forEach === nativeForEach) {
				obj.forEach(iterator, context);
			} else if ( isArray(obj) ) {
				for (var i = 0, l = obj.length; i < l; i++) {
					if (iterator.call(context, obj[i], i, obj) === breaker) return;
				}
			} else {
				for (var key in obj) {
					if (iterator.call(context, obj[key], key, obj) === breaker) return;
				}
			}
		};

		exports.toJSONByPrototype = ko.toJSONByPrototype = function(VM, M){
			var self = VM;
			return function(_m){
				var toInnerJSON = function(obj, dataModel, viewModel){
					Object.keys(dataModel).forEach( function(key, index, array){
						var value = dataModel[key];
						if( isArray( value ) ){
							if( isFunction( viewModel[key] ) ){
								obj[ key ] = viewModel[key]();
							} else if( isArray( viewModel[key] ) ){
								obj[ key ] = [];
								viewModel[key].forEach( function(element, _index, _array){
									if( isFunction( element ) )
										obj[ key ].push( element() );
								} );
							}
						}
						else if( isString( value ) || isNumber( value ) || isBoolean( value ) ){
							if( viewModel[ key ] && isFunction( viewModel[ key ] ) ){
								obj[ key ] = viewModel[ key ]();
							}
						}
						else if( isFunction( value ) ){
						}
						else if( isObject( value ) ){
							obj[ key ] = {};
							toInnerJSON( obj[ key ], dataModel[ key ], viewModel[ key ] );
						}
					});
					return obj;
				};

				return toInnerJSON( {}, _m, self );
			}(M);
		};

		// pass the viewmodel to build up, the reference data model, validation definions, functions and static data
		exports.updateViewModel = ko.updateViewModel = function(VM, M){
			var self = VM;
			return function(_m){
				var innerUpdateViewModel = function(data, viewModel, path){
					each( data, function(value, key, list){
						var name = path + '.' + key;
						if( isArray( value ) ){
							var isAnObject = value.length > 0 && value[0] && isObject( value[0] );
							if( isAnObject ){
								var pname = name + '[]';
								innerUpdateViewModel( value[0], viewModel[ key ][0], pname );
							} else{
								if( viewModel[ key ] && isFunction(viewModel[ key ]) )
									viewModel[ key ]( value );
							}
						}
						else if( isString( value ) || isNumber( value ) || isBoolean( value ) ){
							if( viewModel[ key ] && isFunction(viewModel[ key ]) )
								viewModel[ key ]( value );
						}
						else if( isFunction( value ) ){
						}
						else if( isObject( value ) ){
							innerUpdateViewModel( value, viewModel[ key ], name );
						}
					} );

					return viewModel;
				};

				innerUpdateViewModel( _m, self, '');
			}(M);
		};

		exports.mapObject = ko.mapObject = function(VM, M, V, F, S){
			var self = VM;

			return function(_m, _v, _f, _s){
				var innerMakeViewModel = function(data, _validation, viewModel, path){
					each( data, function(value, key, list){
						var name = path + '.' + key;
						var validation = _validation ? _validation[key] : null;
						if( isArray( value ) ){
							var isAnObject = value.length > 0 && value[0] && isObject( value[0] );
							if( isAnObject ){
								var pname = name + '[]';
								viewModel[ key ] = [];
								innerMakeViewModel( value[0], validation, viewModel[ key ][0], pname );
							} else{
								viewModel[ key ] = validation ? ko.observableArray().extend( validation ) : ko.observableArray();
								each( value, function(element, index, array){
									viewModel[ key ].push( element );
								} );
							}
						}
						else if( isString( value ) || isNumber( value ) || isBoolean( value ) ){
							viewModel[ key ] = validation ? ko.observable( value ).extend( validation ) :  ko.observable( value );
						}
						else if( isFunction( value ) ){
							//viewModel[ key ] = ko.computed( value, viewModel );
						}
						else if( isObject( value ) ){
							viewModel[ key ] = {};
							innerMakeViewModel( value, validation, viewModel[ key ], name );
						}
					} );

					return viewModel;
				};

				var innerMakeComputerModel = function(data, viewModel, path){
					each( data, function(value, key, list){
						var name = path + '.' + key;
						if( isArray( value ) ){
							var isAnObject = value.length > 0 && value[0] && isObject( value[0] );
							if( isAnObject ){
								var pname = name + '[]';
								innerMakeComputerModel( value[0], viewModel[ key ][0], pname );
							} else{
							}
						}
						else if( isString( value ) || isNumber( value ) || isBoolean( value ) ){
						}
						else if( isFunction( value ) ){
							viewModel[ key ] = ko.computed( value, viewModel );
						}
						else if( isObject( value ) ){
							innerMakeComputerModel( value, viewModel[ key ], name );
						}
					} );

					return viewModel;
				};

				var innerMakeFunctions = function( _methods, viewModel, path){
					each( _methods, function(value, key, list){
						var name = path + '.' + key;
						if( isArray( value ) ){
							viewModel[ key ] = [];
							each( value, function(element, index, array){
								viewModel[ key ].push( element );
							} );
						}
						else if( isFunction(value) ){
							viewModel[ key ] = value;
						}
						else if( isObject(value) ){
							if( !viewModel[ key ] )
								viewModel[ key ] = {};
							innerMakeMethods( value, viewModel[ key ], name );
						}
					});
				};

				//Statics
				each( _s, function(value, key, list){
					self[key] = value;
				});

				//ViewModel
				innerMakeViewModel( _m, _v, self, '');
				innerMakeComputerModel( _m, self, '');

				//Behaviours
				innerMakeFunctions( _f, self, '');

				if( self.init )
					self.init();
			}(M, V, F, S || {});
		};
	}
));