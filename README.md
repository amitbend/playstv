# playstv
Node.JS module for the plays.tv API - based on [playstv-node](https://github.com/Jishaxe/playstv-node) 
API docs are available [here](https://plays.tv/developers/documentation)
You can also test the different api calls through the developer portal - make sure you've got a key first! 


### Getting started
1. Head over to [the developer portal](https://plays.tv/developers/documentation) and ask for an API key.
2. Create a new instance of plays.tv object with your new `appkey` and `appid`
3. Test your key with the `verify` method


### Methods
- `videos.search` - searching videos with your criteria
  
   * Search videos matching the provided parameters in searchParams. Pagination is automatically resolved.
   * userId string Plays.tv handle of the user who curated the video
   * gameId string Plays.tv ID of the game
   * hashtags Array of hashtags without the hashtag (#)
   * metatags An array of metatags with the hashtag (#) removed
   * @param {Object} searchParams Object of the above keys
   * @param {Number} count Total results you want to get.
   * @param {String} sort Sorting technique (trending, popular, recent)
   * @param {String} sortdir Direction to sort (asc, desc)
   
- `users.get` - getting user information
- `verify` -  Verifies the API key and token given in the constructor

