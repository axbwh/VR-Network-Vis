var padding = 18;
const ogNavHeight = $("#header").height();
const headerWidth = $("#header").width();

String.prototype.replaceAll = function (search, replacement) {
    var target = this;
    return target.split(search).join(replacement);
};

String.prototype.insertBefore = function (strToFind, strToInsert) {
    var target = this;
    var n = target.lastIndexOf(strToFind);
    if (n < 0) return target;
    return target.substring(0, n) + strToInsert + target.substring(n);
}

String.prototype.replaceSelector = function (selStr, typeStr, colStr, zStr) {
    var target = this;
    return target.replaceAll('var(--selector)', selStr).replaceAll('var(--typename)', typeStr).replaceAll('var(--nodecolor)', colStr).replaceAll('var(--zindex)', zStr)
};

String.prototype.isHexColor = function () {
    var target = this;
    return /(^#[0-9A-F]{6}$)|(^#[0-9A-F]{3}$)/i.test(target);
};

Number.prototype.isHexColor = function () {
    var target = this;
    return target.toString().isHexColor()
};

String.prototype.isNumber = function () {
    var target = this;
    return !isNaN(parseInt(target));
};

Number.prototype.isNumber = function () {
    return true
};

Array.prototype.curbIndex = function (index) {
    var target = this;
    return index < target.length ? target[index] : target[target.length - 1]
};

Array.prototype.caseIndexOf = function (query) {
    var target = this;
    return target.findIndex(item => query.toLowerCase() === item.toLowerCase());
};

Array.prototype.containsAny = function (query) {
    var target = this;
    return query.some(function (v) {
        return target.caseIndexOf(v) >= 0;
    });
};

Array.prototype.containsType = function (query) {
    var target = this
    return target.some(oride => oride.subtype.caseIndexOf(query) > -1)
}

Array.prototype.returnByType = function (query) {
    var target = this
    return target.find(or => {
        return or.subtype.caseIndexOf(query) > -1
    })
}

Array.prototype.substractArray = function (query) {
    var target = this
    return target.filter(elem => {
        return query.indexOf(elem) < 0
    })
}

Array.prototype.unique = function () {
    var target = this;
    return target.filter(function (x, i) {
        return target.indexOf(x) === i
    })
}

function parseNodeTypeList(data) {
    var typ = data.map(a => a.data('type')).unique()
    var subType = {};
    typ.forEach(tp => subType[tp] = data.map(a => {
        var subtype = a.nodes(`[type = "${tp}"]`).data('role')
        return subtype != undefined ? subtype : tp
    }).unique())
    return subType
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



function styleCy(nodeType, data, colList, styleList) {
    var colSchm = colList[styleList.colorScheme]
    var typeAr = Object.keys(nodeType)

    var subAr = {
        type: _.flatMap(nodeType, (val, key) => {
            return _.map(val, v => {
                return key
            })
        }),
        subtype: _.flatMap(nodeType)
    }

    Object.keys(colSchm).forEach(value => {
        if (colSchm[value].constructor !== Array) {
            $(":root").get(0).style.setProperty('--' + value.replaceAll('.', '-'), colSchm[value])
            data = data.replaceAll('var(--' + value.replaceAll('.', '-') + ')', colSchm[value])
        }
    })

    var colNum = {
        type: _.map(colSchm.node, (val, index) => {
            return index
        }),
        subtype: _.map(colSchm.node, (val) => {
            return _.map(val, (v, ind) => {
                return ind
            })
        })
    }

    var colNumOride = { // arrays of types and subtypes indicies that have been override
        type: [],
        subtype: colSchm.node.slice().fill([])
    }

    var nodeStyles = {
        type: [],
        subtype: []
    }

    // copy all existing node styling override for Types into nodeStyles.type, 
    // fill colNumOride with type indices that have been override
    styleList.nodeOverride.forEach(oride => {
        if (oride.subtype.containsAny(typeAr)) {
            nodeStyles.type[nodeStyles.type.length] = oride
            if (oride.color.isNumber()) {
                nodeStyles.type[nodeStyles.type.length - 1].color = parseInt(oride.color)
                colNumOride.type[colNumOride.type.length] = oride.color
            }
        }
    })


    // assign new node styling override into nodeStyles.type for remaining types, 
    // and reassigns index for faulty "color" fields (empty, not a number/valid hexvalue)
    typeAr.forEach((key, index) => {
        var typeOride = nodeStyles.type.returnByType(key)
        var availColNum = colNum.type.substractArray(colNumOride.type)

        if (typeOride) {
            if ((!typeOride.color.isHexColor() && !typeOride.color.isNumber()) || (typeOride.color.isNumber() && typeOride.color >= colNum.type.length)) {
                nodeStyles.type.returnByType(key).color = availColNum.length > 0 ? availColNum[0] : colNum.type[0]
                colNumOride.type[colNumOride.type.length] = availColNum[0]
            }
        }

        if (!typeOride) {
            nodeStyles.type[nodeStyles.type.length] = {
                label: key,
                subtype: [key],
                color: availColNum.length > 0 ? availColNum[0] : colNum.type[0],
            }
            colNumOride.type[colNumOride.type.length] = availColNum[0]
        }

    })

    // allow for quick lookup of what the assigned color is for the type containing a subtype
    function getTypeBySub(subtype) {
        return nodeStyles.type.returnByType(subAr.type[subAr.subtype.caseIndexOf(subtype)])
    };

    // copy all existing node styling override for subtypes into nodeStyles.subtype, 
    // fill corresponding subtypeArrays in colNumOride with subtype indices that have been override
    styleList.nodeOverride.forEach(oride => {
        if (oride.subtype.containsAny(subAr.subtype) && !oride.subtype.containsAny(typeAr)) {
            nodeStyles.subtype[nodeStyles.subtype.length] = oride
            if (oride.color.isNumber() && getTypeBySub(oride.subtype[0]).color.isNumber()) {
                nodeStyles.subtype[nodeStyles.subtype.length - 1].color = parseInt(oride.color)
                colNumOride.subtype[getTypeBySub(oride.subtype[0]).color][colNumOride.subtype.length] = oride.color
            }
        }
    })

    // assign new node styling override into nodeStyles.type for remaining types, 
    // and reassigns index for faulty "color" fields (empty, not a number/valid hexvalue)
    subAr.subtype.forEach((subName, index) => {
        var typeOfSub = getTypeBySub(subName)
        var typeColOfSub = typeOfSub.color
        var typeOride = nodeStyles.subtype.returnByType(subName)
        if (typeColOfSub.isNumber()) {
            var availColNum = colNum.subtype[typeColOfSub].substractArray(colNumOride.subtype[typeColOfSub])
        }

        if (!typeOride) {
            nodeStyles.subtype[nodeStyles.subtype.length] = {
                label: subName,
                subtype: [subName],
                color: availColNum ? availColNum.length > 0 ? availColNum[0] : colNum.subtype[typeColOfSub][0] : typeColOfSub,
                shape: typeOfSub.shape ? typeOfSub.shape : 'circle',
            }
            if (availColNum) {
                colNumOride.subtype[typeColOfSub][colNumOride.subtype[typeColOfSub].length] = availColNum[0]
            }
        }

        if (typeOride) {
            if (availColNum) {
                if ((!typeOride.color.isHexColor() && !typeOride.color.isNumber()) || (typeOride.color.isNumber() && typeOride.color >= colNum.subtype[typeColOfSub].length)) {
                    nodeStyles.subtype.returnByType(subName).color = availColNum.length > 0 ? availColNum[0] : colNum.subtype[typeColOfSub][0]
                    colNumOride.subtype[typeColOfSub][colNumOride.subtype[typeColOfSub].length] = availColNum[0]
                }
            } else if (!typeOride.color.isHexColor()) {
                nodeStyles.subtype.returnByType(subName).color = typeColOfSub
            }
            nodeStyles.subtype.returnByType(subName).shape = typeOfSub.shape ? typeOfSub.shape : 'circle'
        }
    })

    typeString = data.split('/*type').pop().split('type*/').shift()
    ringString = data.split('/*ring').pop().split('ring*/').shift()
    var beforeStr = "/*ring"
    var styleString = ""
    //Assign default styling for all nodes of a certain type
    nodeStyles.type.forEach(style => {
        var styleString = style.shape === 'ring' ? (typeString + ringString) : typeString
        style.subtype.forEach(subName => {
            var nodeColor = style.color.isNumber() ? colSchm.node[style.color][0] : style.color 
            data = data.insertBefore(beforeStr, styleString.replaceSelector('type', subName, nodeColor, typeAr.caseIndexOf(subName) + 1))
            
        })
    })
    //Assign further styling override for nodes of certain role(subtype)
    nodeStyles.subtype.forEach(style => {
        var styleString = style.shape === 'ring' ? (typeString + ringString) : typeString
        style.subtype.forEach(subName => {
            var typeStyle = getTypeBySub(subName)
            var nodeColor = typeStyle.color.isNumber() && style.color.isNumber() ? colSchm.node[typeStyle.color][style.color] : style.color.isHexColor() ? style.color : typeStyle.color
            data = data.insertBefore(beforeStr, styleString.replaceSelector('role', subName, nodeColor, typeAr.caseIndexOf(typeStyle.subtype[typeStyle.subtype.length - 1]) + 1))
            
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
