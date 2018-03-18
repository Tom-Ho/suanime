import React from 'react'

export default function reducer(state={
    downloadsArray: [],
    downloading: [],
    completed: [],
    completedArray: []
}, action) {
    switch(action.type) {
        case "QUEUE_DOWNLOAD": {
            var start = Date.now()
            console.log(action)
            var newDLProps = {
                props: {
                    epLink: action.payload.epLink,
                    animeFilename: action.payload.animeFilename,
                    posterImg: action.payload.posterImg,
                    animeName: action.payload.animeName,
                    epTitle: action.payload.epTitle
                }
            }
            var newDL = action.payload.animeFilename
            global.estore.set("storedDownloadsArray", [newDLProps, ...global.estore.get("storedDownloadsArray")])
            global.estore.set("storedDownloading", [newDL, ...global.estore.get("storedDownloading")])
            console.log(Date.now() - start)
            return Object.assign({}, state, {
                downloadsArray: [newDLProps, ...state.downloadsArray],
                downloading: [newDL, ...state.downloading],
                epLink: action.payload.epLink,
                animeFilename: action.payload.animeFilename,
                posterImg: action.payload.posterImg
            })
        }
        case "COMPLETED_DOWNLOAD": {
            var newDownloading = state.downloading.filter(el => el!=action.payload.animeFilename)
            global.estore.set("storedDownloading", newDownloading)
            var newCompleted = action.payload.animeFilename
            global.estore.set("storedCompleted", [newCompleted, ...global.estore.get("storedCompleted")])
            var newCompletedProps
            var newDownloadsArray = state.downloadsArray.filter(el => {
                if(el.props.animeFilename == action.payload.animeFilename) {
                    newCompletedProps = el
                    newCompletedProps.props['totalSize'] = action.payload.totalSize
                    newCompletedProps.props['elapsed'] = action.payload.elapsed
                    newCompletedProps.props['completeDate'] = action.payload.completeDate
                    return false
                }
                return true
            })
            global.estore.set("storedDownloadsArray", newDownloadsArray)
            var newCompletedArray = [newCompletedProps, ...global.estore.get("storedCompletedArray")]
            global.estore.set("storedCompletedArray", newCompletedArray)
            return Object.assign({}, state, {
                downloading: newDownloading,
                completed: [newCompleted, ...state.completed],
                downloadsArray: newDownloadsArray,
                completedArray: newCompletedArray
            })
        }
        case "CLEAR_DOWNLOAD": {
            var newDownloading = state.downloading.filter(el => el!=action.payload.animeFilename)
            global.estore.set("storedDownloading", newDownloading)
            var newCompleted = state.completed.filter(el => el!=action.payload.animeFilename)
            global.estore.set("storedCompleted", newCompleted)
            var newDownloadsArray = state.downloadsArray.filter(el => el.props.animeFilename != action.payload.animeFilename)
            global.estore.set("storedDownloadsArray", newDownloadsArray)
            var newCompletedArray = state.completedArray.filter(el => el.props.animeFilename != action.payload.animeFilename)
            global.estore.set("storedCompletedArray", newCompletedArray)
            return Object.assign({}, state, {
                downloading: newDownloading,
                completed: newCompleted,
                downloadsArray: newDownloadsArray,
                completedArray: newCompletedArray
            })
        }
        case "HYDRATE_DOWNLOADS": {
            return Object.assign({}, state, {
                downloadsArray: action.payload.downloadsArray,
                downloading: action.payload.downloading,
                completed: action.payload.completed,
                completedArray: action.payload.completedArray
            })
        }
        default: return state
    }
}