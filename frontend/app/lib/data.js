import { popupE } from "@/app/lib/trigger"

export function getData(setData, endpoint, parameters, baseURL = process.env.NEXT_PUBLIC_API_URL) {
    popupE('Processing', 'Please wait...')
    let params = new URLSearchParams(parameters).toString()
    console.log('Payload :: ', params)
    fetch(`${baseURL}${endpoint}?${params}`, {
        headers: {
            'Accept': 'application/json'
        }
    })
    .then((res) => {
        if (!res.ok) {
            return res.json().then(errData => {
                throw new Error(errData.message || 'Server Error')
            })
        }
        return res.json()
    })
    .then(data => {
        console.log(`From ${endpoint}`, data)
        if (data.error) popupE('Error', data.error)
        else {
            try {
                setData(data)
            } catch (err) {
                console.log(err)
                popupE('Error', 'Error in client worker')
            }
        }
        if (data.message) popupE('Success', data.message)
    })
    .catch(err => {
        console.log(err)
        popupE('Error', 'Server Error')
    })
}

export function getFile(name, endpoint, parameters, baseURL = process.env.NEXT_PUBLIC_API_URL) {
    let params = new URLSearchParams(parameters).toString()
    fetch(`${baseURL}${endpoint}?${params}`, {
        headers: {
            'Accept': 'application/json'
        }
    })
    .then((res) => {
        if (!res.ok) {
            return res.json().then(errData => {
                throw new Error(errData.message || 'Server Error')
            })
        }
        return res.blob()
    })
    .then(blob => {
        console.log(blob)
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.style.display = 'none'
        a.href = url
        a.download = name
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
    })
    .catch(err => {
        console.log(err)
        popupE('Error', 'Server Error')
    })
}

export function postFile(setData, files, key, data, endpoint, baseURL = process.env.NEXT_PUBLIC_API_URL) {
    popupE('Processing', 'Please wait...')
    const formData = new FormData()
    Object.keys(data).forEach(k => {
        if (Array.isArray(data[k])) {
            data[k].forEach(item => formData.append(`${k}[]`, item))
        } else {
            formData.append(k, JSON.stringify(data[k]))
        }
    })
    
    if (Array.isArray(files)) {
        files.forEach((file, i) => {
            formData.append(`${key}${i}`, file)
        })
    } else {
        formData.append(key, files)
    }

    fetch(`${baseURL}${endpoint}`, {
        method: "POST",
        headers: {
            'Accept': 'application/json'
        },
        body: formData
    })
    .then((res) => {
        if (!res.ok) {
            return res.json().then(errData => {
                throw new Error(errData.message || 'Server Error')
            })
        }
        return res.json()
    })
    .then((data) => {
        if (data.error) popupE('Error', data.error)
        if (data.message && data.success) popupE('Success', data.message)
        try {
            setData(data)
        } catch (err) {
            console.log(err)
            popupE('Error', 'Error in client worker')
        }
    })
    .catch(err => {
        console.log(err)
        popupE('Error', err.message || 'Server File upload Error')
    })
}

export async function postData(setData, data, endpoint, baseURL = process.env.NEXT_PUBLIC_API_URL) {
    popupE('Processing', 'Please wait...')
    fetch(`${baseURL}${endpoint}`, {
        method: "POST",
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        },
        body: JSON.stringify(data)
    })
    .then((res) => {
        if (!res.ok) {
            return res.json().then(errData => {
                throw new Error(errData.message || 'Server Error')
            })
        }
        return res.json()
    })
    .then((data) => {
        console.log(`From ${endpoint}`, data)
        if (data.success === false) popupE('Error', data.message)
        if (data?.success && data?.message) popupE('Success', data.message)
        try {
            setData(data)
        } catch (err) {
            console.log(err)
            popupE('Error', 'Error in client worker')
        }
    })
    .catch(err => {
        console.log(err)
        popupE('Error', err.message || 'Server Error')
    })
}

export function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
}

export async function fetcher([endpoint, parameters, baseURL = process.env.NEXT_PUBLIC_API_URL]) {
    let params = new URLSearchParams(parameters).toString()
    return fetch(`${baseURL}${endpoint}?${params}`, {
        headers: {
            'Accept': 'application/json'
        }
    })
    .then((res) => {
        if (!res.ok) {
            return res.json().then(errData => {
                throw new Error(errData.message || 'Server Error')
            })
        }
        return res.json()
    })
}

export function postFetcher([endpoint, parameters, baseURL = process.env.NEXT_PUBLIC_API_URL]) {
    return fetch(`${baseURL}${endpoint}`, {
        method: "POST",
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        },
        body: JSON.stringify(parameters)
    })
    .then((res) => {
        if (!res.ok) {
            return res.json().then(errData => {
                throw new Error(errData.message || 'Server Error')
            })
        }
        return res.json()
    })
}