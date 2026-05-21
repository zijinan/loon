/*
 * Tencent Video adblock for Loon - conservative low-cache version.
 *
 * Design:
 * 1. External splash/H5 ad chains return tiny 204 responses instead of REJECT.
 * 2. i.video.qq.com is protobuf/binary, so this script only does same-length
 *    byte/string replacements for clear ad markers and domains.
 * 3. It does not touch video CDN, qpic, gtimg media, tc.qq.com, or vv.video.qq.com.
 */

const url = ($request && $request.url) || "";
const host = getHost(url);
const isResponse = typeof $response !== "undefined" && $response;

try {
  if (!isResponse) {
    if (isExternalAdHost(host)) {
      return doneResponse(204, "", "text/plain; charset=utf-8");
    }
    return $done({});
  }

  if (isExternalAdHost(host)) {
    return doneResponse(204, "", "text/plain; charset=utf-8");
  }

  if (host !== "i.video.qq.com") {
    return $done({});
  }

  const body = $response.body;
  if (!body) return $done({});

  const preview = typeof body === "string" ? body : asciiPreview(body, 900 * 1024);
  if (!isTencentVideoAdPayload(preview)) {
    return $done({});
  }

  const pairs = [
    ["https://pgdt.gtimg.cn", "https://invalid.local"],
    ["http://pgdt.gtimg.cn", "http://invalid.local"],
    ["pgdt.gtimg.cn", "invalid.local"],
    ["gdt.qq.com", "nil.qq.com"],
    ["sdkreport.e.qq.com", "sdkblock.e.qq.com"],
    ["ef-dongfeng.tanx.com", "ef-dongfeng.null.com"],
    ["jetmobo.com", "invalid.cn0"],
    ["lipanwuxian.com", "invalidsite.com"],
    ["liulianglf.cn", "invalidlf.cn0"],
    ["AdFeedImagePoster", "NoFeedImagePoster"],
    ["AdFeedVideoPoster", "NoFeedVideoPoster"],
    ["AdFocusPoster", "NoFocusPoster"],
    ["AdFeedInfo", "NoFeedInfo"],
    ["view_ad_ssp", "void_ad_ssp"],
    ["video_ad_ssp_feeds", "video_no_ssp_feeds"],
    ["ServerAdFeedsVideo", "ServerNoFeedsVideo"],
    ["adsplash", "nosplash"],
    ["ad_block_2", "no_block_2"],
    ["_ad_insert_mix_block", "_no_insert_mix_block"],
    ["mod_adfeed", "mod_nofeed"],
    ["ad_focus", "no_focus"],
    ["ad_duration", "no_duration"],
    ["ad_reportkey", "no_reportkey"],
    ["ad_request_id", "no_request_id"],
    ["ad_group_id", "no_group_id"],
    ["ad_product_id", "no_product_id"],
    ["ad_card_type", "no_card_type"],
    ["ad_action_type", "no_action_type"],
    ["ad_control_config", "no_control_config"],
    ["ad.vipinfo", "no.vipinfo"],
    ["ad.channel", "no.channel"],
    ["ad.userinfo", "no.userinfo"],
    ["advertiser", "xvertiser0"],
    ["creative", "inactive"],
    ["qz_gdt", "qz_nil"],
    ["gdt_click.fcg", "nil_click.fcg"],
    ["gdt_report.fcg", "nil_report.fcg"],
    ["元宝-腾讯全能AI助手", "腾讯视频会员权益权益"],
    ["立即下载", "稍后再看"],
    ["了解详情", "稍后再看"],
    ["广告", "推荐"]
  ];

  if (typeof body === "string") {
    let next = body;
    let changed = 0;
    for (const [from, to] of pairs) {
      const result = replaceAllSameLengthString(next, from, to);
      next = result.value;
      changed += result.count;
    }
    if (!changed) return $done({});
    return $done({
      status: $response.status,
      headers: passHeaders($response.headers),
      body: next
    });
  }

  const bytes = toUint8Array(body);
  let changed = 0;
  for (const [from, to] of pairs) {
    changed += replaceAllSameLengthBytes(bytes, from, to);
  }
  if (!changed) return $done({});
  return $done({
    status: $response.status,
    headers: passHeaders($response.headers),
    body: bytes
  });
} catch (err) {
  console.log("[TencentVideoAdblock] " + (err && err.message ? err.message : err));
  return $done({});
}

