/// Knockout Mapper plugin
/// (c) 2014 Imre Fazekas
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
			return toString.call(obj) === '[object Array]';
		};
		var isString = function (obj) {
			return "[object String]" === toString.call(obj);
		};
		var isObject = function (obj) {
			return obj === Object(obj);
		};
		var isBoolean = function(obj) {
			return obj === true || obj === false || toString.call(obj) === '[object Boolean]';
		};
		var isNumber = function (obj) {
			return (toString.call(obj) === "[object " + Number + "]") || !isNaN(obj);
		};
		var isFunction = function (obj) {
			return toString.call(obj) === "[object " + Function + "]";
		};
		var isDate = function (obj) {
			return toString.call(obj) === "[object " + Date + "]";
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
				for (var i = 0, l = obj.length; i < l; i+=1) {
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
			var toInnerJSON = function(obj, dataModel, viewModel){
				Object.keys(dataModel).forEach( function(key, index, array){
					if( viewModel && viewModel[key] ){
						var value = dataModel[key];
						if( isArray( value ) ){
							obj[ key ] = [];
							if( isArray( viewModel[key] ) )
								obj[ key ] = viewModel[key];
							else{
								var marray = viewModel[key]();
								var isAnObject = value.length > 0 && value[0] && isObject( value[0] );
								if( isAnObject ){
									each( marray, function(element, ind, list){
										obj[ key ].push( toInnerJSON( {}, value[0], element) );
									} );
								} else {
									each( marray, function(element, ind, list){
										obj[ key ].push( isFunction( element ) ? element() : element );
									} );
								}
							}
						}
						else if( isString( value ) || isNumber( value ) || isBoolean( value ) ){
							obj[ key ] = isFunction( viewModel[ key ] ) ? viewModel[ key ]() : viewModel[ key ];
						}
						else if( isFunction( value ) ){
							return;
						}
						else if( isObject( value ) && isFunction( value.read ) && isFunction( value.write ) ){
							return;
						}
						else if( isObject( value ) ){
							obj[ key ] = {};
							toInnerJSON( obj[ key ], value, value._observable ? viewModel[ key ]() : viewModel[ key ] );
						}
					}
				});
				return obj;
			};

			return toInnerJSON( {}, M, self );
		};

		exports.resetViewModel = ko.resetViewModel = function(VM){
			var self = VM;
			var innerResetViewModel = function(viewModel){
				if( !viewModel ) return;

				if( isFunction(viewModel) ){
					if( viewModel.originalValue )
						viewModel( viewModel.originalValue() );
				} else if( isObject(viewModel) ){
					each( viewModel, function(value, key, list){
						innerResetViewModel( viewModel[ key ] );
					});
				}
				return viewModel;
			};

			innerResetViewModel( self );
		};

		// pass the viewmodel to build up, the reference data model, validation definions, functions and static data
		exports.updateViewModel = ko.updateViewModel = function(VM, M){
			var self = VM;
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
								return;
							}
							else if( isObject( value ) && isFunction( value.read ) && isFunction( value.write ) ){
								return;
							}
							else if( isObject( value ) ){
								if( isFunction( viewModel[ key ] ) )
									viewModel[ key ]( value );
								else
									innerUpdateViewModel( value, viewModel[ key ], name );
							}
						}
					} );

				return viewModel;
			};

			innerUpdateViewModel( M, self, '');
		};

		ko.extenders.originalValue = function (observable, value) {
			if(!observable.originalValue) {
				observable.originalValue = ko.observable( value );
			}
		};
		function extend( model, validation ){
			model.extend( isFunction(validation) ? { fn: validation } : validation );
		}
		exports.mapObject = ko.mapObject = function(VM, M, V, F, S){
			var self = VM;
			var _m = M, _v = V  || {}, _f = F  || {}, _s = S || {};

			var _MakeViewModel = function(data, viewModel, validationRules, context){
				var validation = validationRules || {};
				each( data, function(value, key, list){
					if(key === '_observable') return;

					if( isArray( value ) ){
						viewModel[ key ] = ko.observableArray();
						if(validation[key]) {
							extend( viewModel[key], (isArray(validation[key]) && validation[key].length>0) ? validation[key][0] : validation[key] );
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
						viewModel[ key ] = ko.observable( value ).extend( { originalValue: value } );
						if(validation[key]) {
							extend( viewModel[key], validation[key] );
						}
					}
					else if( isFunction( value ) ){
						//viewModel[ key ] = ko.computed( value, context );
						return;
					}
					else if( isObject( value ) && isFunction( value.read ) && isFunction( value.write ) ){
						//viewModel[ key ] = ko.computed( value, context );
						return;
					}
					else if( isObject( value ) ){
						viewModel[ key ] = value._observable ? ko.observable() : {};

						_MakeViewModel( value, viewModel[ key ], validation[key], context );
					}
				} );

				return viewModel;
			};

			var _MakeComputerModel = function(data, viewModel, validationRules, context){
				var validation = validationRules || {};
				each( data, function(value, key, list){
					if( isArray( value ) ){
						var isAnObject = value.length > 0 && value[0] && isObject( value[0] );
						if( isAnObject ){
							each( value, function(element, index, array){
								_MakeViewModel(element, {}, context);
							} );
						}
					}
					else if( isString( value ) || isNumber( value ) || isBoolean( value ) || isDate( value ) ){
						return;
					}
					else if( isFunction( value ) ){
						viewModel[ key ] = ko.pureComputed( value, context );
					}
					else if( isObject( value ) && isFunction( value.read ) && isFunction( value.write ) ){
						viewModel[ key ] = ko.pureComputed( value, context );
						if( validation[key] ) {
							extend( viewModel[key], validation[key] );
						}
					}
					else if( isObject( value ) ){
						_MakeComputerModel( value, viewModel[ key ], validation[key], context );
					}
				} );

				return viewModel;
			};

			var _MakeFunctions = function( _methods, viewModel, context){
				each( _methods, function(value, key, list){
					if( isArray( value ) ){
						viewModel[ key ] = [];
						each( value, function(element, index, array){
							viewModel[ key ].push( isFunction(element) ? element.bind( context ) : element );
						} );
					}
					else if( isFunction(value) ){
						viewModel[ key ] = value.bind( context );
					}
					else if( isObject(value) ){
						if( !viewModel[ key ] )
							viewModel[ key ] = {};
						_MakeFunctions( value, viewModel[ key ], context );
					}
				});
			};

			//Statics
			each( _s, function(value, key, list){
				self[key] = value;
			});

			//ViewModel
			_MakeViewModel( _m, self, _v, self );
			_MakeComputerModel( _m, self, _v, self );

			//Behaviours
			_MakeFunctions( _f, self, self );

			if( self.init )
				self.init();

			return self;
		};
	}
));