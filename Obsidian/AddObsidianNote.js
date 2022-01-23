// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: cyan; icon-glyph: magic;
// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: light-brown; icon-glyph: magic;

// File manager on iCloud
var fm = FileManager.iCloud();
var url = args.shortcutParameter;

const undefined = "undefined"
const googleApiKey = "replace_with_API_key" //YoutubeAPI key: https://console.cloud.google.com/ && https://developers.google.com/youtube/v3/docs
const youtubeRegExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#\&\?]*).*/; //Regex to  extract video_id from Yotube URLs
const titleRegExp = "<title[^>]*>([^<]+)<\/title>";

//Get file content from Shortcuts app
var content = await formatDailyNoteContent(url);

//Get path to the Obsidian file
var path = formatPath();

createDailyNote(path, content);

// Tell Shortcuts that we're done (not strictly necessary)
Script.complete();


function createDailyNote(path, newContent){
  // If Daily Note file already exists -> ammend conent, otherwise create a new Daily Note file
  if (fm.fileExists(path)) { 
    // Get file contents
    var oldContent = fm.readString(path);
    // Append new content to the old content in the file
    var content = oldContent + '\r\n' + newContent;
  } else {
    // If the file does not exist, the content is the new content
    var content = formatNewFile(newContent);
  }

  // Write the file content to iCloud
  fm.writeString(path, content);
}

// Obsidian *.md format for a string with URL: - (title)[url]
async function formatDailyNoteContent(url){
  // Get page title from URL
  let title = await extractTitle(url);

  // Content format is: - (title)[url]
  return '- [' + title +'](' + url +')';
}

// Grab page title from HTML source
async function extractTitle(url){

  // Quick workaround to extract video title from Youtube pages via embeded URL: https://www.youtube.com/embed/{video_id}
  var match = url.match(youtubeRegExp);

  if (match && match[7].length == 11){ 
    //we have youtube URL and will continue with workaround through Youtube API 
    return extractYoutubeVideoTitle(match[7])
  } 
  // Otherwise Grab <title> tag from page HTML source 
  else {
    // Load HTML as a string using Request() https://docs.scriptable.app/request/
    let req = new Request(url);
    let res = await req.loadString();

    // Extract <title> tag from page HTML source 
    let title = new RegExp(titleRegExp);
    let titleMatch = res.match(title);
    
    if (titleMatch)
      return titleMatch[1];
    else 
      return undefined;
  }
}

// Quick workaround to extract video title from Youtube pages via Youtube API
// Youtube pages doesn't load video description in a <title> tag
async function extractYoutubeVideoTitle(id){

  //using Youtube API to get video metadata by video_id
  url = 'https://www.googleapis.com/youtube/v3/videos?part=snippet&id=' + id + '&key=' + googleApiKey;

  // Load HTML as JSON using Request() https://docs.scriptable.app/request/
  let req = new Request(url);
  let data = await req.loadJSON();

  if(data.items && data.items.length > 0)
    return data.items[0].snippet.title
  else
    return undefined;
}

//Obsidian format for the new Daily Log file
function formatNewFile(content){
  return 'Tags: \n\nLinks:\n' + content;
}

function formatPath(){
  //Get the filename type parameter from Shortcuts  
  //This is just yyyy-MM-dd.md by default, can be changed in the Shortcuts app
  var filename = args.plainTexts[0] + ".md";

  //"daily_notes" is the name of the folder bookmark setting from Scriptable
  //You have to create it in Scriptable > Settings > File Bookmarks
  return fm.joinPath(fm.bookmarkedPath("daily_notes"), filename);
}