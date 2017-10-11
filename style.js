var padding = 18;
const ogNavHeight = $("#header").height();
const headerWidth = $("#header").width();

function navPadding () {
	var windowWidth = $( window ).width();	
	var headerHeight = $("#header").height() + parseInt($("#header").css("top"), 10);
	var controlWidth = $("#controls").width() + parseInt($("#controls").css("left"), 10);
	var toggleWidth = $("#toggle").width() + parseInt($("#toggle").css("right"), 10);
	var leftOffset =  (windowWidth-headerWidth)/2;

	console.log("| ogNavHeight = " + ogNavHeight + "| headerHeight = " + headerHeight + "| windowWidth = " + windowWidth);

if(windowWidth < controlWidth + 560 + padding){
		$("#header").addClass("stacked");
		$("#toggle").addClass("stacked");
		$("#infoContainer").addClass("stacked");
		leftOffset =  50;
	}else if(windowWidth < headerWidth + controlWidth + 560 + padding*2){
		$("#toggle").removeClass("stacked");
		$("#infoContainer").removeClass("stacked");
		$("#header").addClass("stacked");
		leftOffset =  50;
	}else{
		$("#toggle").removeClass("stacked");
		$("#header").removeClass("stacked");
		$("#infoContainer").removeClass("stacked");

		if(leftOffset < controlWidth + padding){
		leftOffset =  controlWidth + padding;
	}
	}
		
		
	
     $("#header").css("left", leftOffset);

}

navPadding();
$(window).on('resize', navPadding);