function getHost(input) {
  const m = String(input).match(/^https?:\/\/([^/:?#]+)/i);
  return m ? m[1].toLowerCase() : "";
}

function isExternalAdHost(h) {
  return /(^|\.)(jetmobo\.com|lipanwuxian\.com|liulianglf\.cn)$/i.test(h)
    || h === "ef-dongfeng.tanx.com"
    || h === "sdkreport.e.qq.com";
}

function isTencentVideoAdPayload(text) {
  return /广告|AdFeedInfo|AdFocusPoster|AdFeedImagePoster|AdFeedVideoPoster|view_ad_ssp|video_ad_ssp_feeds|ServerAdFeedsVideo|pgdt\.gtimg\.cn|gdt\.qq\.com|ad_control_config|advertiser|元宝-腾讯全能AI助手|jetmobo|lipanwuxian|liulianglf|tanx/i.test(text);
}

function doneResponse(status, body, contentType) {
  return $done({
    response: {
      status: status,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "no-store, no-cache, must-revalidate",
        "Pragma": "no-cache"
      },
      body: body
    }
  });
}

function passHeaders(headers) {
  const h = Object.assign({}, headers || {});
  delete h["Content-Encoding"];
  delete h["content-encoding"];
  delete h["Content-Length"];
  delete h["content-length"];
  h["Cache-Control"] = "no-store";
  return h;
}

function asciiPreview(input, maxLen) {
  const bytes = toUint8Array(input);
  const limit = Math.min(bytes.length, maxLen || bytes.length);
  let out = "";
  for (let i = 0; i < limit; i++) {
    const c = bytes[i];
    out += c >= 32 && c <= 126 ? String.fromCharCode(c) : " ";
  }
  return out;
}

function toUint8Array(input) {
  if (input instanceof Uint8Array) return input;
  if (input instanceof ArrayBuffer) return new Uint8Array(input);
  if (input && input.buffer instanceof ArrayBuffer) {
    return new Uint8Array(input.buffer, input.byteOffset || 0, input.byteLength || input.length);
  }
  const s = String(input || "");
  const arr = new Uint8Array(s.length);
  for (let i = 0; i < s.length; i++) arr[i] = s.charCodeAt(i) & 0xff;
  return arr;
}

function normalizeReplacement(from, to) {
  let r = String(to);
  if (r.length > from.length) return r.slice(0, from.length);
  while (r.length < from.length) r += "x";
  return r;
}

function replaceAllSameLengthString(input, from, to) {
  if (!from || input.indexOf(from) === -1) return { value: input, count: 0 };
  const rep = normalizeReplacement(from, to);
  const parts = input.split(from);
  return { value: parts.join(rep), count: parts.length - 1 };
}

function replaceAllSameLengthBytes(bytes, from, to) {
  if (!from) return 0;
  const needle = stringToBytes(from);
  const rep = stringToBytes(normalizeReplacement(from, to));
  let count = 0;
  outer: for (let i = 0; i <= bytes.length - needle.length; i++) {
    for (let j = 0; j < needle.length; j++) {
      if (bytes[i + j] !== needle[j]) continue outer;
    }
    for (let j = 0; j < rep.length; j++) bytes[i + j] = rep[j];
    count++;
    i += needle.length - 1;
  }
  return count;
}

function stringToBytes(str) {
  const out = new Uint8Array(str.length);
  for (let i = 0; i < str.length; i++) out[i] = str.charCodeAt(i) & 0xff;
  return out;
}
