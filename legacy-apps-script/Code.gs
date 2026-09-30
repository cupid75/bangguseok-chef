const CONFIG = {
  SPREADSHEET_ID_PROPERTY: 'SPREADSHEET_ID',
  GEMINI_API_KEY_PROPERTY: 'GEMINI_API_KEY',
  GEMINI_MODEL: 'gemini-3.6-flash',
  MAX_RESULTS: 3,
  SCRIPT_CACHE_TTL_SECONDS: 21600, // 6시간
  GEMINI_MAX_OUTPUT_TOKENS: 1600,
  GEMINI_MAX_RETRIES: 2,
  SHEETS: {
    RECIPES: '레시피',
    CACHE: '검색캐시',
    PANTRY: '기본조미료',
  },
};

/**
 * 설정 및 시트 연결 상태를 확인합니다.
 * Apps Script 상단 실행 버튼으로 한 번 실행하세요.
 */
function verifySetup() {
  const spreadsheet = getSpreadsheet_();
  const sheetNames = Object.values(CONFIG.SHEETS);

  sheetNames.forEach((sheetName) => getSheet_(spreadsheet, sheetName));

  const apiKey = PropertiesService.getScriptProperties()
    .getProperty(CONFIG.GEMINI_API_KEY_PROPERTY);

  if (!apiKey) {
    throw new Error('Script Properties에 GEMINI_API_KEY가 없습니다.');
  }

  Logger.log(JSON.stringify({
    spreadsheetName: spreadsheet.getName(),
    sheets: sheetNames,
    geminiApiKeyConfigured: true,
  }));
}

/**
 * 화면에서 호출할 메인 검색 함수입니다.
 * 예: searchRecipes('계란, 양파')
 */
function searchRecipes(rawInput) {
  // 1차 임시 캐시: 같은 재료 조합의 재검색은 시트/AI 호출 없이 즉시 반환합니다.
  const spreadsheet = getSpreadsheet_();
  const pantryMap = getPantryMap_(spreadsheet);
  const ingredients = normalizeInput_(rawInput, pantryMap);

  if (ingredients.length === 0) {
    return { query: [], recipes: [], message: '계란, 양파처럼 기본 조미료를 제외한 재료를 한 가지 이상 입력해 주세요.' };
  }

  const cacheKey = ingredients.slice().sort().join(',');
  const hotCacheKey = 'recipe-search:v3:' + cacheKey;
  const scriptCache = CacheService.getScriptCache();
  const hotCacheValue = scriptCache.get(hotCacheKey);
  if (hotCacheValue) {
    try { return JSON.parse(hotCacheValue); }
    catch (error) { scriptCache.remove(hotCacheKey); }
  }

  const lock = LockService.getScriptLock();
  if (!lock.tryLock(20000)) {
    throw new Error('검색 요청이 많습니다. 잠시 후 다시 시도해 주세요.');
  }

  try {
    // 대기 중 다른 요청이 결과를 만들었을 수 있으므로 한 번 더 확인합니다.
    const secondCacheValue = scriptCache.get(hotCacheKey);
    if (secondCacheValue) {
      try { return JSON.parse(secondCacheValue); }
      catch (error) { scriptCache.remove(hotCacheKey); }
    }

    const allRecipes = readRecipes_(spreadsheet);
    const cachedRecipeIds = getCachedRecipeIds_(spreadsheet, cacheKey);
    const recipeById = new Map(allRecipes.map((recipe) => [recipe.id, recipe]));
    const selectedRecipes = [];
    const selectedIds = new Set();

    // 2차 영구 캐시: 이전 검색 결과를 시트에서 우선 사용합니다.
    cachedRecipeIds.forEach((recipeId) => {
      const recipe = recipeById.get(recipeId);
      if (recipe && recipe.usageStatus !== '숨김' && !selectedIds.has(recipe.id)) {
        selectedRecipes.push(recipe);
        selectedIds.add(recipe.id);
      }
    });

    findMatchingRecipes_(allRecipes, ingredients).forEach((recipe) => {
      if (selectedRecipes.length < CONFIG.MAX_RESULTS && !selectedIds.has(recipe.id)) {
        selectedRecipes.push(recipe);
        selectedIds.add(recipe.id);
      }
    });

    if (selectedRecipes.length < CONFIG.MAX_RESULTS) {
      const generatedRecipes = generateRecipesWithGemini_(ingredients, CONFIG.MAX_RESULTS - selectedRecipes.length, pantryMap);
      appendGeneratedRecipes_(spreadsheet, generatedRecipes).forEach((recipe) => {
        if (selectedRecipes.length < CONFIG.MAX_RESULTS && !selectedIds.has(recipe.id)) {
          selectedRecipes.push(recipe);
          selectedIds.add(recipe.id);
        }
      });
    }

    upsertCache_(spreadsheet, cacheKey, ingredients, selectedRecipes.map((recipe) => recipe.id));
    increaseSearchCounts_(spreadsheet, selectedRecipes);
    const result = {
      query: ingredients,
      recipes: selectedRecipes.map(toPublicRecipe_),
      message: selectedRecipes.length ? '' : '입력한 재료로 만들 수 있는 레시피를 아직 찾지 못했어요. 식재료를 한 가지 더 넣거나, 쉼표(,)로 구분해 다시 검색해 주세요.',
    };
    scriptCache.put(hotCacheKey, JSON.stringify(result), CONFIG.SCRIPT_CACHE_TTL_SECONDS);
    return result;
  } finally {
    lock.releaseLock();
  }
}

