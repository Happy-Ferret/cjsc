/*
* @author sheiko
* @license MIT
* @copyright (c) Dmitry Sheiko http://www.dsheiko.com
* jscs standard:Jquery
* jshint unused:false
*/

	/**
		* module Cli
		* @constructor
		* @alias module:Cli
		* @param {string} srcPath
		* @param {function} fsContainer
		* @param {function} pathContainer
		*/
	var Cli = function( srcPath, fsContainer, pathContainer ) {
			var startTime = process.hrtime();
			// Dependency injection
			fsContainer = fsContainer || {};
			pathContainer = pathContainer || {};
			return {
				/**
				* Display header (copyright)
				*/
				printHeader: function() {
					console.log( " CommonJS Compiler " + this.getProjectInfo().version + " (https://github.com/dsheiko/cjsc) ");
				},
				/**
				* Display body
				* @param {number} counter
				*/
				printBody: function( counter ) {
					console.log( " \033[0;32m>>>\033[0m " + counter + " dependencies resolved" );
					console.log( " Compilation time: " + this.getElapsedTime() );
				},
				/**
				* Determine script execution time
				* @return {String}
				*/
				getElapsedTime: function() {
						var precision = 0,
								elapsed = process.hrtime( startTime )[ 1 ] / 1000000, // divide by a million to get nano to milli
						out = process.hrtime( startTime )[ 0 ] + "s, " + elapsed.toFixed( precision ) + "ms";
						startTime = process.hrtime(); // reset the timer
						return out;
				},
				/**
					* Get object with project info
					* @access public
					* @returns {Object}
					*/
				getProjectInfo: function() {
					var project, plain;
					try {
						plain = fsContainer.readFileSync( pathContainer.join( __dirname, "..", "package.json" ), "utf-8" );
						project = JSON.parse( plain );
					} catch ( e ) {
						throw new ReferenceError( "Cannot read package.json\n" );
					}
					return project;
				},
				/**
				*
				* @param {string} pathArg
				* @param {string} [calleePath]
				* @return {string}
				*/
				readJs: function( pathArg ) {
					if ( typeof pathArg !== "string" ) {
						throw new TypeError( "file path must be a string. " + typeof pathArg + " found" );
					}

					if ( !fsContainer.existsSync( pathArg ) ) {
						pathArg = pathArg + ".js";
						if ( !fsContainer.existsSync( pathArg ) ) {
							throw new ReferenceError( pathArg + " doesn't exist\n" );
						}
					}
					return fsContainer.readFileSync( pathArg, "utf-8" );
				},
				/**
				*
				* @param {string} file
				* @param {string} data
				*/
				writeJs: function( file, data ) {
					fsContainer.writeFileSync( file, data, "utf-8" );
				},
				/**
				* Resolve relative path relative to initial path (where main module located)
				* or relative to callee if any given
				* ('/foo/bar/filename.js', './baz') -> /foo/bar/baz
				* ('/foo/bar', './baz') -> /foo/bar/baz
				* ('/foo/bar', '/tmp/file/') -> /tmp/file/
				* @param {string} relPath
				* @param {string} [calleeFilename]
				* @return {string}
				*/
				resolveFilename: function( relPath, calleeFilename ) {
					return pathContainer.resolve( calleeFilename ? pathContainer.dirname( calleeFilename ) : srcPath, relPath );
				},
				/**
				* Test if a given path exists
				* @param {string} pathArg
				*/
				exists: function( pathArg ){
					if ( !fsContainer.existsSync( pathArg ) ) {
						pathArg = pathArg + ".js";
						return fsContainer.existsSync( pathArg );
					}
					return true;
				}
			};
		};

module.exports = Cli;