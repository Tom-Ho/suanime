const suDownloadItem = require('./suDownloadItem')
const fs = require('fs')
const util = require('util')
const EventEmitter = require('events').EventEmitter

/**
 * 
 * @param {object} settings - maxConcurrentDownloads and autoQueue 
 */
function suDownloader() {
    util.inherits(suDownloader, EventEmitter)
    this.setMaxListeners(50)

    this.settings = {
        maxConcurrentDownloads: 4,
        autoQueue: true
    }

    this.downloads = {
        activeDownloads: [], //contains suDownloadItem
        queuedDownloads: [], //contains downloadOptions
        activeNumberOfDownloads: 0,
        downloadingNumberOfDownloads: 0,
        queuedNumberOfDownloads: 0,
        queueIsRunning: true
    }

    const internals = {
        populateState: () => {
            var sudownloads = global.estore.get('sudownloads')
            if(sudownloads) {
                this.downloads = sudownloads
                this.downloads.activeDownloads = sudownloads.activeDownloads.map(el => new suDownloadItem(el.options))
            }
        },

        getQueueDownload: key => {
            return this.downloads.queuedDownloads.find(el => el.key == key)
        },

        getQueueDownloadIndex: key => {
            return this.downloads.queuedDownloads.findIndex(el => el.key == key)
        },

        getActiveDownload: key => {
            return this.downloads.activeDownloads.find(el => el.options.key == key)
        },

        getActiveDownloadIndex: key => {
            return this.downloads.activeDownloads.findIndex(el => el.options.key == key)
        },

        calculateCurrentDownloads: () => {
            this.downloads.activeNumberOfDownloads = this.downloads.activeDownloads.length
            this.downloads.downloadingNumberOfDownloads = this.downloads.activeDownloads.filter(el => el.status == 'DOWNLOADING').length
            this.downloads.queuedNumberOfDownloads = this.downloads.queuedDownloads.length
            this.persistToDisk()
        },

        removeFromQueue: key => {
            let downloadQueueIndex = internals.getQueueDownloadIndex(key)
            if(downloadQueueIndex != -1) {
                this.downloads.queuedDownloads.splice(downloadQueueIndex, 1)
                internals.calculateCurrentDownloads()
                return true
            }
            return false
        },

        removeFromActive: (key) => {
            let downloadItemIndex = internals.getActiveDownloadIndex(key)
            if(downloadItemIndex != -1) {
                this.downloads.activeDownloads.splice(downloadItemIndex, 1)
                internals.calculateCurrentDownloads()
                return true
            }
            return false
        },

        canStartNextInQueue: () => {
            return this.downloads.queuedDownloads.length && this.downloads.downloadingNumberOfDownloads < this.settings.maxConcurrentDownloads && this.downloads.queueIsRunning
        },

        downloadNextInQueue: () => {
            if(internals.canStartNextInQueue()) {
                this.startDownload(this.downloads.queuedDownloads[0].key)
            }
        },

        downloadNext: () => {
            this.downloads.activeDownloads.some(downloadItem => {
                if(downloadItem.status == 'PAUSED' && this.downloads.downloadingNumberOfDownloads < this.settings.maxConcurrentDownloads) {
                    this.resumeDownload(downloadItem.options.key)
                    return true
                }
            })
        },

        handleDownloadFinished: key => {
            let downloadsIdx = internals.getActiveDownloadIndex(key)
            this.downloads.activeDownloads.splice(downloadsIdx, 1)
            internals.calculateCurrentDownloads()
            internals.downloadNextInQueue()
        }
    }

    internals.populateState()    

    this.setSettings = settings => {
        this.settings = Object.assign({}, this.settings, settings)
    }

    /**
     * 
     * @param {object} downloadOptions 
     * adds a download to queue, will automatically start download when queue is free if `autoQueue` is on
     */
    this.QueueDownload = downloadOptions => {
        /**
         * downloadOptions = {
         * key: String,
         * path: String,
         * url: String,
         * onStart: function,
         * onProgress: function,
         * onFinish: function,
         * onError: function
         * }
         */
        console.log('queuing download', downloadOptions.key)
        this.downloads.queuedDownloads.push(downloadOptions)
        if(internals.canStartNextInQueue() && this.settings.autoQueue) {
            this.startDownload(downloadOptions.key)
        } else {
            internals.calculateCurrentDownloads()
        }
    }

    /**
     * 
     * @param {string} key 
     * starts a download
     */
    this.startDownload = key => {
        let downloadQueueIndex = internals.getQueueDownloadIndex(key)

        if(downloadQueueIndex == -1) {
            let predownloadItem = internals.getActiveDownload(key)
            if(predownloadItem && predownloadItem.status != 'DOWNLOADING') {
                this.resumeDownload(key)
                return true
            }
            return false
        }

        console.log('starting download ', key)
        let downloadOptions = internals.getQueueDownload(key)
        const downloadItem = new suDownloadItem(downloadOptions)

        this.downloads.queuedDownloads.splice(downloadQueueIndex, 1)
        this.downloads.activeDownloads.push(downloadItem)
        
        this.emit('new_download_started', key)
        
        downloadItem.start()
        downloadItem.on('finish', (data) => internals.handleDownloadFinished(key))
        
        
        internals.calculateCurrentDownloads()
    }

    /**
     * starts the queue
     */
    this.startQueue = () => {
        this.downloads.queueIsRunning = true
        while(this.downloads.downloadingNumberOfDownloads < this.settings.maxConcurrentDownloads && this.downloads.downloadingNumberOfDownloads < this.downloads.activeNumberOfDownloads) {
            internals.downloadNext()
        }
        while(internals.canStartNextInQueue()) {
            internals.downloadNextInQueue()
        }
    }

    /**
     * stops the queue
     */
    this.stopQueue = () => {
        this.downloads.queueIsRunning = false
        this.downloads.activeDownloads.forEach(downloadItem => {
            if(downloadItem.status == 'DOWNLOADING') {
                this.pauseDownload(downloadItem.options.key)
            }
        })
    }

    /**
     * 
     * @param {string} key 
     * pauses a download
     */
    this.pauseDownload = key => {
        let downloadItem = internals.getActiveDownload(key)
        downloadItem.pause()
        internals.calculateCurrentDownloads()
    }

    /**
     * 
     * @param {string} key 
     * resumes a paused download
     */
    this.resumeDownload = key => {
        let downloadItem = internals.getActiveDownload(key)
        downloadItem.downloadFromExisting()
        internals.calculateCurrentDownloads()
    }

    /**
     * 
     * @param {object} key 
     * @param {boolean} [deleteFile=false] - whether to delete the file or just clear from queue/active
     */
    this.clearDownload = (key, deleteFile = false) => {
        /**
         * deleteFile: {boolean} whether or not to delete the file or just clear download from queues
         */
        if(!internals.removeFromQueue(key)) { //try remove from queue first
            let downloadItem = internals.getActiveDownload(key)
            downloadItem.pause()
            if(deleteFile) {
                fs.unlink(downloadItem.options.mtdpath, internals.removeFromActive(key))
            } else {
                internals.removeFromActive(key)
            }
        }
    }

    this.getActiveDownload = key => {
        return internals.getActiveDownload(key)
    }

    this.persistToDisk = () => {
        var bareDLs = this.downloads.activeDownloads.map(el => {
            return {
             options: el.options,
             stats: el.stats
            }
        })
        global.estore.set("sudownloads", Object.assign({}, this.downloads, { activeDownloads: bareDLs }))
    }

}

module.exports = new suDownloader()