/* -------------------------------------------------------------------------- */
/*                               검색 및 캐시                                  */
/* -------------------------------------------------------------------------- */

function findMatchingRecipes_(recipes, queryIngredients) {
  return recipes
    .filter((recipe) => recipe.usageStatus !== '숨김')
    .map((recipe) => {
      const matchedCount = queryIngredients.filter((ingredient) =>
        recipe.normalizedIngredients.includes(ingredient)
      ).length;

      return {
        recipe,
        matchedCount,
        isReviewed: recipe.usageStatus === '사용',
      };
    })
    .filter((item) => item.matchedCount > 0)
    .sort((a, b) => {
      if (b.matchedCount !== a.matchedCount) {
        return b.matchedCount - a.matchedCount;
      }

      if (a.isReviewed !== b.isReviewed) {
        return a.isReviewed ? -1 : 1;
      }

      return a.recipe.title.localeCompare(b.recipe.title, 'ko');
    })
    .map((item) => item.recipe);
}

function getCachedRecipeIds_(spreadsheet, cacheKey) {
  const sheet = getSheet_(spreadsheet, CONFIG.SHEETS.CACHE);

  if (sheet.getLastRow() < 2) {
    return [];
  }

  const rows = sheet.getRange(2, 1, sheet.getLastRow() - 1, 6).getValues();

  const row = rows.find((values) => String(values[0]) === cacheKey);

  if (!row || !row[2]) {
    return [];
  }

  return String(row[2])
    .split(',')
    .map((id) => id.trim())
    .filter(Boolean);
}

function upsertCache_(spreadsheet, cacheKey, ingredients, recipeIds) {
  const sheet = getSheet_(spreadsheet, CONFIG.SHEETS.CACHE);
  const now = formatDate_(new Date());

  if (sheet.getLastRow() < 2) {
    sheet.appendRow([
      cacheKey,
      ingredients.join(','),
      recipeIds.join(','),
      now,
      now,
      1,
    ]);
    return;
  }

  const rows = sheet.getRange(2, 1, sheet.getLastRow() - 1, 6).getValues();
  const rowIndex = rows.findIndex((values) => String(values[0]) === cacheKey);

  if (rowIndex === -1) {
    sheet.appendRow([
      cacheKey,
      ingredients.join(','),
      recipeIds.join(','),
      now,
      now,
      1,
    ]);
    return;
  }

  const targetRow = rowIndex + 2;
  const previousCount = Number(rows[rowIndex][5]) || 0;

  sheet.getRange(targetRow, 2, 1, 5).setValues([[
    ingredients.join(','),
    recipeIds.join(','),
    rows[rowIndex][3] || now,
    now,
    previousCount + 1,
  ]]);
}

