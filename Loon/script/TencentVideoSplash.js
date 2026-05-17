/*
 * Tencent Video ad response cleaner for Loon.
 *
 * Why this is conservative:
 * i.video.qq.com returns protobuf/binary data. Without Tencent's .proto schema,
 * deleting a field safely would require rebuilding length-delimited messages.
 * This script instead performs same-length byte replacements for known ad
 * markers/domains found in the capture, preserving binary offsets and sizes.
 */

const STARTUP_PACKAGE_ZIPS = {
  "916b4000": "UEsDBBQAAAAAAAAAIVg9s7p0bAAAAGwAAAAJAAAAaG9tZS5qc29ueyJ2IjoiNS43LjUiLCJmciI6NjAsImlwIjowLCJvcCI6MSwidyI6MTMyLCJoIjoxMzIsIm5tIjoiaG9tZSIsImRkZCI6MCwiYXNzZXRzIjpbXSwibGF5ZXJzIjpbXSwibWFya2VycyI6W119UEsBAhQAFAAAAAAAAAAhWD2zunRsAAAAbAAAAAkAAAAAAAAAAAAAAAAAAAAAAGhvbWUuanNvblBLBQYAAAAAAQABADcAAACTAAAAAAA=",
  "cd5bd9cc": "UEsDBBQAAAAAAAAAIVjnx8yAcAAAAHAAAAANAAAAaG9tZURhcmsuanNvbnsidiI6IjUuNy41IiwiZnIiOjYwLCJpcCI6MCwib3AiOjEsInciOjEzMiwiaCI6MTMyLCJubSI6ImhvbWVEYXJrIiwiZGRkIjowLCJhc3NldHMiOltdLCJsYXllcnMiOltdLCJtYXJrZXJzIjpbXX1QSwECFAAUAAAAAAAAACFY58fMgHAAAABwAAAADQAAAAAAAAAAAAAAAAAAAAAAaG9tZURhcmsuanNvblBLBQYAAAAAAQABADsAAACbAAAAAAA=",
  "28261b7e": "UEsDBBQAAAAAAAAAIVhrvDzmbgAAAG4AAAALAAAAQXBwZWFyLmpzb257InYiOiI1LjcuNSIsImZyIjo2MCwiaXAiOjAsIm9wIjoxLCJ3IjoxMzIsImgiOjEzMiwibm0iOiJBcHBlYXIiLCJkZGQiOjAsImFzc2V0cyI6W10sImxheWVycyI6W10sIm1hcmtlcnMiOltdfVBLAQIUABQAAAAAAAAAIVhrvDzmbgAAAG4AAAALAAAAAAAAAAAAAAAAAAAAAABBcHBlYXIuanNvblBLBQYAAAAAAQABADkAAACXAAAAAAA=",
  "4a9e6fa5": "UEsDBBQAAAAAAAAAIVjCAPjDcQAAAHEAAAAOAAAARGlzYXBwZWFyLmpzb257InYiOiI1LjcuNSIsImZyIjo2MCwiaXAiOjAsIm9wIjoxLCJ3IjoxMzIsImgiOjEzMiwibm0iOiJEaXNhcHBlYXIiLCJkZGQiOjAsImFzc2V0cyI6W10sImxheWVycyI6W10sIm1hcmtlcnMiOltdfVBLAQIUABQAAAAAAAAAIVjCAPjDcQAAAHEAAAAOAAAAAAAAAAAAAAAAAAAAAABEaXNhcHBlYXIuanNvblBLBQYAAAAAAQABADwAAACdAAAAAAA=",
  "76bb0627": "UEsDBBQAAAAAAAAAIVgBHS4WcgAAAHIAAAAPAAAAQXBwZWFyRGFyay5qc29ueyJ2IjoiNS43LjUiLCJmciI6NjAsImlwIjowLCJvcCI6MSwidyI6MTMyLCJoIjoxMzIsIm5tIjoiQXBwZWFyRGFyayIsImRkZCI6MCwiYXNzZXRzIjpbXSwibGF5ZXJzIjpbXSwibWFya2VycyI6W119UEsBAhQAFAAAAAAAAAAhWAEdLhZyAAAAcgAAAA8AAAAAAAAAAAAAAAAAAAAAAEFwcGVhckRhcmsuanNvblBLBQYAAAAAAQABAD0AAACfAAAAAAA=",
  "cb6a29c3": "UEsDBBQAAAAAAAAAIVj3ipsOdQAAAHUAAAASAAAARGlzYXBwZWFyRGFyay5qc29ueyJ2IjoiNS43LjUiLCJmciI6NjAsImlwIjowLCJvcCI6MSwidyI6MTMyLCJoIjoxMzIsIm5tIjoiRGlzYXBwZWFyRGFyayIsImRkZCI6MCwiYXNzZXRzIjpbXSwibGF5ZXJzIjpbXSwibWFya2VycyI6W119UEsBAhQAFAAAAAAAAAAhWPeKmw51AAAAdQAAABIAAAAAAAAAAAAAAAAAAAAAAERpc2FwcGVhckRhcmsuanNvblBLBQYAAAAAAQABAEAAAAClAAAAAAA=",
  "d4d87610": "UEsDBBQAAAAAAAAAIVjXo53XbQAAAG0AAAAKAAAAc2hvcnQuanNvbnsidiI6IjUuNy41IiwiZnIiOjYwLCJpcCI6MCwib3AiOjEsInciOjEzMiwiaCI6MTMyLCJubSI6InNob3J0IiwiZGRkIjowLCJhc3NldHMiOltdLCJsYXllcnMiOltdLCJtYXJrZXJzIjpbXX1QSwECFAAUAAAAAAAAACFY16Od120AAABtAAAACgAAAAAAAAAAAAAAAAAAAAAAc2hvcnQuanNvblBLBQYAAAAAAQABADgAAACVAAAAAAA=",
  "51438c43": "UEsDBBQAAAAAAAAAIVj8hTKwcQAAAHEAAAAOAAAAc2hvcnREYXJrLmpzb257InYiOiI1LjcuNSIsImZyIjo2MCwiaXAiOjAsIm9wIjoxLCJ3IjoxMzIsImgiOjEzMiwibm0iOiJzaG9ydERhcmsiLCJkZGQiOjAsImFzc2V0cyI6W10sImxheWVycyI6W10sIm1hcmtlcnMiOltdfVBLAQIUABQAAAAAAAAAIVj8hTKwcQAAAHEAAAAOAAAAAAAAAAAAAAAAAAAAAABzaG9ydERhcmsuanNvblBLBQYAAAAAAQABADwAAACdAAAAAAA=",
  "285a9c62": "UEsDBBQAAAAAAAAAIVhzWcgodwAAAHcAAAAUAAAAcmVjb21tZW5kX2xpZ2h0Lmpzb257InYiOiI1LjcuNSIsImZyIjo2MCwiaXAiOjAsIm9wIjoxLCJ3IjoxMzIsImgiOjEzMiwibm0iOiJyZWNvbW1lbmRfbGlnaHQiLCJkZGQiOjAsImFzc2V0cyI6W10sImxheWVycyI6W10sIm1hcmtlcnMiOltdfVBLAQIUABQAAAAAAAAAIVhzWcgodwAAAHcAAAAUAAAAAAAAAAAAAAAAAAAAAAByZWNvbW1lbmRfbGlnaHQuanNvblBLBQYAAAAAAQABAEIAAACpAAAAAAA=",
  "fd3fb8d1": "UEsDBBQAAAAAAAAAIVgEgNl3dgAAAHYAAAATAAAAcmVjb21tZW5kX2RhcmsuanNvbnsidiI6IjUuNy41IiwiZnIiOjYwLCJpcCI6MCwib3AiOjEsInciOjEzMiwiaCI6MTMyLCJubSI6InJlY29tbWVuZF9kYXJrIiwiZGRkIjowLCJhc3NldHMiOltdLCJsYXllcnMiOltdLCJtYXJrZXJzIjpbXX1QSwECFAAUAAAAAAAAACFYBIDZd3YAAAB2AAAAEwAAAAAAAAAAAAAAAAAAAAAAcmVjb21tZW5kX2RhcmsuanNvblBLBQYAAAAAAQABAEEAAACnAAAAAAA=",
  "414088c0": "UEsDBBQAAAAAAAAAIVj8HGkRagAAAGoAAAAHAAAAbWUuanNvbnsidiI6IjUuNy41IiwiZnIiOjYwLCJpcCI6MCwib3AiOjEsInciOjEzMiwiaCI6MTMyLCJubSI6Im1lIiwiZGRkIjowLCJhc3NldHMiOltdLCJsYXllcnMiOltdLCJtYXJrZXJzIjpbXX1QSwECFAAUAAAAAAAAACFY/BxpEWoAAABqAAAABwAAAAAAAAAAAAAAAAAAAAAAbWUuanNvblBLBQYAAAAAAQABADUAAACPAAAAAAA=",
  "ef06d34b": "UEsDBBQAAAAAAAAAIVjSV9QLbgAAAG4AAAALAAAAbWVEYXJrLmpzb257InYiOiI1LjcuNSIsImZyIjo2MCwiaXAiOjAsIm9wIjoxLCJ3IjoxMzIsImgiOjEzMiwibm0iOiJtZURhcmsiLCJkZGQiOjAsImFzc2V0cyI6W10sImxheWVycyI6W10sIm1hcmtlcnMiOltdfVBLAQIUABQAAAAAAAAAIVjSV9QLbgAAAG4AAAALAAAAAAAAAAAAAAAAAAAAAABtZURhcmsuanNvblBLBQYAAAAAAQABADkAAACXAAAAAAA=",
  default: "UEsDBBQAAAAAAAAAIVgw4GTcbQAAAG0AAAAKAAAAYmxhbmsuanNvbnsidiI6IjUuNy41IiwiZnIiOjYwLCJpcCI6MCwib3AiOjEsInciOjEzMiwiaCI6MTMyLCJubSI6ImJsYW5rIiwiZGRkIjowLCJhc3NldHMiOltdLCJsYXllcnMiOltdLCJtYXJrZXJzIjpbXX1QSwECFAAUAAAAAAAAACFYMOBk3G0AAABtAAAACgAAAAAAAAAAAAAAAAAAAAAAYmxhbmsuanNvblBLBQYAAAAAAQABADgAAACVAAAAAAA=",
};

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
    const text = isBinary ? asciiPreview(body) : body;
    const requestText = getRequestText();
    const isExplicitAd = isExplicitAdRequest(requestText);

    if (host === "ilive.qq.com" && /\/cgi-bin\/general\/platform_config\/pull_config/i.test(url) && /preload_switch_ios/i.test(text)) {
      return finishResponse({
        status: $response.status,
        headers: passHeaders($response.headers),
        body: disablePreloadSwitch(text),
      });
    }

    if (isHardAdResponse(host, text, isExplicitAd)) {
      return finishResponse({
        status: 204,
        headers: emptyHeaders(),
        body: "",
      });
    }

    const markers = [
      "AdFeedInfo",
      "AdFeedImagePoster",
      "AdFeedVideoPoster",
      "view_ad_ssp",
      "video_ad_ssp_feeds",
      "ServerAdFeedsVideo",
      "video/splash",
      "pgdt.gtimg.cn",
      "gdt.qq.com",
      "gdt_stats.fcg",
      "gdt_click.fcg",
      "gdt_report.fcg",
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
      "wuji_dashboard/xy/starter",
      "wupload/xy/starter",
      "film.video.qq.com",
      "yuanbao.tencent.com",
      "iwan.qq.com",
      "sample_rate",
      "ad_type",
      "ad_device_platform",
    ];

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
      changed += replaceAscii(bytes, "AdFeedVideoPoster", "NoFeedVideoPoster");
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
      changed += replaceAscii(bytes, "wp.smvy.cn", "invalid.cn");
      changed += replaceAscii(bytes, "c3.ni0.qq.com", "c3.nil.qq.com");
      changed += replaceAscii(bytes, "promotionTest", "promotionNone");
      changed += replaceAscii(bytes, "ad_control_config_test", "no_control_config_test");
      changed += replaceAscii(bytes, "ad.vipinfo", "no.vipinfo");
      changed += replaceAscii(bytes, "ad.channel", "no.channel");
      changed += replaceAscii(bytes, "ad.userinfo", "no.userinfo");
      changed += replaceAscii(bytes, "wuji_dashboard/xy/starter", "wuji_dashboard/xy/blocked");
      changed += replaceAscii(bytes, "wupload/xy/starter", "wupload/xy/blocked");
      changed += replaceAscii(bytes, "vip.vip_area_level_opration", "nil.vip_area_level_opration");
      changed += replaceAscii(bytes, "film.video.qq.com", "null.video.qq.com");
      changed += replaceAscii(bytes, "yuanbao.tencent.com", "invalid.tencent.com");
      changed += replaceAscii(bytes, "iwan.qq.com", "null.qq.com");
      changed += replaceAscii(bytes, "ad_type", "no_type");
      changed += replaceAscii(bytes, "ad_device_platform", "no_device_platform");
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
    next = sameLengthReplace(next, "AdFeedVideoPoster", "NoFeedVideoPoster");
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
    next = sameLengthReplace(next, "wp.smvy.cn", "invalid.cn");
    next = sameLengthReplace(next, "c3.ni0.qq.com", "c3.nil.qq.com");
    next = sameLengthReplace(next, "promotionTest", "promotionNone");
    next = sameLengthReplace(next, "ad_control_config_test", "no_control_config_test");
    next = sameLengthReplace(next, "ad.vipinfo", "no.vipinfo");
    next = sameLengthReplace(next, "ad.channel", "no.channel");
    next = sameLengthReplace(next, "ad.userinfo", "no.userinfo");
    next = sameLengthReplace(next, "wuji_dashboard/xy/starter", "wuji_dashboard/xy/blocked");
    next = sameLengthReplace(next, "wupload/xy/starter", "wupload/xy/blocked");
    next = sameLengthReplace(next, "vip.vip_area_level_opration", "nil.vip_area_level_opration");
    next = sameLengthReplace(next, "film.video.qq.com", "null.video.qq.com");
    next = sameLengthReplace(next, "yuanbao.tencent.com", "invalid.tencent.com");
    next = sameLengthReplace(next, "iwan.qq.com", "null.qq.com");
    next = sameLengthReplace(next, "ad_type", "no_type");
    next = sameLengthReplace(next, "ad_device_platform", "no_device_platform");
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

  if (isStartupPackageUrl(host, url)) {
    const packageBody = startupPackageBody(url);
    return finishRequestWithResponse({
      status: 200,
      headers: zipHeaders(packageBody.length),
      body: packageBody,
    });
  }

  if (isStartupAssetUrl(host, url)) {
    return finishRequestWithResponse({
      status: 200,
      headers: gifHeaders(),
      body: transparentGifBody(),
    });
  }

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

  if (isSplashVideoAssetUrl(host, url)) {
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

  if (!isExplicitAdRequest(text)) {
    return $done({});
  }

  if (isBinary) {
    const bytes = toUint8Array(body);
    let changed = 0;
    changed += replaceAscii(bytes, "AdRequestContextInfo", "NoRequestContextInfo");
    changed += replaceAscii(bytes, "view_ad_ssp", "void_ad_ssp");
    changed += replaceAscii(bytes, "reward_ad_ssp", "reward_no_ssp");
    changed += replaceAscii(bytes, "reward_free_mode", "reward_void_mode");
    changed += replaceAscii(bytes, "GetFollowHeartRewardAdInfo", "GetFollowHeartRewardNoInfo");
    changed += replaceAscii(bytes, "video_ad_ssp_feeds", "video_no_ssp_feeds");
    changed += replaceAscii(bytes, "ServerAdFeedsVideo", "ServerNoFeedsVideo");
    changed += replaceAscii(bytes, "GetPersonalCenterAdData", "GetPersonalCenterNoData");
    changed += replaceAscii(bytes, "adService", "noService");
    changed += replaceAscii(bytes, "vip_ad_promotion", "vip_no_promotion");
    changed += replaceAscii(bytes, "promotion.adapter", "promotion.invalid");
    changed += replaceAscii(bytes, "GetFloatActivity", "NilFloatActivity");
    changed += replaceAscii(bytes, "AccessPromotion", "IgnorePromotion");
    changed += replaceAscii(bytes, "ad_screen", "no_screen");
    changed += replaceAscii(bytes, "ad_type", "no_type");
    changed += replaceAscii(bytes, "ad_device_platform", "no_device_platform");

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
  next = sameLengthReplace(next, "reward_free_mode", "reward_void_mode");
  next = sameLengthReplace(next, "GetFollowHeartRewardAdInfo", "GetFollowHeartRewardNoInfo");
  next = sameLengthReplace(next, "video_ad_ssp_feeds", "video_no_ssp_feeds");
  next = sameLengthReplace(next, "ServerAdFeedsVideo", "ServerNoFeedsVideo");
  next = sameLengthReplace(next, "GetPersonalCenterAdData", "GetPersonalCenterNoData");
  next = sameLengthReplace(next, "adService", "noService");
  next = sameLengthReplace(next, "vip_ad_promotion", "vip_no_promotion");
  next = sameLengthReplace(next, "promotion.adapter", "promotion.invalid");
  next = sameLengthReplace(next, "GetFloatActivity", "NilFloatActivity");
  next = sameLengthReplace(next, "AccessPromotion", "IgnorePromotion");
  next = sameLengthReplace(next, "ad_screen", "no_screen");
  next = sameLengthReplace(next, "ad_type", "no_type");
  next = sameLengthReplace(next, "ad_device_platform", "no_device_platform");

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
  if (!/^(?:vfiles\.gtimg\.cn|wfiles\.gtimg\.cn|vip\.image\.video\.qpic\.cn|invalid\.localxx)$/i.test(host)) {
    return false;
  }
  return /\/(?:wuji_dashboard\/xy\/(?:starter|blocked)|wupload\/xy\/(?:starter|blocked|promotionTest|promotionNone|universal)|wupload\/ad_control_config_test|wupload\/vip\.vip_area_level_opration(?:_test)?)(?:\/|$)/i.test(url);
}

function isStartupPackageUrl(host, url) {
  if (!/^(?:vfiles\.gtimg\.cn|wfiles\.gtimg\.cn|invalid\.localxx)$/i.test(host)) {
    return false;
  }
  return /\/wuji_dashboard\/xy\/(?:starter|blocked)\/[^/?#]+\.zip(?:[?#]|$)/i.test(url);
}

function isSplashVideoAssetUrl(host, url) {
  if (host !== "ugchsy.gtimg.com") return false;
  return /\/gzc_1000127_[^/?#]+\.f10201\.mp4(?:[?#]|$)/i.test(url);
}

function startupPackageBody(url) {
  const match = String(url).match(/\/([0-9a-f]{8})\.zip(?:[?#]|$)/i);
  const key = match ? match[1].toLowerCase() : "default";
  return base64ToBinary(STARTUP_PACKAGE_ZIPS[key] || STARTUP_PACKAGE_ZIPS.default);
}

function getRequestText() {
  const body = $request && $request.body;
  if (!body) return "";
  return typeof body === "string" ? body : asciiPreview(body);
}

function isExplicitAdRequest(text) {
  return /reward_ad_ssp|reward_no_ssp|GetFollowHeartReward(?:Ad|No)Info|reward_(?:free|void)_mode|video_(?:ad|no)_ssp_feeds|Server(?:Ad|No)FeedsVideo|GetPersonalCenter(?:Ad|No)Data|vip_(?:ad|no)_promotion|AccessPromotion|IgnorePromotion|GetFloatActivity|NilFloatActivity|trpc\.promotion\.(?:adapter|invalid)|(?:ad|no)Service/i.test(text);
}

function isHardAdResponse(host, text, isExplicitAd) {
  if (host !== "i.video.qq.com" || !isExplicitAd) return false;
  return /view_ad_ssp|video_ad_ssp_feeds|ServerAdFeedsVideo|AdFeedInfo|AdFeedImagePoster|AdFeedVideoPoster|video\/splash|pgdt\.gtimg\.cn|gdt_(?:stats|click|report)\.fcg|nc\.gdt\.qq\.com|vr\.gdt\.qq\.com|c3\.gdt\.qq\.com|v3\.gdt\.qq\.com|adsplash|vip_ad_promotion|ad\.vipinfo|ad\.userinfo|yuanbao\.tencent\.com|GetFloatActivity/i.test(text);
}

function disablePreloadSwitch(text) {
  try {
    const data = JSON.parse(text);
    const items = data && data.datas && Array.isArray(data.datas.items) ? data.datas.items : [];
    items.forEach((item) => {
      if (item && item.key === "preload_switch_ios") {
        item.value = "0";
        item.version = "";
        item.version_id = "0";
        item.version_name = "";
      }
    });
    return JSON.stringify(data);
  } catch (_) {
    return String(text).replace(/("key"\s*:\s*"preload_switch_ios"[\s\S]{0,240}?"value"\s*:\s*)"[^"]*"/g, '$1"0"');
  }
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

function gifHeaders() {
  return {
    "Cache-Control": "no-store",
    "Content-Type": "image/gif",
  };
}

function zipHeaders(length) {
  return {
    "Accept-Ranges": "bytes",
    "Cache-Control": "public, max-age=31536000",
    "Content-Length": String(length),
    "Content-Type": "application/zip",
    "ETag": '"tencent-video-blank-startup-package"',
    "Last-Modified": "Mon, 01 Jan 2024 00:00:00 GMT",
  };
}

function transparentGifBody() {
  return "GIF89a\x01\x00\x01\x00\x80\x00\x00\x00\x00\x00\x00\x00\x00!\xF9\x04\x01\x00\x00\x00\x00,\x00\x00\x00\x00\x01\x00\x01\x00\x00\x02\x02D\x01\x00;";
}

function base64ToBinary(input) {
  if (typeof atob === "function") return atob(input);

  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
  let buffer = 0;
  let bits = 0;
  let out = "";

  for (let i = 0; i < input.length; i++) {
    const ch = input.charAt(i);
    if (ch === "=") break;
    const value = chars.indexOf(ch);
    if (value < 0) continue;
    buffer = (buffer << 6) | value;
    bits += 6;
    if (bits >= 8) {
      bits -= 8;
      out += String.fromCharCode((buffer >> bits) & 0xff);
    }
  }

  return out;
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
