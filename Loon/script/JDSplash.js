/*
 * JD splash/ad cleaner for Loon.
 *
 * The 2026-05 capture shows two paths for the current splash ads:
 * 1. api.m.jd.com feature/config responses that keep launch ad modules enabled.
 * 2. full-screen m.360buyimg.com/mobilecms/s{width}x{height}_jfs images.
 */

(() => {
  const url = ($request && $request.url) || "";
  const host = getHost(url);
  const isResponse = typeof $response !== "undefined" && $response;

  try {
    if (!isResponse) {
      return handleRequest(url, host);
    }
    return handleResponse(url, host);
  } catch (error) {
    console.log(`[JDSplash] ${error && error.message ? error.message : error}`);
    return $done({});
  }
})();

function handleRequest(url, host) {
  if (host === "second-floor-pro.pf.jd.com") {
    return finishRequestWithResponse(blankHtmlResponse());
  }

  if (host === "m.360buyimg.com" && isFullScreenMobileCmsImage(url)) {
    return finishRequestWithResponse({
      status: 204,
      headers: emptyHeaders(),
      body: "",
    });
  }

  return $done({});
}

function handleResponse(url, host) {
  if (host === "second-floor-pro.pf.jd.com") {
    return $done(blankHtmlResponse());
  }

  if (host !== "api.m.jd.com") {
    return $done({});
  }

  const body = $response && $response.body;
  if (!body || typeof body !== "string") {
    return $done({});
  }

  let obj;
  try {
    obj = JSON.parse(body);
  } catch (_) {
    return $done({});
  }

  const functionId = getFunctionId(url, ($request && $request.body) || "");
  const before = JSON.stringify(obj);

  cleanDeliveryLayer(obj, functionId);
  cleanStartupResponse(obj, functionId);
  cleanStrategy(obj);
  cleanBasicConfig(obj);
  cleanWelcomeHome(obj);
  cleanTabHomeInfo(obj);
  cleanOrderAndProfile(obj);
  stripCommonAdFields(obj, functionId);

  const after = JSON.stringify(obj);
  if (after === before) {
    return $done({});
  }

  return $done({
    status: $response.status,
    headers: passHeaders($response.headers),
    body: after,
  });
}

function cleanDeliveryLayer(obj, functionId) {
  const id = String(functionId || "").toLowerCase();
  if (id !== "deliverlayer" && id !== "ordertrackbusiness") {
    return;
  }

  delete obj.bannerInfo;
}

function cleanStartupResponse(obj, functionId) {
  const id = String(functionId || "").toLowerCase();
  const looksLikeStartup =
    id === "start" ||
    id === "startup" ||
    (Array.isArray(obj.images) && ("showTimesDaily" in obj || "showTimes" in obj));

  if (!looksLikeStartup) {
    return;
  }

  if (Array.isArray(obj.images)) obj.images = [];
  if ("showTimesDaily" in obj) obj.showTimesDaily = 0;
  if ("showTimes" in obj) obj.showTimes = 0;
  if ("displayTime" in obj) obj.displayTime = 0;
  if ("countDown" in obj) obj.countDown = 0;
  if (obj.data && typeof obj.data === "object") {
    if (Array.isArray(obj.data.images)) obj.data.images = [];
    obj.data.showTimesDaily = 0;
    obj.data.showTimes = 0;
    obj.data.displayTime = 0;
  }
}

function cleanStrategy(obj) {
  const data = obj && obj.data;
  if (!data || typeof data !== "object") {
    return;
  }

  if (data.startupConfig && typeof data.startupConfig === "object") {
    data.startupConfig.enable = 0;
    data.startupConfig.frequency = 86400;
  }

  if (data.refresh && typeof data.refresh === "object") {
    data.refresh.enable = 0;
  }
}

function cleanBasicConfig(obj) {
  const data = obj && obj.data;
  if (!data || typeof data !== "object") {
    return;
  }

  if (data.LaunchOption && typeof data.LaunchOption === "object") {
    setIfPresent(data.LaunchOption, ["WillFinishedAdjsut", "On"], 0);
    setIfPresent(data.LaunchOption, ["LaunchMainSwitch", "launchEndLSWDT"], "0");
    setIfPresent(data.LaunchOption, ["LaunchMainSwitch", "LaunchAsyncSwitchIsOn"], "0");
    setIfPresent(data.LaunchOption, ["LaunchMainSwitch", "LaunchMainSwitchIsOn"], "0");
  }

  if (data.JDReact && data.JDReact.appLaunchSwitch) {
    setIfPresent(data.JDReact, ["appLaunchSwitch", "switch"], 0);
  }

  if (data.liveroom && data.liveroom.config) {
    setIfPresent(data.liveroom, ["config", "xViewShow"], "0");
  }

  if (data.JDAD) {
    data.JDAD = {};
  }
}

function cleanWelcomeHome(obj) {
  if (Array.isArray(obj.floorList)) {
    const blockedTypes = new Set([
      "bottomXview",
      "float",
      "photoCeiling",
      "ruleFloat",
      "searchIcon",
      "topRotate",
      "tabBarAtmosphere",
    ]);
    obj.floorList = obj.floorList.filter((item) => !blockedTypes.has(item && item.type));
  }

  if (Array.isArray(obj.webViewFloorList)) {
    obj.webViewFloorList = [];
  }

  delete obj.topBgImgBig;
  delete obj.roofTop;
}

function cleanTabHomeInfo(obj) {
  if (obj.result && typeof obj.result === "object") {
    delete obj.result.iconInfo;
    delete obj.result.roofTop;
  }
}