function increaseSearchCounts_(spreadsheet, recipes) {
  if (recipes.length === 0) {
    return;
  }

  const sheet = getSheet_(spreadsheet, CONFIG.SHEETS.RECIPES);
  const values = sheet.getDataRange().getValues();
  const headerIndexes = getHeaderIndexes_(values[0]);
  const idColumn = headerIndexes['레시피ID'];
  const countColumn = headerIndexes['검색횟수'];

  const rowById = new Map();

  values.slice(1).forEach((row, index) => {
    rowById.set(String(row[idColumn]), index + 2);
  });

  recipes.forEach((recipe) => {
    const rowNumber = rowById.get(recipe.id);

    if (!rowNumber) {
      return;
    }

    const cell = sheet.getRange(rowNumber, countColumn + 1);
    cell.setValue((Number(cell.getValue()) || 0) + 1);
  });
}

/* -------------------------------------------------------------------------- */
/*                                Gemini API                                  */
/* -------------------------------------------------------------------------- */

function generateRecipesWithGemini_(ingredients, count, pantryMap) {
  const apiKey = PropertiesService.getScriptProperties()
    .getProperty(CONFIG.GEMINI_API_KEY_PROPERTY);

  if (!apiKey) {
    throw new Error('GEMINI_API_KEY 설정값을 찾을 수 없습니다.');
  }

  const basicIngredients = [...new Set(pantryMap.values())].join(', ');

  const prompt = [
    '한국 1인 가구 요리 초보자용 레시피 JSON을 작성합니다.',
    `핵심 재료: ${ingredients.join(', ')}`,
    `기본 조미료: ${basicIngredients}`,
    `핵심 재료를 하나 이상 활용한 쉬운 레시피를 최대 ${count}개 작성하세요.`,
    '식재료가 아닌 물건만 입력된 경우 recipes 배열을 비워 반환하세요.',
    '1~2인분, 30분 이내이며 육류·생선·계란은 충분히 익힙니다.',
    '모든 항목은 짧게 작성하고, 만드는 방법은 3~5단계·단계별 한 문장으로 작성하세요.',
    '대체 재료 또는 알레르기 주의가 없으면 해당 배열에 "없음"을 넣으세요.',
  ].join('\n');

  const recipeSchema = {
    type: 'OBJECT',
    properties: {
      recipes: {
        type: 'ARRAY',
        items: {
          type: 'OBJECT',
          properties: {
            title: { type: 'STRING' },
            ingredients: {
              type: 'ARRAY',
              items: { type: 'STRING' },
            },
            normalizedIngredients: {
              type: 'ARRAY',
              items: { type: 'STRING' },
            },
            cookingTimeMinutes: { type: 'INTEGER' },
            servings: { type: 'INTEGER' },
            requiredTools: {
              type: 'ARRAY',
              items: { type: 'STRING' },
            },
            substitutions: {
              type: 'ARRAY',
              items: { type: 'STRING' },
            },
            allergenInfo: {
              type: 'ARRAY',
              items: { type: 'STRING' },
            },
            instructions: {
              type: 'ARRAY',
              items: { type: 'STRING' },
            },
          },
          required: [
            'title',
            'ingredients',
            'normalizedIngredients',
            'cookingTimeMinutes',
            'servings',
            'requiredTools',
            'substitutions',
            'allergenInfo',
            'instructions',
          ],
        },
      },
    },
    required: ['recipes'],
  };

  const requestBody = {
    contents: [{
      parts: [{ text: prompt }],
    }],
    generationConfig: {
      responseMimeType: 'application/json',
      responseJsonSchema: recipeSchema,
      temperature: 0.5,
      maxOutputTokens: CONFIG.GEMINI_MAX_OUTPUT_TOKENS,
    },
  };

  const url =
    `https://generativelanguage.googleapis.com/v1beta/models/` +
    `${CONFIG.GEMINI_MODEL}:generateContent?key=${encodeURIComponent(apiKey)}`;

  let response;
  let statusCode;
  let responseText;

  // Gemini가 일시적으로 붐비면 짧게 기다린 뒤 최대 2회 더 시도합니다.
  for (let attempt = 0; attempt <= CONFIG.GEMINI_MAX_RETRIES; attempt += 1) {
    response = UrlFetchApp.fetch(url, {
      method: 'post',
      contentType: 'application/json',
      payload: JSON.stringify(requestBody),
      muteHttpExceptions: true,
    });
    statusCode = response.getResponseCode();
    responseText = response.getContentText();

    if (statusCode !== 503 && statusCode !== 429) {
      break;
    }

    if (attempt < CONFIG.GEMINI_MAX_RETRIES) {
      Utilities.sleep(700 * (attempt + 1));
    }
  }

  if (statusCode < 200 || statusCode >= 300) {
    if (statusCode === 503) {
      throw new Error('AI_TEMPORARILY_BUSY');
    }
    if (statusCode === 429) {
      throw new Error('AI_RATE_LIMITED');
    }
    throw new Error('AI_REQUEST_FAILED');
  }

  const responseJson = JSON.parse(responseText);
  const parts = responseJson.candidates &&
    responseJson.candidates[0] &&
    responseJson.candidates[0].content &&
    responseJson.candidates[0].content.parts;

  const generatedText = Array.isArray(parts)
    ? parts.map((part) => part.text || '').join('')
    : '';

  if (!generatedText) {
    throw new Error('Gemini가 레시피 결과를 반환하지 않았습니다.');
  }

  const generatedData = JSON.parse(generatedText);

  if (!generatedData.recipes || !Array.isArray(generatedData.recipes)) {
    throw new Error('Gemini 응답 형식이 올바르지 않습니다.');
  }

  return generatedData.recipes.slice(0, count);
}

