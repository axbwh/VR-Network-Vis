/*

*/
$(function () {
  var infoString = '<div class="info-row"><em> Select Any Node </em></div>';
  var layoutPadding = 50;
  var keyXPadding = 100;
  var keyYPadding = 50;
  var paddedHeight;
  var layoutDuration = 150;
  var collProject;
  var collSchool;
  var maxZoom = 3;
  var styleList;



  // get exported json from cytoscape desktop via ajax
  var graphP = loadData()

  // also get style via ajax
  var styleP = $.ajax({
    url: 'style.cycss',
    type: 'GET',
    dataType: 'text',
  });

  var colorP = fetch('colors.json').then(resp => resp.json())




  // when both graph export json and style loaded, init cy
  Promise.all([graphP, styleP, colorP]).then(initCy);

  Element.prototype.remove = function () {
    this.parentElement.removeChild(this);
  }

  NodeList.prototype.remove = HTMLCollection.prototype.remove = function () {
    for (var i = this.length - 1; i >= 0; i--) {
      if (this[i] && this[i].parentElement) {
        this[i].parentElement.removeChild(this[i]);
      }
    }
  }

  function getMaxLabelWidth(eles) {

    var maxLabelWidth = 0;

    eles.forEach(function (n) {
      var labelWidth = n.boundingBox({
        includeLabels: true
      }).w;

      if (labelWidth > maxLabelWidth) {
        maxLabelWidth = labelWidth;
      }
    });
    return maxLabelWidth;
  }

  function addKey() {

    var keyBorder = cy.add({
      group: "nodes",
      data: {
        id: "keyBorder",
        type: "border"
      }
    })

    var titleKey = cy.add({
      group: "nodes",
      data: {
        id: "titleKey",
        name: "NODE TYPE",
        type: "key"
      }
    });

    var keyAr = []
    var subKeyStyles = []
    var keyStyles = _.filter(styleList.nodeStyles.type, typ => {
      var subKeyAr = _.filter(styleList.nodeStyles.subtype, styp => { 
        return styp.type.toLowerCase() === typ.label.toLowerCase() && _.intersection(styp.subtype, typ.subtype).length < 1
      })
      if(subKeyAr.length > 1){
        subKeyStyles = subKeyStyles.concat(subKeyAr)
        return false
      }else{
        return true
      }
    })

    keyStyles = keyStyles.concat(subKeyStyles)
    

    keyStyles.forEach(stl => {
          keyAr[keyAr.length] = {
            group: "nodes",
            data: {
              id: `${stl.label}-key`,
              name: stl.label,
              type: "key",
              role: stl.subtype[0],
            }
          }
    })

    var roleKey = cy.add(keyAr);

    var keys = cy.elements('[type = "key"]');
    keys.unselectify().ungrabify();
    keyBorder.unselectify().ungrabify();

    function arrange() {

      var maxLabelWidth = getMaxLabelWidth(keys);
      var nodeHeight = keys.height();
      var bboxIgnore = cy.elements('.hidden, .filtered, [type = "key"], [type = "border"]');
      var bbox = cy.elements().not(bboxIgnore).boundingBox({
        includeLabels: true
      });
      var keyNum = keys.size();
      var keysHeight = (nodeHeight * keyNum) + (keyYPadding * (keyNum - 1));

      var layout = keys.layout({
        name: 'grid',
        columns: 1,
        boundingBox: {
          x1: bbox.x1 - (maxLabelWidth + keyXPadding),
          y1: bbox.y1 + ((bbox.h - keysHeight) / 2),
          w: maxLabelWidth,
          h: keysHeight
        },
        sort: (a, b) => {
          return sortBySubType(a, b, styleList)
        }
      });

      keyBorder.position({
        x: bbox.x1 - (maxLabelWidth + keyXPadding) + maxLabelWidth / 2,
        y: bbox.y1 + ((bbox.h - keysHeight) / 2) + keysHeight / 2
      });
      keyBorder.style({
        'width': (maxLabelWidth + keyXPadding / 2),
        'height': (keysHeight + keyXPadding / 2),
      })

      layout.run();
    }
    addKey.arrange = arrange;
  }

  function resizeIframe() {
    // Find all iframes
    var iFrames = $("iframe");
    // Find &#x26; save the aspect ratio for all iframes
    iFrames.each(function () {
      $(this).data("ratio", this.height / this.width)
        // Remove the hardcoded width &#x26; height attributes
        .removeAttr("width")
        .removeAttr("height");

    });

    // Resize the iframes when the window is resized

    iFrames.each(function () {
      // Get the parent container&#x27;s width
      var width = $(this).parent().width();
      $(this).width(width)
        .height(width * $(this).data("ratio"));
    });
    // Resize to fix all iframes on page load.
    $(this).data("ratio", this.height / this.width);
  }

  var getInitials = function (string, initNum, space) {
    var names = string.split(' ');
    _.pull(names, 'of', 'the', '&');
    var initials = names[0].substring(0, 1).toUpperCase();



    if (space == 1) {
      var kerning = " ";
    } else {
      var kerning = "";
    }

    if (names.length > 2) {
      for (var i = 1; i < names.length - 1; i++) {
        initials += kerning + names[i].substring(0, 1).toUpperCase();
      }

    }

    if (names.length > 1) {
      if (initNum == 1 || isNaN(names[names.length - 1]) == false) {
        initials += kerning + names[names.length - 1];
      } else {
        initials += kerning + names[names.length - 1].substring(0, 1).toUpperCase();
      }
    }

    if (initNum == 0) {
      initials = string;
    }

    return initials;
  };

  function setInitials(ele, cutoff01, cutoff02, space) {
    if (ele.data('name').length > cutoff01) {
      var initNum = 1;
      if (space != 1) {
        initNum = 2;
      }
    } else {
      var initNum = 0;
    }

    var nameShort = getInitials(ele.data('name'), initNum, space);

    if (nameShort.length > cutoff02) {
      nameShort = getInitials(ele.data('name'), 2, space);
    }

    return nameShort
  }


  function checkImageExists(imageUrl, callBack) {
    var imageData = new Image();

    imageData.onload = function () {
      callBack(true);
    }

    imageData.onerror = function () {
      callBack(false);
    };
    imageData.src = imageUrl;
  }


  function convertMedia(html) { //https://stackoverflow.com/a/22667308
    var pattern1 = /(?:http?s?:\/\/)?(?:www\.)?(?:vimeo\.com)\/?(.+)/g;
    var pattern2 = /(?:http?s?:\/\/)?(?:www\.)?(?:youtube\.com|youtu\.be)\/(?:watch\?v=)?(.+)/g;
    var pattern3 = /([-a-zA-Z0-9@:%_\+.~#?&//=]{2,256}\.[a-z]{2,4}\b(\/[-a-zA-Z0-9@:%_\+.~#?&//=]*)?(?:jpg|jpeg|gif|png))/gi;

    if (pattern1.test(html)) {
      var replacement = '<div class="media-wrapper"><iframe width="1920" height="1080" class="info-media" src="//player.vimeo.com/video/$1" frameborder="0" webkitallowfullscreen mozallowfullscreen allowfullscreen></iframe></div>';
      var html = html.replace(pattern1, replacement);
      return html;
    }


    if (pattern2.test(html)) {
      var replacement = '<div class="media-wrapper"><iframe width="1920" height="1080" class="info-media" src="http://www.youtube.com/embed/$1?&rel=0&showinfo=0&modestbranding=1&hd=1&autohide=1&color=white" frameborder="0" allowfullscreen></iframe></div>';
      var html = html.replace(pattern2, replacement);
      return html;
    }


    if (pattern3.test(html)) {
      var replacement = '<div class="media-wrapper"><a href="$1" target="_blank"><img class="img-fit" src="$1" /></a><br /></div>';
      var html = html.replace(pattern3, replacement);
      return html;
    }

  }

  function checkMediaIsVideo(html) {
    var pattern1 = /(?:http?s?:\/\/)?(?:www\.)?(?:vimeo\.com)\/?(.+)/g;
    var pattern2 = /(?:http?s?:\/\/)?(?:www\.)?(?:youtube\.com|youtu\.be)\/(?:watch\?v=)?(.+)/g;
    var pattern3 = /([-a-zA-Z0-9@:%_\+.~#?&//=]{2,256}\.[a-z]{2,4}\b(\/[-a-zA-Z0-9@:%_\+.~#?&//=]*)?(?:jpg|jpeg|gif|png))/gi;

    if (pattern1.test(html) || pattern2.test(html)) {
      return true;
    } else {
      return false;
    }
  }

  function infoTitleResize() {
    var fontsize = $("#toggle h").css('font-size');
    $("#toggle h").css('font-size', 20);
    $("#toggle h").css('font-Weight', 300);
    $("#toggle h").css('width', 'auto');
    $("#toggle h").css('letter-spacing', '0.04em');

    var titleWidth = $("#toggle h").width();
    var toggleWidth = $("#toggle").outerWidth();
    var showinfoWidth = $("#toggle h2").outerWidth();
    var checkboxWidth = $("#toggle .checkbox-round").outerWidth() + parseInt($("#toggle .checkbox-round").css('margin-left'), 10);
    var computedWidth = (toggleWidth - (showinfoWidth + checkboxWidth + 20));
    if (titleWidth > computedWidth) {
      $("#toggle h").css('font-size', 10);
      $("#toggle h").css('font-Weight', 800);
      $("#toggle h").css('letter-spacing', '0.1em');

      for (reWidth = titleWidth; $("#toggle h").height() < $("#toggle h2").height(); reWidth--) {
        $("#toggle h").css('width', reWidth);
      }

    }
  }

  function populateHtml(node, callback) {
    var infoTitle = $("#toggle h");
    var infoContainer = $("#infoWrapper .info .container");

    infoContainer.html('');

    var brief = node.data('brief');
    var infoSchool = node.data('school');
    var mediaLink = node.data('mediaLink');
    var siteLink = node.data('siteLink');
    var staffSiteLink = node.data('staffSiteLink');
    var siteName = node.data('siteName');
    var nodeType = node.data('type');
    var role = node.data('role');
    var datesActive = node.data('datesActive')

    if (!mediaLink && nodeType == "person") {
      mediaLink = 'assets/id-img.png';
    }



    if (!siteName) {
      siteName = node.data('name');
    }

    infoTitle.html(node.data('name'));
    infoTitleResize();


    if (role) {
      infoContainer.append('<div class="info-row"><p class="info-left">Role |</p> <p class ="info-right">' + node.data('role') + '</p></div>');
    }

    if (nodeType == "project") {
      var schoolHood = node.closedNeighborhood().closedNeighborhood().nodes('[type = "school"]');
      if (schoolHood.size() > 0) {
        infoSchool = '';
        schoolHood.forEach(function (ele, i) {
          infoSchool += ele.data('name');
          if (schoolHood.size() > 1 && i < schoolHood.size() - 1) {
            infoSchool += " | ";
          }
        });
      }

      var cutoff = 12;

      while (infoSchool.length > 60) {
        infoSchool = '';
        schoolHood.forEach(function (ele, i) {
          infoSchool += setInitials(ele, cutoff, cutoff, 2);
          if (schoolHood.size() > 1 && i < schoolHood.size() - 1) {
            infoSchool += " | ";
          }
        });
        cutoff -= 1;
      }

    }

    if (infoSchool) {
      infoContainer.append('<div class="info-row"><p class="info-left">Programme |</p> <p class ="info-right">' + infoSchool + '</p></div>');
    }

    if (siteLink) {
      infoContainer.append('<div class="info-row"><p class="info-left">Website |</p> <a  target="_blank" class ="info-right" href="' + siteLink + '">' + siteName + '</a></div>');
    }

    if (datesActive) {
      infoContainer.append('<div class="info-row"><p class="info-left">Dates Active |</p> <p class ="info-right">' + datesActive + '</p></div>');
    }

    if (brief) {
      infoContainer.append('<div class="info-row"><hr><p class="info-brief">' + brief + '</p></div>');
    }

    var mediaIsVideo = checkMediaIsVideo(mediaLink);
    var idHref = 'href="' + staffSiteLink + '"';

    function embedImg() {
      if (nodeType == "person") {
        if (staffSiteLink) {

          infoContainer.prepend('<div class="id-wrapper id-linked"><a ' + idHref + '" target="_blank"><div style="background-image: url(' + mediaLink + ');" class="img-crop"></div></a></div>');

        } else {

          infoContainer.prepend('<div class="id-wrapper"><a target="_blank"><div style="background-image: url(' + mediaLink + ');" class="img-crop"></div></a></div>');
        }
      } else {
        var imgHtml = convertMedia(mediaLink);

        infoContainer.prepend(imgHtml);
      }

      callback();
    }

    function embedVideo() {

      var videoHtml = convertMedia(mediaLink);

      if (nodeType == "person") {

        if (staffSiteLink) {

          infoContainer.prepend('<div class="id-linked"><a ' + idHref + '" target="_blank">' + videoHtml + '</a></div>');

        } else {

          infoContainer.prepend('<div class="id-linked"><a target="_blank">' + videoHtml + '</a></di>');
        }

      } else {

        var videoHtml = convertMedia(mediaLink);

        infoContainer.prepend(videoHtml);

      }
      resizeIframe();
      callback();
    }

    if (mediaIsVideo == false) {

      checkImageExists(mediaLink, function (imageReady) {

        if (imageReady == true) {

          embedImg();

        } else {
          mediaLink = 'assets/id-img.png';
          embedImg();
        }
      });

    } else if (mediaIsVideo == true) {
      embedVideo();
    } else {

      callback();

    }
  }



  function clearNav() {
    var infoContainer = $("#infoWrapper .info .container");
    $("#toggle h").html('');
    infoContainer.html(infoString);
  }

  // rearranges node in concentric layout around highlighted node
  function highlight(node) {
    $("#detailAid").hide();
    $("#detailAid-label").hide();

    var nhood = node.closedNeighborhood(); //closedNeighborhood returns connected eles

    if (node.data('type') == 'project') {
      var indhood = nhood.closedNeighborhood('[type = "school"]');
      nhood = nhood.add(indhood);
    }

    if (node.data('type') == 'school') {
      var indhood = nhood.closedNeighborhood('[type = "project"]');
      nhood = nhood.add(indhood);
    }

    if ($('#showProjects').prop('checked') == true || $('#showCollab').prop('checked') == true) {
      var nschool = nhood.nodes('[type = "school"]');
      if (nschool.size() > 1) {

        spreadNodes(nschool);
      }
    }

    populateHtml(node, reframe);



    function reframe() {

      cy.batch(function () { //batch processess multiple eles at once
        cy.elements().not(nhood).removeClass('highlighted').addClass('faded');
        nhood.removeClass('faded').addClass('highlighted');

        var npos = node.position();

        // Cytoscape Canvas Dimensions
        var cyW = cy.width();
        var cyH = cy.height();

        var cyRatio = cyH / cyW;

        if ($('#showInfo').prop('checked') == true) {

          if (nhood.nodes().size() < 3) {
            nhood = cy.nodes();
          }

          cy.maxZoom(100);

          var ogPan = Object.assign({}, cy.pan());
          var ogZoom = cy.zoom();

          cy.stop().fit(nhood, 0);
          var fitZoom = cy.zoom();
          //Highlighted Node Bouding Box Dimension before Being Resized
          var nhoodHeight = nhood.renderedBoundingBox().h;
          var nhoodWidth = nhood.renderedBoundingBox().w;
          var nhoodRatio = nhoodHeight / nhoodWidth;



          //Info Window Dimension
          var infoWidth = $('#infoContainer').outerWidth();
          var infoHeight = $('#infoContainer').outerHeight();

          if ((cyH - infoHeight) > 300) {
            var framePadding = 25;
          } else if ((cyH - infoHeight) > 200) {
            var framePadding = 10;
          } else {
            var framePadding = 5;
          }

          //Left Negative Space Dimensions minus Padding
          var leftWidth = cyW - (infoWidth + framePadding * 2);
          var leftHeight = cyH - (framePadding * 2);

          var leftRatio = leftHeight / leftWidth;

          //Bottom Negative Space Dimensions minus Padding
          var bottomWidth = cyW - (framePadding * 2);
          var bottomHeight = cyH - (infoHeight + framePadding * 2);

          var bottomRatio = bottomHeight / cyW;

          var panOffset = {
            x: 0,
            y: 0
          };

          //Check Whether Left or Bottom offer Largest Possible Display Area for Nodes Bounding Box

          //Calc area for each alignment
          var alignment = [];
          ////Align Left, Width First // Height First
          alignment[0] = {
            placement: 'left',
            order: 'width',
            width: leftWidth,
            height: leftWidth * nhoodRatio
          }

          alignment[1] = {
            placement: 'left',
            order: 'height',
            width: leftHeight / nhoodRatio,
            height: leftHeight
          }


          ////Align Bottom, Width First // Height First
          alignment[2] = {
            placement: 'bottom',
            order: 'width',
            width: bottomWidth,
            height: bottomWidth * nhoodRatio
          }

          alignment[3] = {
            placement: 'bottom',
            order: 'height',
            width: bottomHeight / nhoodRatio,
            height: bottomHeight
          }



          alignment.map(ali => ali.area = ali.width * ali.height);

          alignment = _.orderBy(alignment, [function (ali) {
            return ali.area
          }], ['desc']);

          var isAligned = false;

          for (i = 0; i < 3 && isAligned == false; i++) {
            curAli = alignment[i];

            if (curAli.placement == 'left' && curAli.order == 'width' && curAli.height < leftHeight) {
              var scaleFactor = leftWidth / nhoodWidth;
              var newZoom = fitZoom * scaleFactor;

              panOffset.x = -(infoWidth / 2);
              panOffset.y = 0;

              isAligned = true;
            }

            if (curAli.placement == 'left' && curAli.order == 'height' && curAli.width < leftWidth) {
              var scaleFactor = leftHeight / nhoodHeight;
              var newZoom = fitZoom * scaleFactor;

              panOffset.x = -(infoWidth / 2);
              panOffset.y = 0;

              isAligned = true;
            }

            if (curAli.placement == 'bottom' && curAli.order == 'width' && curAli.height < bottomHeight) {
              var scaleFactor = bottomWidth / nhoodWidth;
              var newZoom = fitZoom * scaleFactor;

              panOffset.x = 0;
              panOffset.y = infoHeight / 2;

              isAligned = true;
            }

            if (curAli.placement == 'bottom' && curAli.order == 'height' && curAli.width < bottomWidth) {
              var scaleFactor = bottomHeight / nhoodHeight;
              var newZoom = fitZoom * scaleFactor;

              panOffset.x = 0;
              panOffset.y = infoHeight / 2;

              isAligned = true;
            }
          }

          cy.zoom(newZoom);
          cy.center(nhood);
          var centerPan = Object.assign({}, cy.pan());
          cy.zoom(ogZoom);
          cy.pan(ogPan);
          cy.pan(centerPan);

          cy.stop().animate({ //frames all elements
            zoom: newZoom,
            pan: {
              x: centerPan.x + panOffset.x,
              y: centerPan.y + panOffset.y
            },
          }, {
            duration: layoutDuration
          })
        } else {

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
    }
  }

  function clear() { //reset layout
    unspreadNodes();
    cy.elements().removeClass('highlighted').removeClass('faded');
  }

  function fitAll() {
    if (cy.$(':selected').size() < 1) {

      cy.animate({
        fit: {
          eles: cy.elements().not('.hidden, .filtered'),
          padding: layoutPadding
        }
      }, {
        duration: layoutDuration
      });
    }
  }

  function clearStyles() {
    cy.elements().removeClass('filtered');
    cy.elements().removeClass('hidden');
    cy.elements().removeClass('highlighted');
    cy.edges().unselect();
  }

  function spreadNodes(nodesToSpread) {

    nodesToSpread.style({
      'label': function (ele) {
        return ele.data('name')
      }
    })

    var nodeNum = nodesToSpread.size();

    nodesToSpread.forEach(function (n) {
      var p = n.position();
      n.data('originPos', {
        x: p.x,
        y: p.y
      });
    });

    var nodeCenter = nodesToSpread.position();
    var nodeHeight = nodesToSpread.outerHeight();

    var maxLabelWidth = getMaxLabelWidth(nodesToSpread);

    //var gridWidth = (maxLabelWidth * nodeNum) + layoutPadding * (nodeNum + 1);
    var gridWidth = (maxLabelWidth * nodeNum)

    var layout = nodesToSpread.layout({
      name: 'grid',
      columns: nodeNum,
      boundingBox: {
        x1: nodeCenter.x - gridWidth / 2,
        y1: nodeCenter.y - (nodeHeight / 2),
        w: gridWidth,
        h: nodeHeight
      },
      avoidOverlap: true,
      avoidOverlapPadding: 0,
      padding: 0,
    });

    layout.run();
  }

  function unspreadNodes() {
    if ($('#showProjects').prop('checked') == true || $('#showCollab').prop('checked') == true) {
      var nodesToSpread = cy.nodes('[type = "school"]');
      nodesToSpread.forEach(function (n) {
        if (n.data('originPos')) {
          var position = n.data('originPos');
          n.position({
            x: position.x,
            y: position.y
          });
          n.removeData('originPos')
        }
      });
    }
  }

  function circleRadius(collection, nodeSize = 30, padding = 25) { //works out radius for evenly spaced nodes along circumference of circle
    var circum = collection.size() * nodeSize + collection.size() * padding;
    return circum / (2 * Math.PI);
  }


  function drawProjects() {
    clearStyles();

    cy.nodes().positions({
      x: 0,
      y: 0
    });
    var elesHide = cy.elements('edge[type = "collab"], [type = "school"]');
    var elesFilter = cy.elements('edge[type = "collab"]');

    var activePeople = cy.nodes('[type = "project"]').closedNeighborhood().nodes('[type = "person"]');
    var nonActivePeople = cy.nodes('[type = "person"]').not(activePeople);

    var emptySchoolNodes = cy.elements('[type = "school"]').filter(function (ele) {
      return ele.closedNeighborhood().nodes('[type = "person"]').size() < 1;
    });

    elesFilter = elesFilter.add(nonActivePeople);
    elesFilter = elesFilter.add(emptySchoolNodes);
    elesHide.addClass('hidden');
    elesFilter.addClass('filtered');

    paddedHeight = cy.height() - layoutPadding * 2

    if (cy.$(':selected').anySame(nonActivePeople) == true) {
      cy.elements('[type = "school"]').addClass('filtered');
      // cy.$(':selected').removeClass('filtered').addClass('hidden')
    }

    var personRadius = circleRadius(activePeople) * 2;
    var projectRadius = circleRadius(cy.nodes('[type = "project"]')) * 2;

    if (projectRadius < personRadius + 250) {
      projectRadius = personRadius + 250;
    }

    var personLayout = activePeople.layout({
      name: 'circle',
      avoidOverlap: false,
      padding: layoutPadding,
      startAngle: 0,
      sweep: Math.PI,
      boundingBox: {
        x1: 0 - personRadius,
        y1: 0 - personRadius,
        w: personRadius * 2,
        h: personRadius * 2,
      },
      radius: personRadius,
      nodeDimensionsIncludeLabels: false,
      sort: (a, b) => {
        return sortBySubType(a, b, styleList)
      },
    });

    var projectLayout = cy.nodes('[type = "project"]').layout({
      name: 'circle',
      avoidOverlap: false,
      padding: layoutPadding,
      startAngle: 0,
      sweep: Math.PI,
      boundingBox: {
        x1: 0 - projectRadius,
        y1: 0 - projectRadius,
        w: projectRadius * 2,
        h: projectRadius * 2,
      },
      radius: projectRadius,
      nodeDimensionsIncludeLabels: false
    });


    personLayout.run();
    projectLayout.run();

    addKey.arrange();

    cy.$(':selected').forEach(highlight);
    //cy.fit(cy.elements().not('.hidden, .filtered'), layoutPadding);
  }

  function drawSchools() {
    clearStyles();

    var elesHide = cy.edges('[type = "collab"], [type = "school"]');
    var elesFilter = cy.elements('[type = "null"]');

    var schoolNodes = cy.nodes('[type = "school"]');

    var emptySchoolNodes = schoolNodes.filter(function (ele) {
      return ele.closedNeighborhood().nodes('[type = "person"]').size() < 1;
    });

    schoolNodes = cy.nodes('[type = "school"]').not(emptySchoolNodes);


    var schoolNum = schoolNodes.size();

    elesFilter = elesFilter.add(emptySchoolNodes);

    elesHide.addClass('hidden');
    elesFilter.addClass('filtered');

    elesHide.position({
      x: cy.width() / 2,
      y: -50,
    });

    var schoolBB = {
      w: 0,
      h: 0
    };
    var maxClusterSize = 0;

    function spreadSchools(forceRadius) {
      schoolBB.w = 0;
      schoolBB.h = 0;

      schoolNodes.forEach(function (ele) {
        var node = ele;
        var nhood = node.closedNeighborhood();
        var npos = node.position();

        var radius = circleRadius(nhood.nodes('[type = "person"]'));
        var minRad = 50;

        if (forceRadius) {
          radius = forceRadius;
        }

        if (radius < minRad) {
          radius = minRad;
        }

        var layout = nhood.nodes('[type = "person"]').layout({
          name: 'circle',
          avoidOverlap: false,
          padding: layoutPadding,
          boundingBox: {
            x1: npos.x - radius,
            y1: npos.y - radius,
            w: radius * 2,
            h: radius * 2,
          },
          radius: radius,
          nodeDimensionsIncludeLabels: false,
          sort: (a, b) => {
            return sortBySubType(a, b, styleList)
          },
        });
        layout.run();
        ele.data('clusterSize', radius * 2);
        if (maxClusterSize < ele.data('clusterSize')) {
          maxClusterSize = ele.data('clusterSize');
        }
      });
    }

    spreadSchools();

    var projectRadius = circleRadius(cy.nodes('[type = "project"]'));


    var projectLayout = cy.nodes('[type = "project"]').layout({
      name: 'circle',
      avoidOverlap: false,
      padding: layoutPadding,
      boundingBox: {
        x1: 0 - projectRadius,
        y1: 0 - projectRadius,
        w: projectRadius * 2,
        h: projectRadius * 2,
      },
      radius: projectRadius,
      nodeDimensionsIncludeLabels: false
    });


    var schoolRadius = circleRadius(schoolNodes, maxClusterSize, 200);

    if (schoolRadius < projectRadius + maxClusterSize / 2 + 200) {
      schoolRadius = projectRadius + maxClusterSize / 2 + 200;
    }

    schoolNodes = schoolNodes.sort(function (a, b) {
      return a.closedNeighborhood().size() - b.closedNeighborhood().size();
    })

    schoolNodes.forEach(function (node, f) {
      var i = f + 1;
      var order = Math.ceil(schoolNum / 2) - ((i % 2) * -2 + 1) * (Math.ceil(schoolNum / 2) - Math.ceil(i / 2));
      node.data('order', order);
    })

    var schoolLayout = cy.elements('[type = "school"]').layout({
      name: 'circle',
      avoidOverlap: false,
      padding: layoutPadding,
      startAngle: ((Math.PI * 2) / schoolNodes.size() / 2) * (schoolNum % 2) + Math.PI / 2,
      boundingBox: {
        x1: 0 - schoolRadius,
        y1: 0 - schoolRadius,
        w: schoolRadius * 2,
        h: schoolRadius * 2,
      },
      radius: schoolRadius,
      nodeDimensionsIncludeLabels: false,
      sort: function (a, b) {

        return a.data('order') - b.data('order');
      }
    });

    schoolLayout.run();
    projectLayout.run();

    spreadSchools(maxClusterSize / 2);

    addKey.arrange();
    clear();
    cy.$(':selected').forEach(highlight);
  }

  function drawCollab() {
    clearStyles();
    var elesHide = cy.elements('[type = "project"], [type = "school"]');
    var elesFilter = cy.elements('[type = "project"]');

    var activePeople = cy.nodes('[type = "project"]').closedNeighborhood();
    var nonActivePeople = cy.nodes('[type = "person"]').not(activePeople);
    elesFilter = elesFilter.add(nonActivePeople);

    elesHide.addClass('hidden');
    elesFilter.addClass('filtered');

    var people = activePeople.nodes('[type = "person"]');


    var layout = people.layout({
      name: 'circle',
      avoidOverlap: false,
      padding: layoutPadding,
      radius: circleRadius(people),
      nodeDimensionsIncludeLabels: false,
      sort: (a, b) => {
        return sortBySubType(a, b, styleList)
      },
    });

    layout.run();

    cy.nodes().not(people).position({
      x: cy.width() / 2,
      y: cy.height() / 2,
    });

    addKey.arrange();
    cy.$(':selected').forEach(highlight);
  }

  function addCollab() {
    cy.nodes('[type = "project"]').forEach(function (projectNode) {
      projectNode.closedNeighborhood().nodes('[type = "person"]').forEach(function (person) {
        projectNode.closedNeighborhood().nodes('[type = "person"]').forEach(function (otherPerson) {
          if (person != otherPerson && cy.edges('[id ="' + person.id() + "to" + otherPerson.id() + '"]').size() < 1 && cy.edges('[id ="' + otherPerson.id() + "to" + person.id() + '"]').size() < 1) {
            cy.add({
              group: "edges",
              data: {
                id: person.id() + "to" + otherPerson.id(),
                source: person.id(),
                target: otherPerson.id(),
                type: "collab"
              }
            });
          }
        })
      })
    });
  }


  function setLabels() {
    cy.nodes('[type = "person"],[type = "project"],[type = "school"]').style({
      'label': function (ele) {
        return ele.data('name')
      }
    })

    cy.nodes('[type = "project"]:unselected').style({
      'label': function (ele) {
        return setInitials(ele, 15, 15, 2)
      }
    })

    cy.nodes('[type = "school"]:unselected').style({
      'label': function (ele) {
        return setInitials(ele, 12, 12, 2)
      }
    })

    if (cy.zoom() < 1.2) {

      cy.nodes('[type = "person"]:unselected').style({
        'label': function (ele) {
          return setInitials(ele, 6, 6, 1)
        }
      })

    } else {
      cy.nodes('[type = "person"]:unselected').style({
        'label': function (ele) {
          return setInitials(ele, 12, 12, 1)
        }
      })
    }

    cy.nodes('.highlighted').style({
      'label': function (ele) {
        if (cy.nodes('.highlighted[type = "project"]').size() > 5 && ele.data('type') == 'project') {
          return setInitials(ele, 6, 6, 1)
        } else {
          return ele.data('name')
        }
      }
    })
  }

  function hoverLight(node) {
    node.closedNeighborhood().addClass('hover-hood');
    node.addClass('hover');
    node.style({
      'label': node.data('name')
    })
  }

  function hoverNight(node) {
    node.closedNeighborhood().removeClass('hover-hood');
    node.removeClass('hover');
    setLabels();
  }

  function setAuto() {
    var viewNames = cy.nodes().not('.hidden, .filtered, [type = "key"], [type = "border"]').map(function (ele) {
      return ele.data('name');
    });
    $("#autocomplete").autocomplete("option", "source", viewNames);
  }

  function initAuto() {
    $("#autocomplete").on("autocompletefocus", function (event, ui) {
      $("#searchAid").hide();
      $("#searchAid-label").hide();
      var autoName = ui.item.value;
      var node = cy.nodes('[name = "' + ui.item.value + '"]');
      var hovered = cy.nodes('.hover-hood, .hover');

      hovered.forEach(function (n) {
        hoverNight(n);
      });

      setLabels();
      hoverLight(node);
    });

    $("#autocomplete").on("autocompleteselect", function (event, ui) {
      //$( "#autocomplete" ).blur();
      var autoName = ui.item.value;
      var node = cy.nodes('[name = "' + autoName + '"]');

      cy.$(':selected').unselect()

      node.select();


    });

    $("#autocomplete").on("autocompleteclose", function (event, ui) {
      cy.elements().removeClass('hover-hood').removeClass('hover')
    });

  }

  function initCy(then) {
    var loading = document.getElementById('loading');
    var elements = then[0]
    var cycss = then[1];
    var colorList = then[2];


    let defaultZoom = 1

    loading.classList.add('loaded');


    var cy = window.cy = cytoscape({
      container: document.getElementById('cy'),
      elements: elements,
      motionBlur: true,
      selectionType: 'single',
      boxSelectionEnabled: false,
      wheelSensitivity: 0.5,
    })
    //temp {
    var styleMaster = {
      colorScheme: 2,
      fg:'',
      bg:'',
      hl:'',
      ll:'',
      nodeOverride: [
        {
          label: "Person",
          subtype: ["person"],
          color: '1',
          shape: ''
        },
        {
          label: "Post-grad Student",
          subtype: ["Honours Student", "Masters Student", "PhD Student"],
          color: ''
        },
        {
          label: "Programme",
          subtype: ["school"],
          color: '',
          shape:'ring'
        },
        {
          label: "Project",
          subtype: ["project"],
          color:'',
          shape: 'ring'
        }
      ]
    }
    // } temp

    styleList = parseStyles(cy.nodes(), colorList, styleMaster, cycss);
    cy.style(styleList.stylesheet)

    addCollab();
    addKey();

    cy.minZoom(0.075);
    cy.maxZoom(maxZoom);


    cy.on('select', 'node', function (e) {
      var node = this;
      highlight(node);

    });

    cy.on('mouseover', 'node', function (e) {
      var node = this;
      hoverLight(node);
      $("#cy").css('cursor', 'pointer');


    });

    cy.on('mouseout', 'node', function (e) {
      var node = this;
      hoverNight(node);
      $("#cy").css('cursor', 'default');
    });

    cy.on('unselect', 'node', function (e) {

      var node = this;
      $("#autocomplete").val('');

      //unspreadNodes();
      clear();
      clearNav();
      fitAll();
    });


    cy.on('zoom', function (event) {
      setLabels();
    });

    drawProjects();
    initAuto();
    setAuto();
    fitAll();
  }



  $("#showProjects").on('change', function () {
    $("#viewAid").hide();
    $("#viewAid-label").hide();
    $('#showSchools').prop('checked', false);
    $('#showProjects').prop('checked', true);
    $('#showCollab').prop('checked', false);
    //if ($('#showCollab').prop('checked') == true || $('#showSchools').prop('checked') == true) {
    drawProjects();
    setAuto();
    fitAll();
    //}
  })


  $("#showSchools").on('change', function () {
    $("#viewAid").hide();
    $("#viewAid-label").hide();
    $('#showSchools').prop('checked', true);
    $('#showProjects').prop('checked', false);
    $('#showCollab').prop('checked', false);
    //if ($('#showProjects').prop('checked') == true || $('#showCollab').prop('checked') == true) {
    drawSchools();
    setAuto();
    fitAll();
    // }

  })

  $("#showCollab").on('change', function () {
    $("#viewAid").hide();
    $("#viewAid-label").hide();
    $('#showSchools').prop('checked', false);
    $('#showProjects').prop('checked', false);
    $('#showCollab').prop('checked', true);
    //if ($('#showProjects').prop('checked') == true || $('#showSchools').prop('checked') == true) {
    drawCollab();
    setAuto();
    fitAll();
    //}

  })

  $("#showInfo").on('change', function () {
    $("#detailAid").hide();
    $("#detailAid-label").hide();
    $("#infoWrapper").toggleClass("expanded");
    clear();
    cy.$(':selected').forEach(highlight);
  })

  $(window).on('resize', function () {
    $("#contact").iconselectmenu("close");
    $("#autocomplete").autocomplete("close");
  });

  $(window).on('resize', _.debounce(function () {
    selectHelp();
    fitAll();
    clear();
    cy.$(':selected').forEach(highlight);
  }, 250));

  $("#autocomplete").autocomplete({
    autoFocus: true,
    // minLength: 2,
    classes: {
      "ui-autocomplete": "suggestion-menu",
      "ui-menu-item": "suggestion-item",
    },
    position: {
      my: "left bottom",
      at: "left top",
      collision: "flip"
    },
    source: [''],
  });

  $.widget("custom.iconselectmenu", $.ui.selectmenu, {
    _renderItem: function (ul, item) {
      var li = $("<li>"),
        wrapper = $("<div>", {
          text: item.label
        });

      $("<span>", {
          style: item.element.attr("data-style"),
          "class": item.element.attr("data-class")
        })
        .appendTo(wrapper);

      return li.append(wrapper).appendTo(ul);
    },

    _renderButtonItem: function (item) {
      var div = $("<div>", {
        text: item.label
      });
      var buttonItem = $("<span>", {
        style: item.element.attr("data-style"),
        "class": item.element.attr("data-class")
      }).appendTo(div);

      // this._setText( buttonItem, item.label );

      return div;
    }
  });

  $('.aid-label').click(function () {
    var thisLabel = $(this).attr('id').replace('-label', '');
    $(this).hide()
    $("#" + thisLabel).hide()
  })

  var contactMenuOpen = false;
  $("#contact").iconselectmenu({
      open: function (event, ui) {
        $("#autocomplete").autocomplete("close");
        $("#contactAid, #contactAid-label").hide();
        contactMenuOpen = true;
      },
      close: function (event, ui) {
        contactMenuOpen = false;
      },
      select: function (event, ui) {
        if (contactMenuOpen == true) {
          if (ui.item.element.attr("value") == 'help') {
            if ($(window).width() <= 700) {
              $(".aid, .aid-label").not("#contactAid, #contactAid-label").show();
            } else {
              $(".aid, .aid-label").show();
            }
          } else {
            var outlink = ui.item.element.attr("href");
            window.open(outlink);
          }
        }
      },
      classes: {
        "ui-selectmenu-menu": "contact-menu",
        "ui-selectmenu-open": "contact-menu-open",
        "ui-menu-item": "contact-item"
      },
      position: {
        my: "left bottom",
        at: "left top",
        collision: "flip"
      }
    })
    .iconselectmenu("menuWidget")
    .addClass("ui-menu-icons");

  var helpModal = document.getElementById('help-modal');

  var helpClose = document.getElementById('help-modal-close');

  function selectHelp() {
    if ($(window).width() <= 700) {
      $("#contact").val('help')
      $("#contact").iconselectmenu("refresh");
    } else {
      $("#contact").val('github')
      $("#contact").iconselectmenu("refresh");
    }
  }

  selectHelp();



  $("#help-modal-close").on('click', function () {
    helpModal.style.display = 'none';
  });

  $("#help-modal").on('click', function (event) {
    if (event.target == helpModal) {
      helpModal.style.display = 'none';
    }
  });

});
