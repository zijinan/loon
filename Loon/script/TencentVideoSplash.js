/*
 * Tencent Video ad response cleaner for Loon.
 *
 * Why this is conservative:
 * i.video.qq.com returns protobuf/binary data. Without Tencent's .proto schema,
 * deleting a field safely would require rebuilding length-delimited messages.
 * This script instead performs same-length byte replacements for known ad
 * markers/domains found in the capture, preserving binary offsets and sizes.
 */

(() => {
  const url = ($request && $request.url) || "";
  const host = getHost(url);
  const argument = typeof $argument === "string" ? $argument : "";
  const aggressive = /(?:^|[&,])aggressive=1(?:$|[&,])/.test(argument);
  const isResponse = typeof $response !== "undefined" && $response;

  try {
    if (!isResponse) {
      return handleRequest(url, host, aggressive);
    }

    if (isIaccHost(host)) {
      return finishResponse({
        status: 204,
        headers: emptyHeaders(),
        body: "",
      });
    }

    if (aggressive && host === "rdelivery.qq.com") {
      return finishResponse({
        status: 200,
        headers: jsonHeaders(),
        body: '{"code":0,"configs":[],"msg":"ok"}',
      });
    }

    const body = $response && $response.body;
    if (!body) return $done({});

    const isBinary = typeof body !== "string";
    const markers = [
      "AdFeedInfo",
      "AdFeedImagePoster",
      "view_ad_ssp",
      "pgdt.gtimg.cn",
      "gdt.qq.com",
      "l.qq.com",
      "adsplash",
      "ad_block_2",
      "_ad_insert_mix_block",
      "mod_adfeed",
      "ad_duration",
      "promotionTest",
      "ad_control_config_test",
      "ad.vipinfo",
      "ad.channel",
      "ad.userinfo",
      "film.video.qq.com",
      "yuanbao.tencent.com",
      "iwan.qq.com",
      "sample_rate",
    ];

    const text = isBinary ? asciiPreview(body) : body;
    if (!markers.some((marker) => text.includes(marker))) {
      return $done({});
    }

    if (isBinary) {
      const bytes = toUint8Array(body);
      let changed = 0;

      // Longer forms first; all replacements must be exactly the same length.
      changed += replaceAscii(bytes, "https://pgdt.gtimg.cn", "https://invalid.local");
      changed += replaceAscii(bytes, "http://pgdt.gtimg.cn", "http://invalid.local");
      changed += replaceAscii(bytes, "pgdt.gtimg.cn", "invalid.local");
      changed += replaceAscii(bytes, "gdt.qq.com", "nil.qq.com");
      changed += replaceAscii(bytes, "l.qq.com", "0.qq.com");
      changed += replaceAscii(bytes, "AdFeedImagePoster", "NoFeedImagePoster");
      changed += replaceAscii(bytes, "AdFeedInfo", "NoFeedInfo");
      changed += replaceAscii(bytes, "view_ad_ssp", "void_ad_ssp");
      changed += replaceAscii(bytes, "adsplash", "nosplash");
      changed += replaceAscii(bytes, "ad_block_2", "no_block_2");
      changed += replaceAscii(bytes, "_ad_insert_mix_block", "_no_insert_mix_block");
      changed += replaceAscii(bytes, "mod_adfeed", "mod_nofeed");
      changed += replaceAscii(bytes, "ad_focus", "no_focus");
      changed += replaceAscii(bytes, "ad_duration", "no_duration");
      changed += replaceAscii(bytes, "ad_reportkey", "no_reportkey");
      changed += replaceAscii(bytes, "ad_request_id", "no_request_id");
      changed += replaceAscii(bytes, "ad_group_id", "no_group_id");
      changed += replaceAscii(bytes, "ad_product_id", "no_product_id");
      changed += replaceAscii(bytes, "ad_card_type", "no_card_type");
      changed += replaceAscii(bytes, "ad_action_type", "no_action_type");
      changed += replaceAscii(bytes, "advertiser", "xvertiser0");
      changed += replaceAscii(bytes, "creative", "inactive");
      changed += replaceAscii(bytes, "qz_gdt", "qz_nil");
      changed += replaceAscii(bytes, "gdt_click.fcg", "nil_click.fcg");
      changed += replaceAscii(bytes, "gdt_report.fcg", "nil_report.fcg");
      changed += replaceAscii(bytes, "review.gdtimg.com", "invalid.invalidxx");
      changed += replaceAscii(bytes, "vfiles.gtimg.cn", "invalid.localxx");
      changed += replaceAscii(bytes, "wp.smvy.cn", "invalid.cn");
      changed += replaceAscii(bytes, "c3.ni0.qq.com", "c3.nil.qq.com");
      changed += replaceAscii(bytes, "promotionTest", "promotionNone");
      changed += replaceAscii(bytes, "ad_control_config_test", "no_control_config_test");
      changed += replaceAscii(bytes, "ad.vipinfo", "no.vipinfo");
      changed += replaceAscii(bytes, "ad.channel", "no.channel");
      changed += replaceAscii(bytes, "ad.userinfo", "no.userinfo");
      changed += replaceAscii(bytes, "film.video.qq.com", "null.video.qq.com");
      changed += replaceAscii(bytes, "yuanbao.tencent.com", "invalid.tencent.com");
      changed += replaceAscii(bytes, "iwan.qq.com", "null.qq.com");
      changed += replaceAscii(bytes, '"sample_rate":0.01', '"sample_rate":0.00');
      changed += replaceAscii(bytes, '"sample_rate":0.05', '"sample_rate":0.00');
      changed += replaceAscii(bytes, '"sample_rate":0.1', '"sample_rate":0.0');
      changed += replaceAscii(bytes, '"sample_rate":0.2', '"sample_rate":0.0');
      changed += replaceAscii(bytes, '"sample_rate":0.3', '"sample_rate":0.0');

      if (changed === 0) return $done({});
      return finishResponse({
        status: $response.status,
        headers: passHeaders($response.headers),
        body: bytes,
      });
    }

    let next = body;
    next = sameLengthReplace(next, "https://pgdt.gtimg.cn", "https://invalid.local");
    next = sameLengthReplace(next, "http://pgdt.gtimg.cn", "http://invalid.local");
    next = sameLengthReplace(next, "pgdt.gtimg.cn", "invalid.local");
    next = sameLengthReplace(next, "gdt.qq.com", "nil.qq.com");
    next = sameLengthReplace(next, "l.qq.com", "0.qq.com");
    next = sameLengthReplace(next, "AdFeedImagePoster", "NoFeedImagePoster");
    next = sameLengthReplace(next, "AdFeedInfo", "NoFeedInfo");
    next = sameLengthReplace(next, "view_ad_ssp", "void_ad_ssp");
    next = sameLengthReplace(next, "adsplash", "nosplash");
    next = sameLengthReplace(next, "ad_block_2", "no_block_2");
    next = sameLengthReplace(next, "_ad_insert_mix_block", "_no_insert_mix_block");
    next = sameLengthReplace(next, "mod_adfeed", "mod_nofeed");
    next = sameLengthReplace(next, "ad_focus", "no_focus");
    next = sameLengthReplace(next, "ad_duration", "no_duration");
    next = sameLengthReplace(next, "ad_reportkey", "no_reportkey");
    next = sameLengthReplace(next, "ad_request_id", "no_request_id");
    next = sameLengthReplace(next, "ad_group_id", "no_group_id");
    next = sameLengthReplace(next, "ad_product_id", "no_product_id");
    next = sameLengthReplace(next, "ad_card_type", "no_card_type");
    next = sameLengthReplace(next, "ad_action_type", "no_action_type");
    next = sameLengthReplace(next, "advertiser", "xvertiser0");
    next = sameLengthReplace(next, "creative", "inactive");
    next = sameLengthReplace(next, "qz_gdt", "qz_nil");
    next = sameLengthReplace(next, "gdt_click.fcg", "nil_click.fcg");
    next = sameLengthReplace(next, "gdt_report.fcg", "nil_report.fcg");
    next = sameLengthReplace(next, "review.gdtimg.com", "invalid.invalidxx");
    next = sameLengthReplace(next, "vfiles.gtimg.cn", "invalid.localxx");
    next = sameLengthReplace(next, "wp.smvy.cn", "invalid.cn");
    next = sameLengthReplace(next, "c3.ni0.qq.com", "c3.nil.qq.com");
    next = sameLengthReplace(next, "promotionTest", "promotionNone");
    next = sameLengthReplace(next, "ad_control_config_test", "no_control_config_test");
    next = sameLengthReplace(next, "ad.vipinfo", "no.vipinfo");
    next = sameLengthReplace(next, "ad.channel", "no.channel");
    next = sameLengthReplace(next, "ad.userinfo", "no.userinfo");
    next = sameLengthReplace(next, "film.video.qq.com", "null.video.qq.com");
    next = sameLengthReplace(next, "yuanbao.tencent.com", "invalid.tencent.com");
    next = sameLengthReplace(next, "iwan.qq.com", "null.qq.com");
    next = sameLengthReplace(next, '"sample_rate":0.01', '"sample_rate":0.00');
    next = sameLengthReplace(next, '"sample_rate":0.05', '"sample_rate":0.00');
    next = sameLengthReplace(next, '"sample_rate":0.1', '"sample_rate":0.0');
    next = sameLengthReplace(next, '"sample_rate":0.2', '"sample_rate":0.0');
    next = sameLengthReplace(next, '"sample_rate":0.3', '"sample_rate":0.0');

    if (next === body) return $done({});
    return finishResponse({
      status: $response.status,
      headers: passHeaders($response.headers),
      body: next,
    });
  } catch (error) {
    console.log(`[TencentVideoSplash] ${error && error.message ? error.message : error}`);
    return $done({});
  }
})();