function cleanOrderAndProfile(obj) {
  const floorBlockList = new Set([
    "banner",
    "jdDeliveryBanner",
    "bannerFloor",
    "bpDynamicFloor",
    "plusFloor",
    "bigSaleFloor",
    "buyOften",
    "newAttentionCard",
    "newBigSaleFloor",
    "newStyleAttentionCard",
    "newsFloor",
    "noticeFloor",
    "recommendfloor",
  ]);

  pruneFloors(obj, floorBlockList);
  if (obj.others && typeof obj.others === "object") {
    pruneFloors(obj.others, floorBlockList);
  }
}

function pruneFloors(container, blocked) {
  if (!Array.isArray(container.floors)) return;

  container.floors = container.floors.filter((floor) => {
    const id = floor && (floor.mId || floor.type || floor.templateId);
    if (blocked.has(id)) return false;

    if (floor && floor.data && typeof floor.data === "object") {
      delete floor.data.commonPopup;
      delete floor.data.commonPopup_dynamic;
      delete floor.data.floatLayer;
      if (floor.mId === "virtualServiceCenter" && Array.isArray(floor.data.virtualServiceCenters)) {
        for (const item of floor.data.virtualServiceCenters) {
          if (Array.isArray(item.serviceList)) {
            item.serviceList = item.serviceList.filter((card) => !isFeaturedDealTitle(card && card.serviceTitle));
          }
        }
      }
      if (floor.mId === "customerServiceFloor") {
        delete floor.data.moreIcon;
        delete floor.data.moreIcon_dark;
        if ("moreText" in floor.data) floor.data.moreText = " ";
      }
      if (Array.isArray(floor.data.commonTips)) floor.data.commonTips = [];
      if (Array.isArray(floor.data.commonWindows)) floor.data.commonWindows = [];
      if (floor.data.commentRemindInfo && Array.isArray(floor.data.commentRemindInfo.infos)) {
        floor.data.commentRemindInfo.infos = [];
      }
      delete floor.data.newPlusBlackCard;
    }
    return true;
  });
}

function isFeaturedDealTitle(title) {
  if (typeof title !== "string") return false;
  return title.indexOf("\u7cbe\u9009\u7279\u60e0") >= 0;
}

function stripCommonAdFields(value, functionId) {
  const id = String(functionId || "").toLowerCase();
  const canPruneMore = /^(start|startup|welcomehome|gettabhomeinfo|deliverlayer|personinfobusiness|myorderinfo|ordertrackbusiness|basicconfig|strategy)$/.test(id);
  walk(value, (obj) => {
    for (const key of Object.keys(obj)) {
      const lower = key.toLowerCase();
      if (
        lower === "commonpopup" ||
        lower === "commonpopup_dynamic" ||
        lower === "floatlayer" ||
        lower === "webviewfloorlist" ||
        lower === "rooftop" ||
        lower === "xview" ||
        lower === "xviewshow"
      ) {
        delete obj[key];
        continue;
      }

      if (canPruneMore && /(^|_)(splash|startupad|launchad|advert|advertise|jzt|jdad)(_|$)/i.test(key)) {
        delete obj[key];
      }
    }
  });
}

function walk(value, visitor, seen) {
  if (!value || typeof value !== "object") return;
  const used = seen || [];
  if (used.indexOf(value) >= 0) return;
  used.push(value);
  visitor(value);
  for (const item of Object.values(value)) {
    walk(item, visitor, used);
  }
}

function isFullScreenMobileCmsImage(url) {
  const match = String(url).match(/\/mobilecms\/s(\d+)x(\d+)_jfs\//i);
  if (!match) return false;
  const width = Number(match[1]);
  const height = Number(match[2]);
  return width >= 700 && height >= 1200 && height / width > 1.75;
}

function getFunctionId(url, requestBody) {
  const fromUrl = String(url).match(/[?&]functionId=([^&]+)/);
  if (fromUrl) return safeDecode(fromUrl[1]);

  if (typeof requestBody === "string") {
    const fromBody = requestBody.match(/(?:^|&)functionId=([^&]+)/);
    if (fromBody) return safeDecode(fromBody[1]);
  }

  return "";
}

function getHost(url) {
  const match = String(url).match(/^https?:\/\/([^/:?#]+)/i);
  return match ? match[1].toLowerCase() : "";
}

function setIfPresent(obj, path, value) {
  let target = obj;
  for (let i = 0; i < path.length - 1; i++) {
    target = target && target[path[i]];
    if (!target || typeof target !== "object") return;
  }
  const last = path[path.length - 1];
  if (Object.prototype.hasOwnProperty.call(target, last)) {
    target[last] = value;
  }
}

function safeDecode(value) {
  try {
    return decodeURIComponent(String(value).replace(/\+/g, " "));
  } catch (_) {
    return String(value);
  }
}

function finishRequestWithResponse(response) {
  return $done({ response });
}

function blankHtmlResponse() {
  return {
    status: 200,
    headers: {
      "Cache-Control": "no-store",
      "Content-Type": "text/html; charset=utf-8",
    },
    body: "<!doctype html><html><head><meta name=\"viewport\" content=\"width=device-width,initial-scale=1\"></head><body></body></html>",
  };
}

function emptyHeaders() {
  return {
    "Cache-Control": "no-store",
    "Content-Type": "text/plain; charset=utf-8",
  };
}

function passHeaders(headers) {
  const next = Object.assign({}, headers || {});
  delete next["content-length"];
  delete next["Content-Length"];
  return next;
}
