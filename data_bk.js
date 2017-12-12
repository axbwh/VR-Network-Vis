
function loadData() {
  
    if (!String.prototype.includes) {
    String.prototype.includes = function(search, start) {
      if (typeof start !== 'number') {
        start = 0;
      }

      if (start + search.length > this.length) {
        return false;
      } else {
        return this.indexOf(search, start) !== -1;
      }
    };
  }

  const SCHOOL_MATCHERS = {
    "Design": ["design"],
    "Film": ["film"],
    "Engineering & Computer Science": ["engineering", "computer science", "ecs", "computer graphics"],
    "Architecture": ["architecture", "soad"],
    "Information Technology Services": ["its"],
    "Management": ["management"],
    "Marketing": ["marketing"],
    "Careers": ["careers"],
    "Maori" : ["te kawa a maui"],
    "VBS" : ["vbs"],
    "Psychology": ["psychology"],
    "Wai Te Ata Press" : ["wai te ata press"]
  }

  const FAC_MATCHERS = {
    "Design": ["design", "media design"],
    "Engineering & Computer Science": ["engineering", "computer science", "ecs", "computer graphics", "computer graphics"],
    "Architecture": ["architecture", "soad"],
    "Central Service Unit": ["its" ,"marketing" , "careers", "learning and research technology team", "directorate", "information technology services", "engagement and alumni", "image services", "research development office"],
    "Humanities & Social Sciences" : ["te kawa a maui", "psychology" , "psych", "wai te ata press", "film", "te kawa a māui", "art", "wai-te-ata press"],
    "Victoria Business School" : ["vbs", "victoria business school", "information management", "management", "managment"],
  }

  function detectSchool(entry = "", TEXT_MATCHERS) {
    function matchesSchool(matchers) {
      return _.some(matchers, matcher => entry.toLowerCase().includes(matcher))
    }

    const detectedSchool = _.findKey(TEXT_MATCHERS, matchesSchool)
    return detectedSchool || "Other"
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
    //const data = result.data.slice(2)

    const data = result.data
    const rowsWithNames = data.filter(row => row["name"])
    const allNames = data.map(row => row["name"]).filter(Boolean)//.map creates collection of all answers to question 1, .filter(Boolean) filters truthy(defined) fields

    return {
      extractedData :
        rowsWithNames.map(row => ({
        id: row["name"],
        name: row["name"],
        role: row["role"],
        type: "person",
        mediaLink: row["mediaLink"],
        siteLink: row["siteLink"],
        staffSiteLink: row["staffSiteLink"],       
        brief: function(){ console.log(row["bio"]); return row["bio"]},
        school: row["programme"],
        fac: detectSchool(row["programme"], FAC_MATCHERS),
        recommendations: detectRecommended(row["collaborators"], allNames),
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
      mediaLink: row["mediaLink"],
      siteLink: row["siteLink"],
      brief: row["projectBrief"],
      school: detectSchool(row["schools"], SCHOOL_MATCHERS),
      fac: detectSchool(row["schools"], FAC_MATCHERS),
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
        _.keys(FAC_MATCHERS).map(name => ({ data: { id: name, name: name, programme: "",  type: "school" } })),//school nodes

      { data: { id: "Other", name: "Other", type: "school" }},//unknown school node
       // _.uniq(personData.map(row => row.role)).map(role => ({ data: { id: role, name: role, type: "role" }}))//person data

      ]),


      edges: _.flattenDeep([
        personData.map(row => ({ data: { source: row.name, target: row.fac, type: "school" } })),//edges(conection lines) for school to person
        // personData.map(row => {
        //   return row.recommendations.map(name => ({ data: { source: row.name, target: name, type: "collab"} }))//edges between collaborators
        // }),

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
  //   .then(extractProjectData)
  //   .then(formatForCytoscape)
    //console.log("surveynames =" + d.extractedNames)
      // var surveyNames = surveyData.then(function(){ console.log("surveynames =" + surveyData.extractedNames)
  //   return surveyData.extractedNames})

  var surveyData = $.ajax({ url: 'data.csv', type: 'GET', dataType: 'text' })
  .then(parseData)//parse csv using papaparse.js, convert to js object
  .then(extractRelevantData)//uses lodash.js to iterate over objects and extract relevant data

  var projectData = surveyData.then(function(data){
    return $.ajax({ url: 'project_data.csv', type: 'GET', dataType: 'text' })
    .then(parseData)
    .then(extractProjectData.bind(null, data.extractedNames))
  })

  return Promise.all([surveyData, projectData]).spread(function(sData, pData){
    return formatForCytoscape(sData, pData);//formats data into objects for cytoscape, specifically nodes and edges(connection lines between nodes)
  })

}