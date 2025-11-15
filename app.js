require('dotenv').config();
const express = require('express');
const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');
const app = express();
const PORT = process.env.PORT || 3000;

// CORS Middleware
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Range');
  res.header('Access-Control-Expose-Headers', 'Content-Range');
  
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  
  next();
});

app.use(express.json());

// Configuration
const BASE_DIR = path.join(__dirname, 'subtitles');
const TMDB_API_KEY = process.env.TMDB_KEY;
const TRANSLATE_API_KEY = process.env.GOOGLE_TRANSLATE_KEY;
const DOMAIN = 'https://api.kurdforest.xyz';

// Supported languages with their codes and names (117+ languages)
const SUPPORTED_LANGUAGES = {
  // Middle Eastern Languages
  'ckb': { name: 'Kurdish (Sorani)', nativeName: 'کوردی' },
  'ku': { name: 'Kurdish (Kurmanji)', nativeName: 'Kurmancî' },
  'ar': { name: 'Arabic', nativeName: 'العربية' },
  'fa': { name: 'Persian', nativeName: 'فارسی' },
  'tr': { name: 'Turkish', nativeName: 'Türkçe' },
  'he': { name: 'Hebrew', nativeName: 'עברית' },
  'ur': { name: 'Urdu', nativeName: 'اردو' },
  'ps': { name: 'Pashto', nativeName: 'پښتو' },
  'sd': { name: 'Sindhi', nativeName: 'سنڌي' },
  
  // European Languages
  'en': { name: 'English', nativeName: 'English' },
  'es': { name: 'Spanish', nativeName: 'Español' },
  'fr': { name: 'French', nativeName: 'Français' },
  'de': { name: 'German', nativeName: 'Deutsch' },
  'it': { name: 'Italian', nativeName: 'Italiano' },
  'pt': { name: 'Portuguese', nativeName: 'Português' },
  'ru': { name: 'Russian', nativeName: 'Русский' },
  'nl': { name: 'Dutch', nativeName: 'Nederlands' },
  'pl': { name: 'Polish', nativeName: 'Polski' },
  'uk': { name: 'Ukrainian', nativeName: 'Українська' },
  'ro': { name: 'Romanian', nativeName: 'Română' },
  'hu': { name: 'Hungarian', nativeName: 'Magyar' },
  'cs': { name: 'Czech', nativeName: 'Čeština' },
  'el': { name: 'Greek', nativeName: 'Ελληνικά' },
  'sv': { name: 'Swedish', nativeName: 'Svenska' },
  'da': { name: 'Danish', nativeName: 'Dansk' },
  'fi': { name: 'Finnish', nativeName: 'Suomi' },
  'no': { name: 'Norwegian', nativeName: 'Norsk' },
  'bg': { name: 'Bulgarian', nativeName: 'Български' },
  'hr': { name: 'Croatian', nativeName: 'Hrvatski' },
  'sr': { name: 'Serbian', nativeName: 'Српски' },
  'sk': { name: 'Slovak', nativeName: 'Slovenčina' },
  'sl': { name: 'Slovenian', nativeName: 'Slovenščina' },
  'lt': { name: 'Lithuanian', nativeName: 'Lietuvių' },
  'lv': { name: 'Latvian', nativeName: 'Latviešu' },
  'et': { name: 'Estonian', nativeName: 'Eesti' },
  'ga': { name: 'Irish', nativeName: 'Gaeilge' },
  'mt': { name: 'Maltese', nativeName: 'Malti' },
  
  // Asian Languages
  'zh': { name: 'Chinese (Simplified)', nativeName: '中文' },
  'zh-TW': { name: 'Chinese (Traditional)', nativeName: '繁體中文' },
  'ja': { name: 'Japanese', nativeName: '日本語' },
  'ko': { name: 'Korean', nativeName: '한국어' },
  'hi': { name: 'Hindi', nativeName: 'हिन्दी' },
  'bn': { name: 'Bengali', nativeName: 'বাংলা' },
  'ta': { name: 'Tamil', nativeName: 'தமிழ்' },
  'te': { name: 'Telugu', nativeName: 'తెలుగు' },
  'mr': { name: 'Marathi', nativeName: 'मराठी' },
  'th': { name: 'Thai', nativeName: 'ไทย' },
  'vi': { name: 'Vietnamese', nativeName: 'Tiếng Việt' },
  'id': { name: 'Indonesian', nativeName: 'Bahasa Indonesia' },
  'ms': { name: 'Malay', nativeName: 'Bahasa Melayu' },
  'fil': { name: 'Filipino', nativeName: 'Filipino' },
  'my': { name: 'Burmese', nativeName: 'မြန်မာစာ' },
  'km': { name: 'Khmer', nativeName: 'ភាសាខ្មែរ' },
  'lo': { name: 'Lao', nativeName: 'ລາວ' },
  'ne': { name: 'Nepali', nativeName: 'नेपाली' },
  'si': { name: 'Sinhala', nativeName: 'සිංහල' },
  'pa': { name: 'Punjabi', nativeName: 'ਪੰਜਾਬੀ' },
  'gu': { name: 'Gujarati', nativeName: 'ગુજરાતી' },
  'kn': { name: 'Kannada', nativeName: 'ಕನ್ನಡ' },
  'ml': { name: 'Malayalam', nativeName: 'മലയാളം' },
  'or': { name: 'Odia', nativeName: 'ଓଡ଼ିଆ' },
  
  // African Languages
  'sw': { name: 'Swahili', nativeName: 'Kiswahili' },
  'am': { name: 'Amharic', nativeName: 'አማርኛ' },
  'yo': { name: 'Yoruba', nativeName: 'Yorùbá' },
  'ig': { name: 'Igbo', nativeName: 'Igbo' },
  'ha': { name: 'Hausa', nativeName: 'Hausa' },
  'zu': { name: 'Zulu', nativeName: 'isiZulu' },
  'xh': { name: 'Xhosa', nativeName: 'isiXhosa' },
  'st': { name: 'Sotho', nativeName: 'Sesotho' },
  'sn': { name: 'Shona', nativeName: 'chiShona' },
  'mg': { name: 'Malagasy', nativeName: 'Malagasy' },
  'so': { name: 'Somali', nativeName: 'Soomaali' },
  'rw': { name: 'Kinyarwanda', nativeName: 'Kinyarwanda' },
  
  // Other Major Languages
  'az': { name: 'Azerbaijani', nativeName: 'Azərbaycan' },
  'be': { name: 'Belarusian', nativeName: 'Беларуская' },
  'ca': { name: 'Catalan', nativeName: 'Català' },
  'eu': { name: 'Basque', nativeName: 'Euskara' },
  'gl': { name: 'Galician', nativeName: 'Galego' },
  'is': { name: 'Icelandic', nativeName: 'Íslenska' },
  'mk': { name: 'Macedonian', nativeName: 'Македонски' },
  'sq': { name: 'Albanian', nativeName: 'Shqip' },
  'bs': { name: 'Bosnian', nativeName: 'Bosanski' },
  'hy': { name: 'Armenian', nativeName: 'Հայերեն' },
  'ka': { name: 'Georgian', nativeName: 'ქართული' },
  'mn': { name: 'Mongolian', nativeName: 'Монгол' },
  'kk': { name: 'Kazakh', nativeName: 'Қазақ' },
  'ky': { name: 'Kyrgyz', nativeName: 'Кыргызча' },
  'uz': { name: 'Uzbek', nativeName: 'Oʻzbek' },
  'tg': { name: 'Tajik', nativeName: 'Тоҷикӣ' },
  'tk': { name: 'Turkmen', nativeName: 'Türkmen' },
  
  // South Asian Languages
  'as': { name: 'Assamese', nativeName: 'অসমীয়া' },
  'mai': { name: 'Maithili', nativeName: 'मैथिली' },
  'mni': { name: 'Manipuri', nativeName: 'মৈতৈলোন্' },
  'sat': { name: 'Santali', nativeName: 'ᱥᱟᱱᱛᱟᱲᱤ' },
  'kok': { name: 'Konkani', nativeName: 'कोंकणी' },
  'doi': { name: 'Dogri', nativeName: 'डोगरी' },
  'ks': { name: 'Kashmiri', nativeName: 'کٲشُر' },
  'brx': { name: 'Bodo', nativeName: 'बड़ो' },
  
  // Additional Languages
  'af': { name: 'Afrikaans', nativeName: 'Afrikaans' },
  'lb': { name: 'Luxembourgish', nativeName: 'Lëtzebuergesch' },
  'fy': { name: 'Frisian', nativeName: 'Frysk' },
  'cy': { name: 'Welsh', nativeName: 'Cymraeg' },
  'br': { name: 'Breton', nativeName: 'Brezhoneg' },
  'gd': { name: 'Scottish Gaelic', nativeName: 'Gàidhlig' },
  'gv': { name: 'Manx', nativeName: 'Gaelg' },
  'kw': { name: 'Cornish', nativeName: 'Kernewek' },
  'fo': { name: 'Faroese', nativeName: 'Føroyskt' },
  'sm': { name: 'Samoan', nativeName: 'Gagana Samoa' },
  'mi': { name: 'Maori', nativeName: 'Māori' },
  'haw': { name: 'Hawaiian', nativeName: 'ʻŌlelo Hawaiʻi' },
  'ty': { name: 'Tahitian', nativeName: 'Reo Tahiti' },
  'to': { name: 'Tongan', nativeName: 'Lea faka-Tonga' },
  'fj': { name: 'Fijian', nativeName: 'Na Vosa Vakaviti' },
  'bi': { name: 'Bislama', nativeName: 'Bislama' },
  'tpi': { name: 'Tok Pisin', nativeName: 'Tok Pisin' },
  'chr': { name: 'Cherokee', nativeName: 'ᏣᎳᎩ' },
  'iu': { name: 'Inuktitut', nativeName: 'ᐃᓄᒃᑎᑐᑦ' },
  'oj': { name: 'Ojibwe', nativeName: 'ᐊᓂᔑᓈᐯᒧᐎᓐ' },
  'cr': { name: 'Cree', nativeName: 'ᓀᐦᐃᔭᐍᐏᐣ' }
};

