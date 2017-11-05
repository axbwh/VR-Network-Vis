  /*

  */

  $(function(){
    var layoutPadding = 50;
    var keyXPadding =100;
    var keyYPadding = 50;
    var paddedHeight;
    var layoutDuration = 150;
    var collProject;
    var collSchool;
    var maxZoom = 3;

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

    function getMaxLabelWidth(eles){

      var maxLabelWidth = 0;

      eles.forEach(function(n){
        var labelWidth = n.boundingBox({ includeLabels : true}).w;

        if(labelWidth > maxLabelWidth){
          maxLabelWidth = labelWidth;
        }
      });
      return maxLabelWidth ;
    }

    function addKey(){

      var titleKey = cy.add({
        group: "nodes",
        data: { id: "titleKey", name: "KEY",  type: "key" }
      });

      var projectKey = cy.add({
        group: "nodes",
        data: { id: "projectKey", name: "Project",  type: "key" }
      });

      projectKey.addClass("project")

      var schoolKey = cy.add({
        group: "nodes",
        data: { id: "schoolKey", name: "School",  type: "key" }
      });

      schoolKey.addClass("school")

      var roleKey = cy.add([
      {
        group: "nodes",
        data: { id: "schoolKey", name: "School",  type: "key" }
      },
      {
        group: "nodes",
        data: { id: "academicStaffKey", name: "Academic Staff",  role: "Academic staff", type: "key" }
      },
      {
        group: "nodes",
        data: { id: "honoursStudentKey", name: "Honours Student",  role: "Honours student", type: "key" }
      },
      {
        group: "nodes",
        data: { id: "phdStudentKey", name: "PhD Student",  role: "PhD student", type: "key" }
      },
      {
        group: "nodes",
        data: { id: "mastersStudentKey", name: "Masters Student",  role: "Masters student", type: "key" }
      },
      {
        group: "nodes",
        data: { id: "generalStaff", name: "General Staff",  role: "General staff", type: "key" }
      }
      ]);


      var keys = cy.elements('[type = "key"]');
      keys.unselectify().ungrabify();

      function arrange(){
        var maxLabelWidth = getMaxLabelWidth(keys);
        var nodeHeight = keys.height();
        var bboxIgnore = cy.elements('.hidden, .filtered, [type = "key"]');
        var bbox = cy.elements().not(bboxIgnore).boundingBox({ includeLabels : true});
        var keyNum = keys.size();
        var keysHeight = (nodeHeight*keyNum) + (keyYPadding*(keyNum-1));
        var layout = keys.layout({
          name: 'grid',
          columns: 1,
          boundingBox: { x1: bbox.x1 - (maxLabelWidth + keyXPadding), y1: bbox.y1 + ((bbox.h-keysHeight)/2), w: maxLabelWidth, h: keysHeight }
        });

        layout.run();
      }
      addKey.arrange = arrange;
    }


    function getId(url) {
      var regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
      var match = url.match(regExp);

      if (match && match[2].length == 11) {
        return match[2];
      } else {
        return 'error';
      }
    }

    function resizeIframe(){
    // Find all iframes
    var iFrames = $( "iframe" );
  // Find &#x26; save the aspect ratio for all iframes
  iFrames.each(function () {
    $( this ).data( "ratio", this.height / this.width )
    // Remove the hardcoded width &#x26; height attributes
    .removeAttr( "width" )
    .removeAttr( "height" );

  });

  // Resize the iframes when the window is resized

  iFrames.each( function() {
    // Get the parent container&#x27;s width
    var width = $( this ).parent().width();
    $( this ).width( width )
    .height( width * $( this ).data( "ratio" ) );
  });
// Resize to fix all iframes on page load.
$( this ).data( "ratio", this.height / this.width );
}

var getInitials = function (string, initNum, space) {
  var names = string.split(' '),
  initials = names[0].substring(0, 1).toUpperCase();

  if(space == 1){
  var kerning = " ";
}else{
  var kerning = "";
}

  if(names.length > 2){
    for (var i = 1; i < names.length - 1; i++) {
      initials += kerning + names[i].substring(0, 1).toUpperCase();
    }
    
  }

  if (names.length > 1) {
    if(initNum == 1 || isNaN(names[names.length - 1]) == false){
      initials += kerning + names[names.length - 1];
    }else{
      initials += kerning + names[names.length - 1].substring(0, 1).toUpperCase();
    }
  }
  return initials;
};

function populateHtml(node){
  $("#infoWrapper").addClass("expanded");
  var infoPadding = 20;

  var infoContainer = $("#infoWrapper .info .container");
  var videoLink = node.data('videoLink');
  var infoSchool = node.data('school');
  var siteLink = node.data('siteLink');
  // var siteName = node.data('siteName');
  var siteName = "shortersite.name";
  var projectBrief = node.data('projectBrief');

  var toggleWidth = $("#toggle").width() + parseInt($("#toggle").css('right'));

  $("#toggle").prepend('<h>' + node.data('name') + '</h>');

  var infoTitle = $("#toggle h")

  if(infoTitle.width()+ toggleWidth < infoContainer.width()){
    infoTitle.css("padding-right", (infoContainer.width()  - (infoTitle.width()+toggleWidth)) - infoPadding);
  }
  if(videoLink){

    videoId = getId(videoLink);
    infoContainer.append('<iframe width=1920 height=1080 src="//www.youtube.com/embed/' + videoId + '?&rel=0&showinfo=0&modestbranding=1&hd=1&autohide=1&color=white" frameborder="0" allowfullscreen></iframe>');

    resizeIframe();
  }

  if(node.data('type') == "person"){
    infoContainer.append('<div class="info-row"><p class="info-left">Role |</p> <p class ="info-right">' +  node.data('role') + '</p></div>');
  }
  if(infoSchool){
    infoContainer.append('<div class="info-row"><p class="info-left">Programme |</p> <p class ="info-right">' + infoSchool + '</p></div>');
  }

  if(projectBrief){
    infoContainer.append('<p>' + projectBrief + '</p>');
  }

  if(siteLink){
    infoContainer.append('<div class="info-row"><p class="info-left">Website |</p> <a class ="info-right" href="' + siteLink + '">' + siteName + '</a></div>');
  }

  function clearNav(){
    $("#toggle h").remove();
  }
  populateHtml.clearNav = clearNav;
}
   // rearranges node in concentric layout around highlighted node
   function highlight( node ){

      var nhood = node.closedNeighborhood(); //closedNeighborhood returns connected eles

      cy.batch(function(){ //batch processess multiple eles at once
        cy.elements().not( nhood ).removeClass('highlighted').addClass('faded');
        nhood.removeClass('faded').addClass('highlighted');

        var npos = node.position();
        var w = cy.width();
        var h = cy.height();



        if($('#showInfo').prop('checked') == true){
          cy.maxZoom(100);

          var ogPan = Object.assign({}, cy.pan());
          var ogZoom = cy.zoom();
          console.log( ogPan);
          
          cy.stop().fit(nhood);   
          var fitZoom = cy.zoom();

          var infoWidth = $('#infoContainer').width();
          var newWidth = w -  (infoWidth + layoutPadding*2);
          var scaleFactor = newWidth/w;
          var newZoom = fitZoom * scaleFactor;

          console.log("| infoWidth = " + infoWidth);
          cy.zoom(newZoom);
          cy.center(nhood);
          var centerPan = Object.assign({}, cy.pan());
          console.log(centerPan);
          console.log(ogPan);
          cy.zoom(ogZoom);
          cy.pan(ogPan);
          console.log("centerPan");
          console.log(centerPan);
          console.log(ogPan);
          cy.pan(centerPan);

          cy.stop().animate({ //frames all elements
            zoom : newZoom,
            pan: {x : centerPan.x-(infoWidth/2), y: centerPan.y},
          }, {
            duration: layoutDuration
          })

          //cy.panBy({x : -(infoWidth/2), y: 0});

       // cy.maxZoom(maxZoom);
     }else{

         cy.stop().animate({ //frames all elements
          fit: {
            eles: nhood,
            padding: layoutPadding
          }
        }, {
          duration: layoutDuration
        })
       }


     });

      //$("#infoWrapper .info .container").html(node.data('questionsHtml'));

      populateHtml(node);
      if($('#showInfo').prop('checked') == true){
        $("#infoWrapper").addClass("expanded")
      }else{
        $("#infoWrapper").removeClass("expanded")
      }
    }

    function clear(){//reset layout
     cy.elements().removeClass('highlighted').removeClass('faded');
     $("#infoWrapper").removeClass("expanded")
     $("#infoWrapper .info .container").html('');
     $("#toggle h").remove();
     cy.animate({
      fit: {
        eles : cy.elements().not('.hidden, .filtered'),
        padding: layoutPadding
      }
    }, {
      duration: layoutDuration
    });
   }

   function clearStyles(){
    cy.elements().removeClass('filtered');
    cy.elements().removeClass('hidden');
    cy.elements().removeClass('highlighted');
    cy.edges().unselect();
  }

  function spreadProjects(node){
    nhoodProjects = node.closedNeighborhood().nodes('[type = "project"]');

    var nodeNum = nhoodProjects.size();

    if(nodeNum > 1){

      nhoodProjects.forEach(function(n){
        var p = n.position();
        n.data('originPos', {
          x: p.x,
          y: p.y
        });
      });

      var nodeCenter =  nhoodProjects.position();
      var nodeHeight = nhoodProjects.height();
      var maxLabelWidth = getMaxLabelWidth(nhoodProjects);

      var gridWidth = (maxLabelWidth*nodeNum) + layoutPadding * (nodeNum+1);

      var layout = nhoodProjects.layout({
        name: 'grid',
        columns: nodeNum,
        boundingBox: { x1: nodeCenter.x - gridWidth/2, y1: nodeCenter.y - nodeHeight/2, w: gridWidth, h: nodeHeight }
      });

      layout.run();
    }
  }

  function unspreadProjects(node){
    nhoodProjects = node.closedNeighborhood().nodes('[type = "project"]');
    var nodeNum = nhoodProjects.size();

    if(nodeNum > 1){
      nhoodProjects.forEach(function(n){
        var position = n.data('originPos');
        n.position({ x: position.x, y : position.y});
      });
    }
  }


  function drawProjects(){
    clearStyles();
    var elesHide = cy.elements('edge[type = "collab"], [type = "school"]');
    var elesFilter = cy.elements('edge[type = "collab"]');

    var activePeople = cy.nodes('[type = "project"]').closedNeighborhood();
    var nonActivePeople = cy.nodes('[type = "person"]').not( activePeople );
    elesFilter = elesFilter.add(nonActivePeople);

    elesHide.addClass('hidden');
    elesFilter.addClass('filtered');

    paddedHeight = cy.height()-layoutPadding*2

    if(cy.$(':selected').anySame(nonActivePeople) == true){
      cy.elements('[type = "school"]').addClass('filtered')
      // cy.$(':selected').removeClass('filtered').addClass('hidden')
    }

    var layout = cy.elements().layout({
      name: 'concentric',
      startAngle: 0,
      sweep: Math.PI,
      concentric: function(ele){
        if(ele.data('type') == "project"){
          return 1;
        } else if(cy.nodes('[type = "project"]').closedNeighborhood().contains(ele) != true){
         return 3;
       }else{
        return 2;
      }
    },
    levelWidth: function(){ return 1 },
    boundingBox : {
      x1 : 0,
      y1 : 0,
      w : 300,
      h: 300
    },
    avoidOverlap : false,
    equidistant: false,
     // spacingFActor : 0.5;
     padding: layoutPadding,
     minNodeSpacing: paddedHeight / 2 ,
     nodeDimensionsIncludeLabels: false,
   });

    layout.run();
    addKey.arrange();

    clear();
    cy.$(':selected').forEach(highlight);
    cy.fit(cy.elements().not('.hidden, .filtered'), layoutPadding);
  }

  function drawSchools(){
    clearStyles();
    var elesHide = cy.elements('edge[type = "collab"], [type = "project"]');
    var elesFilter = cy.elements('[type = "null"]');



    elesHide.addClass('hidden');
    elesFilter.addClass('filtered');

    elesHide.position({
      x: cy.width()/2,
      y: -50,
    });

    var schoolNodes = cy.nodes('[type = "school"]');
    var schoolNum = schoolNodes.size();

    var schoolColumns = Math.ceil(schoolNum/3);

    for(i = 2; i < 6; i ++){
      if(schoolNum % i < schoolNum % schoolColumns){
        schoolColumns = i;
      }else if(schoolNum % i == schoolNum % schoolColumns){
        if (i > schoolColumns) {
          schoolColumns = i;
        }

      }
    }
    var schoolRows = Math.floor(schoolNum/schoolColumns);

    var schoolBB = { w : 0, h : 0};

    function spreadSchools(){
      schoolBB.w = 0;
      schoolBB.h = 0;

      schoolNodes.forEach(function(ele){
        var node = ele;
        var nhood = node.closedNeighborhood();
        var npos = node.position();

        var layout = nhood.layout({
          name: 'concentric',
          padding: 0,
          avoidOverlap: false,
          minNodeSpacing: 230,
          boundingBox: {
            x1: npos.x - cy.height() / 6,
            y1: npos.y - cy.height() / 6,
            x2: npos.x + cy.height() / 6,
            y2: npos.y + cy.height() / 6,
          },
          nodeDimensionsIncludeLabels: false,
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
        layout.run();
      });

      var maxRowSize = 0;
      var maxColSize = 0;


      for(i = 0; i < schoolRows; i++){

        var rowSize = 0;

        for(j = i*schoolColumns ; j < i*schoolColumns + schoolColumns && j < schoolNum; j++){
          rowSize += schoolNodes[j].closedNeighborhood().boundingBox().w;

        }

        if( rowSize > maxRowSize){
          maxRowSize = rowSize;
        }
      }

      for(i = 0; i < schoolColumns; i++){

        var colSize = 0;

        for(j = i ; j < schoolNum; j += schoolColumns){
          colSize += schoolNodes[j].closedNeighborhood().boundingBox().h;
        }

        if( colSize > maxColSize){
          maxColSize = colSize;
        }

      }

      schoolBB.w = maxRowSize;
      schoolBB.h = maxColSize;
    }

    spreadSchools();

    var schoolWidth = schoolBB.w + (schoolColumns-1)*layoutPadding*2;
    var schoolHeight = schoolBB.h + (schoolRows-1)*layoutPadding*2;

    var schoolLayout = cy.elements('[type = "school"]').layout({
      name: 'grid',
      columns: schoolColumns,
      boundingBox: { x1: 0, y1: 0, w: schoolWidth , h: schoolHeight }
    })

    schoolLayout.run();

    spreadSchools();

    addKey.arrange();
    clear();
    cy.$(':selected').forEach(highlight);
    cy.$(':selected').forEach(spreadProjects);
    cy.fit(cy.elements().not('.hidden, .filtered'), layoutPadding);
  }


  function drawCollab(){
    clearStyles();
    var elesHide = cy.elements('[type = "project"], [type = "school"]');
    var elesFilter = cy.elements('[type = "project"]');

    elesHide.addClass('hidden');
    elesFilter.addClass('filtered');

    var people = cy.nodes('[type = "person"]');

    var layout = people.layout({
      name: 'circle',
      avoidOverlap : false,
      padding: layoutPadding,
      radius: paddedHeight / 2 ,
      nodeDimensionsIncludeLabels: false,
    });

    layout.run();

    cy.nodes().not(people).position({
      x: cy.width()/2,
      y: cy.height()/2,
    });
    addKey.arrange();
    clear();
    cy.$(':selected').forEach(highlight);
    cy.fit(cy.elements().not('.hidden, .filtered'), layoutPadding);
  }

  function addCollab(){
    cy.nodes('[type = "project"]').forEach(function(projectNode) {
      projectNode.closedNeighborhood().nodes('[type = "person"]').forEach(function(person){
        projectNode.closedNeighborhood().nodes('[type = "person"]').forEach(function(otherPerson){
          if(person != otherPerson && cy.edges('[source ="' + otherPerson.id() + '"][target ="' + person.id()+ '"]').size() < 1 ){
            cy.add({
              group: "edges",
              data: { id: person.id() + "to" + otherPerson.id(), source: person.id(), target: otherPerson.id(), type: "collab" }
            });
          }
        })
      })
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
    })

    addCollab();
    addKey();

    cy.elements('[type = "school"]').addClass("school");
    cy.elements('[type = "project"]').addClass("project");

    cy.minZoom(0.2);
    cy.maxZoom(maxZoom);

    cy.on('select', 'node', function(e){

      var node = this;

      if ($('#showSchools').prop('checked') == true) {
        spreadProjects( node );
      }

      highlight( node );

    });

    cy.on('unselect', 'node', function(e){

      var node = this;

      if ($('#showSchools').prop('checked') == true) {
        unspreadProjects( node );
      }

      clear();
      populateHtml.clearNav();

    });

    cy.on('zoom', function(event){
      console.log(cy.nodes('[type = "project"]'));

      cy.nodes('[type = "person"],[type = "project"]').style({
        'label': function( ele ){ return ele.data('name')}
      })

     if(cy.zoom() < 1.2){
      cy.nodes('[type = "person"]:unselected').style({
        'label': function( ele ){ return getInitials( ele.data('name'), 2, 1)}
      })

       cy.nodes('[type = "project"]:unselected').style({
        'label': function( ele ){ return getInitials( ele.data('name'), 2, 2)}
      })

    }else{
      cy.nodes('[type = "person"]:unselected').style({
        'label': function( ele ){ return getInitials(ele.data('name'), 1, 1) }
      })

      cy.nodes('[type = "project"]:unselected').style({
        'label': function( ele ){ return ele.data('name')}
      })

    }

    cy.nodes('.highlighted').style({
        'label': function( ele ){ return ele.data('name')}
      })


  });

    drawProjects();
  }

  $("#showProjects").on('change', function() {
    if($('#showCollab').prop('checked') == true || $('#showSchools').prop('checked') == true){
     drawProjects(); 
   }
   $('#showSchools').prop('checked', false);
   $('#showProjects').prop('checked', true);
   $('#showCollab').prop('checked', false);
 })




  $("#showSchools").on('change', function() {
    if($('#showProjects').prop('checked') == true || $('#showCollab').prop('checked') == true){
     drawSchools();
   }
   $('#showSchools').prop('checked', true);
   $('#showProjects').prop('checked', false);
   $('#showCollab').prop('checked', false);
 })

  $("#showCollab").on('change', function() {

    if($('#showProjects').prop('checked') == true || $('#showSchools').prop('checked') == true){
     drawCollab();
   }

   $('#showSchools').prop('checked', false);
   $('#showProjects').prop('checked', false);
   $('#showCollab').prop('checked', true);
 })

  $("#showInfo").on('change', function() {
    $("#infoWrapper").toggleClass("expanded");
    clear();
    cy.$(':selected').forEach(highlight);
  })

  $(window).on('resize', _.debounce(function () {
    cy.fit(cy.elements().not('.hidden, .filtered'), layoutPadding);
  }, 250));

});





