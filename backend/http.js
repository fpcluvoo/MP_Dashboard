// Server-only. Run Node 24 with --use-env-proxy in the managed cloud.
export class ApiError extends Error {
  constructor(status) {super(`Provider request failed (${status})`);this.status=status;}
}
export class HttpTransport {
  constructor({fetchImpl=fetch,sleep=ms=>new Promise(r=>setTimeout(r,ms)),timeoutMs=30000,maxBytes=32*1024*1024}={}) {
    Object.assign(this,{fetchImpl,sleep,timeoutMs,maxBytes});
  }
  async bytes(url,{method='GET',headers={},body,attempts=method==='GET'?3:1}={}) {
    if(new URL(url).protocol!=='https:')throw new Error('HTTPS required');
    for(let attempt=0;attempt<attempts;attempt++) {
      let response;
      try {response=await this.fetchImpl(url,{method,headers,body,redirect:'error',signal:AbortSignal.timeout(this.timeoutMs)});}
      catch {if(attempt+1===attempts)throw new Error('Provider transport failed');await this.sleep(500*2**attempt);continue;}
      if([429,500,502,503,504].includes(response.status)&&attempt+1<attempts) {
        const retry=response.headers.get('retry-after');
        const ms=retry ? (/^\d+$/.test(retry)?Number(retry)*1000:Date.parse(retry)-Date.now()) : 500*2**attempt;
        await response.body?.cancel();await this.sleep(Math.min(60000,Math.max(0,Number.isFinite(ms)?ms:1000)));continue;
      }
      if(!response.ok){await response.body?.cancel();throw new ApiError(response.status);}
      const chunks=[];let length=0;
      for await(const chunk of response.body??[]) {length+=chunk.length;if(length>this.maxBytes){throw new Error('Provider response too large');}chunks.push(chunk);}
      return Buffer.concat(chunks);
    }
    throw new Error('Retry budget exhausted');
  }
  async json(url,options) {const bytes=await this.bytes(url,options);if(!bytes.length)return {};try{return JSON.parse(bytes);}catch{throw new Error('Invalid provider JSON');}}
}