// Default language
const DEFAULT_LANGUAGE = 'ckb';

// Cache to avoid translating same lines repeatedly
const translationCache = new Map();
let requestQueue = [];
let activeRequests = 0;
const MAX_CONCURRENT_REQUESTS = 10;

// Store active processes for status tracking
const activeProcesses = new Map();

// Donation tracking
const donationStats = {
  totalDonations: 0,
  lastDonation: null,
  donationCount: 0
};

// Utility Functions
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

async function downloadSubtitle(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Subtitle download failed: ${res.status}`);
  const buffer = await res.arrayBuffer();
  return Buffer.from(buffer).toString('utf8');
}

function srtToVtt(srtContent) {
  let vtt = 'WEBVTT\n\n';
  vtt += srtContent.replace(/(\d{2}):(\d{2}):(\d{2}),(\d{3})/g, '$1:$2:$3.$4');
  return vtt;
}

async function translateTextWithQueue(text, sourceLang = 'en', targetLang = 'ckb') {
  const cacheKey = `${sourceLang}-${targetLang}-${text}`;
  if (translationCache.has(cacheKey)) {
    return translationCache.get(cacheKey);
  }

  return new Promise((resolve, reject) => {
    const request = async () => {
      try {
        const encodedText = encodeURIComponent(text);
        const url = `https://translate-pa.googleapis.com/v1/translate?params.client=gtx&query.source_language=${sourceLang}&query.target_language=${targetLang}&query.display_language=en-US&query.text=${encodedText}&key=${TRANSLATE_API_KEY}&data_types=TRANSLATION&data_types=SENTENCE_SPLITS&data_types=BILINGUAL_DICTIONARY_FULL`;
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`Translation API error: ${response.status}`);
        }
        const data = await response.json();
        const translated = data.translation || text;
        
        translationCache.set(cacheKey, translated);
        resolve(translated);
      } catch (error) {
        console.error('Translation failed for text:', text.substring(0, 50) + '...', error);
        resolve(text);
      } finally {
        activeRequests--;
        processQueue();
      }
    };

    requestQueue.push(request);
    processQueue();
  });
}

function processQueue() {
  while (requestQueue.length > 0 && activeRequests < MAX_CONCURRENT_REQUESTS) {
    activeRequests++;
    const request = requestQueue.shift();
    request();
  }
}

async function translateSubtitle(content, processId, targetLang) {
  const lines = content
    .split('\n')
    .filter(line => line.trim() && !line.includes('-->') && !/^\d+$/.test(line));
  
  const languageName = SUPPORTED_LANGUAGES[targetLang]?.name || targetLang;
  console.log(`Translating ${lines.length} subtitle lines to ${languageName}...`);
  updateProcessStatus(processId, 'translating', `Translating ${lines.length} subtitle lines to ${languageName}...`, 40);
  
  const uniqueLines = [...new Set(lines)];
  console.log(`Reduced to ${uniqueLines.length} unique lines for translation`);
  updateProcessStatus(processId, 'translating', `Processing ${uniqueLines.length} unique lines in ${languageName}...`, 50);
  
  const translationMap = new Map();
  
  const translationPromises = uniqueLines.map((line, index) => 
    translateTextWithQueue(line, 'en', targetLang).then(translated => {
      const progress = 50 + Math.floor((index / uniqueLines.length) * 40);
      updateProcessStatus(processId, 'translating', `Translated ${index + 1}/${uniqueLines.length} lines to ${languageName}...`, progress);
      return { original: line, translated: translated };
    })
  );
  
  const results = await Promise.allSettled(translationPromises);
  
  results.forEach(result => {
    if (result.status === 'fulfilled') {
      translationMap.set(result.value.original, result.value.translated);
    }
  });
  
  updateProcessStatus(processId, 'finalizing', `Finalizing ${languageName} translation...`, 95);
  
  return content
    .split('\n')
    .map(line => {
      if (line.trim() && !line.includes('-->') && !/^\d+$/.test(line)) {
        return translationMap.get(line) || line;
      }
      return line;
    })
    .join('\n');
}

async function fetchImdbId(tmdbId, type) {
  const url = `https://api.themoviedb.org/3/${type}/${tmdbId}/external_ids?api_key=${TMDB_API_KEY}`;
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return data.imdb_id || null;
  } catch (err) {
    console.error('Failed to fetch IMDb ID:', err);
    return null;
  }
}

// LibreSubs subtitle fetcher
async function getLibreSubs(tmdbId, type, season = null, episode = null) {
  const DOMAIN = `https://libre-subs.fifthwit.net/search?id=${tmdbId}`;

  let url;
  if (type === 'movie') {
    url = DOMAIN;
  } else {
    url = `${DOMAIN}&season=${season}&episode=${episode}`;
  }

  try {
    console.log(`Trying LibreSubs: ${url}`);
    const request = await fetch(url);
    
    if (!request.ok) {
      throw new Error(`LibreSubs API error: ${request.status}`);
    }

    const subtitles = await request.json();
    
    if (!subtitles || !subtitles.length) {
      throw new Error('No subtitles found on LibreSubs');
    }

    const englishSub = subtitles.find(sub => sub.language === 'en');
    const selectedSub = englishSub || subtitles[0];

    console.log(`Found LibreSubs subtitle: ${selectedSub.filename || selectedSub.url}`);
    
    return {
      success: true,
      subtitle: selectedSub,
      source: 'libresubs'
    };
  } catch (error) {
    console.error('LibreSubs failed:', error.message);
    return {
      success: false,
      error: error.message,
      source: 'libresubs'
    };
  }
}

