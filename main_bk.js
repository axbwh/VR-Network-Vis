/*

*/

$(function(){
  var layoutPadding = 200;
  var layoutDuration = 150;

  // get exported json from cytoscape desktop via ajax
  var graphP = loadData()


  // also get style via ajax
  var styleP = $.ajax({
    url: 'data.cycss',
    type: 'GET',
    dataType: 'text'
  });

  // when both graph export json and style loaded, init cy
  Promise.all([ graphP, styleP ]).then(initCy);

 // rearranges node in concentric layout around highlighted node
 function highlight( node ){
    var nhood = node.closedNeighborhood(); //closedNeighborhood returns connected eles

    cy.batch(function(){ //batch processess multiple eles at once
      cy.elements().not( nhood ).removeClass('highlighted').addClass('faded');
      nhood.removeClass('faded').addClass('highlighted');

      var npos = node.position();
      var w = window.innerWidth;
      var h = window.innerHeight;

       cy.stop().animate({ //frames all elements
        fit: {
          eles: nhood,
          padding: layoutPadding
        }
      }, {
        duration: layoutDuration
      })
      // .delay( layoutDuration, function(){ //rearranges neighboor nodes in concentric layout and zoom viewport
      //   nhood.layout({
      //     name: 'concentric',
      //     padding: layoutPadding,
      //     animate: true,
      //     animationDuration: layoutDuration,
      //     boundingBox: {
      //       x1: npos.x - w/2,
      //       x2: npos.x + w/2,
      //       y1: npos.y - w/2,
      //       y2: npos.y + w/2
      //     },
      //     fit: true,
      //     concentric: function( n ){
      //       if( node.id() === n.id() ){
      //         return 2;
      //       } else {
      //         return 1;
      //       }
      //     },
      //     levelWidth: function(){
      //       return 1;
      //     }
      //   });
      // } );

     });

    $("#infoWrapper .info .container").html(node.data('questionsHtml'))
  }

  function clear(defaultZoom){//reset layout
    cy.batch(function() {
      cy.$('.highlighted').forEach(function(n){
        n.animate({
          position: n.data('orgPos')
        });
      });

      cy.elements().removeClass('highlighted').removeClass('faded');
    });

    //cy.zoom(defaultZoom)
    //cy.center()
    cy.fit();
  }
function drawProjects(collection){
  cy.remove('*');
  cy.add(collection);
  collection.layout({
            name: 'concentric',
            padding: 0,
            animate: false,
            avoidOverlap: false,
            minNodeSpacing: 130,
            boundingBox: {
              x1: npos.x - 125,
              x2: npos.x + 125,
              y1: npos.y - 125,
              y2: npos.y + 125
            },
            nodeDimensionsIncludeLabels: false,
            height: 200, // height of layout area (overrides container height)
            width: 200,
            fit: false,
            concentric: function( node ){
              if( node.data('type') == "project" ){
                return 1;
              } else {
                return 2;
              }
            },
            levelWidth: function(){
              return 1;
            }
          });
}

  function initCy( then ){

    var loading = document.getElementById('loading');
    var elements = then[0]
    var styleJson = then[1];

    let defaultZoom = 1

    loading.classList.add('loaded');

    var cy = window.cy = cytoscape({
      container: document.getElementById('cy'),
      style: styleJson,
      elements: elements,
      motionBlur: true,
      selectionType: 'single',
      boxSelectionEnabled: false,
      wheelSensitivity: 0.5,

      // interaction options
    })

    var collProject = cy.elements('[type != "programme"]');
    // console.log("collProject = " + collProject);
    var collSchool = cy.elements('[type != "project"]');

    cy.minZoom(0.5);
    cy.maxZoom(2);

    cy.on('free', 'node', function( e ){
      var n = e.cyTarget;
      var p = n.position();

      n.data('orgPos', {
        x: p.x,
        y: p.y
      });
    });

    cy.on('select', 'node', function(e){

      var node = this;
      highlight( node );

    });

    cy.on('unselect', 'node', function(e){

      var node = this;
      clear(defaultZoom);

    });


    cy.on('layoutstop', function(e) {//once layout finished running
        cy.nodes().forEach(node => node.data('orgPos', Object.assign({}, node.position())))
        defaultZoom = cy.zoom()
      cy.fit();
    })

    // cy.elements('[type != "role"]').layout({
    //  name: 'cose-bilkent',
    //  idealEdgeLength: 100, padding: 10,
    // })

    cy.elements('[type = "programme"]').layout({
      name: 'grid',
      columns: 3,
      boundingBox: { x1: 0, y1: 0, w: cy.width(), h: cy.height() }
    })

    cy.one('layoutready', function(e) {

      cy.elements('[type = "programme"]').forEach(function(ele){
        var node = ele;
        var nhood = node.closedNeighborhood();

        var npos = node.position();


          nhood.layout({
            name: 'concentric',
            padding: 0,
            animate: false,
            avoidOverlap: false,
             minNodeSpacing: 130,
            boundingBox: {
              x1: npos.x - 125,
              x2: npos.x + 125,
              y1: npos.y - 125,
              y2: npos.y + 125
            },
            nodeDimensionsIncludeLabels: false,
            height: 200, // height of layout area (overrides container height)
            width: 200,
            fit: false,
            concentric: function( n ){
              if( node.id() === n.id() ){
                return 2;
              } else {
                return 1;
              }
            },
            levelWidth: function(){
              return 1;
            }
          });
      });
    });


  cy.elements('[type = "project"]').layout({
    name: 'grid',
    columns: 1,
    boundingBox: { x1: -500, y1: 0, w: 100, h: cy.height() }
  });



  //drawProjects(collProject);
  //var collProject = cy.elements('[type != "programme"]')
}



$("#showRoles").change(function(e) {
  //cy.nodes('[type = "role"]').toggleClass('filtered')

  // cy.remove(collSchool);
  // cy.add(collProject);
  // cy.fit();
})

$("#showSchools").change(function(e) {
  //cy.nodes('[type = "programme"]').toggleClass('filtered')
  // cy.remove(collProject);
  // cy.add(collSchool);
  // cy.fit();
})

$("#infoWrapper .toggle").click(function(e) {
  $("#infoWrapper").toggleClass("expanded")
})
});