function handleRequest(url, host, aggressive) {
  const body = $request && $request.body;

  if (isIaccHost(host)) {
    return finishRequestWithResponse({
      status: 204,
      headers: emptyHeaders(),
      body: "",
    });
  }

  if (host === "tv2.reachmax.cn") {
    return finishRequestWithResponse({
      status: 204,
      headers: emptyHeaders(),
      body: "",
    });
  }

  if (isStartupAssetUrl(host, url)) {
    return finishRequestWithResponse({
      status: 204,
      headers: emptyHeaders(),
      body: "",
    });
  }

  if (host === "rdelivery.qq.com") {
    const text = typeof body === "string" ? body : body ? asciiPreview(body) : "";
    if (aggressive || /splash|app_cold_launch|adsplash|ad_/i.test(text)) {
      return finishRequestWithResponse({
        status: 200,
        headers: jsonHeaders(),
        body: '{"code":0,"message":"suc","sampling_list":[],"max_batch_size":0,"report_delay":0}',
      });
    }
    return $done({});
  }

  if (host !== "i.video.qq.com" || !body) {
    return $done({});
  }

  const isBinary = typeof body !== "string";
  const text = isBinary ? asciiPreview(body) : body;
  const markers = [
    "AdRequestContextInfo",
    "view_ad_ssp",
    "reward_ad_ssp",
    "adService",
    "AccessPromotion",
  ];

  if (!markers.some((marker) => text.includes(marker))) {
    return $done({});
  }

  if (/reward_ad_ssp|GetFollowHeartRewardAdInfo|reward_free_mode/.test(text)) {
    return finishRequestWithResponse({
      status: 204,
      headers: emptyHeaders(),
      body: "",
    });
  }

  if (isBinary) {
    const bytes = toUint8Array(body);
    let changed = 0;
    changed += replaceAscii(bytes, "AdRequestContextInfo", "NoRequestContextInfo");
    changed += replaceAscii(bytes, "view_ad_ssp", "void_ad_ssp");
    changed += replaceAscii(bytes, "reward_ad_ssp", "reward_no_ssp");
    changed += replaceAscii(bytes, "adService", "noService");
    changed += replaceAscii(bytes, "AccessPromotion", "IgnorePromotion");

    if (changed === 0) return $done({});
    return $done({
      headers: passHeaders($request.headers),
      body: bytes,
    });
  }

  let next = body;
  next = sameLengthReplace(next, "AdRequestContextInfo", "NoRequestContextInfo");
  next = sameLengthReplace(next, "view_ad_ssp", "void_ad_ssp");
  next = sameLengthReplace(next, "reward_ad_ssp", "reward_no_ssp");
  next = sameLengthReplace(next, "adService", "noService");
  next = sameLengthReplace(next, "AccessPromotion", "IgnorePromotion");

  if (next === body) return $done({});
  return $done({
    headers: passHeaders($request.headers),
    body: next,
  });
}