function appendGeneratedRecipes_(spreadsheet, generatedRecipes) {
  if (!generatedRecipes.length) {
    return [];
  }

  const sheet = getSheet_(spreadsheet, CONFIG.SHEETS.RECIPES);
  const nextNumber = getNextRecipeNumber_(sheet);
  const now = formatDate_(new Date());
  const savedRecipes = generatedRecipes.map((recipe, index) => ({
    id: `R${String(nextNumber + index).padStart(4, '0')}`,
    title: cleanText_(recipe.title),
    ingredients: arrayToText_(recipe.ingredients),
    normalizedIngredients: normalizeIngredientArray_(recipe.normalizedIngredients),
    cookingTimeMinutes: Number(recipe.cookingTimeMinutes) || 15,
    servings: Number(recipe.servings) || 1,
    requiredTools: arrayToText_(recipe.requiredTools),
    substitutions: arrayToText_(recipe.substitutions) || '없음',
    allergenInfo: arrayToText_(recipe.allergenInfo) || '없음',
    instructions: formatInstructionSteps_(recipe.instructions),
    source: 'AI생성',
    usageStatus: '사용',
    createdAt: now,
    updatedAt: now,
    searchCount: 0,
  }));

  const rows = savedRecipes.map((recipe) => [
    recipe.id, recipe.title, recipe.ingredients, recipe.normalizedIngredients.join(','),
    recipe.cookingTimeMinutes, recipe.servings, recipe.requiredTools, recipe.substitutions,
    recipe.allergenInfo, recipe.instructions, recipe.source, recipe.usageStatus,
    recipe.createdAt, recipe.updatedAt, recipe.searchCount,
  ]);

  sheet.getRange(sheet.getLastRow() + 1, 1, rows.length, rows[0].length).setValues(rows);
  return savedRecipes;
}

/* -------------------------------------------------------------------------- */
/*                              데이터 읽기 및 정리                            */
/* -------------------------------------------------------------------------- */

