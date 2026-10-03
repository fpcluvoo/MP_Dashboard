import {createHmac} from 'node:crypto';
export function kauflandHeaders({clientKey,secretKey},method,url,body='',timestamp=Math.floor(Date.now()/1000)) {
  if(!clientKey||!secretKey)throw new Error('Kaufland credentials missing');
  return {'Shop-Client-Key':clientKey,'Shop-Timestamp':String(timestamp),'Shop-Signature':createHmac('sha256',secretKey).update([method,url,body,String(timestamp)].join('\n')).digest('hex'),'User-Agent':'MP-Dashboard/0.1'};
}
export class OAuthTokens {
  #cache;
  constructor({provider,clientId,clientSecret,refreshToken,scope,transport}) {Object.assign(this,{provider,clientId,clientSecret,refreshToken,scope,transport});}
  async get(force=false) {
    if(!force&&this.#cache?.expires>Date.now()+60000)return this.#cache.token;
    if(!this.clientId||!this.clientSecret)throw new Error('OAuth client credentials missing');
    const basic=this.provider==='ebay';
    const url=basic?'https://api.ebay.com/identity/v1/oauth2/token':this.provider==='otto'?'https://api.otto.market/v1/token':'https://api.amazon.com/auth/o2';
    const form=new URLSearchParams({grant_type:this.provider==='otto'?'client_credentials':'refresh_token'});
    if(this.provider!=='otto'){if(!this.refreshToken)throw new Error('Refresh token missing');form.set('refresh_token',this.refreshToken);}
    if(this.scope)form.set('scope',this.scope);
    const headers={'Content-Type':'application/x-www-form-urlencoded'};
    if(basic)headers.Authorization=`Basic ${Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64')}`;
    else {form.set('client_id',this.clientId);form.set('client_secret',this.clientSecret);}
    const result=await this.transport.json(url,{method:'POST',headers,body:form.toString(),attempts:1});
    if(!result.access_token||!Number.isFinite(result.expires_in))throw new Error('Invalid OAuth response');
    this.#cache={token:result.access_token,expires:Date.now()+result.expires_in*1000};return this.#cache.token;
  }
}
