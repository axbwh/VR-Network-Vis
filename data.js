function loadData() {
  const SCHOOL_MATCHERS = {
    "Design": ["design"],
    "Film": ["film"],
    "ECS": ["engineering", "computer science", "ecs", "computer graphics"],
    "Architecture": ["architecture", "soad"],
    "ITS": ["its"],
    "Management": ["management"],
    // "Marketing": ["marketing"],
    // "Careers": ["careers"],
    // "Maori" : ["te kawa a maui"],
    // "VBS" : ["vbs"],
    // "Psychology": ["psychology"],
    // "WTAP" : ["wai te ata press"]
  }

  function detectSchool(entry = "") {
    function matchesSchool(matchers) {
      return _.some(matchers, matcher => entry.toLowerCase().includes(matcher))
    }

    const detectedSchool = _.findKey(SCHOOL_MATCHERS, matchesSchool)
    return detectedSchool || "Unknown"
  }

  function detectRecommended(entry = "", allNames) {
    return allNames.filter(name => {
      return entry.toLowerCase().includes(name.toLowerCase())
    })
  }

  function formatQuestions(row, questionsRow) {
    //TODO HTML escape
    const formattedQuestions = _.keys(row).map(questionKey => { // .keys creates array of object keys(csv column names) .map iterates over array/object and creates array by invoking function
      if (row[questionKey] && row[questionKey] !== "Unknown") { // if field exists and(&&) isn't(!==) "Unknown"
        return `
          <h3>${questionsRow[questionKey]}</h3>
          <p>${row[questionKey]}</p>
        `
      }
    })


    return _.compact(formattedQuestions).join("")
  }

  function extractRelevantData(result) {
    const questionsRow = result.data[0]

    // Skip the questions row and the strange export details row below it
    const data = result.data.slice(2)

    const rowsWithNames = data.filter(row => row["Q1"])
    const allNames = data.map(row => row["Q1"]).filter(Boolean)//.map creates collection of all answers to question 1, .filter(Boolean) filters truthy(defined) fields

    return {
      extractedData :
        rowsWithNames.map(row => ({
        id: row["Q1"],
        name: row["Q1"],
        role: row["Q2"],
        type: "person",
        school: detectSchool(row["Q3"]),
        recommendations: detectRecommended(row["Q16"], allNames),
        questionsHtml: formatQuestions(row, questionsRow)
        })),
      extractedNames : allNames
    }
  }

  function extractProjectData(Names, result) {
    const data = result.data
    return data.map(row => ({
      id: row["title"],
      name: row["title"],
      type: "project",
      videoLink: row["videoLink"],
      siteLink: row["siteLink"],
      projectBrief: row["projectBrief"],
      school: detectSchool(row["schools"]),
      recommendations: detectRecommended(row["collaborators"], Names)
    }))
  }

  function formatForCytoscape(sData, pData) {
    var personData = sData.extractedData
    //console.log("schools = " + _.keys(SCHOOL_MATCHERS).map(name => ({ data: { id: name, name: name, type: "school" } })))
    return {
      nodes: _.flattenDeep([
        personData.map(row => ({ data: row })),//store extracted data
        pData.map(row =>({ data : row })),
        _.keys(SCHOOL_MATCHERS).map(name => ({ data: { id: name, name: name, type: "school" } })),//school nodes

      { data: { id: "Unknown", name: "Unknown", type: "school" }},//unknown school node
       // _.uniq(personData.map(row => row.role)).map(role => ({ data: { id: role, name: role, type: "role" }}))//person data

      ]),


      edges: _.flattenDeep([
        personData.map(row => ({ data: { source: row.name, target: row.school, type: "school" } })),//edges(conection lines) for school to person
        personData.map(row => {
          return row.recommendations.map(name => ({ data: { source: row.name, target: name, type: "collab"} }))//edges between collaborators
        }),

        //personData.map(row => ({ data: { source: row.name, target: row.role, type: "role" } }))// edges between roles
       pData.map(row => {
          return row.recommendations.map(name => ({ data: { source: row.name, target: name, type: "project" } }))//edges between projects
        }),

      ])
    }
  }

  function parseData(csv) {
    return Papa.parse(csv, {
      delimiter: ",",
      header: true //first row interpreted as field name, following rows interpreted as objects with values keyed by field name
    })
  }

  // return $.ajax({ url: 'project_data.csv', type: 'GET', dataType: 'text' })//jquery ajax request for csv file
  //   .then(parseData)//parse csv using papaparse.js, convert to js object
  //   .then(extractProjectData)//uses lodash.js to iterate over objects and extract relevant data
  //   .then(formatForCytoscape)//formats data into objects for cytoscape, specifically nodes and edges(connection lines between nodes)
    //console.log("surveynames =" + d.extractedNames)
      // var surveyNames = surveyData.then(function(){ console.log("surveynames =" + surveyData.extractedNames)
  //   return surveyData.extractedNames})

  var surveyData = $.ajax({ url: 'data.csv', type: 'GET', dataType: 'text' }).then(parseData).then(extractRelevantData)

  var projectData = surveyData.then(function(data){
    return $.ajax({ url: 'project_data_adv.csv', type: 'GET', dataType: 'text' }).then(parseData).then(extractProjectData.bind(null, data.extractedNames))
  })

 // return Promise.join(surveyData, projectData, function(sData, pData){
 //    console.log("sData = " + sData);
 //    return formatForCytoscape(sData, pData);
 //  })

  return Promise.all([surveyData, projectData]).spread(function(sData, pData){
    console.log(formatForCytoscape(sData, pData));
    return formatForCytoscape(sData, pData);
  })

}