// Wyzie lib subtitle fetcher
async function getWyzieSubs(tmdbId, type, season = null, episode = null, imdbId = null) {
  try {
    const wyzieLib = await import('wyzie-lib');
    const { searchSubtitles } = wyzieLib;
    
    const searchParams = imdbId 
      ? (type === 'movie' 
          ? { imdb_id: imdbId, format: 'srt' }
          : { imdb_id: imdbId, season, episode, format: 'srt' })
      : (type === 'movie' 
          ? { tmdb_id: tmdbId, format: 'srt' }
          : { tmdb_id: tmdbId, season, episode, format: 'srt' });
    
    console.log('Searching Wyzie for subtitles with parameters:', searchParams);
    const subs = await searchSubtitles(searchParams);
    
    if (!subs || !subs.length) {
      throw new Error('No subtitles found on Wyzie');
    }

    const englishSub = subs.find(s => s.language === 'en');
    const selectedSub = englishSub || subs[0];
    
    console.log(`Found Wyzie subtitle: ${selectedSub.filename}`);
    
    return {
      success: true,
      subtitle: selectedSub,
      source: 'wyzie'
    };
  } catch (error) {
    console.error('Wyzie failed:', error.message);
    return {
      success: false,
      error: error.message,
      source: 'wyzie'
    };
  }
}

// Status tracking functions
function generateProcessId(tmdbId, type, season, episode, language) {
  return `${type}-${tmdbId}-${season || '0'}-${episode || '0'}-${language}`;
}

function updateProcessStatus(processId, status, message, progress = 0) {
  if (activeProcesses.has(processId)) {
    const process = activeProcesses.get(processId);
    process.status = status;
    process.message = message;
    process.progress = progress;
    process.lastUpdated = new Date().toISOString();
    
    console.log(`[${processId}] ${status}: ${message} (${progress}%)`);
  }
}

function getProcessStatus(processId) {
  return activeProcesses.get(processId) || null;
}

function cleanupProcess(processId) {
  setTimeout(() => {
    if (activeProcesses.has(processId)) {
      activeProcesses.delete(processId);
      console.log(`Cleaned up process: ${processId}`);
    }
  }, 5 * 60 * 1000);
}

function getSubtitlePath(tmdbId, type, season = null, episode = null, language = DEFAULT_LANGUAGE) {
  const folderPath = type === 'movie' 
    ? path.join(BASE_DIR, 'movies', String(tmdbId), language)
    : path.join(BASE_DIR, 'tvshows', String(tmdbId), `season${season}`, `episode${episode}`, language);
  
  const vttPath = path.join(folderPath, 'subtitle.vtt');
  
  if (fs.existsSync(vttPath)) {
    console.log(`Cache HIT: ${vttPath}`);
    return vttPath;
  } else {
    console.log(`Cache MISS: ${vttPath}`);
    return null;
  }
}

async function fetchAndTranslateSubtitle(tmdbId, type, season = null, episode = null, language = DEFAULT_LANGUAGE) {
  const processId = generateProcessId(tmdbId, type, season, episode, language);
  
  // Check cache first to avoid redundant processing
  const existingPath = getSubtitlePath(tmdbId, type, season, episode, language);
  if (existingPath) {
    console.log(`Subtitle already exists in cache for ${processId}, skipping processing`);
    return { 
      success: true, 
      path: existingPath, 
      fromCache: true, 
      language: language 
    };
  }
  
  if (!SUPPORTED_LANGUAGES[language]) {
    return {
      success: false,
      error: `Unsupported language: ${language}. Supported languages: ${Object.keys(SUPPORTED_LANGUAGES).join(', ')}`
    };
  }

  activeProcesses.set(processId, {
    status: 'starting',
    message: `Initializing subtitle fetch for ${SUPPORTED_LANGUAGES[language].name}...`,
    progress: 0,
    startedAt: new Date().toISOString(),
    lastUpdated: new Date().toISOString(),
    tmdbId,
    type,
    season,
    episode,
    language,
    languageName: SUPPORTED_LANGUAGES[language].name
  });

  const retries = 3;
  let attempts = 0;
  
  const folderPath = type === 'movie' 
    ? path.join(BASE_DIR, 'movies', String(tmdbId), language)
    : path.join(BASE_DIR, 'tvshows', String(tmdbId), `season${season}`, `episode${episode}`, language);
  
  const vttPath = path.join(folderPath, 'subtitle.vtt');
  
  await ensureDir(folderPath);
  
  updateProcessStatus(processId, 'fetching_imdb', 'Fetching IMDb ID from TMDb...', 10);
  console.log(`Fetching IMDb ID for TMDb ${tmdbId}...`);
  const imdbId = await fetchImdbId(tmdbId, type);
  console.log(`Fetched IMDb ID: ${imdbId}`);
  
  while (attempts < retries) {
    try {
      updateProcessStatus(processId, 'searching_subs', 'Searching for subtitles...', 20);
      
      let subtitleResult;
      
      updateProcessStatus(processId, 'searching_subs', 'Trying Wyzie subtitle source...', 25);
      subtitleResult = await getWyzieSubs(tmdbId, type, season, episode, imdbId);
      
      if (!subtitleResult.success) {
        updateProcessStatus(processId, 'searching_subs', 'Wyzie failed, trying LibreSubs...', 30);
        console.log('Wyzie failed, trying LibreSubs...');
        subtitleResult = await getLibreSubs(tmdbId, type, season, episode);
      }
      
      if (!subtitleResult.success) {
        throw new Error(`Both subtitle sources failed: ${subtitleResult.error}`);
      }
      
      updateProcessStatus(processId, 'downloading', `Downloading subtitle from ${subtitleResult.source}...`, 35);
      console.log(`Downloading subtitle from ${subtitleResult.source}...`);
      const srtContent = await downloadSubtitle(subtitleResult.subtitle.url);
      
      console.log(`Translating subtitle to ${SUPPORTED_LANGUAGES[language].name}...`);
      const translatedSrt = await translateSubtitle(srtContent, processId, language);
      
      updateProcessStatus(processId, 'converting', 'Converting to WebVTT format...', 95);
      console.log('Converting to WebVTT format...');
      const vttContent = srtToVtt(translatedSrt);
      
      fs.writeFileSync(vttPath, vttContent, 'utf8');
      console.log(`Subtitle saved: ${vttPath}`);
      
      updateProcessStatus(processId, 'complete', `Subtitle in ${SUPPORTED_LANGUAGES[language].name} ready!`, 100);
      cleanupProcess(processId);
      
      return { 
        success: true, 
        path: vttPath, 
        fromCache: false,
        source: subtitleResult.source,
        language: language
      };
    } catch (err) {
      attempts++;
      console.error(`Attempt ${attempts} failed:`, err.message);
      updateProcessStatus(processId, 'retrying', `Attempt ${attempts} failed, retrying... (${err.message})`, 0);
      
      if (attempts >= retries) {
        updateProcessStatus(processId, 'failed', `Failed after ${retries} attempts: ${err.message}`, 0);
        cleanupProcess(processId);
        return { 
          success: false, 
          error: err.message,
          sourcesTried: ['wyzie', 'libresubs'],
          language: language
        };
      }
      await sleep(3000);
    }
  }
  
  updateProcessStatus(processId, 'failed', 'Failed after 3 attempts', 0);
  cleanupProcess(processId);
  return { 
    success: false, 
    error: 'Failed after 3 attempts',
    sourcesTried: ['wyzie', 'libresubs'],
    language: language
  };
}

