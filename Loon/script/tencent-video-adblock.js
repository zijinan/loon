/* Tencent Video Loon low-cache v3 */
const url=(typeof $request!=="undefined"&&$request&&$request.url)||"";
const host=getHost(url);
const isResp=typeof $response!=="undefined"&&$response;

try{
  if(!isResp){
    if(extHost(host)||iaccHost(host)) return reply(204,"","text/plain");
    if(host==="rdelivery.qq.com") return reply(200,stub(),"application/json");
    if(host==="i.video.qq.com") return cleanReq();
    return $done({});
  }
  if(extHost(host)||iaccHost(host)) return finish({status:204,headers:hTxt(),body:""});
  if(host==="rdelivery.qq.com") return finish({status:200,headers:hJson(),body:stub()});
  if(host!=="i.video.qq.com") return $done({});
  const rt=textOf((typeof $request!=="undefined"&&$request&&$request.body)||null,160*1024);
  if(/trpc\.business_feeds\.video_ad_ssp_feeds|trpc\.reward_ad_ssp|trpc\.promotion\.adapter|GetPersonalCenterAdData|GetFloatActivity|adService/i.test(rt)){
    return finish({status:204,headers:hTxt(),body:""});
  }
  const body=$response&&$response.body;
  if(!body) return $done({});
  const pv=textOf(body,1200*1024);
  if(!/AdFeed|AdFocus|view_ad_ssp|video_ad_ssp|ServerAdFeeds|pgdt\.gtimg|adsmind\.gdtimg|review\.gdtimg|gdt\.qq|l\.qq|content_type_ad|whole_ad_type|ad_session_id|ad_reportkey|ad_control_config|advertiser|jetmobo|lipanwuxian|liulianglf|tanx|10086|广告/i.test(pv)) return $done({});
  return rewrite(body,false);
}catch(e){console.log("[TVVideo] "+(e&&e.message?e.message:e));$done({});}

function cleanReq(){
  const body=$request&&$request.body;
  if(!body) return $done({});
  const t=textOf(body,256*1024);
  if(!/AdRequestContextInfo|view_ad_ssp|reward_ad_ssp|reward_free_mode|GetFollowHeartRewardAdInfo|video_ad_ssp_feeds|ServerAdFeedsVideo|GetPersonalCenterAdData|adService|vip_ad_promotion|promotion\.adapter|AccessPromotion|GetFloatActivity|ad_screen|ad_type|ad_device_platform|ad_pos|ad_scene|ad_request_id|advertiser=|qz_gdt/i.test(t)) return $done({});
  return rewrite(body,true);
}

