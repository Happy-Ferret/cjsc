/**
* js-import-compiler
*
* @author sheiko
* @license MIT
* jscs standard:Jquery
*/

/**
* Executing cjsc cli
* @module cjsc-module
*/

/**
* @typedef requireConfig
* @type {Object}
* @property {module:DependencyConfig} depId
*/

	"use strict";
		/** @type {function} nodejs File I/O api */
var fs = require( "fs" ),
		/** @type {function} nodejs api for handling and transforming file paths */
		npath = require( "path" ),
    /*
		 * @type {module:lib/SrcMapGenerator}
		 */
		SrcMapGenerator = require( "./lib/SrcMapGenerator" ),
		/*
		 * @type {module:Compiler} Compiler constructor
		 */
		Compiler = require( "./lib/Compiler" ),
		/**
		 * @type {module:Parser} Parser constructor
		 */
		Parser = require( "./lib/Parser" ),
		/**
		 * @type {module:Replacer} Replacer constructor
		 */
		Replacer = require( "./lib/Replacer" ),
		/**
		 * @type {module:DependencyEntity}  DependencyEntity constructor
		 */
		DependencyEntity = require( "./lib/Entity/Dependency" );

/**
 * Runner
 * @param {*[]} argv - CLI arguments
 * @param {requireConfig} config - Depnedency configuration
 */
module.exports = function( argv, config ) {

	(function(){


		var
				/** @type {Compiler} */
				compiler,
				/** @type {Parser} */
				parser,
        /** @type {module:lib/FileSystem} */
        fSys,
				/** @type {module:lLib/Cli} Cli constructor	*/
				cli = new require( "./lib/Cli" )(),
				/** @type {SourceMapGenerator} */
				srcMapGen;

    cli.printHeader();
    cli.parseCliOptions( argv );
    fSys = new require( "./lib/FileSystem" )( npath.dirname( cli.srcPath ) );

    config = require( "./lib/Config" )( cli.options[ "config" ], fSys );
		parser = new Parser( DependencyEntity );

    srcMapGen = new SrcMapGenerator( cli.destPath, fSys );

		compiler = new Compiler( parser, fSys, config, srcMapGen );

//		srcResolvedFile = fSys.resolveFilename( cli.srcPath );
//    console.log("----", srcResolvedFile);

		if ( cli.options[ "source-map" ] ) {
			cli.options[ "source-map" ] = cli.options[ "source-map" ].replace( /\*/, npath.basename( cli.destPath ) );
			fSys.setSourceMapRoot( cli.options[ "source-map-root" ] || "", cli.options[ "source-map" ] );
		}

    //cli.srcPath is File??

		compiler.run( cli.srcPath, function( map, output ){
      if ( !map ) {
        return;
      }
//console.log();
      //console.log( "\n\n\n********************\n", output );
      if ( !map[ cli.srcPath ].length ) {
        output = fSys.readJs( cli.srcPath );
        console.log( " No dependencies found. Source is copied to the destination" );
      }

      if ( cli.options[ "minify" ] ) {
        output = require( "uglify-js" ).minify( output, { fromString: true }).code;
      }

      if ( cli.options[ "source-map" ] ) {
        output += "\n//# sourceMappingURL=" + ( cli.options[ "source-map-url" ] || "./" ) + npath.basename( cli.options[ "source-map" ] );
      }

      fSys.writeJs( cli.destPath, cli.options.banner + output );
      cli.options[ "source-map" ] && cli.writeJs( cli.options[ "source-map" ], srcMapGen.get() );

      map[ cli.srcPath ].length && cli.printBody( Object.keys( map ).length );

    });

	}());
};
