export interface AddTorrentOptions {
  startWhenAdded?: boolean,
  skipHashChecking?: boolean,
  tag?: string
}

export interface RequesterOptions {
  timeout?: number
  proxy?: string
}
