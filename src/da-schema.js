;
(() => {
	const extendFunction = function(...args) {
		let listOfFuncs = [];
		for (let func of arguments) {
			listOfFuncs.push(func);
		}
		return function() {
			let result;
			for (let func of listOfFuncs) {
				if (!result) result = func(...arguments);
			}
			return result;
		};
	};

	function createJsObject(schema, jsObject = {}, validSchema = true) {
		if (validSchema) checkSchema(schema);

		function generateValue() {

			const base = function(jsObj, schema, key) {
				if (schema.defaultValue) {
					return {
					[key]: schema.defaultValue
					};
				}

			};
			const string = extendFunction(base, function(jsObj, schema, key) {
				return {
				[key]: 'stringValue'
				};
			});

			const number = extendFunction(base, function(jsObj, schema, key) {
				return {
				[key]: 1
				};
			});

			const boolean = extendFunction(base, function(jsObj, schema, key) {
				return {
				[key]: true
				};
			});

			const object = extendFunction(base, function(jsObj, schema, key) {
				let newObject = {};
				if (schema.properties) {
					newObject[key] = createJsObject(schema.properties, {}, false);
				} else {
					newObject[key] = {};
				}
				return newObject;
			});
			const array = extendFunction(base, function(jsObj, schema, key) {
				let newObject = [];
				newObject[key] = [];
				if (schema.items) {
					schema.items.forEach((prop, index, array) => {
						let itemValue = generateValue()[prop.type](jsObj, prop, key);
						newObject[key].push(itemValue[Object.keys(itemValue)[0]]);
					});
				}

				return newObject;
			});

			return {
				string,
				number,
				boolean,
				object,
				array
			};
		}

		for (let key in schema) {
			let type = schema[key].type;
			let generateValueInstance = generateValue();

			Object.assign(jsObject, generateValueInstance[type](jsObject, schema[key], key));
		}

		return jsObject;
	}

	function checkJsObject(jsObject, schema, validSchema = true) {
		if (validSchema) checkSchema(schema);

		function validJsObjectEngine() {
			const string = function(objProp, schema, key) {
				if (typeof objProp !== schema.type) {
					throw `Incompatibility value ${objProp} typed as ${schema.type}`;
				}
			};
			const boolean = function(objProp, schema, key) {
				if (typeof objProp !== schema.type) {
					throw `Incompatibility value ${objProp} typed as ${schema.type}`;
				}
			};
			const number = function(objProp, schema, key) {
				if (typeof objProp !== schema.type) {
					throw `Incompatibility value ${objProp} typed as ${schema.type}`;
				}
			};
			const object = function(objProp, schema, key) {
				if (typeof objProp !== schema.type) {
					throw `Incompatibility value ${objProp} typed as ${schema.type}`;
				}
				if (schema.properties) {
					checkJsObject(objProp, schema.properties);
				}
			};
			const array = function(objProp, schema, key) {
				if (!Array.isArray(objProp)) {
					throw `Incompatibility value ${objProp} typed as ${schema.type}`;
				}
				if (schema.items) {
					objProp.forEach((prop, index, array) => {
						function returnIndex(index, schemaItemLength) {
							let finalIndex;
							if (index >= schemaItemLength) {
								finalIndex = index - schemaItemLength;
							} else {
								finalIndex = index;
							}
							return finalIndex;
						}
						checkJsObject({ arraySubProp: prop }, { arraySubProp: schema.items[returnIndex(index, schema.items.length)] });
					});
				}
			};
			return {
				string,
				array,
				object,
				boolean,
				number
			};
		}

		for (let key in schema) {
			let type = schema[key].type;
			let validJsObjectEngineInstance = validJsObjectEngine();
			if (!jsObject.hasOwnProperty(key)) {
				throw `Can't find ${key} in object ${JSON.stringify(jsObject)}`;
			}
			validJsObjectEngineInstance[type](jsObject[key], schema[key], key);
		}

	}

	function checkSchema(schema) {
		function validSchemaEngine() {
			const base = function(schema, key) {
				if (schema.hasOwnProperty('optional')) {
					if (typeof schema.optional !== 'boolean') {
						throw `Incompatibility value of optional option`;
					}
				}
				if (schema.hasOwnProperty('defaultValue')) {
					checkJsObject({
					[key]: schema.defaultValue
					}, {
					[key]: schema
					}, false);
				}
			};
			const string = extendFunction(base, function(schema, key) {});
			const boolean = extendFunction(base, function(schema, key) {});
			const number = extendFunction(base, function(schema, key) {});
			const object = extendFunction(base, function(schema, key) {
				if (schema.hasOwnProperty('properties')) {
					let objProp = schema.properties;
					for (let key in objProp) {
						checkSchema({
						[key]: objProp[key]
						});
					}
				}
			});
			const array = extendFunction(base, function(schema, key) {
				if (schema.hasOwnProperty('items')) {
					schema.items.forEach((prop, index, array) => {
						checkSchema({
						[key]: prop
						});
					});
				}
			});
			return {
				string,
				array,
				object,
				boolean,
				number
			};
		}

		for (let key in schema) {
			let type = schema[key].type;
			let validSchemaEngineInstance = validSchemaEngine();
			if (Object.keys(validSchemaEngineInstance)
				.indexOf(type) === -1) {
				throw `Type ${type} not implemented`;
			}
			validSchemaEngineInstance[type](schema[key], key);
		}

	}

	module.exports = {
		checkSchema,
		checkJsObject,
		createJsObject
	};
})();
