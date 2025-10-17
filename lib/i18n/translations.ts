/**
 * Translation dictionaries for the application
 * Supports English (en) and Chinese (zh)
 */

export type Language = 'en' | 'zh';

export interface Translations {
  // Header
  home: string;
  host: string;
  participant: string;
  participants: string;
  radius: string;
  venues: string;
  shareLink: string;
  publishDecision: string;

  // Final decision
  finalDecision: string;

  // Input panel
  addYourLocation: string;
  addYourStartingLocation: string;
  searchForAddress: string;
  startTypingAddress: string;
  clickMapToAdd: string;
  addedLocations: string;
  noLocationsYet: string;
  startingLocationEmphasis: string;

  // Nickname prompt
  enterNickname: string;
  nicknameVisible: string;
  nicknamePlaceholder: string;
  confirm: string;
  cancel: string;
  edit: string;
  editLocation: string;
  editLocationDescription: string;

  // Circle radius control
  circleDisplayRadius: string;
  circleTooltip: string;
  visualizationOnly: string;

  // Participants
  participantsCount: string;
  removeParticipant: string;

  // Tabs
  search: string;
  customAdd: string;
  added: string;

  // Search results tab
  searchPlaceholder: string;
  searchButton: string;
  sortBy: string;
  rating: string;
  distance: string;
  noResults: string;
  noResultsMessage: string;
  onlyInCircle: string;
  onlyInCircleDescription: string;

  // User added tab
  noUserAddedVenues: string;
  noUserAddedMessage: string;

  // Add venue tab
  addSpecificVenue: string;
  searchAndAddVenue: string;

  // Venue card
  vote: string;
  remove: string;
  votes: string;

  // Share modal
  shareEventLink: string;
  shareDescription: string;
  copyLink: string;
  close: string;

  // Toasts
  joinLinkCopied: string;
  finalDecisionPublished: string;
  pleaseEnterKeyword: string;
  noResultsFound: string;
  tryDifferentSearch: string;
  pleaseSelectVenue: string;
  pleaseEnterNickname: string;

  // Errors
  apiKeyMissing: string;
  apiKeyMissingMessage: string;
  loadingEvent: string;

  // Map confirmation
  addLocationAt: string;
  clickOkToConfirm: string;
}

