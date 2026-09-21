import axios from 'axios'
export function createAuthClient(baseURL, accounts, adapter) {
  const client = axios.create({baseURL, withCredentials:false, adapter})
  client.interceptors.request.use(async config => {
    Object.assign(config.headers, await (await accounts()).headers())
    return config
  })
  async function ensureProfile() {
    let rows=(await client.get('/timeforgeprofiles')).data
    if(rows[0])return rows[0]
    try {return (await client.post('/timeforgeprofiles',{payRate:null})).data}
    catch(error) {
      if(error.response?.status!==409)throw error
      rows=(await client.get('/timeforgeprofiles')).data
      if(!rows[0])throw error
      return rows[0]
    }
  }
  return {
    async login(data) {return {user:await (await accounts()).login(data.identifier,data.password)}},
    async updateProfile(data) {return (await accounts()).updateProfile(data)},
    async register(data) {return (await accounts()).register(data)},
    async logout() {return (await accounts()).logout()},
    async restoreUser() {
      const user = await (await accounts()).restore()
      if (!user) {const error=new Error('Sign in required');error.response={status:401};throw error}
      return user
    },
    async getUser() {return this.restoreUser()},
    async getTimeForgeProfile() {
      const profile=await ensureProfile()
      return {payRate:profile.payRate ?? null}
    },
    async updateTimeForgeProfile(payRate) {
      const profile=await ensureProfile()
      const response=await client.put('/timeforgeprofiles/'+encodeURIComponent(profile.id),{payRate})
      return {payRate:response.data.payRate ?? null}
    }
  }
}

export function authErrorMessage(error, fallback) {
  const data=error?.response?.data
  const message=data?.error?.message || data?.message?.[0]?.messages?.[0]?.message || data?.message
  return typeof message==='string' ? message : fallback
}
