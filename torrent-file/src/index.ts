import bencode from 'bencode'
import _ from 'lodash'
import { BinaryLike, createHash, Hash } from 'crypto'

export interface TorrentInfoFileDictionary {
  length: number
  path: Buffer[]
}

export interface TorrentInfoDictionary {
  name: Buffer
  'piece length': number
  'pieces': Buffer
  files? : TorrentInfoFileDictionary[]
  length? : number
  private?: any
  [propName: string]: any
}

export interface TorrentFileDictionary {
  announce: Buffer
  info: TorrentInfoDictionary
  'announce-list'?: Buffer[]
  [propName: string]: any
}

export interface ContentFile {
  length: number
  path: string
}

export default class TorrentFile {
  dict: TorrentFileDictionary

  constructor (buffer: Buffer) {
    this.dict = bencode.decode(buffer)
  }

  /**
   * Get announce tracker's hostname.
   */
  getTrackerHost (): string {
    return new URL(this.dict.announce.toString('utf-8')).hostname
  }

  /**
   * Get suggested name to save the file (or directory) as.
   */
  getName (): string {
    return this.dict.info.name.toString('utf-8')
  }

  /**
   * Get content files from torrent metainfo.
   * @param sort sort files by path if true
   */
  getContentFiles (sort: boolean = false): ContentFile[] {
    const files: ContentFile[] = []
    if (this.dict.info.length !== undefined) {
      files.push({
        length: this.dict.info.length,
        path: this.dict.info.name.toString('utf-8')
      })
      return files
    }
    if (this.dict.info.files !== undefined) {
      for (const f of this.dict.info.files) {
        let filePath: string = this.dict.info.name.toString('utf-8')
        for (const fp of f.path) {
          filePath = filePath + '/' + fp.toString('utf-8')
        }
        files.push({
          length: f.length,
          path: filePath
        })
      }
    }
    return sort ? _.sortBy(files, ['path']) : files
  }

  /**
   * Get total content files size
   */
  getContentSize (): number {
    const files: ContentFile[] = this.getContentFiles()
    let size: number = 0
    for (const f of files) {
      size += f.length
    }
    return size
  }

  /**
   * Get all trackers
   */
  getTrackers (): string[] {
    const trackers = []
    if (this.dict['announce-list'] !== undefined) {
      for (const t of this.dict['announce-list']) {
        trackers.push(t.toString('utf-8'))
      }
    } else {
      trackers.push(this.dict.announce.toString('utf-8'))
    }
    return trackers
  }

  /**
   * Get info_hash defined in BEP 0003
   */
  getHash (): string {
    return sha1(bencode.encode(this.dict.info))
  }

  /**
   * Get 'clean' info_hash
   */
  getCleanHash (): string {
    const cleanInfo: TorrentInfoDictionary = { ...this.dict.info }
    const keepKeys: string[] = ['length', 'files', 'name', 'piece length', 'pieces']
    for (const key in cleanInfo) {
      if (keepKeys.indexOf(key) === -1) {
        delete cleanInfo[key]
      }
    }
    return sha1(bencode.encode(cleanInfo))
  }

  /**
   * Get sorted files hash
   */
  getFilesHash (): string {
    return sha1(bencode.encode(this.getContentFiles(true)))
  }
}

/**
 * Get sha1 of any content.
 * @param content any binary like content
 */
function sha1 (content: BinaryLike): string {
  const hash: Hash = createHash('sha1')
  hash.update(content)
  return hash.digest('hex')
}