export const translations: Record<Language, Translations> = {
  en: {
    // Header
    home: '← Home',
    host: '👑 Host',
    participant: '👤 Participant',
    participants: 'participants',
    radius: 'Radius',
    venues: 'Venues',
    shareLink: 'Share Link',
    publishDecision: 'Publish Decision',

    // Final decision
    finalDecision: '🎉 Final Decision',

    // Input panel
    addYourLocation: 'Add Your Location',
    addYourStartingLocation: 'Add Your Starting Location',
    searchForAddress: 'Search for Your Starting Address or Place',
    startTypingAddress: 'Where will you be starting from? Type an address, city, or place name...',
    clickMapToAdd: '💡 Type to see suggestions, or click anywhere on the map to add your starting location',
    addedLocations: 'Added Starting Locations',
    noLocationsYet: 'No starting locations added yet. Add the address or place where you will be starting from.',
    startingLocationEmphasis: 'Add where you will be starting from',

    // Nickname prompt
    enterNickname: 'Enter Your Nickname',
    nicknameVisible: 'This will be visible to the event organizer and displayed on the map.',
    nicknamePlaceholder: 'e.g., Alice, Bob, John',
    confirm: 'Confirm',
    cancel: 'Cancel',
    edit: 'Edit',
    editLocation: 'Edit Location',
    editLocationDescription: 'Update the name or choose a new location from the search box above.',

    // Circle radius control
    circleDisplayRadius: 'Circle Display Radius',
    circleTooltip: 'Adjusts the visual circle size on the map. Venue search uses the natural meeting area (MEC).',
    visualizationOnly: 'For visualization only. Does not affect search area.',

    // Participants
    participantsCount: 'Participants',
    removeParticipant: 'Remove participant',

    // Tabs
    search: 'Search',
    customAdd: 'Custom Add',
    added: 'Added',

    // Search results tab
    searchPlaceholder: 'e.g., restaurants, cafes, parks',
    searchButton: 'Search',
    sortBy: 'Sort by',
    rating: 'Rating',
    distance: 'Distance',
    noResults: 'No Venues Yet',
    noResultsMessage: 'Search for venues using the search box above',
    onlyInCircle: 'Only in meeting area',
    onlyInCircleDescription: 'Show only venues within the circle',

    // User added tab
    noUserAddedVenues: 'No User-Added Venues',
    noUserAddedMessage: "Use the 'Add Venue' tab to manually add specific venues you have in mind",

    // Add venue tab
    addSpecificVenue: 'Add a Specific Venue',
    searchAndAddVenue: 'Search and add a venue you have in mind',

    // Venue card
    vote: 'Vote',
    remove: 'Remove',
    votes: 'votes',

    // Share modal
    shareEventLink: 'Share Event Link',
    shareDescription: 'Share this link with participants so they can add their locations:',
    copyLink: 'Copy Link',
    close: 'Close',

    // Toasts
    joinLinkCopied: 'Join link copied to clipboard!',
    finalDecisionPublished: 'Final decision published!',
    pleaseEnterKeyword: 'Please enter a search keyword',
    noResultsFound: 'No results found for',
    tryDifferentSearch: 'Try a different search term.',
    pleaseSelectVenue: 'Please select a venue first',
    pleaseEnterNickname: 'Please enter a nickname',

    // Errors
    apiKeyMissing: 'API Key Missing',
    apiKeyMissingMessage: 'Please set your Google Maps API key in the',
    loadingEvent: 'Loading event...',

    // Map confirmation
    addLocationAt: 'Add location at:',
    clickOkToConfirm: 'Click OK to confirm this location.',
  },
  zh: {
    // Header
    home: '← 首页',
    host: '👑 主办方',
    participant: '👤 参与者',
    participants: '位参与者',
    radius: '半径',
    venues: '地点',
    shareLink: '分享链接',
    publishDecision: '发布决定',

    // Final decision
    finalDecision: '🎉 最终决定',

    // Input panel
    addYourLocation: '添加您的位置',
    addYourStartingLocation: '添加您的出发位置',
    searchForAddress: '搜索您的出发地址或地点',
    startTypingAddress: '您将从哪里出发？输入地址、城市或地点名称...',
    clickMapToAdd: '💡 输入以查看建议，或点击地图上的任意位置添加您的出发位置',
    addedLocations: '已添加的出发位置',
    noLocationsYet: '尚未添加出发位置。请添加您将要出发的地址或地点。',
    startingLocationEmphasis: '添加您将要出发的位置',

    // Nickname prompt
    enterNickname: '输入您的昵称',
    nicknameVisible: '活动组织者和地图上将显示此昵称。',
    nicknamePlaceholder: '例如：小明、小红、小华',
    confirm: '确认',
    cancel: '取消',
    edit: '编辑',
    editLocation: '编辑位置',
    editLocationDescription: '更新名称或从上方的搜索框中选择新位置。',

    // Circle radius control
    circleDisplayRadius: '圆圈显示半径',
    circleTooltip: '调整地图上圆圈的视觉大小。地点搜索使用自然会面区域（MEC）。',
    visualizationOnly: '仅用于可视化。不影响搜索区域。',

    // Participants
    participantsCount: '参与者',
    removeParticipant: '移除参与者',

    // Tabs
    search: '搜索',
    customAdd: '自定义添加',
    added: '已添加',

    // Search results tab
    searchPlaceholder: '例如：餐厅、咖啡馆、公园',
    searchButton: '搜索',
    sortBy: '排序方式',
    rating: '评分',
    distance: '距离',
    noResults: '暂无地点',
    noResultsMessage: '使用上方的搜索框搜索地点',
    onlyInCircle: '仅在会面区域内',
    onlyInCircleDescription: '仅显示圆圈内的地点',

    // User added tab
    noUserAddedVenues: '无用户添加的地点',
    noUserAddedMessage: '使用"添加地点"标签手动添加您想要的特定地点',

    // Add venue tab
    addSpecificVenue: '添加特定地点',
    searchAndAddVenue: '搜索并添加您想要的地点',

    // Venue card
    vote: '投票',
    remove: '移除',
    votes: '票',

    // Share modal
    shareEventLink: '分享活动链接',
    shareDescription: '与参与者分享此链接，以便他们可以添加自己的位置：',
    copyLink: '复制链接',
    close: '关闭',

    // Toasts
    joinLinkCopied: '加入链接已复制到剪贴板！',
    finalDecisionPublished: '最终决定已发布！',
    pleaseEnterKeyword: '请输入搜索关键词',
    noResultsFound: '未找到结果',
    tryDifferentSearch: '尝试不同的搜索词。',
    pleaseSelectVenue: '请先选择一个地点',
    pleaseEnterNickname: '请输入昵称',

    // Errors
    apiKeyMissing: 'API密钥缺失',
    apiKeyMissingMessage: '请在以下文件中设置您的Google Maps API密钥',
    loadingEvent: '加载活动中...',

    // Map confirmation
    addLocationAt: '在此添加位置：',
    clickOkToConfirm: '点击确定以确认此位置。',
  },
};

/**
 * Detect the browser's preferred language
 */
export function detectBrowserLanguage(): Language {
  if (typeof window === 'undefined') return 'en';

  const browserLang = navigator.language.toLowerCase();

  // Check if browser language starts with 'zh' (includes zh-CN, zh-TW, etc.)
  if (browserLang.startsWith('zh')) {
    return 'zh';
  }

  return 'en';
}
