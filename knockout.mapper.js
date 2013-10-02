/// Knockout Mapper plugin v1.1.7
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
		var toString = Object.prototype.toString;
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
		var isDate = function (obj) {
			return toString.call(obj) == "[object " + Date + "]";
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
						if( viewModel[key] ){
							var value = dataModel[key];
							if( isArray( value ) ){
								var marray = viewModel[key]();
								var isAnObject = value.length > 0 && value[0] && isObject( value[0] );
								if( isAnObject ){
									obj[ key ] = [];
									each( marray, function(element, ind, list){
										obj[ key ].push( toInnerJSON( {}, value[0], element) );
									} );
								} else {
									each( marray, function(element, ind, list){
										obj[ key ].push( isFunction( element ) ? element() : element );
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
							else if( isObject( value ) && isFunction( value.read ) && isFunction( value.write ) ){
							}
							else if( isObject( value ) ){
								obj[ key ] = {};
								toInnerJSON( obj[ key ], dataModel[ key ], viewModel[ key ] );
							}
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
					if(data && viewModel)
						each( data, function(value, key, list){
							if( viewModel[ key ] ){
								var name = path + '.' + key;
								if( isArray( value ) && viewModel[ key ] ){
									viewModel[ key ]([]);

									var isAnObject = value.length > 0 && value[0] && isObject( value[0] );
									if( isAnObject ){
										each( value, function(element, index, list){
											viewModel[ key ].push( exports.mapObject({}, element ) );
										} );
									} else {
										viewModel[ key ]( value );
									}
								}
								else if( isString( value ) || isNumber( value ) || isBoolean( value ) ){
									if( viewModel[ key ] && isFunction(viewModel[ key ]) )
										viewModel[ key ]( value );
								}
								else if( isFunction( value ) ){
								}
								else if( isObject( value ) && isFunction( value.read ) && isFunction( value.write ) ){
								}
								else if( isObject( value ) ){
									innerUpdateViewModel( value, viewModel[ key ], name );
								}
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

				var _MakeViewModel = function(data, viewModel, validationRules, context){
					var validation = validationRules || {};
					each( data, function(value, key, list){
						if( isArray( value ) ){
							viewModel[ key ] = ko.observableArray();
							if(validation[key]) {
								viewModel[key].extend(
									(isArray(validation[key]) && validation[key].length>0) ? validation[key][0] : validation[key]
								);
							}
							var isAnObject = value.length > 0 && value[0] && isObject( value[0] );
							if( isAnObject ){
								each( value, function(element, index, array){
									viewModel[ key ].push( _MakeViewModel(element, {}, {}, context) );
								} );
							} else{
								each( value, function(element, index, array){
									viewModel[ key ].push( element );
								} );
							}
						}
						else if( isString( value ) || isNumber( value ) || isBoolean( value ) || isDate( value ) ){
							viewModel[ key ] = ko.observable( value );
							if(validation[key]) {
								viewModel[key].extend(validation[key]);
							}
						}
						else if( isFunction( value ) ){
							//viewModel[ key ] = ko.computed( value, context );
						}
						else if( isObject( value ) && isFunction( value.read ) && isFunction( value.write ) ){
							//viewModel[ key ] = ko.computed( value, context );
						}
						else if( isObject( value ) ){
							viewModel[ key ] = {};

							_MakeViewModel( value, viewModel[ key ], validation[key], context );
						}
					} );

					return viewModel;
				};

				var _MakeComputerModel = function(data, viewModel, context){
					each( data, function(value, key, list){
						if( isArray( value ) ){
							var isAnObject = value.length > 0 && value[0] && isObject( value[0] );
							if( isAnObject ){
								each( value, function(element, index, array){
									_MakeViewModel(element, {}, context);
								} );
							} else{
							}
						}
						else if( isString( value ) || isNumber( value ) || isBoolean( value ) || isDate( value ) ){
						}
						else if( isFunction( value ) ){
							viewModel[ key ] = ko.computed( value, context );
						}
						else if( isObject( value ) && isFunction( value.read ) && isFunction( value.write ) ){
							viewModel[ key ] = ko.computed( value, context );
						}
						else if( isObject( value ) ){
							_MakeComputerModel( value, viewModel[ key ], context );
						}
					} );

					return viewModel;
				};

				var _MakeFunctions = function( _methods, viewModel){
					each( _methods, function(value, key, list){
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
							_MakeFunctions( value, viewModel[ key ] );
						}
					});
				};

				//Statics
				each( _s, function(value, key, list){
					self[key] = value;
				});

				//ViewModel
				_MakeViewModel( _m, self, _v, self );
				_MakeComputerModel( _m, self, self );

				//Behaviours
				_MakeFunctions( _f, self );

				if( self.init )
					self.init();

				return self;
			}(M, V  || {}, F  || {}, S || {});
		};
	}
));