function getHost(url) {
  const match = String(url).match(/^https?:\/\/([^/:?#]+)/i);
  return match ? match[1].toLowerCase() : "";
}

function isIaccHost(host) {
  return host === "iacc.qq.com" || host === "iacc.rec.qq.com";
}

function isStartupAssetUrl(host, url) {
  if (host !== "vfiles.gtimg.cn") return false;
  return /\/(?:wuji_dashboard\/xy\/starter|wupload\/xy\/(?:starter|promotionTest)|wupload\/ad_control_config_test)\//i.test(url);
}

function finishRequestWithResponse(response) {
  return $done({ response });
}

function finishResponse(response) {
  return $done(response);
}

function emptyHeaders() {
  return {
    "Cache-Control": "no-store",
    "Content-Type": "text/plain; charset=utf-8",
  };
}

function jsonHeaders() {
  return {
    "Cache-Control": "no-store",
    "Content-Type": "application/json; charset=utf-8",
  };
}

function passHeaders(headers) {
  const next = Object.assign({}, headers || {});
  delete next["content-length"];
  delete next["Content-Length"];
  return next;
}

function toUint8Array(body) {
  if (body instanceof Uint8Array) return body;
  return new Uint8Array(body);
}

function asciiPreview(body) {
  const bytes = toUint8Array(body);
  const chunkSize = 8192;
  let out = "";
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, Math.min(i + chunkSize, bytes.length));
    out += String.fromCharCode.apply(null, Array.from(chunk));
  }
  return out;
}

function replaceAscii(bytes, from, to) {
  if (from.length !== to.length) {
    throw new Error(`replacement length mismatch: ${from} -> ${to}`);
  }

  const source = asciiBytes(from);
  const target = asciiBytes(to);
  let count = 0;

  for (let i = 0; i <= bytes.length - source.length; i++) {
    let matched = true;
    for (let j = 0; j < source.length; j++) {
      if (bytes[i + j] !== source[j]) {
        matched = false;
        break;
      }
    }
    if (!matched) continue;

    for (let j = 0; j < target.length; j++) {
      bytes[i + j] = target[j];
    }
    count++;
    i += source.length - 1;
  }

  return count;
}

function asciiBytes(text) {
  const out = new Uint8Array(text.length);
  for (let i = 0; i < text.length; i++) {
    out[i] = text.charCodeAt(i) & 0xff;
  }
  return out;
}

function sameLengthReplace(text, from, to) {
  if (from.length !== to.length) {
    throw new Error(`replacement length mismatch: ${from} -> ${to}`);
  }
  return text.split(from).join(to);
}
