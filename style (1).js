var padding = 18;
const ogNavHeight = $("#header").height();
const headerWidth = $("#header").width();

var colors = {
    bg: '#1A2A39',
    fg: '#ddd',
    hl: '#B6AB72',
    ll: '#3D4452',
    node: {
        school: '#B6AB72',
        project: '#287777',
        collab: '#78909C',
        person: [ {
            "Academic Staff": '#287777',
            "Professional Staff": '#1B4966',
            "Honours Student": '#4489A3',
            "PhD Student": '#4489A3',
            "Masters Student": '#4489A3'
        }]
    }
}

let isPlainObj = (o) => Boolean(
    o && o.constructor && o.constructor.prototype && o.constructor.prototype.hasOwnProperty("isPrototypeOf")
  )
  
  let flattenObj = (obj, keys=[]) => {
    return Object.keys(obj).reduce((acc, key) => {
      return Object.assign(acc, isPlainObj(obj[key])
        ? flattenObj(obj[key], keys.concat(key))
        : {[keys.concat(key).join(".")]: obj[key]}
      )
    }, {})
  }




String.prototype.replaceAll = function (search, replacement) {
    var target = this;
    return target.split(search).join(replacement);
};

function colorStyleCss() {
    console.log(flattenObj(colors))
    _.forEach(flattenObj(colors), function (value, key) {
        if(value.constructor !== Array){
        $(":root").get(0).style.setProperty('--' + key.replaceAll('.', '-'), value)
        }
    })
}


function colorStyleCycss(data) {
    _.forEach(flattenObj(colors), function (value, key) {
        if(value.constructor === Array){
            console.log(key)
            _.forEach(value[0], function (val, ke){
                console.log(`${ke} =`)
                console.log(val)
                data += `node[role = "${ke}"] {
                    background-color: ${val};
                    }`
            })
        }else{
        data = data.replaceAll('var(--' + key.replaceAll('.', '-') + ')', value)
        }
    })
    return data
}

function navbarCollapse() {
    var x = document.getElementById("controls");
    var y = document.getElementById("view");
    if (x.className === "topnav") {
        x.className += " responsive";
        y.className = "active";
    } else {
        x.className = "topnav";
        y.className = "";
    }
}

function navPadding() {
    var windowWidth = $(window).width();
    var headerHeight = $("#header").height() + parseInt($("#header").css("top"), 10);
    var controlWidth = $("#controls").width() + parseInt($("#controls").css("left"), 10);
    var toggleWidth = $("#toggle").width() + parseInt($("#toggle").css("right"), 10);
    var leftOffset = (windowWidth - headerWidth) / 2;
}

colorStyleCss()
navPadding();
$(window).on('resize', navPadding);
