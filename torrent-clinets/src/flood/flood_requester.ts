import axios, {
  AxiosRequestConfig,
  AxiosResponse
} from 'axios'
import FormData, { Stream } from 'form-data'
import { HttpsProxyAgent } from 'https-proxy-agent'
import {
  AddTorrentOptions,
  RequesterOptions
} from '../common'
import {
  FloodData,
  FloodTrafficData
} from './flood_data'

interface FloodAddTorrentPostData {
  tags: string,
  destination: string,
  isBasePath: 'true' | 'false',
  start: 'true' | 'false',
  fastResume: 'true' | 'false',
  torrents: Buffer | Stream
}

export default class FloodRequester {
  baseUrl: string
  username: string
  passwd: string
  cookie: string
  timeout: number
  proxy: string | undefined

  constructor (
    url: string,
    username: string,
    passwd: string,
    options: RequesterOptions = {}
  ) {
    if (url[url.length - 1] !== '/') {
      url += '/'
    }
    this.baseUrl = url
    this.username = username
    this.passwd = passwd
    this.timeout = options.timeout || 10000
    this.proxy = options.proxy
    this.cookie = ''
  }

  /**
   * Make http request to flood server.
   */
  private async _makeRequest (
    method: 'get' | 'post',
    path: string,
    data: any = {},
    type: 'json' | 'formData' = 'json'
  ): Promise<AxiosResponse<any>> {
    const headers: AxiosRequestConfig['headers'] = {}
    if (path[0] === '/') {
      path = path.substr(1)
    }
    headers.Cookie = this.cookie
    if (type === 'json') {
      headers['Content-Type'] = 'application/json'
    }
    if (type === 'formData') {
      const form = new FormData()
      for (const key in data) {
        form.append(key, data[key])
      }
      headers['Content-Type'] = form.getHeaders()['content-type']
      data = form
    }
    const requestConfig: AxiosRequestConfig = {
      url: this.baseUrl + path,
      method,
      data,
      withCredentials: true,
      headers,
      timeout: this.timeout
    }
    if (this.proxy) {
      if (new URL(this.baseUrl).protocol === 'https:') {
        const agent = new HttpsProxyAgent(this.proxy)
        requestConfig.httpsAgent = agent
      } else {
        const proxy = new URL(this.proxy)
        requestConfig.proxy = {
          host: proxy.hostname,
          port: parseInt(proxy.port)
        }
      }
    }
    return await axios.request(requestConfig)
  }

  /**
   * Login flood and get jwt token.
   */
  private async _auth (): Promise<void> {
    try {
      const res: AxiosResponse<any> = await this._makeRequest(
        'post',
        '/auth/authenticate',
        {
          username: this.username,
          password: this.passwd
        }
      )
      const headers: AxiosResponse['headers'] = res.headers
      this.cookie = headers['set-cookie'][0].split(';')[0]
    } catch (err) {
      if (
        err.response &&
        err.response.data.message === 'Failed login.'
      ) {
        throw new Error('Auth failed')
      } else {
        throw err
      }
    }
  }

  /**
   * Auto auth if request is unauthorized.
   */
  private async _makeAuthRequest (
    method: 'get' | 'post',
    path: string,
    data: any = {},
    type: 'json' | 'formData' = 'json'
  ): Promise<any> {
    let response: AxiosResponse<any>
    try {
      response = await this._makeRequest(method, path, data, type)
    } catch (err) {
      if (
        err.response &&
        err.response.data === 'Unauthorized'
      ) {
        await this._auth()
        response = await this._makeRequest(method, path, data, type)
      } else {
        throw err
      }
    }
    return response.data
  }

  /**
   * Check authrization
   */
  private async _isAuthrized (): Promise<boolean> {
    try {
      const res: AxiosResponse<any> = await this._makeRequest('get', '/auth/verify')
      return !!res.data
    } catch (err) {
      if (
        err.response &&
        err.response.data === 'Unauthorized'
      ) {
        return false
      } else {
        throw err
      }
    }
  }

  /**
   * get torrents status
   */
  async getTorrents (): Promise<FloodData> {
    return await this._makeAuthRequest('get', '/api/torrents')
  }

  /**
   * get traffic status
   */
  async getTraffic (): Promise<FloodTrafficData> {
    return await this._makeAuthRequest('get', '/api/traffic')
  }

  /**
   * add torrent, one by one
   */
  async addTorrentFile (
    torrentFile : Buffer | Stream,
    downloadPath: string,
    options: AddTorrentOptions = {}
  ): Promise<void> {
    const data: FloodAddTorrentPostData = {
      tags: options.tag || '',
      destination: downloadPath,
      isBasePath: 'false',
      start: options.startWhenAdded ? 'true' : 'false',
      fastResume: options.skipHashChecking ? 'true' : 'false',
      torrents: torrentFile
    }
    // the add torrent request won't response if the request is not authrized
    // so check it before making any request
    const isAuthrized = await this._isAuthrized()
    if (!isAuthrized) {
      await this._auth()
    }
    await this._makeRequest('post', '/api/client/add-files', data, 'formData')
  }

  /**
   * delete torrents
   */
  async deleteTorrents (
    hashes: string | string[],
    deleteData: boolean = false
  ): Promise<void> {
    if (typeof hashes === 'string') {
      hashes = [hashes]
    }
    const data = {
      deleteData,
      hash: hashes
    }
    await this._makeAuthRequest('post', '/api/client/torrents/delete', data)
  }
}