function readRecipes_(spreadsheet) {
  const sheet = getSheet_(spreadsheet, CONFIG.SHEETS.RECIPES);

  if (sheet.getLastRow() < 2) {
    return [];
  }

  const values = sheet.getDataRange().getValues();
  const headers = getHeaderIndexes_(values[0]);

  return values.slice(1)
    .filter((row) => row[headers['레시피ID']])
    .map((row) => ({
      id: String(row[headers['레시피ID']]),
      title: String(row[headers['요리제목']] || ''),
      ingredients: String(row[headers['구성재료']] || ''),
      normalizedIngredients: splitCsv_(
        row[headers['정규화재료']]
      ),
      cookingTimeMinutes: Number(row[headers['조리시간(분)']]) || 0,
      servings: Number(row[headers['인분']]) || 0,
      requiredTools: String(row[headers['필수도구']] || ''),
      substitutions: String(row[headers['대체재료']] || ''),
      allergenInfo: String(row[headers['알레르기주의']] || ''),
      instructions: String(row[headers['만드는방법']] || ''),
      source: String(row[headers['생성출처']] || ''),
      usageStatus: String(row[headers['사용여부']] || ''),
      createdAt: String(row[headers['등록일']] || ''),
      updatedAt: String(row[headers['수정일']] || ''),
      searchCount: Number(row[headers['검색횟수']]) || 0,
    }));
}

function getPantryMap_(spreadsheet) {
  const sheet = getSheet_(spreadsheet, CONFIG.SHEETS.PANTRY);

  if (sheet.getLastRow() < 2) {
    return new Map();
  }

  const rows = sheet.getRange(2, 1, sheet.getLastRow() - 1, 3).getValues();
  const pantryMap = new Map();

  rows.forEach(([name, aliases, enabled]) => {
    if (String(enabled).toUpperCase() !== 'Y') {
      return;
    }

    const canonicalName = normalizeWord_(name);

    if (!canonicalName) {
      return;
    }

    pantryMap.set(canonicalName, canonicalName);

    splitCsv_(aliases).forEach((alias) => {
      pantryMap.set(normalizeWord_(alias), canonicalName);
    });
  });

  return pantryMap;
}

function normalizeInput_(rawInput, pantryMap) {
  const uniqueIngredients = new Set();

  String(rawInput || '')
    .split(',')
    .map((item) => normalizeWord_(item))
    .filter(Boolean)
    .forEach((ingredient) => {
      const canonicalName = pantryMap.get(ingredient) || ingredient;

      // 기본 조미료는 입력해도 검색 핵심 재료에서 제외합니다.
      if (!pantryMap.has(ingredient)) {
        uniqueIngredients.add(canonicalName);
      }
    });

  return [...uniqueIngredients];
}

function normalizeIngredientArray_(items) {
  return [...new Set(
    (Array.isArray(items) ? items : [])
      .map((item) => normalizeWord_(item))
      .filter(Boolean)
  )];
}

function getNextRecipeNumber_(sheet) {
  if (sheet.getLastRow() < 2) {
    return 1;
  }

  const ids = sheet.getRange(2, 1, sheet.getLastRow() - 1, 1).getValues();

  const highestNumber = ids.reduce((highest, [id]) => {
    const match = String(id).match(/^R(\d+)$/);
    return match ? Math.max(highest, Number(match[1])) : highest;
  }, 0);

  return highestNumber + 1;
}

function getSpreadsheet_() {
  const spreadsheetId = PropertiesService.getScriptProperties()
    .getProperty(CONFIG.SPREADSHEET_ID_PROPERTY);

  if (!spreadsheetId) {
    throw new Error('Script Properties에 SPREADSHEET_ID가 없습니다.');
  }

  return SpreadsheetApp.openById(spreadsheetId);
}

function getSheet_(spreadsheet, sheetName) {
  const sheet = spreadsheet.getSheetByName(sheetName);

  if (!sheet) {
    throw new Error(`"${sheetName}" 시트를 찾을 수 없습니다.`);
  }

  return sheet;
}

