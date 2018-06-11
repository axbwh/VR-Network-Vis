var padding = 18;
const ogNavHeight = $("#header").height();
const headerWidth = $("#header").width();

String.prototype.replaceAll = function (search, replacement) {
    var target = this;
    return target.split(search).join(replacement);
};

String.prototype.insertBefore = function(strToFind, strToInsert) {
    var target = this;
    var n = target.lastIndexOf(strToFind);
    if (n < 0) return target;
    return target.substring(0,n) + strToInsert + target.substring(n);    
}

String.prototype.replaceSelector = function (selStr, typeStr, colStr, zStr) {
    var target = this;
    return target.replaceAll('var(--selector)', selStr).replaceAll('var(--typename)', typeStr).replaceAll('var(--nodecolor)', colStr).replaceAll('var(--zindex)', zStr)
}; 

String.prototype.isHexColor = function () {
    var target = this;
    return /(^#[0-9A-F]{6}$)|(^#[0-9A-F]{3}$)/i.test(target);
};

String.prototype.isNumber = function () {
    var target = this;
    return !isNaN(parseInt(target));
};

Array.prototype.curbIndex = function (index) {
    var target = this;
    return index < target.length ? target[index] : target[target.length - 1]
};

Array.prototype.caseIndexOf = function (query) {
    var target = this;
    return target.findIndex(item => query.toLowerCase() === item.toLowerCase());
};

Array.prototype.unique = function () {
    var target = this;
    return target.filter(function (x, i) {
        return target.indexOf(x) === i
    })
}

function parseNodeTypeList(data) {
    var typ = data.map(a => a.data('type')).unique()
    var subTypes = {};
    typ.forEach(tp => subTypes[tp] = data.map(a => {
        var subtype = a.nodes(`[type = "${tp}"]`).data('role') 
        return subtype != undefined ? subtype : tp 
    }).unique())
    return subTypes
}

function sortBySubType(a, b, nodeType) {
    // objects with no role properties (Key Label, Bbox) placed first
    if (!a.data().hasOwnProperty('role') || !b.data().hasOwnProperty('role')) {
        return !a.data('role') ? -1 : 1
    } else {
        var typeAr = Object.keys(nodeType)
        var atype = a.data('type');
        var btype = b.data('type');
        //to maintain ordering per type > per subtype, for nodes of type=key, assign mock types
        if (a.data("type") == "key") {
            atype = typeAr.indexOf(a.data('role')) > -1 ? typeAr.indexOf(a.data('role')) : atype
            btype = typeAr.indexOf(b.data('role')) > -1 ? typeAr.indexOf(b.data('role')) : btype
            typeAr.forEach(val => {
                atype = nodeType[val].indexOf(a.data('role')) > -1 ? val : atype
                btype = nodeType[val].indexOf(b.data('role')) > -1 ? val : btype
            })
        }

        if (atype !== btype) {
            var orderA = typeAr.indexOf(atype)
            var orderB = typeAr.indexOf(btype)
        } else {
            var orderA = nodeType[atype].indexOf(a.data('role'));
            var orderB = nodeType[atype].indexOf(b.data('role'));
        }
        return orderA - orderB
    }
}



function styleCy(nodeType, data, colList, styleList){  
    colSchm = colList[styleList.colorScheme]
    nodeAr = Object.keys(nodeType)

    Object.keys(colSchm).forEach( value => {        
        if(colSchm[value].constructor !== Array){
            $(":root").get(0).style.setProperty('--' + value.replaceAll('.', '-'), colSchm[value])
            data = data.replaceAll('var(--' + value.replaceAll('.', '-') + ')', colSchm[value])
        }
    })

    typeString = data.split('/*type').pop().split('type*/').shift()
    ringString = data.split('/*ring').pop().split('ring*/').shift()
    console.log(ringString)
    var beforeStr = "/*ring"
    var styleString = ""

    // var styleOride 

    nodeAr.forEach((key, index) => {
        var typeOride = styleList.nodeOverride.find( oride => {
            return oride.subtypes.caseIndexOf(key) > -1
        })

        var type = typeOride && typeOride.color.isNumber() ? colSchm.node.curbIndex(typeOride.color) : colSchm.node.curbIndex(index)
        var typeCol = typeOride && typeOride.color.isHexColor() ? typeOride.color : type[0]
        if(typeOride){
            console.log(typeOride.color.isHexColor())        
        }
        // debugger
        
        styleString = styleList.ringNodes.indexOf(key) > -1 ? (typeString + ringString) : typeString
        
        data = data.insertBefore(beforeStr, styleString.replaceSelector('type', key, typeCol, index + 1))
        
        nodeType[key].forEach( (val, ind) => {

            var subOride = styleList.nodeOverride.find( oride => {
                return oride.subtypes.caseIndexOf(val) > -1
            })
            console.log(`val = ${val} ^^ subOride = ${subOride}`)

            var subCol = typeOride && typeOride.color.isHexColor() ? typeCol : subOride && subOride.color.isNumber() ? type.curbIndex(subOride.color) : subOride && subOride.color.isHexColor() ? subOride.color : type.curbIndex(ind)

            styleString = styleList.ringNodes.indexOf(val) > -1 ? (typeString + ringString) : typeString

            data = data.insertBefore(beforeStr, styleString.replaceSelector('role', val, subCol,index + 1))
        // console.log(`typeOride.color`)
        // console.log(typeOride.color)
        // console.log(`typeCol`)
        // console.log(typeCol)
        
        // if(subOride){
        // console.log(`subOride.color`)
        // console.log(subOride.color)
        // console.log(`subCol`)
        // console.log(subCol)
        // debugger
        // }
        })
    })
    return data
}

let isPlainObj = (o) => Boolean(
    o && o.constructor && o.constructor.prototype && o.constructor.prototype.hasOwnProperty("isPrototypeOf")
)

let flattenObj = (obj, keys = []) => {
    return Object.keys(obj).reduce((acc, key) => {
        return Object.assign(acc, isPlainObj(obj[key]) ?
            flattenObj(obj[key], keys.concat(key)) : {
                [keys.concat(key).join(".")]: obj[key]
            }
        )
    }, {})
}

// function colorStyleCss() {
//     _.forEach(flattenObj(colors), function (value, key) {
//         if (value.constructor !== Array) {
//             $(":root").get(0).style.setProperty('--' + key.replaceAll('.', '-'), value)
//         }
//     })
// }


// function colorStyleCycss(data) {
//     _.forEach(flattenObj(colors), function (value, key) {
//         if (value.constructor === Array) {
//             _.forEach(value[0], function (val, ke) { // here key is 
//                 data += `node[role = "${ke}"] {
//                     background-color: ${val};
//                     }`
//             })
//         } else {
//             data = data.replaceAll('var(--' + key.replaceAll('.', '-') + ')', value)
//         }
//     })
//     return data
// }

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

//colorStyleCss()
navPadding();
$(window).on('resize', navPadding);