// CORS middleware for subtitles
app.use('/subtitles', (req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Range');
  res.header('Access-Control-Expose-Headers', 'Content-Range');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

// Serve static subtitles
app.use('/subtitles', express.static(BASE_DIR));

// API Routes
app.post('/api/subtitle/fetch', async (req, res) => {
  try {
    const { tmdbId, type, season, episode, language = DEFAULT_LANGUAGE } = req.body;
    
    if (!tmdbId || !type) {
      return res.status(400).json({ error: 'Missing required parameters: tmdbId and type' });
    }
    
    if ((type === 'tv' || type === 'anime') && (!season || !episode)) {
      return res.status(400).json({ error: 'Season and episode required for TV shows' });
    }
    
    if (!SUPPORTED_LANGUAGES[language]) {
      return res.status(400).json({ 
        error: `Unsupported language: ${language}`,
        supportedLanguages: SUPPORTED_LANGUAGES 
      });
    }
    
    console.log(`Processing request: ${type} ${tmdbId} ${season ? `S${season}E${episode}` : ''} in ${language}`);
    
    const processId = generateProcessId(tmdbId, type, season, episode, language);
    
    // Check if subtitle already exists in cache FIRST
    const existingPath = getSubtitlePath(
      tmdbId,
      type === 'movie' ? 'movie' : 'tv',
      season ? parseInt(season) : null,
      episode ? parseInt(episode) : null,
      language
    );
    
    if (existingPath) {
      let subtitleUrl;
      if (type === 'movie') {
        subtitleUrl = `/subtitles/movies/${tmdbId}/${language}/subtitle.vtt`;
      } else {
        subtitleUrl = `/subtitles/tvshows/${tmdbId}/season${season}/episode${episode}/${language}/subtitle.vtt`;
      }
      
      console.log(`Subtitle found in cache for ${language}, serving immediately`);
      
      return res.json({
        success: true,
        subtitleUrl: `${DOMAIN}${subtitleUrl}`,
        fromCache: true,
        language: language,
        languageName: SUPPORTED_LANGUAGES[language].name,
        status: 'complete',
        progress: 100,
        message: `Subtitle in ${SUPPORTED_LANGUAGES[language].name} served from cache`
      });
    }
    
    // Only start processing if subtitle doesn't exist in cache
    console.log(`Subtitle not found in cache for ${language}, starting processing...`);
    
    fetchAndTranslateSubtitle(
      tmdbId,
      type === 'movie' ? 'movie' : 'tv',
      season ? parseInt(season) : null,
      episode ? parseInt(episode) : null,
      language
    );
    
    return res.json({
      success: true,
      processId: processId,
      status: 'processing',
      progress: 0,
      language: language,
      languageName: SUPPORTED_LANGUAGES[language].name,
      message: `Subtitle processing started for ${SUPPORTED_LANGUAGES[language].name}`,
      statusUrl: `${DOMAIN}/api/subtitle/status/${processId}`
    });
    
  } catch (error) {
    console.error('Subtitle API error:', error);
    return res.status(500).json({ success: false, error: 'Internal server error while processing subtitle' });
  }
});

app.get('/api/subtitle/status/:processId', (req, res) => {
  const { processId } = req.params;
  const status = getProcessStatus(processId);
  
  if (!status) {
    return res.status(404).json({ 
      success: false, 
      error: 'Process not found or expired',
      status: 'not_found'
    });
  }
  
  let response = { ...status };
  
  if (status.status === 'complete') {
    const { tmdbId, type, season, episode, language } = status;
    let subtitleUrl;
    
    if (type === 'movie') {
      subtitleUrl = `/subtitles/movies/${tmdbId}/${language}/subtitle.vtt`;
    } else {
      subtitleUrl = `/subtitles/tvshows/${tmdbId}/season${season}/episode${episode}/${language}/subtitle.vtt`;
    }
    
    response.subtitleUrl = `${DOMAIN}${subtitleUrl}`;
  }
  
  res.json({
    success: true,
    ...response
  });
});

app.get('/api/languages', (req, res) => {
  const totalLanguages = Object.keys(SUPPORTED_LANGUAGES).length;
  res.json({
    success: true,
    languages: SUPPORTED_LANGUAGES,
    defaultLanguage: DEFAULT_LANGUAGE,
    totalLanguages: totalLanguages,
    message: `Supporting ${totalLanguages} languages worldwide`
  });
});

app.get('/api/languages/search', (req, res) => {
  const { q } = req.query;
  if (!q) {
    return res.status(400).json({ error: 'Query parameter "q" is required' });
  }

  const searchTerm = q.toLowerCase();
  const results = Object.entries(SUPPORTED_LANGUAGES)
    .filter(([code, lang]) => 
      code.toLowerCase().includes(searchTerm) ||
      lang.name.toLowerCase().includes(searchTerm) ||
      lang.nativeName.toLowerCase().includes(searchTerm)
    )
    .reduce((acc, [code, lang]) => {
      acc[code] = lang;
      return acc;
    }, {});

  res.json({
    success: true,
    query: q,
    results: results,
    count: Object.keys(results).length
  });
});

app.get('/api/language/:code', (req, res) => {
  const { code } = req.params;
  const language = SUPPORTED_LANGUAGES[code];
  
  if (!language) {
    return res.status(404).json({ 
      success: false, 
      error: `Language code '${code}' not found` 
    });
  }
  
  res.json({
    success: true,
    code: code,
    ...language,
    exampleRequest: {
      curl: `curl -X POST ${DOMAIN}/api/subtitle/fetch \\\\\n  -H "Content-Type: application/json" \\\\\n  -d '{\n    "tmdbId": 278,\n    "type": "movie",\n    "language": "${code}"\n  }'`,
      javascript: `fetch('${DOMAIN}/api/subtitle/fetch', {\n  method: 'POST',\n  headers: { 'Content-Type: 'application/json' },\n  body: JSON.stringify({\n    tmdbId: 278,\n    type: 'movie',\n    language: '${code}'\n  })\n})`,
      python: `import requests\n\nresponse = requests.post('${DOMAIN}/api/subtitle/fetch', json={\n    'tmdbId': 278,\n    'type': 'movie',\n    'language': '${code}'\n})`
    }
  });
});

// Donation endpoints
app.get('/api/donation', (req, res) => {
  res.json({
    success: true,
    message: 'Support the development of this API',
    wallets: SUPPORTED_CRYPTO,
    stats: donationStats
  });
});

app.post('/api/donation/verify', (req, res) => {
  const { txHash, amount, currency } = req.body;
  
  if (!txHash || !amount || !currency) {
    return res.status(400).json({
      success: false,
      error: 'Missing required parameters: txHash, amount, currency'
    });
  }
  
  donationStats.totalDonations += parseFloat(amount);
  donationStats.donationCount += 1;
  donationStats.lastDonation = new Date().toISOString();
  
  res.json({
    success: true,
    message: 'Thank you for your donation!',
    donation: {
      txHash,
      amount,
      currency,
      timestamp: new Date().toISOString()
    },
    stats: donationStats
  });
});

app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    service: 'Subtitle API', 
    timestamp: new Date().toISOString(),
    activeProcesses: activeProcesses.size,
    supportedLanguages: Object.keys(SUPPORTED_LANGUAGES).length,
    domain: DOMAIN,
    donationStats: donationStats
  });
});

app.get('/api/subtitle/status-legacy/:tmdbId', (req, res) => {
  const { tmdbId } = req.params;
  const { type, season, episode, language = DEFAULT_LANGUAGE } = req.query;
  
  const subtitlePath = getSubtitlePath(
    tmdbId,
    type || 'movie',
    season ? parseInt(season) : null,
    episode ? parseInt(episode) : null,
    language
  );
  
  res.json({ 
    exists: !!subtitlePath, 
    path: subtitlePath,
    language: language,
    languageName: SUPPORTED_LANGUAGES[language]?.name 
  });
});

