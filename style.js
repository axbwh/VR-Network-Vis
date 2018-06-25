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

function parseStyles(allNodes, colorList, styleList, data) {
    var typ = allNodes.map(a => a.data('type')).unique()
    var nodeType = {};
    typ.forEach(tp => nodeType[tp] = allNodes.map(a => {
        var subtype = a.nodes(`[type = "${tp}"]`).data('role')
        return subtype != undefined ? subtype : tp
    }).unique())

    var colSchm = colorList[styleList.colorScheme]
    var typeAr = Object.keys(nodeType)

    var subAr = {
        type: _.flatMap(nodeType, (val, key) => {
            return _.map(val, v => {
                return key
            })
        }),
        subtype: _.flatMap(nodeType)
    }

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

    // assign new node styling override into nodeStyles.subtype for remaining subtypes, 
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

            if (typeAr.caseIndexOf(subName) > -1) {
                nodeStyles.subtype[nodeStyles.subtype.length - 1].color = typeOfSub.color.isHexColor() ? typeOfSub.color : colNum.subtype[typeColOfSub][0]
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

        nodeStyles.subtype.returnByType(subName).type = typeOfSub.label

    })


    console.log(nodeStyles)
    var cssColors = {
        fg: styleList.fg.isHexColor() ? styleList.fg : colSchm.fg,
        bg: styleList.bg.isHexColor() ? styleList.bg : colSchm.bg,
        hl: styleList.hl.isHexColor() ? styleList.hl : colSchm.hl,
        ll: styleList.ll.isHexColor() ? styleList.ll : colSchm.ll,
    }

    // Styles Css 
    Object.keys(cssColors).forEach(value => {
        if (cssColors[value].constructor !== Array) {
            $(":root").get(0).style.setProperty('--' + value.replaceAll('.', '-'), cssColors[value])
            data = data.replaceAll('var(--' + value.replaceAll('.', '-') + ')', cssColors[value])
        }
    })
    //

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

    return {
        stylesheet: data,
        nodeStyles: nodeStyles
    }
}

function sortBySubType(a, b, styleList) {
    var subStyles = styleList.nodeStyles.subtype
    var typeStyles = styleList.nodeStyles.type
    var typeAr = _.map(typeStyles, typ => typ.label)
    var subAr = _.map(subStyles, typ => typ.label)
    var atype = a.data('type') ? _.find(typeStyles, typ => typ.subtype.caseIndexOf(a.data('type')) > -1) : undefined
    var btype = b.data('type') ? _.find(typeStyles, typ => typ.subtype.caseIndexOf(b.data('type')) > -1) : undefined
    var aStyle = a.data('role') ? _.find(subStyles, typ => typ.subtype.caseIndexOf(a.data('role')) > -1) : undefined
    var bStyle = b.data('role') ? _.find(subStyles, typ => typ.subtype.caseIndexOf(b.data('role')) > -1) : undefined

    //to maintain ordering per type > per subtype, for nodes of type=key, assign mock types
    if ( aStyle && bStyle && a.data("type") == "key") {
        atype = typeAr.caseIndexOf(aStyle.type) > -1 ? _.find(typeStyles, typ => typ.label == aStyle.type) : atype
        btype = typeAr.caseIndexOf(bStyle.type) > -1 ?  _.find(typeStyles, typ => typ.label == bStyle.type) : btype
    }

    // objects with no role properties (Key Label, Bbox) placed first
    if (!atype || !btype) {
        return  -1
    } else {
        if ((!aStyle || !bStyle) || (atype !== btype)) {
            var orderA = atype.color.isHexColor() ? typeAr.caseIndexOf(atype.label) + 10 : atype.color
            var orderB = atype.color.isHexColor() ? typeAr.caseIndexOf(btype.label) + 10 : btype.color
        } else {
            var orderA = aStyle.color.isHexColor() ? subAr.caseIndexOf(aStyle.label) + 10 : aStyle.color
            var orderB = bStyle.color.isHexColor() ? subAr.caseIndexOf(bStyle.label) + 10: bStyle.color
        }
        return orderA - orderB
    }
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

navPadding();
$(window).on('resize', navPadding);
