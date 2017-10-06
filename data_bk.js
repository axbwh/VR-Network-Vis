function loadData() {
  const SCHOOL_MATCHERS = {
    "Design": ["design"],
    "Film": ["film"],
    "ECS": ["engineering", "computer science", "ecs", "computer graphics"],
    "Architecture": ["architecture", "soad"],
    "ITS": ["its"],
    "Management": ["management"],
    "Marketing": ["marketing"],
    "Careers": ["careers"]
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

    return rowsWithNames.map(row => ({
      id: row["Q1"],
      name: row["Q1"],
      role: row["Q2"],
      school: detectSchool(row["Q3"]),
      recommendations: detectRecommended(row["Q16"], allNames),
      questionsHtml: formatQuestions(row, questionsRow)
    }))
  }

  function formatForCytoscape(data) {
    return {
      nodes: _.flattenDeep([
        data.map(row => ({ data: row })),
        _.keys(SCHOOL_MATCHERS).map(name => ({ data: { id: name, name: name, type: "programme" } })),
        { data: { id: "Unknown", name: "Unknown", type: "programme" }},
        _.uniq(data.map(row => row.role)).map(role => ({ data: { id: role, name: role, type: "role" }}))
      ]),
      edges: _.flattenDeep([
        data.map(row => ({ data: { source: row.name, target: row.school, type: "programme" } })),
        data.map(row => {
          return row.recommendations.map(name => ({ data: { source: row.name, target: name } }))
        }),
        data.map(row => ({ data: { source: row.name, target: row.role, type: "role" } }))
      ])
    }
  }

  function parseData(csv) {
    return Papa.parse(csv, {
      delimiter: ",",
      header: true
    })
  }

  return $.ajax({ url: 'data.csv', type: 'GET', dataType: 'text' })
    .then(parseData)
    .then(extractRelevantData)
    .then(formatForCytoscape)
}
