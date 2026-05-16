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

  try {
    if (isIaccHost(host)) {
      return blockEmpty("blocked iacc ad endpoint");
    }

    if (aggressive && host === "rdelivery.qq.com") {
      return $done({
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

      if (changed === 0) return $done({});
      return $done({
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

    if (next === body) return $done({});
    return $done({
      status: $response.status,
      headers: passHeaders($response.headers),
      body: next,
    });
  } catch (error) {
    console.log(`[TencentVideoSplash] ${error && error.message ? error.message : error}`);
    return $done({});
  }
})();

function getHost(url) {
  const match = String(url).match(/^https?:\/\/([^/:?#]+)/i);
  return match ? match[1].toLowerCase() : "";
}

function isIaccHost(host) {
  return host === "iacc.qq.com" || host === "iacc.rec.qq.com";
}

function blockEmpty(reason) {
  console.log(`[TencentVideoSplash] ${reason}`);
  return $done({
    status: 204,
    headers: {
      "Cache-Control": "no-store",
      "Content-Type": "text/plain; charset=utf-8",
    },
    body: "",
  });
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