function getHeaderIndexes_(headerRow) {
  const requiredHeaders = [
    '레시피ID',
    '요리제목',
    '구성재료',
    '정규화재료',
    '조리시간(분)',
    '인분',
    '필수도구',
    '대체재료',
    '알레르기주의',
    '만드는방법',
    '생성출처',
    '사용여부',
    '등록일',
    '수정일',
    '검색횟수',
  ];

  const indexes = {};

  requiredHeaders.forEach((header) => {
    const index = headerRow.indexOf(header);

    if (index === -1) {
      throw new Error(`레시피 시트에서 "${header}" 열을 찾을 수 없습니다.`);
    }

    indexes[header] = index;
  });

  return indexes;
}

function toPublicRecipe_(recipe) {
  return {
    id: recipe.id,
    title: recipe.title,
    ingredients: recipe.ingredients,
    cookingTimeMinutes: recipe.cookingTimeMinutes,
    servings: recipe.servings,
    requiredTools: recipe.requiredTools,
    substitutions: recipe.substitutions,
    allergenInfo: recipe.allergenInfo,
    instructions: recipe.instructions,
    source: recipe.source,
    usageStatus: recipe.usageStatus,
  };
}

function splitCsv_(value) {
  return String(value || '')
    .split(',')
    .map((item) => normalizeWord_(item))
    .filter(Boolean);
}

function normalizeWord_(value) {
  return String(value || '')
    .trim()
    .replace(/\s+/g, '')
    .toLowerCase();
}

function arrayToText_(items, separator) {
  if (!Array.isArray(items)) {
    return '';
  }

  return items
    .map((item) => cleanText_(item))
    .filter(Boolean)
    .join(separator || ', ');
}

function cleanText_(value) {
  return String(value || '').trim();
}

function formatDate_(date) {
  return Utilities.formatDate(
    date,
    Session.getScriptTimeZone(),
    'yyyy-MM-dd'
  );
}

/**
 * 조리 방법을 한 단계씩 줄바꿈하고 1), 2) 형식으로 통일합니다.
 */
function formatInstructionSteps_(instructions) {
  const raw = Array.isArray(instructions) ? instructions.join('\n') : String(instructions || '');
  const steps = raw
    .replace(/\r\n?/g, '\n')
    .split(/\n+|(?=\s*\d+\s*[).]\s+)/)
    .map((step) => step.replace(/^\s*\d+\s*[).]\s*/, '').replace(/^[-•]\s*/, '').trim())
    .filter(Boolean);

  return steps.map((step, index) => (index + 1) + ') ' + step).join('\n');
}

/**
 * 기존 레시피 DB의 조리 방법을 AI 생성 레시피와 같은 줄바꿈 구조로 정리합니다.
 */
function normalizeRecipeInstructionFormats() {
  const spreadsheet = getSpreadsheet_();
  const sheet = getSheet_(spreadsheet, CONFIG.SHEETS.RECIPES);
  if (sheet.getLastRow() < 2) {
    Logger.log('정리할 레시피가 없습니다.');
    return;
  }

  const values = sheet.getDataRange().getValues();
  const headers = getHeaderIndexes_(values[0]);
  const instructionColumn = headers['만드는방법'];
  const sourceColumn = headers['생성출처'];
  const updatedAtColumn = headers['수정일'];
  const now = formatDate_(new Date());
  const summary = { total: 0, basicDb: 0, aiGenerated: 0, other: 0 };

  values.slice(1).forEach((row, index) => {
    const original = String(row[instructionColumn] || '');
    const formatted = formatInstructionSteps_(original);
    if (!formatted || formatted === original) {
      return;
    }

    const rowNumber = index + 2;
    sheet.getRange(rowNumber, instructionColumn + 1).setValue(formatted);
    if (updatedAtColumn !== undefined) {
      sheet.getRange(rowNumber, updatedAtColumn + 1).setValue(now);
    }

    summary.total += 1;
    const source = String(row[sourceColumn] || '');
    if (source === '기본DB') summary.basicDb += 1;
    else if (source === 'AI생성') summary.aiGenerated += 1;
    else summary.other += 1;
  });

  Logger.log(JSON.stringify(summary));
}

function doGet() {
  return HtmlService.createHtmlOutputFromFile('Index')
      .setTitle('방구석 요리사');
      }

