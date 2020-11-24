export interface FloodTorrentData {
  hash: string,
  name: string,
  message: string,
  state: string,
  isStateChanged: boolean,
  isActive: boolean,
  isComplete: boolean,
  isHashChecking: boolean,
  isOpen: boolean,
  priority: string,
  upRate: number,
  upTotal: number,
  downRate: number,
  downTotal: number,
  ratio: number,
  bytesDone: number,
  sizeBytes: number,
  peersConnected: number,
  directory: string,
  basePath: string,
  baseFilename: string,
  baseDirectory: string,
  seedingTime: string,
  dateAdded: string,
  dateCreated: string,
  throttleName: string,
  isMultiFile: boolean,
  isPrivate: boolean,
  tags: string[],
  comment: string,
  ignoreScheduler: boolean,
  trackerURIs: string[],
  seedsConnected: number,
  seedsTotal: number,
  peersTotal: number,
  status: string[],
  percentComplete: number,
  eta: (null|number|string)
}

export interface FloodTorrentsData {
  [propName: string]: FloodTorrentData
}

export interface FloodData {
  torrents: FloodTorrentsData,
  length: number,
  id: number
}

export interface FloodTransferSummaryData {
  upRate: number,
  upTotal:number,
  upThrottle: number,
  downRate: number,
  downTotal: number,
  downThrottle: number
}

export interface FloodTrafficData {
  id: number,
  transferSummary: FloodTransferSummaryData
}

export default class FloodDataParser {
  data: FloodData
  torrents: string[]

  constructor (data: FloodData) {
    this.data = data
    this.torrents = Object.keys(data.torrents)
  }

  getTorrentName (hash: string): string {
    return this.data.torrents[hash].name
  }

  getTorrentTracker (hash: string): string {
    const tracker = this.data.torrents[hash].trackerURIs
    if (tracker.length) {
      return tracker[0]
    }
    return ''
  }

  filterTorrentsByTracker (
    trackers: string | string[],
    inTorrents?: string[]
  ): string[] {
    if (typeof trackers === 'string') {
      trackers = [trackers]
    }
    if (inTorrents === undefined) {
      inTorrents = this.torrents
    }
    const torrents: string[] = []
    for (const hash of inTorrents) {
      const torrent: FloodTorrentData = this.data.torrents[hash]
      let breakFlag: boolean = false
      for (const tracker of trackers) {
        for (const url of torrent.trackerURIs) {
          if (tracker.includes(url)) {
            torrents.push(hash)
            breakFlag = true
            break
          }
        }
        if (breakFlag) {
          break
        }
      }
    }
    return torrents
  }

  filterTorrentsByTags (
    tags: string | string[],
    inTorrents?: string[]
  ): string[] {
    if (typeof tags === 'string') {
      tags = [tags]
    }
    if (inTorrents === undefined) {
      inTorrents = this.torrents
    }
    const torrents: string[] = []
    for (const hash of inTorrents) {
      const torrent: FloodTorrentData = this.data.torrents[hash]
      for (const tag of torrent.tags) {
        if (tags.indexOf(tag) !== -1) {
          torrents.push(hash)
          break
        }
      }
    }
    return torrents
  }

  filterTorrentsByAnnounce (
    filter: string | RegExp,
    inTorrents?: string[]
  ): string[] {
    if (inTorrents === undefined) {
      inTorrents = this.torrents
    }
    const torrents: string[] = []
    for (const hash of inTorrents) {
      const torrent: FloodTorrentData = this.data.torrents[hash]
      if (filter instanceof RegExp) {
        if (filter.test(torrent.message)) {
          torrents.push(hash)
        }
      } else {
        if (torrent.message.indexOf(filter) !== -1) {
          torrents.push(hash)
        }
      }
    }
    return torrents
  }
}