function reqPairs(){return [
["AdRequestContextInfo","NoRequestContextInfo"],["view_ad_ssp","void_ad_ssp"],["reward_ad_ssp","reward_no_ssp"],["reward_free_mode","reward_void_mode"],["GetFollowHeartRewardAdInfo","GetFollowHeartRewardNoInfo"],["video_ad_ssp_feeds","video_no_ssp_feeds"],["ServerAdFeedsVideo","ServerNoFeedsVideo"],["GetPersonalCenterAdData","GetPersonalCenterNoData"],["adService","noService"],["vip_ad_promotion","vip_no_promotion"],["promotion.adapter","promotion.invalid"],["GetFloatActivity","NilFloatActivity"],["AccessPromotion","IgnorePromotion"],["ad_screen","no_screen"],["ad_type","no_type"],["ad_device_platform","no_device_platform"],["ad_pos","no_pos"],["ad_scene","no_scene"],["ad_request_id","no_request_id"],["advertiser","xvertiser0"],["qz_gdt","qz_nil"]
];}
function respPairs(){return [
["https://pgdt.gtimg.cn","https://invalid.local"],["http://pgdt.gtimg.cn","http://invalid.local"],["v3.gdt.qq.com","invalid.local"],["c3.gdt.qq.com","invalid.local"],["vr.gdt.qq.com","invalid.local"],["nc.gdt.qq.com","invalid.local"],["pgdt.gtimg.cn","invalid.local"],["https://adsmind.gdtimg.com","https://invalid.invalidxx"],["http://adsmind.gdtimg.com","http://invalid.invalidxx"],["adsmind.gdtimg.com","invalid.invalidx"],["review.gdtimg.com","invalid.invalidxx"],["pgdt.ugdtimg.com","invalid.invalidx"],["qzs.gdtimg.com","invalid.local"],["gdt.qq.com","invalid.xx"],["c.l.qq.com","x.l.qq.com"],["l.qq.com","0.qq.com"],["sdkreport.e.qq.com","sdkblock.e.qq.comx"],["ef-dongfeng.tanx.com","ef-dongfeng.null.com"],["jetmobo.com","invalid.cn0"],["lipanwuxian.com","invalidsite.com"],["liulianglf.cn","invalidlf.cn0"],["wap-gd-10086","wap-no-10086"],
["AdFeedImagePoster","NoFeedImagePoster"],["AdFeedVideoPoster","NoFeedVideoPoster"],["AdFocusPoster","NoFocusPoster"],["AdFeedInfo","NoFeedInfo"],["view_ad_ssp","void_ad_ssp"],["video_ad_ssp_feeds","video_no_ssp_feeds"],["ServerAdFeedsVideo","ServerNoFeedsVideo"],["adsplash","nosplash"],["ad_block_2","no_block_2"],["_ad_insert_mix_block","_no_insert_mix_block"],["mod_adfeed","mod_nofeed"],
["content_type_ad","content_type_no"],["whole_ad_type","whole_no_type"],["ad_session_id","no_session_id"],["ad_vid","no_vid"],["ad_cast_type","no_cast_type"],["ad_pr_id","no_pr_id"],["ad_reportkey_fst","no_reportkey_fst"],["ad_playmode","no_playmode"],["ad_schedule_ability","no_schedule_ability"],["ad_trans_native","no_trans_native"],["ad_empty_reason","no_empty_reason"],["ad_is_fail","no_is_fail"],["ad_norms","no_norms"],["ad_interaction_type","no_interaction_type"],["ad_highlight","no_highlight"],["ad_flush_num","no_flush_num"],["ad_pr_type","no_pr_type"],["ad_is_bidding","no_is_bidding"],["ad_idx","no_idx"],["ad_id","no_id"],["ad_pos","no_pos"],["ad_scene","no_scene"],["ad_focus","no_focus"],["ad_duration","no_duration"],["ad_reportkey","no_reportkey"],["ad_request_id","no_request_id"],["ad_group_id","no_group_id"],["ad_product_id","no_product_id"],["ad_card_type","no_card_type"],["ad_action_type","no_action_type"],["ad_control_config","no_control_config"],["ad.vipinfo","no.vipinfo"],["ad.channel","no.channel"],["ad.userinfo","no.userinfo"],["advertiser","xvertiser0"],["creative","inactive"],["qz_gdt","qz_nil"],["gdt_click.fcg","nil_click.fcg"],["gdt_report.fcg","nil_report.fcg"],["gdt_stats.fcg","nil_stats.fcg"],
["广告","推荐"],["立即下载","稍后再看"],["了解详情","稍后再看"],["立即领取","稍后再看"]
];}
function rewrite(body,isReq){
  const pairs=isReq?reqPairs():respPairs();
  if(typeof body==="string"){
    let n=body,c=0;
    for(const p of pairs){const r=repStr(n,p[0],p[1]);n=r.v;c+=r.c;}
    if(!c) return $done({});
    if(isReq) return $done({headers:pass($request.headers),body:n});
    return finish({status:$response.status,headers:pass($response.headers),body:n});
  }
  const b=u8(body);let c=0;
  for(const p of pairs)c+=repBytes(b,p[0],p[1]);
  if(!c) return $done({});
  if(isReq) return $done({headers:pass($request.headers),body:b});
  return finish({status:$response.status,headers:pass($response.headers),body:b});
}
function extHost(h){return /(^|\.)(jetmobo\.com|lipanwuxian\.com|liulianglf\.cn|nil\.qq\.com)$/i.test(h)||h==="ef-dongfeng.tanx.com"||h==="sdkreport.e.qq.com"||h==="adsmind.gdtimg.com"||h==="review.gdtimg.com"||h==="c.l.qq.com";}
function iaccHost(h){return h==="iacc.qq.com"||h==="iacc.rec.qq.com";}
function stub(){return '{"code":0,"message":"suc","ret_code":0,"ret_msg":"success","configs":[],"sampling_list":[],"max_batch_size":0,"report_delay":0}';}
function getHost(s){const m=String(s).match(/^https?:\/\/([^/:?#]+)/i);return m?m[1].toLowerCase():"";}
function reply(status,body,ct){return $done({response:{status:status,headers:{"Cache-Control":"no-store, no-cache, must-revalidate","Content-Type":ct},body:body}});}
function finish(r){return $done(r);}
function hTxt(){return {"Cache-Control":"no-store, no-cache, must-revalidate","Content-Type":"text/plain; charset=utf-8"};}
function hJson(){return {"Cache-Control":"no-store, no-cache, must-revalidate","Content-Type":"application/json; charset=utf-8"};}
function pass(h){const x=Object.assign({},h||{});delete x["Content-Encoding"];delete x["content-encoding"];delete x["Content-Length"];delete x["content-length"];x["Cache-Control"]="no-store";return x;}
function textOf(input,max){if(!input)return"";if(typeof input==="string")return input.slice(0,max||input.length);const b=u8(input),lim=Math.min(b.length,max||b.length);let out="";for(let i=0;i<lim;i+=8192){out+=String.fromCharCode.apply(null,Array.from(b.subarray(i,Math.min(i+8192,lim))));}return out;}
function u8(input){if(input instanceof Uint8Array)return input;if(input instanceof ArrayBuffer)return new Uint8Array(input);if(input&&input.buffer instanceof ArrayBuffer)return new Uint8Array(input.buffer,input.byteOffset||0,input.byteLength||input.length);const s=String(input||"");const a=new Uint8Array(s.length);for(let i=0;i<s.length;i++)a[i]=s.charCodeAt(i)&255;return a;}
function enc(s){if(typeof TextEncoder!=="undefined")return new TextEncoder().encode(s);const e=unescape(encodeURIComponent(s));const a=new Uint8Array(e.length);for(let i=0;i<e.length;i++)a[i]=e.charCodeAt(i)&255;return a;}
function fit(f,t){const L=enc(f).length;let n=String(t);while(enc(n).length>L&&n.length>0)n=n.slice(0,-1);while(enc(n).length<L)n+="x";return n;}
function repStr(s,f,t){if(!f||s.indexOf(f)===-1)return{v:s,c:0};const p=s.split(f),r=fit(f,t);return{v:p.join(r),c:p.length-1};}
function repBytes(b,f,t){if(!f)return 0;const n=enc(f),r=enc(fit(f,t));if(n.length!==r.length||!n.length)return 0;let c=0;outer:for(let i=0;i<=b.length-n.length;i++){for(let j=0;j<n.length;j++){if(b[i+j]!==n[j])continue outer;}for(let j=0;j<r.length;j++)b[i+j]=r[j];c++;i+=n.length-1;}return c;}
