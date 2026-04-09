import fs from 'fs';
import path from 'path';

var EventType = ((EventType2) => {
  EventType2.MESSAGE = 'message';
  return EventType2;
})(EventType || {});

const DEFAULT_CONFIG = {
  enabled: true,
  pollSeconds: 60,
  requestTimeoutMs: 12000,
  commandPrefix: '球鳖',
  adminQqList: '',
  roomsJson: '[]',
  statePath: 'data/bilibili-live-push-state.json',
};

export let plugin_config_ui = [];
let currentConfig = { ...DEFAULT_CONFIG };
let ctxRef = null;
let logger = null;
let timer = null;
let state = {
  rooms: {},
};

function sanitizeConfig(raw) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return { ...DEFAULT_CONFIG };
  const out = { ...DEFAULT_CONFIG, ...raw };
  out.enabled = Boolean(out.enabled);
  out.pollSeconds = Math.max(15, Math.min(300, Number(out.pollSeconds) || 60));
  out.requestTimeoutMs = Math.max(3000, Math.min(60000, Number(out.requestTimeoutMs) || 12000));
  out.commandPrefix = String(out.commandPrefix || '').trim();
  out.adminQqList = String(out.adminQqList || '');
  out.roomsJson = String(out.roomsJson || '[]');
  out.statePath = String(out.statePath || 'data/bilibili-live-push-state.json');
  return out;
}

function getStateFilePath() {
  const p = currentConfig.statePath;
  if (path.isAbsolute(p)) return p;
  return path.join(ctxRef.dataPath, p.replace(/^data[\\/]/, ''));
}

function loadState() {
  try {
    const sp = getStateFilePath();
    if (fs.existsSync(sp)) {
      const data = JSON.parse(fs.readFileSync(sp, 'utf-8'));
      if (data && typeof data === 'object') state = data;
    }
  } catch (error) {
    logger?.warn('loadState failed', error);
    state = { rooms: {} };
  }
  if (!state.rooms || typeof state.rooms !== 'object') state.rooms = {};
}

function saveState() {
  try {
    const sp = getStateFilePath();
    const dir = path.dirname(sp);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(sp, JSON.stringify(state, null, 2), 'utf-8');
  } catch (error) {
    logger?.warn('saveState failed', error);
  }
}