// Comprehensive documentation on main route
app.get('/', (req, res) => {
  const totalLanguages = Object.keys(SUPPORTED_LANGUAGES).length;
  const documentation = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>🌐 SUBTITLE TRANSLATION API v3.0</title>
    <style>
        /* ALL YOUR EXISTING CSS REMAINS EXACTLY THE SAME */
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Courier New', Monaco, monospace;
            line-height: 1.6;
            color: #80ff80;
            background: #0a0a0a;
            min-height: 100vh;
            overflow-x: hidden;
        }
        
        body::before {
            content: '';
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: 
                linear-gradient(90deg, #0a0a0a 21px, transparent 1%) center,
                linear-gradient(#0a0a0a 21px, transparent 1%) center,
                #80ff80;
            background-size: 22px 22px;
            opacity: 0.03;
            z-index: -1;
        }
        
        .container {
            max-width: 1400px;
            margin: 0 auto;
            padding: 20px;
        }
        
        .header {
            text-align: center;
            margin-bottom: 40px;
            padding: 40px 20px;
            background: linear-gradient(135deg, #001a00 0%, #003300 100%);
            border: 1px solid #80ff80;
            border-radius: 10px;
            box-shadow: 0 0 20px #80ff80;
            position: relative;
            overflow: hidden;
        }
        
        .header::before {
            content: '';
            position: absolute;
            top: -50%;
            left: -50%;
            width: 200%;
            height: 200%;
            background: linear-gradient(45deg, transparent, #80ff80, transparent);
            animation: shine 3s infinite;
            opacity: 0.1;
        }
        
        @keyframes shine {
            0% { transform: translateX(-100%) translateY(-100%) rotate(45deg); }
            100% { transform: translateX(100%) translateY(100%) rotate(45deg); }
        }
        
        .header h1 {
            font-size: 3.5rem;
            margin-bottom: 15px;
            text-shadow: 0 0 10px #80ff80;
            background: linear-gradient(45deg, #80ff80, #66cc66, #80ff80);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            letter-spacing: 2px;
        }
        
        .header p {
            font-size: 1.3rem;
            color: #66cc66;
            text-shadow: 0 0 5px #80ff80;
        }
        
        .stats {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin: 30px 0;
        }
        
        .stat-card {
            background: #001a00;
            border: 1px solid #80ff80;
            border-radius: 8px;
            padding: 20px;
            text-align: center;
            box-shadow: 0 0 10px #80ff80;
        }
        
        .stat-number {
            font-size: 2.5rem;
            font-weight: bold;
            color: #80ff80;
            text-shadow: 0 0 5px #80ff80;
        }
        
        .stat-label {
            color: #66cc66;
            font-size: 0.9rem;
            margin-top: 5px;
        }

        /* NEW: Cache Status Indicator */
        .status-cache { background: #00ff00; box-shadow: 0 0 5px #00ff00; }

        /* ALL YOUR EXISTING STYLES REMAIN EXACTLY THE SAME */
        .card {
            background: #001a00;
            border: 1px solid #80ff80;
            border-radius: 10px;
            padding: 30px;
            margin-bottom: 30px;
            box-shadow: 0 0 15px #80ff80;
            position: relative;
        }
        
        .card::before {
            content: '>>';
            position: absolute;
            top: 10px;
            left: 15px;
            color: #80ff80;
            font-weight: bold;
        }
        
        .card h2 {
            color: #80ff80;
            border-bottom: 2px solid #80ff80;
            padding-bottom: 15px;
            margin-bottom: 25px;
            display: flex;
            align-items: center;
            gap: 15px;
            font-size: 1.8rem;
            text-shadow: 0 0 5px #80ff80;
        }
        
        .card h2 i {
            color: #80ff80;
        }
        
        .endpoint {
            background: #002200;
            border: 1px solid #66cc66;
            border-radius: 8px;
            padding: 25px;
            margin-bottom: 25px;
            position: relative;
            overflow: hidden;
        }
        
        .endpoint::before {
            content: '$';
            position: absolute;
            top: 10px;
            left: 15px;
            color: #80ff80;
            font-weight: bold;
        }
        
        .method {
            display: inline-block;
            background: #80ff80;
            color: #001a00;
            padding: 8px 16px;
            border-radius: 4px;
            font-weight: bold;
            font-size: 0.9rem;
            margin-right: 15px;
            font-family: 'Courier New', monospace;
            text-shadow: none;
        }
        
        .method.get { background: #80ff80; }
        .method.post { background: #66cc66; }
        
        .url {
            font-family: 'Courier New', Monaco, monospace;
            background: #000;
            color: #80ff80;
            padding: 15px 20px;
            border-radius: 6px;
            margin: 15px 0;
            overflow-x: auto;
            border: 1px solid #80ff80;
            border-left: 4px solid #80ff80;
        }
        
        .code-block {
            background: #000;
            color: #80ff80;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
            overflow-x: auto;
            font-family: 'Courier New', Monaco, monospace;
            font-size: 0.9rem;
            border: 1px solid #80ff80;
            border-left: 4px solid #80ff80;
        }
        
        .param-table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
            border: 1px solid #80ff80;
        }
        
        .param-table th {
            background: #002200;
            color: #80ff80;
            padding: 15px;
            text-align: left;
            border-bottom: 2px solid #80ff80;
            font-family: 'Courier New', monospace;
        }
        
        .param-table td {
            padding: 15px;
            border-bottom: 1px solid #66cc66;
            color: #66cc66;
        }
        
        .param-table tr:nth-child(even) {
            background: #001a00;
        }
        
        .required {
            color: #ff6666;
            font-weight: bold;
            text-shadow: 0 0 5px #ff0000;
        }
        
        .example {
            background: #002200;
            border-left: 4px solid #80ff80;
            padding: 20px;
            margin: 20px 0;
            border-radius: 0 8px 8px 0;
        }
        
        .response {
            background: #001a00;
            border-left: 4px solid #66cc66;
            padding: 20px;
            margin: 20px 0;
            border-radius: 0 8px 8px 0;
        }
        
        .badge {
            display: inline-block;
            padding: 6px 12px;
            border-radius: 4px;
            font-size: 0.8rem;
            font-weight: bold;
            margin-right: 10px;
            font-family: 'Courier New', monospace;
        }
        
        .badge.success { background: #80ff80; color: #001a00; }
        .badge.info { background: #66cc66; color: #001a00; }
        .badge.warning { background: #ffaa00; color: #001a00; }
        .badge.danger { background: #ff6666; color: #001a00; }
        
        .grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 25px;
            margin: 35px 0;
        }
        
        .feature {
            text-align: center;
            padding: 25px;
            background: #001a00;
            border: 1px solid #80ff80;
            border-radius: 8px;
            transition: all 0.3s ease;
        }
        
        .feature:hover {
            transform: translateY(-5px);
            box-shadow: 0 0 15px #80ff80;
        }
        
        .feature i {
            font-size: 3rem;
            color: #80ff80;
            margin-bottom: 20px;
            text-shadow: 0 0 10px #80ff80;
        }
        
        .status-indicator {
            display: inline-block;
            width: 12px;
            height: 12px;
            border-radius: 50%;
            margin-right: 10px;
            box-shadow: 0 0 5px currentColor;
        }
        
        .status-cache { background: #00ff00; }
        .status-starting { background: #80ff80; }
        .status-fetching_imdb { background: #80ff80; }
        .status-searching_subs { background: #80ff80; }
        .status-downloading { background: #80ff80; }
        .status-translating { background: #ffaa00; }
        .status-finalizing { background: #ffaa00; }
        .status-converting { background: #66cc66; }
        .status-complete { background: #80ff80; }
        .status-failed { background: #ff6666; }
        .status-retrying { background: #ffaa00; }
        
        .language-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
            gap: 15px;
            margin: 20px 0;
            max-height: 400px;
            overflow-y: auto;
            padding: 10px;
            border: 1px solid #80ff80;
            border-radius: 8px;
        }
        
        .language-item {
            padding: 15px;
            background: #001a00;
            border: 1px solid #66cc66;
            border-radius: 6px;
            text-align: center;
            transition: all 0.3s ease;
            cursor: pointer;
        }
        
        .language-item:hover {
            background: #002200;
            border-color: #80ff80;
            box-shadow: 0 0 10px #80ff80;
        }
        
        .language-item.active {
            background: #003300;
            border-color: #80ff80;
            box-shadow: 0 0 15px #80ff80;
        }
        
        .language-code {
            font-weight: bold;
            color: #80ff80;
            font-size: 1.1rem;
            text-shadow: 0 0 5px #80ff80;
        }
        
        .language-name {
            color: #66cc66;
            font-size: 0.9rem;
            margin: 5px 0;
        }
        
        .language-native {
            color: #4d994d;
            font-size: 0.8rem;
            margin-top: 5px;
        }
        
        .search-box {
            background: #001a00;
            border: 1px solid #80ff80;
            border-radius: 6px;
            padding: 15px;
            margin: 20px 0;
            color: #80ff80;
            font-family: 'Courier New', monospace;
            width: 100%;
            font-size: 1rem;
        }
        
        .search-box::placeholder {
            color: #66cc66;
        }
        
        .glow {
            animation: glow 2s ease-in-out infinite alternate;
        }
        
        @keyframes glow {
            from { box-shadow: 0 0 5px #80ff80; }
            to { box-shadow: 0 0 15px #80ff80, 0 0 20px #80ff80; }
        }
        
        .terminal {
            background: #000;
            border: 1px solid #80ff80;
            border-radius: 8px;
            padding: 20px;
            margin: 20px 0;
            font-family: 'Courier New', monospace;
        }
        
        .terminal-line {
            margin: 5px 0;
        }
        
        .prompt {
            color: #80ff80;
        }
        
        .command {
            color: #66cc66;
        }
        
        .output {
            color: #4d994d;
        }
        
        .language-docs {
            display: none;
            margin-top: 20px;
            padding: 20px;
            background: #001a00;
            border: 1px solid #80ff80;
            border-radius: 8px;
        }
        
        .language-docs.active {
            display: block;
        }
        
        .tab {
            padding: 10px 20px;
            background: #002200;
            border: 1px solid #80ff80;
            border-radius: 6px 6px 0 0;
            margin-right: 5px;
            cursor: pointer;
            color: #66cc66;
        }
        
        .tab.active {
            background: #003300;
            border-bottom: 1px solid #003300;
            color: #80ff80;
        }
        
        .tab-content {
            display: none;
            padding: 20px;
            background: #001a00;
            border: 1px solid #80ff80;
            border-radius: 0 0 6px 6px;
        }
        
        .tab-content.active {
            display: block;
        }
        
        @media (max-width: 768px) {
            .header h1 {
                font-size: 2.2rem;
            }
            
            .container {
                padding: 10px;
            }
            
            .card {
                padding: 20px;
            }
            
            .language-grid {
                grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
            }
            
            .stats {
                grid-template-columns: 1fr;
            }
        }
    </style>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
</head>
<body>
    <div class="container">
        <div class="header glow">
            <h1>🌐 SUBTITLE TRANSLATION API v3.0</h1>
            <p>ACCESS GRANTED - MULTI-LINGUAL SUBTITLE PROCESSING SYSTEM</p>
        </div>

        <div class="stats">
            <div class="stat-card">
                <div class="stat-number">${totalLanguages}+</div>
                <div class="stat-label">LANGUAGES SUPPORTED</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">2</div>
                <div class="stat-label">SUBTITLE SOURCES</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">INSTANT</div>
                <div class="stat-label">CACHE DELIVERY</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">∞</div>
                <div class="stat-label">CACHED TRANSLATIONS</div>
            </div>
        </div>

        <div class="card">
            <h2><i class="fas fa-terminal"></i> SYSTEM OVERVIEW</h2>
            <p style="color: #66cc66; margin-bottom: 20px;">Advanced subtitle translation engine supporting ${totalLanguages} languages with smart caching and instant delivery.</p>
            
            <div class="terminal">
                <div class="terminal-line"><span class="prompt">$</span> <span class="command">system_status --api v3.0</span></div>
                <div class="terminal-line"><span class="output">✓ Multi-language translation engine: ONLINE</span></div>
                <div class="terminal-line"><span class="output">✓ Smart caching system: ACTIVE</span></div>
                <div class="terminal-line"><span class="output">✓ Instant cache delivery: ENABLED</span></div>
                <div class="terminal-line"><span class="output">✓ Dual subtitle sources: WYZIE + LIBRESUBS</span></div>
                <div class="terminal-line"><span class="output">✓ Language support: ${totalLanguages} LANGUAGES</span></div>
                <div class="terminal-line"><span class="output">✓ Cache hits: IMMEDIATE RESPONSE</span></div>
            </div>
        </div>

        <div class="card">
            <h2><i class="fas fa-language"></i> LANGUAGE MATRIX</h2>
            <p style="color: #66cc66; margin-bottom: 15px;">Global language support covering ${totalLanguages} languages across all continents. Click any language for specific documentation.</p>
            
            <input type="text" class="search-box" placeholder="SEARCH LANGUAGES (name, code, or native name)..."
                   onkeyup="filterLanguages(this.value)">
            
            <div class="language-grid" id="languageGrid">
                ${Object.entries(SUPPORTED_LANGUAGES).map(([code, lang]) => `
                    <div class="language-item" onclick="showLanguageDocs('${code}')" 
                         data-code="${code}" data-name="${lang.name.toLowerCase()}" data-native="${lang.nativeName.toLowerCase()}">
                        <div class="language-code">${code}</div>
                        <div class="language-name">${lang.name}</div>
                        <div class="language-native">${lang.nativeName}</div>
                    </div>
                `).join('')}
            </div>
            
            <div id="languageDocs" class="language-docs">
                <!-- Language-specific documentation will be loaded here -->
            </div>
        </div>

        <div class="card">
            <h2><i class="fas fa-code"></i> API ENDPOINTS</h2>

            <div class="endpoint">
                <div class="method post">POST</div>
                <strong>/api/subtitle/fetch</strong>
                <p>Fetch and translate subtitles for a movie or TV show - instant delivery if cached</p>
                
                <div class="url">POST ${DOMAIN}/api/subtitle/fetch</div>
                
                <h4 style="color: #80ff80;">Request Body (JSON):</h4>
                <table class="param-table">
                    <tr>
                        <th>Parameter</th>
                        <th>Type</th>
                        <th>Required</th>
                        <th>Description</th>
                    </tr>
                    <tr>
                        <td>tmdbId</td>
                        <td>Integer</td>
                        <td><span class="required">Yes</span></td>
                        <td>The Movie Database (TMDb) ID</td>
                    </tr>
                    <tr>
                        <td>type</td>
                        <td>String</td>
                        <td><span class="required">Yes</span></td>
                        <td>"movie" or "tv"</td>
                    </tr>
                    <tr>
                        <td>season</td>
                        <td>Integer</td>
                        <td>For TV shows</td>
                        <td>Season number</td>
                    </tr>
                    <tr>
                        <td>episode</td>
                        <td>Integer</td>
                        <td>For TV shows</td>
                        <td>Episode number</td>
                    </tr>
                    <tr>
                        <td>language</td>
                        <td>String</td>
                        <td>No</td>
                        <td>Language code (default: "ckb")</td>
                    </tr>
                </table>

                <div class="example">
                    <h4 style="color: #80ff80;">Example Request:</h4>
                    <div class="code-block">
// For a movie in Arabic
{
  "tmdbId": 278,
  "type": "movie",
  "language": "ar"
}

// For a TV show episode in Persian
{
  "tmdbId": 1399,
  "type": "tv",
  "season": 1,
  "episode": 1,
  "language": "fa"
}
                    </div>
                </div>

                <div class="response">
                    <h4 style="color: #80ff80;">Example Response (SUBTITLE ALREADY CACHED - Instant):</h4>
                    <div class="code-block">
{
  "success": true,
  "subtitleUrl": "${DOMAIN}/subtitles/movies/278/ar/subtitle.vtt",
  "fromCache": true,
  "language": "ar",
  "languageName": "Arabic",
  "status": "from_cache",
  "progress": 100,
  "message": "Subtitle in Arabic served from cache"
}
                    </div>

                    <h4 style="color: #80ff80;">Example Response (NEW SUBTITLE - Processing Started):</h4>
                    <div class="code-block">
{
  "success": true,
  "processId": "movie-278-0-0-ar",
  "status": "processing",
  "progress": 0,
  "language": "ar",
  "languageName": "Arabic",
  "message": "Subtitle processing started for Arabic",
  "statusUrl": "${DOMAIN}/api/subtitle/status/movie-278-0-0-ar"
}
                    </div>
                </div>

                <h4 style="color: #80ff80; margin-top: 20px;">Usage Examples:</h4>
                
                <div style="margin-bottom: 15px;">
                    <div class="tab active" onclick="switchTab('curl-tab')">cURL</div>
                    <div class="tab" onclick="switchTab('js-tab')">JavaScript</div>
                    <div class="tab" onclick="switchTab('python-tab')">Python</div>
                    <div class="tab" onclick="switchTab('node-tab')">Node.js</div>
                </div>

                <div id="curl-tab" class="tab-content active">
                    <div class="code-block">
# Fetch subtitle for movie in Arabic
# Will return instantly if cached, otherwise starts processing
curl -X POST ${DOMAIN}/api/subtitle/fetch \\
  -H "Content-Type: application/json" \\
  -d '{
    "tmdbId": 278,
    "type": "movie",
    "language": "ar"
  }'

# Example response when subtitle is cached:
# {
#   "success": true,
#   "subtitleUrl": "${DOMAIN}/subtitles/movies/278/ar/subtitle.vtt",
#   "fromCache": true,
#   "status": "from_cache",
#   "progress": 100
# }
                    </div>
                </div>

                <div id="js-tab" class="tab-content">
                    <div class="code-block">
// Fetch subtitle for movie in Arabic
// Will return instantly if cached, otherwise starts processing
fetch('${DOMAIN}/api/subtitle/fetch', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    tmdbId: 278,
    type: 'movie',
    language: 'ar'
  })
})
.then(response => response.json())
.then(data => {
  if (data.fromCache) {
    console.log('Subtitle served from cache:', data.subtitleUrl);
    // Use the subtitle immediately
    videoElement.querySelector('track').src = data.subtitleUrl;
  } else {
    console.log('Subtitle processing started:', data.processId);
    // Poll status until complete
    pollStatus(data.processId);
  }
});

// Example cached response:
// {
//   success: true,
//   subtitleUrl: "${DOMAIN}/subtitles/movies/278/ar/subtitle.vtt",
//   fromCache: true,
//   status: "from_cache",
//   progress: 100
// }
                    </div>
                </div>

                <div id="python-tab" class="tab-content">
                    <div class="code-block">
import requests
import json

# Fetch subtitle for movie in Arabic
# Will return instantly if cached, otherwise starts processing
response = requests.post('${DOMAIN}/api/subtitle/fetch', 
    json={
        'tmdbId': 278,
        'type': 'movie',
        'language': 'ar'
    }
)

data = response.json()

if data.get('fromCache'):
    print('Subtitle served from cache:', data['subtitleUrl'])
    # Use the subtitle immediately
else:
    print('Subtitle processing started:', data['processId'])
    # Poll status until complete

# Example cached response:
# {
#   "success": True,
#   "subtitleUrl": "${DOMAIN}/subtitles/movies/278/ar/subtitle.vtt",
#   "fromCache": True,
#   "status": "from_cache",
#   "progress": 100
# }
                    </div>
                </div>

                <div id="node-tab" class="tab-content">
                    <div class="code-block">
const fetch = require('node-fetch');

// Fetch subtitle for movie in Arabic
// Will return instantly if cached, otherwise starts processing
async function fetchSubtitle() {
  const response = await fetch('${DOMAIN}/api/subtitle/fetch', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      tmdbId: 278,
      type: 'movie',
      language: 'ar'
    })
  });
  
  const data = await response.json();
  
  if (data.fromCache) {
    console.log('Subtitle served from cache:', data.subtitleUrl);
    // Use the subtitle immediately
    return data.subtitleUrl;
  } else {
    console.log('Subtitle processing started:', data.processId);
    // Poll status until complete
    return await pollStatus(data.processId);
  }
}

// Example cached response:
// {
//   success: true,
//   subtitleUrl: "${DOMAIN}/subtitles/movies/278/ar/subtitle.vtt",
//   fromCache: true,
//   status: "from_cache", 
//   progress: 100
// }
                    </div>
                </div>
            </div>

            <div class="endpoint">
                <div class="method get">GET</div>
                <strong>/api/subtitle/status/:processId</strong>
                <p>Check real-time status of subtitle processing</p>
                
                <div class="url">GET ${DOMAIN}/api/subtitle/status/movie-278-0-0-ar</div>
                
                <div class="response">
                    <h4 style="color: #80ff80;">Example Response (Processing):</h4>
                    <div class="code-block">
{
  "success": true,
  "status": "translating",
  "message": "Translated 125/350 lines to Arabic...",
  "progress": 65,
  "startedAt": "2024-01-15T10:30:00.000Z",
  "lastUpdated": "2024-01-15T10:31:25.000Z"
}
                    </div>

                    <h4 style="color: #80ff80;">Example Response (Complete):</h4>
                    <div class="code-block">
{
  "success": true,
  "status": "complete",
  "message": "Subtitle in Arabic ready!",
  "progress": 100,
  "subtitleUrl": "${DOMAIN}/subtitles/movies/278/ar/subtitle.vtt",
  "startedAt": "2024-01-15T10:30:00.000Z",
  "lastUpdated": "2024-01-15T10:32:15.000Z"
}
                    </div>
                </div>

                <h4 style="color: #80ff80; margin-top: 20px;">Usage Examples:</h4>
                
                <div style="margin-bottom: 15px;">
                    <div class="tab active" onclick="switchTab('status-curl')">cURL</div>
                    <div class="tab" onclick="switchTab('status-js')">JavaScript</div>
                </div>

                <div id="status-curl" class="tab-content active">
                    <div class="code-block">
# Check status of subtitle processing
curl -X GET "${DOMAIN}/api/subtitle/status/movie-278-0-0-ar"

# Poll status every 5 seconds until complete
while true; do
  response=$(curl -s "${DOMAIN}/api/subtitle/status/movie-278-0-0-ar")
  echo "$response" | jq '.'
  
  status=$(echo "$response" | jq -r '.status')
  if [ "$status" = "complete" ] || [ "$status" = "failed" ]; then
    break
  fi
  
  sleep 5
done
                    </div>
                </div>

                <div id="status-js" class="tab-content">
                    <div class="code-block">
// Check status of subtitle processing
async function checkStatus(processId) {
  const response = await fetch(\`${DOMAIN}/api/subtitle/status/\${processId}\`);
  const data = await response.json();
  return data;
}

// Poll status every 5 seconds until complete
async function pollStatus(processId) {
  while (true) {
    const status = await checkStatus(processId);
    console.log(\`Progress: \${status.progress}% - \${status.message}\`);
    
    if (status.status === 'complete') {
      console.log('Subtitle ready:', status.subtitleUrl);
      return status.subtitleUrl;
    }
    
    if (status.status === 'failed') {
      console.error('Processing failed:', status.message);
      throw new Error(status.message);
    }
    
    await new Promise(resolve => setTimeout(resolve, 5000));
  }
}

// Usage
const subtitleUrl = await pollStatus('movie-278-0-0-ar');
                    </div>
                </div>
            </div>

            <div class="endpoint">
                <div class="method get">GET</div>
                <strong>/api/languages</strong>
                <p>Get list of all supported languages</p>
                <div class="url">GET ${DOMAIN}/api/languages</div>
                
                <div class="response">
                    <h4 style="color: #80ff80;">Example Response:</h4>
                    <div class="code-block">
{
  "success": true,
  "languages": {
    "ckb": { "name": "Kurdish (Sorani)", "nativeName": "کوردی" },
    "ar": { "name": "Arabic", "nativeName": "العربية" },
    ...
  },
  "defaultLanguage": "ckb",
  "totalLanguages": ${totalLanguages}
}
                    </div>
                </div>
            </div>

            <div class="endpoint">
                <div class="method get">GET</div>
                <strong>/api/health</strong>
                <p>Health check endpoint</p>
                <div class="url">GET ${DOMAIN}/api/health</div>
                
                <div class="response">
                    <h4 style="color: #80ff80;">Example Response:</h4>
                    <div class="code-block">
{
  "status": "OK",
  "service": "Subtitle API",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "activeProcesses": 3,
  "supportedLanguages": ${totalLanguages},
  "domain": "${DOMAIN}"
}
                    </div>
                </div>
            </div>
        </div>

        <div class="card">
            <h2><i class="fas fa-sync-alt"></i> STATUS TYPES</h2>
            <p><span class="status-indicator status-cache"></span> <strong>from_cache</strong> - Subtitle served from cache (instant delivery)</p>
            <p><span class="status-indicator status-starting"></span> <strong>starting</strong> - Initializing process</p>
            <p><span class="status-indicator status-fetching_imdb"></span> <strong>fetching_imdb</strong> - Getting IMDb ID from TMDb</p>
            <p><span class="status-indicator status-searching_subs"></span> <strong>searching_subs</strong> - Searching subtitle sources</p>
            <p><span class="status-indicator status-downloading"></span> <strong>downloading</strong> - Downloading subtitle file</p>
            <p><span class="status-indicator status-translating"></span> <strong>translating</strong> - Translating to target language</p>
            <p><span class="status-indicator status-finalizing"></span> <strong>finalizing</strong> - Finalizing translation</p>
            <p><span class="status-indicator status-converting"></span> <strong>converting</strong> - Converting to WebVTT format</p>
            <p><span class="status-indicator status-complete"></span> <strong>complete</strong> - Subtitle ready to use</p>
            <p><span class="status-indicator status-failed"></span> <strong>failed</strong> - Process failed</p>
            <p><span class="status-indicator status-retrying"></span> <strong>retrying</span> - Retrying after failure</p>
        </div>

        <div class="card">
            <h2><i class="fas fa-video"></i> USAGE IN HTML</h2>
            <p>Use the returned subtitle URL with the HTML5 video element:</p>
            
            <div class="code-block">
&lt;video id="myVideo" controls width="100%"&gt;
  &lt;source src="movie.mp4" type="video/mp4"&gt;
  &lt;track 
    kind="subtitles" 
    srclang="ar" 
    label="Arabic" 
    default&gt;
&lt;/video&gt;

&lt;script&gt;
// Fetch subtitle and apply to video
fetch('${DOMAIN}/api/subtitle/fetch', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    tmdbId: 278,
    type: 'movie', 
    language: 'ar'
  })
})
.then(response => response.json())
.then(data => {
  if (data.fromCache) {
    // Instant setup for cached subtitles
    document.querySelector('#myVideo track').src = data.subtitleUrl;
    console.log('Subtitle loaded from cache');
  } else {
    // Poll for new subtitles
    pollForSubtitle(data.processId);
  }
});

async function pollForSubtitle(processId) {
  const response = await fetch(\`${DOMAIN}/api/subtitle/status/\${processId}\`);
  const status = await response.json();
  
  if (status.status === 'complete') {
    document.querySelector('#myVideo track').src = status.subtitleUrl;
    console.log('Subtitle loaded after processing');
  } else if (status.status === 'failed') {
    console.error('Failed to load subtitle:', status.message);
  } else {
    // Still processing, poll again in 3 seconds
    setTimeout(() => pollForSubtitle(processId), 3000);
  }
}
&lt;/script&gt;
            </div>
        </div>

        <div class="card">
            <h2><i class="fas fa-cogs"></i> FEATURES</h2>
            <div class="grid">
                <div class="feature">
                    <i class="fas fa-bolt"></i>
                    <h3>Instant Cache Delivery</h3>
                    <p>Subtitles served immediately from cache - no waiting for repeated requests</p>
                </div>
                <div class="feature">
                    <i class="fas fa-language"></i>
                    <h3>${totalLanguages}+ Languages</h3>
                    <p>Global language support covering all major languages worldwide</p>
                </div>
                <div class="feature">
                    <i class="fas fa-sync"></i>
                    <h3>Real-time Status</h3>
                    <p>Live progress updates during translation processing</p>
                </div>
                <div class="feature">
                    <i class="fas fa-database"></i>
                    <h3>Dual Sources</h3>
                    <p>Wyzie primary + LibreSubs fallback for maximum reliability</p>
                </div>
                <div class="feature">
                    <i class="fas fa-code"></i>
                    <h3>WebVTT Format</h3>
                    <p>Industry standard subtitle format compatible with all modern players</p>
                </div>
                <div class="feature">
                    <i class="fas fa-globe"></i>
                    <h3>CORS Enabled</h3>
                    <p>Ready for cross-origin requests from any domain</p>
                </div>
            </div>
        </div>
    </div>

    <script>
        // ALL YOUR EXISTING JAVASCRIPT FUNCTIONS REMAIN EXACTLY THE SAME
        function filterLanguages(searchTerm) {
            const items = document.querySelectorAll('.language-item');
            const term = searchTerm.toLowerCase();
            
            items.forEach(item => {
                const code = item.getAttribute('data-code');
                const name = item.getAttribute('data-name');
                const native = item.getAttribute('data-native');
                
                if (code.includes(term) || name.includes(term) || native.includes(term)) {
                    item.style.display = 'block';
                } else {
                    item.style.display = 'none';
                }
            });
        }
        
        function switchTab(tabId) {
            document.querySelectorAll('.tab-content').forEach(tab => {
                tab.classList.remove('active');
            });
            
            document.querySelectorAll('.tab').forEach(tab => {
                tab.classList.remove('active');
            });
            
            document.getElementById(tabId).classList.add('active');
            event.target.classList.add('active');
        }
        
        async function showLanguageDocs(languageCode) {
            document.querySelectorAll('.language-item').forEach(item => {
                item.classList.remove('active');
            });
            
            event.target.classList.add('active');
            
            const docsContainer = document.getElementById('languageDocs');
            docsContainer.innerHTML = '<div style="color: #80ff80; text-align: center; padding: 20px;">Loading documentation for ' + languageCode + '...</div>';
            docsContainer.classList.add('active');
            
            try {
                const response = await fetch('${DOMAIN}/api/language/' + languageCode);
                const data = await response.json();
                
                if (data.success) {
                    docsContainer.innerHTML = \`
                        <h3 style="color: #80ff80; margin-bottom: 20px;">\${data.name} (\${data.nativeName}) - \${data.code}</h3>
                        
                        <div style="margin-bottom: 20px;">
                            <div class="tab active" onclick="switchLangTab('\${data.code}-curl')">cURL</div>
                            <div class="tab" onclick="switchLangTab('\${data.code}-js')">JavaScript</div>
                            <div class="tab" onclick="switchLangTab('\${data.code}-python')">Python</div>
                        </div>
                        
                        <div id="\${data.code}-curl" class="tab-content active">
                            <div class="code-block">\${data.exampleRequest.curl}</div>
                        </div>
                        
                        <div id="\${data.code}-js" class="tab-content">
                            <div class="code-block">\${data.exampleRequest.javascript}</div>
                        </div>
                        
                        <div id="\${data.code}-python" class="tab-content">
                            <div class="code-block">\${data.exampleRequest.python}</div>
                        </div>
                    \`;
                } else {
                    docsContainer.innerHTML = '<div style="color: #ff6666; text-align: center; padding: 20px;">Error loading documentation: ' + data.error + '</div>';
                }
            } catch (error) {
                docsContainer.innerHTML = '<div style="color: #ff6666; text-align: center; padding: 20px;">Error loading documentation</div>';
            }
        }
        
        function switchLangTab(tabId) {
            const parent = document.getElementById('languageDocs');
            const tabs = parent.querySelectorAll('.tab-content');
            const tabButtons = parent.querySelectorAll('.tab');
            
            tabs.forEach(tab => {
                tab.classList.remove('active');
            });
            
            tabButtons.forEach(tab => {
                tab.classList.remove('active');
            });
            
            document.getElementById(tabId).classList.add('active');
            event.target.classList.add('active');
        }
        
        document.addEventListener('DOMContentLoaded', function() {
            const header = document.querySelector('.header h1');
            const originalText = header.textContent;
            header.textContent = '';
            let i = 0;
            
            function typeWriter() {
                if (i < originalText.length) {
                    header.textContent += originalText.charAt(i);
                    i++;
                    setTimeout(typeWriter, 50);
                }
            }
            
            typeWriter();
        });
    </script>
</body>
</html>
  `;
  
  res.send(documentation);
});

// Start server
app.listen(PORT, () => {
  const totalLanguages = Object.keys(SUPPORTED_LANGUAGES).length;
  console.log(`╔══════════════════════════════════════════════════════════════╗`);
  console.log(`║ 🚀 SUBTITLE TRANSLATION API v3.0 - SYSTEM ONLINE            ║`);
  console.log(`║                                                              ║`);
  console.log(`║  PORT: ${PORT}                                               ║`);
  console.log(`║  DOMAIN: ${DOMAIN}                                           ║`);
  console.log(`║  LANGUAGES: ${totalLanguages} SUPPORTED                      ║`);
  console.log(`║  SOURCES: WYZIE + LIBRESUBS                                 ║`);
  console.log(`║  STATUS: REAL-TIME TRACKING ACTIVE                          ║`);
  console.log(`║  DONATION: USDT/ETH to ${DONATION_WALLET.substring(0, 8)}... ║`);
  console.log(`║                                                              ║`);
  console.log(`╚══════════════════════════════════════════════════════════════╝`);
});

module.exports = app;
