(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
	typeof define === 'function' && define.amd ? define(['exports'], factory) :
	(global = global || self, factory(global.BasicRenderer = {}));
}(this, (function (exports) { 'use strict';


        /* ------------------------------------------------------------ */

    function boundingBox(primitive) {
        var X = {i: 0, f: 0};
        var Y = {i: 0, f: 0};

        primitive.vertices.map((v, index) => {
            if (index == 0){
                X = {i: v[0], f: v[0]};
                Y = {i: v[1], f: v[1]};
            }
            else {
                X = {
                    i: X.i > v[0] ? v[0] : X.i, 
                    f: X.f < v[0] ? v[0] : X.f
                };
                Y = {
                    i: Y.i > v[1] ? v[1] : Y.i, 
                    f: Y.f < v[1] ? v[1] : Y.f
                };
            }
        })

        return {X, Y};
    }

    function inside(  x, y, primitive  ) {
        function normVect(A, B){
            var N = [-1*(B[1]-A[1]), (B[0] - A[0])]        
            return N;
        }
        if (primitive.shape == 'triangle'){
            var vert = primitive.vertices;
        
            //Coordenadas dos vértices
            var P0 = [vert[0][0], vert[0][1]];
            var P1 = [vert[1][0], vert[1][1]];
            var P2 = [vert[2][0], vert[2][1]];
    
	    	
	/*
		//Coordenadas dos vértices
            var P0 = [vert[0][0], vert[0][1]];
            var P1 = [vert[1][0], vert[1][1]];
            var P2 = [vert[2][0], vert[2][1]];
            
            //Verifica a existência da propriedade xform
            if( primitive.hasOwnProperty('xform')){
                //Acrescenta uma coordenada homogênea
                var P00 = [vert[0][0], vert[0][1], 1];
                var P11 = [vert[1][0], vert[1][1], 1];
                var P22 = [vert[2][0], vert[2][1], 1];
                function aplicaAfim(ponto){
                    var m = primitive.xform;
                    var somaprod;
                    var pontos;
                    // Realiza a multiplicação da matriz da composição das transformações afins e o ponto
                    for(let i = 0 ; i < 3 ; i++){
                        for(let j =0 ; j < 1 ; j++){
                            somaprod=0;
                            for(k=0; k<3; k++) {
                                somaprod+=m[i][k]*ponto[k][j];
                                pontos[i][j]= somaprod;
                            }
                        }
                    }
                    // Retorna o ponto após a tranformação 
                    return ponto = [pontos[0][0], pontos[1][0]] 
                }
                //Atualiza os pontos 
                P0 = aplicaAfim(P00);
                P1 = aplicaAfim(P01);
                P2 = aplicaAfim(P02);
            }
	
	
	
	
	*/	
		
            //Normais
            var n0 = normVect(P0, P1);
            var n1 = normVect(P1, P2);
            var n2 = normVect(P2, P0);
    
            //Vetores até o ponto genérico (x,y)
            var d0 = [x - P0[0], y - P0[1] ];
            var d1 = [x - P1[0], y - P1[1] ];
            var d2 = [x - P2[0], y - P2[1] ];
    
            //Produto interno entre vetores e suas normais 
            var L0 = (d0[0] * n0[0]) + (d0[1] * n0[1]);
            var L1 = (d1[0] * n1[0]) + (d1[1] * n1[1]);
            var L2 = (d2[0] * n2[0]) + (d2[1] * n2[1]);

            if (L0>0 && L1>0 && L2>0){
                console.log("teste ok");            
                return true;
            } else {
                console.log("teste nok"); 
            }
        }
        else {      
            return false
        }
    }

    function polygonToTriangles(preprop_scene, primitive) {
        const { vertices, color } = primitive;

        for (var i = 1; i < vertices.length - 1; i++){
            var triangulo = {
                shape: 'triangle',
                vertices: [
                    vertices[0],
                    vertices[i],
                    vertices[i+1]
                ],
                color: color
            }

            var bBox = boundingBox(triangulo);
            //preprop_scene.push( bBox );
            
            preprop_scene.push( triangulo );  
        }
        console.log(preprop_scene);
        return preprop_scene;
    }

    function circleToTriangles (preprop_scene, primitive, n) {
        function getRadians(n){ //Criação de lista de variação da angulação do círculo
            var radList = [];
            const degree = (2 * Math.PI)/n;
            for (var i = 0; i < n; i++){
                radList.push(i*degree);
            }
            return radList;
        }

        const list = getRadians(n);
        const { radius: r, center, color } = primitive;
        const [centerX, centerY] = center

        // Criação de pontos através da equação paramétrica do círculo
        const P = list.map((degree) => {
            return [Math.floor(r * Math.sin(degree) + centerX), Math.floor(r * Math.cos(degree) + centerY)];
        })

        return polygonToTriangles(preprop_scene, {vertices: P, color});
    }        
    
    function Screen( width, height, scene ) {
        this.width = width;
        this.height = height;
        this.scene = this.preprocess(scene);   
        this.createImage(); 
    }

    Object.assign( Screen.prototype, {

            preprocess: function(scene) {
                // Possible preprocessing with scene primitives, for now we don't change anything
                // You may define bounding boxes, convert shapes, etc
                
                var preprop_scene = [];

                for( var primitive of scene ) {  

                    if (primitive.shape == 'triangle'){
                        var bBox = boundingBox(primitive);
                        //preprop_scene.push( bBox );
                        preprop_scene.push( primitive );
                    }

                    if (primitive.shape == 'polygon'){
                        preprop_scene = polygonToTriangles(preprop_scene, primitive);
                    }

                    if (primitive.shape == 'circle'){
                        preprop_scene = circleToTriangles(preprop_scene, primitive, 4)
                    }
                }
                
                return preprop_scene;
            },

            createImage: function() {
                this.image = nj.ones([this.height, this.width, 3]).multiply(255);
            },

            rasterize: function() {
                var color;
         
                // In this loop, the image attribute must be updated after the rasterization procedure.
                for( var primitive of this.scene ) {

                    /**
                    for (var i = 0; i < this.scene.length; i += 2){
                        var box = this.scene[i];
                        var primitive = this.scene[i+1];
                        console.log(primitive);
                        for (var j = box.X.i; j <= box.X.f; j++){
                            var x = j + 0.5;
    
                            for (var k = box.Y.i; k <= box.Y.f; k++){
                                var y = k + 0.5;
    
                                if ( inside( x, y, primitive ) ) {                                
                                    color = primitive.color;
                                    this.set_pixel( j, this.height - (k + 1), color );
                                }
                            }
                        }
                    }**/
                    // Loop through all pixels
                    for (var i = 0; i < this.width; i++) {
                        var x = i + 0.5;
                        for( var j = 0; j < this.height; j++) {
                            var y = j + 0.5;
                            if ( inside( x, y, primitive ) ) {
                                color = nj.array(primitive.color);
                                this.set_pixel( i, this.height - (j + 1), color );
                            }
                        }
                    }
                }
            },

            set_pixel: function( i, j, colorarr ) {
                // We assume that every shape has solid color
         
                this.image.set(j, i, 0,    colorarr.get(0));
                this.image.set(j, i, 1,    colorarr.get(1));
                this.image.set(j, i, 2,    colorarr.get(2));
            },

            update: function () {
                // Loading HTML element
                var $image = document.getElementById('raster_image');
                $image.width = this.width; $image.height = this.height;

                // Saving the image
                nj.images.save( this.image, $image );
            }
        }
    );

    exports.Screen = Screen;
    
})));