function parseAdminList() {
  return String(currentConfig.adminQqList || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function isAdmin(userId) {
  return parseAdminList().includes(String(userId || ''));
}

function normalize(text) {
  return String(text || '')
    .trim()
    .toLowerCase()
    .replace(/[！!。,.，？?；;：:“”"'`~·]/g, '')
    .replace(/\s+/g, '');
}

function stripPrefix(text) {
  const trimmed = String(text || '').trim();
  if (!currentConfig.commandPrefix) return trimmed;
  if (trimmed.startsWith(currentConfig.commandPrefix)) return trimmed.slice(currentConfig.commandPrefix.length).trim();
  return trimmed;
}

function parseRooms() {
  try {
    const arr = JSON.parse(currentConfig.roomsJson || '[]');
    if (!Array.isArray(arr)) return [];
    return arr
      .map((room) => ({
        roomId: String(room?.roomId || room?.room_id || '').trim(),
        groupIds: Array.isArray(room?.groupIds || room?.group_ids)
          ? (room.groupIds || room.group_ids).map((groupId) => String(groupId).trim()).filter(Boolean)
          : [],
        name: String(room?.name || '').trim(),
      }))
      .filter((room) => /^\d+$/.test(room.roomId) && room.groupIds.length > 0);
  } catch {
    return [];
  }
}

async function sendGroup(groupId, message) {
  await ctxRef.actions.call(
    'send_msg',
    { message_type: 'group', group_id: String(groupId), message },
    ctxRef.adapterName,
    ctxRef.pluginManager.config,
  );
}

async function sendMsg(ctx, event, message) {
  const params = {
    message,
    message_type: event.message_type,
    ...(event.message_type === 'group' && event.group_id ? { group_id: String(event.group_id) } : {}),
    ...(event.message_type === 'private' && event.user_id ? { user_id: String(event.user_id) } : {}),
  };
  await ctx.actions.call('send_msg', params, ctx.adapterName, ctx.pluginManager.config);
}

function cqEscape(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/\[/g, '&#91;')
    .replace(/\]/g, '&#93;')
    .replace(/,/g, '&#44;');
}

function formatLiveMessage(info, aliasName = '') {
  const uname = String(info?.uname || aliasName || '主播');
  const title = String(info?.title || '').trim() || '（无标题）';
  const roomId = String(info?.room_id || '');
  const liveUrl = String(info?.live_url || `https://live.bilibili.com/${roomId}`);
  const cover = String(info?.cover || '').trim();

  const text = `${uname} 正在直播！\n${title}\n${liveUrl}`;
  if (cover) {
    return `[CQ:image,file=${cqEscape(cover)}]\n${text}`;
  }
  return text;
}

async function fetchRoomBaseInfo(roomIds) {
  if (!roomIds.length) return {};

  const endpoint = 'https://api.live.bilibili.com/xlive/web-room/v1/index/getRoomBaseInfo';
  const params = new URLSearchParams();
  params.set('req_biz', 'web_room_componet');
  for (const id of roomIds) params.append('room_ids', String(id));

  const controller = new AbortController();
  const timerId = setTimeout(() => controller.abort(), currentConfig.requestTimeoutMs);

  try {
    const response = await fetch(`${endpoint}?${params.toString()}`, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0',
        Accept: 'application/json, text/javascript, */*; q=0.01',
        Referer: 'https://live.bilibili.com/',
      },
      signal: controller.signal,
    });

    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    if (!data || data.code !== 0 || !data.data || !data.data.by_room_ids) {
      throw new Error(`invalid_response:${JSON.stringify(data).slice(0, 200)}`);
    }

    return data.data.by_room_ids;
  } finally {
    clearTimeout(timerId);
  }
}

async function pollOnce() {
  const rooms = parseRooms();
  if (!rooms.length) return;

  const roomIds = rooms.map((room) => room.roomId);
  let byRoom = {};
  try {
    byRoom = await fetchRoomBaseInfo(roomIds);
  } catch (error) {
    logger?.warn('bilibili poll failed', error);
    return;
  }

  for (const room of rooms) {
    const roomId = String(room.roomId);
    const info = byRoom[roomId];
    if (!info) continue;

    const curStatus = Number(info.live_status || 0);
    const prev = state.rooms[roomId] || { lastStatus: null, lastLiveTime: 0 };

    if (curStatus === 1 && prev.lastStatus !== 1) {
      const message = formatLiveMessage(info, room.name);
      for (const groupId of room.groupIds) {
        try {
          await sendGroup(groupId, message);
        } catch (error) {
          logger?.warn(`sendGroup failed room=${roomId} gid=${groupId}`, error);
        }
      }
      state.rooms[roomId] = {
        lastStatus: 1,
        lastLiveTime: Date.now(),
      };
      saveState();
      continue;
    }

    state.rooms[roomId] = {
      ...prev,
      lastStatus: curStatus,
    };
  }

  saveState();
}

function startPoller() {
  if (timer) clearInterval(timer);
  timer = setInterval(async () => {
    if (!ctxRef || !currentConfig.enabled) return;
    await pollOnce();
  }, currentConfig.pollSeconds * 1000);
}

function stopPoller() {
  if (timer) clearInterval(timer);
  timer = null;
}

export const plugin_init = async (ctx) => {
  ctxRef = ctx;
  logger = ctx.logger;

  plugin_config_ui = ctx.NapCatConfig.combine(
    ctx.NapCatConfig.boolean('enabled', '启用插件', true, '总开关'),
    ctx.NapCatConfig.number('pollSeconds', '轮询间隔(秒)', 60, '15-300'),
    ctx.NapCatConfig.number('requestTimeoutMs', '请求超时(ms)', 12000, '3000-60000'),
    ctx.NapCatConfig.text('commandPrefix', '命令前缀', '球鳖', '可留空'),
    ctx.NapCatConfig.text('adminQqList', '管理员QQ(逗号分隔)', '', '控制命令权限'),
    ctx.NapCatConfig.text('roomsJson', '房间配置(JSON)', '[]', '[{"roomId":394988,"groupIds":[12345678]}]'),
    ctx.NapCatConfig.text('statePath', '状态文件路径', 'data/bilibili-live-push-state.json', ''),
  );

  try {
    if (ctx.configPath && fs.existsSync(ctx.configPath)) {
      const cfg = JSON.parse(fs.readFileSync(ctx.configPath, 'utf-8'));
      currentConfig = sanitizeConfig(cfg);
    }
  } catch (error) {
    logger?.warn('load config failed', error);
  }

  loadState();

  if (currentConfig.enabled) {
    await pollOnce();
    startPoller();
  }
};

export const plugin_onmessage = async (ctx, event) => {
  if (event.post_type !== EventType.MESSAGE) return;

  const raw = String(event.raw_message || '').replace(/\[CQ:[^\]]+\]/g, '').trim();
  if (!raw) return;

  const text = stripPrefix(raw);
  const norm = normalize(text);

  if (norm === 'b站推送状态' || norm === 'bilibili推送状态') {
    const rooms = parseRooms();
    const lines = [
      `B站推送：${currentConfig.enabled ? '已开启' : '已关闭'}`,
      `轮询：${currentConfig.pollSeconds}s`,
      `房间数：${rooms.length}`,
      `状态文件：${currentConfig.statePath}`,
    ];
    return sendMsg(ctx, event, lines.join('\n'));
  }

  if (!isAdmin(event.user_id)) return;

  if (norm === '开启b站推送' || norm === '开启bilibili推送') {
    currentConfig.enabled = true;
    startPoller();
    await pollOnce();
    return sendMsg(ctx, event, '已开启 B站开播推送');
  }

  if (norm === '关闭b站推送' || norm === '关闭bilibili推送') {
    currentConfig.enabled = false;
    stopPoller();
    return sendMsg(ctx, event, '已关闭 B站开播推送');
  }

  if (norm === '立即检查b站直播' || norm === '立即检查bilibili直播') {
    await pollOnce();
    return sendMsg(ctx, event, '已执行一次立即检查');
  }
};

export const plugin_get_config = async () => currentConfig;

export const plugin_set_config = async (ctx, cfg) => {
  currentConfig = sanitizeConfig(cfg);
  try {
    const dir = path.dirname(ctx.configPath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(ctx.configPath, JSON.stringify(currentConfig, null, 2), 'utf-8');
  } catch (error) {
    logger?.warn('save config failed', error);
  }

  if (currentConfig.enabled) {
    await pollOnce();
    startPoller();
  } else {
    stopPoller();
  }
};

export const plugin_on_config_change = async (ctx, ui, key, value, cur) => {
  currentConfig = sanitizeConfig(cur);
  if (currentConfig.enabled) {
    await pollOnce();
    startPoller();
  } else {
    stopPoller();
  }
};

export const plugin_onevent = async () => {};

export const plugin_cleanup = async () => {
  stopPoller();
};
