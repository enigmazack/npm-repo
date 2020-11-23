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
