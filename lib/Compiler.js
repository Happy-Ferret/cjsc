/*
* @author sheiko
* @license MIT
* @copyright (c) Dmitry Sheiko http://www.dsheiko.com
* jscs standard:Jquery
* jshint unused:false
*/

	/**
		* @module Compiler
		* @constructor
		* @alias module:Compiler
		* @param {Parser} parser
		* @param {Cli} cli
		*/
	module.exports = function( parser, cli ) {
		"use strict";
				/**
				 * Map callee filenames to the dependency array
				 * { filename: DependencyEntity[] }
				 * @access private
				 * @type {Object}
				 */
		var dependencyMap = {},
				/**
				 * Module parser info
				 * @access private
				 * { filename: {__dirname: boolean, __filename: boolean, shortcut: boolean} }
				 * @type {Object}
				 */
				modulePayload = {};

		return {
			/**
			 *
			 * @param {string} fileName
			 * @returns {DependencyEntity[]}
			 */
			findDependencies: function( fileName ) {
				var srcCode = cli.readJs( fileName ),
						that = this,
						syntaxTree;

				try {
					syntaxTree = parser.getSyntaxTree( srcCode );
				}	catch( e ) {
					throw new ReferenceError( "`" + fileName + "` appears to be invalid JavaScript" );
				}
				modulePayload[ fileName ] = parser.getRequirements( syntaxTree );
				dependencyMap[ fileName ] = [];
				parser.getDependecies( syntaxTree ).forEach(function( depEntity ){
					depEntity.filename = cli.resolveFilename( depEntity.id, fileName );
					dependencyMap[ fileName ].push( depEntity );
					that.findDependencies( depEntity.filename );
				});
				return dependencyMap;
			},
			/**
			 * Analyze dependency map for looping calls and throws exceptions when any found
			 * @param {string} srcFilename - filename of the main module
			 * @param {DependencyEntity} dependencyMap
			 */
			preventAnInfiniteLoops: function( srcFilename, dependencyMap ) {
				var
						/**
						 * All the module filenames proccessed during the bypass
						 * @type {string[]}
						 */
						circuit = [],
						/**
						 *
						 * @param {string} filename
						 */
						checkDepForLoopRecursively = function( filename ) {
							// Break if the dependency requires no modules
							if ( typeof dependencyMap[ filename ] === "undefined" ) {
								return;
							}
							dependencyMap[ filename ].forEach(function( dep ){
								// If a module occurs twice during one deep-down bypass
								if ( circuit.indexOf( dep.filename ) !== -1 ) {
									throw new ReferenceError( "`" + dep.filename +
										"` is required recursively and creates an infinite loop" );
								}
								circuit.push( dep.filename );
								checkDepForLoopRecursively( dep.filename );
								// Remove this level adding
								circuit = circuit.filter(function( fname ){
									return fname !== dep.filename;
								});
							});
						};
				circuit = [ srcFilename ];
				checkDepForLoopRecursively( srcFilename );
				return true;
			},

			/**
			 * Get wrapper code preceding module original src
			 * @param {string} filename
			 * @returns {string}
			 */
			getModuleOpener: function( filename ) {
				return "require.def( \"" + filename + "\", function( require, exports, module ){\n";
			},
			/**
			 * Render variable declaration code depending on what nodejs globals required in the module
			 * @param {string} filename
			 * @param {Object} requirements
			 * @returns {string}
			 */
			renderGlobalsDelaration: function( filename, requirements ) {
				/** @type {string[]} */
				var stms = [];
				if ( !requirements.__dirname && !requirements.__filename ) {
					return "";
				}
				stms.push( "__dirname = \"" + cli.getDirname( filename ) + "\"" );
				stms.push( "__filename = \"" + filename + "\"" );
				return "	var " + stms.join( ", " ) + ";\n";
			},
			/**
			 * Render code assigning exports back to modul.exports if the module uses the shortcut
			 * @param {Object} requirements
			 * @returns {string}
			 */
			renderExportsShortcutResolvingCode: function( requirements ) {
				return requirements.shortcut ? "\n	module.exports = exports;" : "";
			},
			/**
			 * Get wrapper code trailing module original src
			 * @returns {string}
			 */
			getModuleCloser: function() {
				return "\n	return module;\n});\n\n";
			},
			/**
			 * Get code of the require function
			 * @returns {string}
			 */
			getScriptHeader: function() {
				return cli.readJs( __dirname + "/template/require.js" );
			},
			/**
			 * Get footer code
			 * @param {string} srcFilename
			 * @returns {string}
			 */
			getScriptFooter: function( srcFilename ) {
				return "require( \"" + srcFilename + "\" );\n";
			},


			/**
			 * Compile Common modules based ona given dependencyMap
			 * @param {string} srcFilename - filename of the main module
			 * @param {Object} dependencyMap
			 * @param {function} Replacer - Replacer constructor
			 * @returns {string} compiler script code
			 */
			compile: function( srcFilename, dependencyMap, Replacer ) {
				var callee,
						output = "",
						that = this,
						replacer,
						replaceModuleIdsWithResolvedFilenames = function( dep ){
							// Replace all the module ids with fully resolved filenames
							this.replacer.replace( dep.range[ 0 ], dep.range[ 1 ], "require( \"" + dep.filename + "\" )" );
						};
				for( callee in dependencyMap ) {
					if ( dependencyMap.hasOwnProperty( callee ) ) {
						replacer = new Replacer( cli.readJs( callee ) );
						// Iterate through all the dependencies
						dependencyMap[ callee ].forEach( replaceModuleIdsWithResolvedFilenames, { replacer: replacer } );
						output += that.getModuleOpener( callee ) +
							that.renderGlobalsDelaration( callee, modulePayload[ callee ] ) +
							replacer.get() +
							that.renderExportsShortcutResolvingCode( modulePayload[ callee ] ) +
							that.getModuleCloser();
					}
				}
				return this.getScriptHeader() + output + this.getScriptFooter( srcFilename );
			}
		};
	};


