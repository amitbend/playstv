request = require("request")
querystring = require("querystring")

const url = "https://api.plays.tv/data/v1"
const RESULTS_PER_PAGE = 50

class PlaysTV {
  constructor(appid, appkey) {
    this.appid = appid
    this.appkey = appkey
    this.api = this

    this.users = {
      get: this.getUser.bind(this)
    }

    this.videos = {
      search: this.searchVideos.bind(this)
    }
  }
  
  /**
   * Makes a GET request to PlaysTV API
   * @param {String} endpoint The endpoint to use, such as /auth/verify
   * @param {Object} args query params to use, this will add in the app id and key for you
   */
  _get(endpoint, args) {
    args.appid = this.appid
    args.appkey = this.appkey
    let query = querystring.stringify(args) 
    return new Promise((resolve, reject) => {
      request(`${url}${endpoint}?${query}`, (error, response, body) => {
          if (error) reject(error)
          else if (response.statusCode !== 200) reject(`Got a ${response.statusCode} instead of 200 on ${endpoint}: ${body}`)
          else resolve(response)
      })
    })
  }

  /**
   * Verifies the API key and token given in the constructor
   */
  verify() {
    return this._get("/auth/verify", {})
  }

  /**
   * Gets a user with the specified username
   * @param {String} username The username to request
   */
  getUser(username) {
    return this._get(`/users/${username}`, {}).then((response) => Promise.resolve(JSON.parse(response.body).content, (error) => Promise.reject(error)))
  }

  /**
   * Search videos matching the provided parameters in searchParams. Pagination is automatically resolved.
   * userId string Plays.tv handle of the user who curated the video
   * gameId string Plays.tv ID of the game
   * hashtags Array of hashtags without the hashtag (#)
   * metatags An array of metatags with the hashtag (#) removed
   * @param {Object} searchParams Object of the above keys
   * @param {Number} count Total results you want to get.
   * @param {String} sort Sorting technique (trending, popular, recent)
   * @param {String} sortdir Direction to sort (asc, desc)
   */
  searchVideos(searchParams, count=50, sort = "recent", sortdir = "desc") {
    let self = this
    if (Object.keys(searchParams).length == 0) return Promise.reject("Video search was not provided any parameters")
    
    let results = []
    
    let query = {limit:RESULTS_PER_PAGE, page: 0, sort, sortdir}
    
    let total_results = count
    if (searchParams.userId) query.userId = searchParams.userId
    if (searchParams.gameId) query.gameId = searchParams.gameId
    if (searchParams.hashtags) query.hashtags = searchParams.hashtags.join(",")
    if (searchParams.metatags) query.metatags = searchParams.metatags.join(",")
    

    // Makes a promise that gets the specified page
    let buildPromise = (page) => {
      query.page = page
      return self._get('/videos/search', query).then((response) => Promise.resolve(JSON.parse(response.body).content, (error) => Promise.reject(error.stack)))
    }

    return new Promise((resolve, reject) => {
       // Get the first page so we can get total results
       buildPromise(0).then((result) => {
         // Pull the total results from the first request
         total_results = result.total_results

         // Constrain the total results to the count
         if (total_results > count) total_results = count

         // Start off our results array with the result of the first page
         results = result.items

         // Holds our promises that will resolve to each page
         let pagePromises = []

         // If all our results fit on one page, just return this page
         if (total_results <= RESULTS_PER_PAGE) {
           resolve(results.slice(0, count))
         }

         // Otherwise, make a promise that gets each page based on globally configured results per page and execute them concurrently
         for (let i = 1; i < total_results / RESULTS_PER_PAGE; i++) {
           pagePromises.push(buildPromise(i))
         }

         // Run all the promises and populate pagePromises with the results of each page
         return Promise.all(pagePromises)
       }).then((allPageResults) => {
         // Add all the results together in one array
         for (let res of allPageResults) {
           results = results.concat(res.items)
         }

         // Return the results
         return resolve(results.slice(0, count))
       }).catch(reject)
    })

  }
}

module.exports = function (config) {
  return new PlaysTV(config.appid, config.appkey)
}
